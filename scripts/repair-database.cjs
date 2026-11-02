const { PrismaClient, Prisma } = require('@prisma/client');
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');
const prisma = new PrismaClient();

async function main() {
  const invalid = await prisma.userReview.count({ where: { OR: [{ rating: { lt: 1 } }, { rating: { gt: 5 } }] } });
  const selfReviews = await prisma.$queryRaw`SELECT id FROM user_reviews WHERE reviewer_id = reviewee_id`;
  if (invalid || selfReviews.length) throw new Error('Invalid historical reviews found; no changes applied. Review them manually first.');
  if (!process.argv.includes('--apply')) {
    console.log('Audit passed. Run with --apply to add CHECK constraints and reconcile stored review/report totals.');
    return;
  }
  const backupDir = resolve(__dirname, '../database/backups');
  mkdirSync(backupDir, { recursive: true });
  const backupFile = resolve(backupDir, `aggregate-totals-${Date.now()}.json`);
  writeFileSync(backupFile, JSON.stringify({
    createdAt: new Date().toISOString(),
    posts: await prisma.marketplacePost.findMany({ select: { id: true, reportCount: true } }),
    users: await prisma.user.findMany({ select: { id: true, ratingAvg: true, ratingCount: true } }),
  }, null, 2));
  console.log(`Saved existing aggregate totals: ${backupFile}`);
  // DDL implicitly commits in MySQL: do not mix it into a data transaction.
  const constraints = await prisma.$queryRaw`SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'user_reviews' AND CONSTRAINT_TYPE = 'CHECK'`;
  const names = new Set(constraints.map((row) => row.CONSTRAINT_NAME));
  const statements = readFileSync(resolve(__dirname, '../database/hardening.sql'), 'utf8').replace(/^--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) {
    const name = statement.match(/ADD CONSTRAINT (\w+)/)[1];
    if (!names.has(name)) await prisma.$executeRawUnsafe(statement);
  }
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`UPDATE marketplace_posts p LEFT JOIN (SELECT post_id, COUNT(*) AS total FROM post_reports GROUP BY post_id) r ON p.id = r.post_id SET p.report_count = COALESCE(r.total, 0)`;
    await tx.$executeRaw`UPDATE users u LEFT JOIN (SELECT reviewee_id, ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS total FROM user_reviews GROUP BY reviewee_id) r ON u.id = r.reviewee_id SET u.rating_avg = COALESCE(r.avg_rating, 5.00), u.rating_count = COALESCE(r.total, 0)`;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  console.log('CHECK constraints installed; report and review totals reconciled. No source records deleted.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
