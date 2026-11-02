const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();
async function main() {
  // Node 22.18+ loads erasable TypeScript directly, without a separate tsx process.
  const { refreshMarketStats } = await import('../src/lib/market-stats.ts');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await prisma.$transaction((tx) => refreshMarketStats(tx), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
      console.log(JSON.stringify(result));
      return;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue;
      throw error;
    }
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
