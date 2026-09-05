import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { replaceWithDemoData } from '../database/demo-seed';

const CONFIRMATION = 'APAGAR_E_CARREGAR_HOMOLOGACAO';
const prisma = new PrismaClient();

function strongTemporaryPassword(): string {
  return randomBytes(18).toString('base64url');
}

async function main(): Promise<void> {
  if (process.env.CONFIRM_PREVIEW_SEED !== CONFIRMATION) {
    throw new Error(
      `Carga cancelada. Defina CONFIRM_PREVIEW_SEED=${CONFIRMATION} para substituir todo o banco.`,
    );
  }

  const trainerName = process.env.PREVIEW_TRAINER_NAME ?? 'Elissandro';
  const trainerEmail = (
    process.env.PREVIEW_TRAINER_EMAIL ?? 'elissandro@mail.com'
  ).toLowerCase();
  const trainerPassword = strongTemporaryPassword();
  const studentPassword = strongTemporaryPassword();
  const [trainerPasswordHash, studentPasswordHash] = await Promise.all([
    hash(trainerPassword, 10),
    hash(studentPassword, 10),
  ]);

  await replaceWithDemoData(prisma, {
    defaultPasswordHash: studentPasswordHash,
    users: {
      'user-ana': {
        mustSetPassword: false,
        passwordHash: studentPasswordHash,
      },
      'user-carlos': {
        name: trainerName,
        email: trainerEmail,
        mustSetPassword: false,
        passwordHash: trainerPasswordHash,
      },
    },
  });

  console.log('Homologação carregada. Guarde estas credenciais agora:');
  console.log(`Treinador: ${trainerEmail} / ${trainerPassword}`);
  console.log(
    `Alunos: joao@studioemar.local e ana@studioemar.local / ${studentPassword}`,
  );
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
