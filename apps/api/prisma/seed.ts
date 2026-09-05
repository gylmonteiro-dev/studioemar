import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { replaceWithDemoData } from '../src/database/demo-seed';

/** Senha local de João e Carlos. Ana permanece em primeiro acesso. */
const DEMO_PASSWORD = 'studioemar';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  await replaceWithDemoData(prisma, {
    defaultPasswordHash: passwordHash,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
