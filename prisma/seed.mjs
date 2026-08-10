// Runs automatically as part of every deploy (see the "build" script in
// package.json). Only inserts the original two names if the table is
// completely empty, so it never duplicates data on repeated deploys.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXISTING_BROTHERS = ['राम थापा', 'हरी कुमार'];

async function main() {
  const count = await prisma.brother.count();
  if (count > 0) {
    console.log(`Skipping seed: ${count} brother(s) already in the database.`);
    return;
  }

  await prisma.brother.createMany({
    data: EXISTING_BROTHERS.map((name, index) => ({ name, displayOrder: index + 1 })),
  });
  console.log(`Seeded ${EXISTING_BROTHERS.length} existing brother(s).`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
