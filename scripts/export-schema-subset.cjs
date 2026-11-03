// Produce a conservative Table/Enum/Ref subset for limited DBML editors.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

function exportSubset(directory) {
  const source = fs.readFileSync(path.join(directory, 'schema-latest.dbml'), 'utf8');
  const enums = [...source.matchAll(/^Enum \w+ \{[^}]*\}/gm)].map(match => match[0]);
  const originals = [...source.matchAll(/^Table (\w+) \{([\s\S]*?)^\}/gm)];
  const tables = originals.map(([, name, body]) => {
    const singleUnique = new Set([...body.matchAll(/^\s+\((\w+)\) \[[^\n]*\bunique\]/gm)].map(match => match[1]));
    const fields = body.split('\n').filter(line => /^  \w+\s+/.test(line) && !line.trim().startsWith('indexes ')).map(line => {
      const match = line.match(/^  (\w+)\s+([^\[]+?)(?:\s+\[([^\]]*)\])?\s*$/);
      assert.ok(match, `Unsupported field: ${line}`);
      const [, column, type, settings = ''] = match;
      const flags = ['pk', 'increment', 'not null'].filter(flag => settings.split(',').map(s => s.trim()).includes(flag));
      if (singleUnique.has(column)) flags.push('unique');
      return `  ${column} ${type.trim().replace(/,\s+/g, ',')}${flags.length ? ' [' + flags.join(', ') + ']' : ''}`;
    });
    return `Table ${name} {\n${fields.join('\n')}\n}`;
  });
  const refs = [...source.matchAll(/^Ref \w+: (\w+\.\w+ > \w+\.\w+)/gm)].map(match => `Ref: ${match[1]}`);
  const columnCount = tables.reduce((sum, table) => sum + table.split('\n').filter(line => /^  \w+ /.test(line)).length, 0);
  const expected = JSON.parse(fs.readFileSync(path.join(directory, 'schema-export-checks.json'), 'utf8'));
  assert.equal(tables.length, expected.tables);
  assert.equal(columnCount, expected.columns);
  assert.equal(refs.length, expected.foreignKeys);
  const output = [...enums, ...tables, ...refs].join('\n\n') + '\n';
  assert.ok(!/^Project |indexes \{|^Ref \w+:/m.test(output));
  fs.writeFileSync(path.join(directory, 'schema-schemastudio.dbml'), output);
  console.log(`Subset export: ${tables.length} tables, ${columnCount} columns, ${refs.length} references`);
}
module.exports = { exportSubset };
if (require.main === module) exportSubset(path.resolve(process.env.SCHEMA_EXPORT_DIR || path.join(__dirname, '../database')));
