// Export the current Prisma MySQL schema without connecting to a database.
// Run from the project root with dependencies installed: node scripts/export-schema.cjs
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const outputDir = path.resolve(process.env.SCHEMA_EXPORT_DIR || path.join(root, 'database'));
const schema = path.join(root, 'prisma/schema.prisma');
const prismaCli = require.resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', schema, '--script'], {
  encoding: 'utf8', env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'mysql://unused:unused@localhost:3306/unused' },
});
if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Prisma schema export failed');
const sql = result.stdout.trim();
assert.match(sql, /CREATE TABLE `users`/);
const tables = [...sql.matchAll(/CREATE TABLE `([^`]+)` \(([\s\S]*?)\) DEFAULT CHARACTER SET[^;]+;/g)];
const expected = [...fs.readFileSync(schema, 'utf8').matchAll(/^model (\w+) \{/gm)];
assert.equal(tables.length, expected.length, 'Missing exported tables');
const enums = [];
const knownColumns = new Map();
const blocks = tables.map(([, table, body]) => {
  const columns = [];
  const indexes = [];
  const primary = body.match(/PRIMARY KEY \(`([^`]+)`\)/)?.[1];
  for (const line of body.split('\n')) {
    const field = line.match(/^\s+`([^`]+)`\s+(.+?)(?:,)?$/);
    if (field) {
      const [, column, definition] = field;
      let type = definition.match(/^(\w+(?:\([^)]*\))?)/)[1].toLowerCase();
      if (type.startsWith('enum(')) {
        const name = `${table}_${column}_enum`;
        const values = [...type.matchAll(/'([^']+)'/g)].map(match => match[1]);
        // Preserve the original case of enum values from the SQL definition.
        const originalValues = [...definition.match(/^ENUM\(([^)]+)\)/)[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
        assert.equal(values.length, originalValues.length);
        enums.push(`Enum ${name} {\n${originalValues.map(value => `  ${value}`).join('\n')}\n}`);
        type = name;
      }
      const settings = [];
      if (column === primary) settings.push('pk');
      if (definition.includes('AUTO_INCREMENT')) settings.push('increment');
      if (definition.includes('NOT NULL')) settings.push('not null');
      const defaultValue = definition.match(/\bDEFAULT\s+('(?:[^']|'')*'|CURRENT_TIMESTAMP\(\d+\)|-?[\d.]+|true|false)/i)?.[1];
      if (defaultValue) settings.push(`default: ${defaultValue.startsWith('CURRENT_') ? '`' + defaultValue + '`' : defaultValue}`);
      if (table === 'support_tickets' && column === 'handled_by_id') settings.push("note: 'Application-managed admin ID; no foreign key in current Prisma schema'");
      if (table === 'user_reviews' && column === 'rating') settings.push("note: 'MySQL CHECK user_reviews_rating_range: 1 to 5'");
      columns.push(`  ${column} ${type}${settings.length ? ` [${settings.join(', ')}]` : ''}`);
      continue;
    }
    const index = line.match(/^\s+(UNIQUE )?INDEX `([^`]+)`\s*\(([^)]+)\)/);
    if (index) {
      const fields = [...index[3].matchAll(/`([^`]+)`/g)].map(match => match[1]);
      indexes.push(`    (${fields.join(', ')}) [name: '${index[2]}'${index[1] ? ', unique' : ''}]`);
    }
  }
  knownColumns.set(table, new Set(columns.map(line => line.trim().split(' ')[0])));
  return `Table ${table} {\n${columns.join('\n')}${indexes.length ? '\n\n  indexes {\n' + indexes.join('\n') + '\n  }' : ''}\n}`;
});
const refs = [...sql.matchAll(/ALTER TABLE `([^`]+)` ADD CONSTRAINT `([^`]+)` FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)`\(`([^`]+)`\) ON DELETE (CASCADE|RESTRICT|SET NULL|NO ACTION) ON UPDATE (CASCADE|RESTRICT|SET NULL|NO ACTION)/g)].map(([, table, name, column, target, targetColumn, onDelete, onUpdate]) => {
  assert.ok(knownColumns.get(table)?.has(column), `Unknown FK source ${table}.${column}`);
  assert.ok(knownColumns.get(target)?.has(targetColumn), `Unknown FK target ${target}.${targetColumn}`);
  return `Ref ${name}: ${table}.${column} > ${target}.${targetColumn} [delete: ${onDelete.toLowerCase()}, update: ${onUpdate.toLowerCase()}]`;
});
assert.ok(refs.length > 0);
const foreignKeyCount = (sql.match(/FOREIGN KEY/g) || []).length;
assert.equal(refs.length, foreignKeyCount, 'Missing DBML relationships');
fs.mkdirSync(outputDir, { recursive: true });
const hardening = fs.readFileSync(path.join(root, 'database/hardening.sql'), 'utf8').trim();
fs.writeFileSync(path.join(outputDir, 'schema-latest.mysql.sql'), '-- Generated from prisma/schema.prisma. MySQL 8.0.16+.\n-- For a NEW EMPTY database only. No seed data or database selection included.\n-- Includes hardening.sql; do not apply that constraint a second time.\n\n' + sql + '\n\n' + hardening + '\n');
fs.writeFileSync(path.join(outputDir, 'schema-latest.dbml'), '// Generated from the Prisma MySQL DDL; no invented foreign keys.\nProject durian_hub {\n  database_type: \'MySQL\'\n  Note: \'Current design schema, not a dump of the running database. Rating CHECK is documented in the column note.\'\n}\n\n' + enums.join('\n\n') + '\n\n' + blocks.join('\n\n') + '\n\n' + refs.join('\n') + '\n');
fs.writeFileSync(path.join(outputDir, 'schema-export-checks.json'), JSON.stringify({ source: 'prisma/schema.prisma + database/hardening.sql', tables: tables.length, columns: [...knownColumns.values()].reduce((sum, set) => sum + set.size, 0), foreignKeys: refs.length, enumColumns: enums.length, includesReviewRatingCheck: true, validation: 'Prisma-generated DDL; table count and FK endpoints matched; no live database connection' }, null, 2) + '\n');
console.log(`Exported ${tables.length} tables, ${refs.length} foreign keys to ${outputDir}`);
require('./export-schema-subset.cjs').exportSubset(outputDir);
