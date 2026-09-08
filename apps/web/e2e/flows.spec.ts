import { expect, test } from '@playwright/test';
import { carlos, injectSession, joao, marina, mockApi } from './helpers';

test.describe('fluxos do aluno', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, { user: joao });
    await injectSession(page, joao);
  });

  test('home mostra próximo treino e créditos', async ({ page }) => {
    await page.goto('/aluno');
    await expect(page.getByRole('heading', { name: /Olá, João/ })).toBeVisible();
    await expect(page.getByText('Seu próximo treino')).toBeVisible();
    await expect(page.getByText('reposição disponível')).toBeVisible();
  });

  test('cancelamento com 12h+ avisa que gera crédito', async ({ page }) => {
    await page.goto('/aluno/agenda/booking-seg-com-credito');
    await page.getByRole('button', { name: 'Desmarcar treino' }).click();
    await expect(
      page.getByText('Esta aula gerará 1 crédito de reposição.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar cancelamento' }).click();
    await expect(
      page.getByText('Treino desmarcado. Você ganhou 1 crédito de reposição.'),
    ).toBeVisible();
  });

  test('cancelamento fora do prazo avisa que não gera crédito', async ({
    page,
  }) => {
    await page.goto('/aluno/agenda/booking-hoje-sem-credito');
    await page.getByRole('button', { name: 'Desmarcar treino' }).click();
    await expect(
      page.getByText(/não receberá crédito de reposição/i),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar mesmo assim' }).click();
    await expect(
      page.getByText('Treino desmarcado. Sem crédito de reposição.'),
    ).toBeVisible();
  });

  test('horários mostram vagas numéricas, não os outros alunos', async ({
    page,
  }) => {
    await page.goto('/aluno/horarios');
    await page.getByRole('button', { name: /07/ }).click();
    await expect(page.getByText('Lotado')).toBeVisible();
    await page.getByRole('button', { name: /08/ }).click();
    await expect(page.getByRole('button', { name: 'Agendar' })).toBeVisible();
    await expect(page.getByText(/\d+\/\d+ alunos/)).toBeVisible();
    await expect(page.getByText('Ana', { exact: true })).toHaveCount(0);
  });

  test('agenda abre na semana do relógio do servidor', async ({ page }) => {
    await mockApi(page, {
      user: joao,
      now: '2026-09-08T15:00:00.000Z',
    });
    await page.goto('/aluno/agenda');
    await expect(page.getByText('07 – 13 SET')).toBeVisible();
  });
});

test.describe('fluxos do treinador', () => {
  test('dashboard mostra ocupação e não a agenda do aluno', async ({ page }) => {
    await mockApi(page, { user: carlos });
    await injectSession(page, carlos);
    await page.goto('/treinador');
    await expect(page.getByRole('heading', { name: /Carlos/ })).toBeVisible();
    await expect(page.getByText('Alunos hoje')).toBeVisible();
    await expect(
      page.getByRole('main').getByText('Ocupação', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('67%').first()).toBeVisible();
    await expect(page.getByText('Olá, João')).toHaveCount(0);
  });

  test('admin cria horário do estúdio em Ajustes', async ({
    page,
  }) => {
    await mockApi(page, { user: marina });
    await injectSession(page, marina);
    await page.goto('/treinador/configuracoes?secao=horarios');
    await expect(page.getByRole('heading', { name: 'Ajustes', exact: true })).toBeVisible();
    await page.getByLabel('Identificação').fill('Turma manhã');
    await expect(page.getByLabel('Tipo da aula')).toHaveValue('AULA');
    await page.getByRole('button', { name: 'Criar horário' }).click();
    await expect(
      page.getByText('Horário criado. As aulas das próximas semanas já estão na agenda.'),
    ).toBeVisible();
  });

  test('admin cadastra tipo de aula pelo modal em Ajustes', async ({
    page,
  }) => {
    await mockApi(page, { user: marina });
    await injectSession(page, marina);
    await page.goto('/treinador/configuracoes?secao=horarios');
    await page.getByRole('button', { name: 'Cadastrar tipo' }).click();
    await page.getByLabel('Nome do tipo').fill('Pilates');
    await page.getByRole('button', { name: 'Salvar tipo' }).click();
    await expect(page.getByText('Tipo de aula cadastrado.')).toBeVisible();
    await expect(page.getByLabel('Tipo da aula')).toHaveValue('PILATES');
  });

  test('admin cadastra modelo de plano em Ajustes', async ({ page }) => {
    await mockApi(page, { user: marina });
    await injectSession(page, marina);
    await page.goto('/treinador/configuracoes?secao=planos');
    await page.getByLabel('Nome do plano').fill('2x manhã');
    await page.getByRole('button', { name: 'Cadastrar plano' }).click();
    await expect(page.getByText('Plano cadastrado.')).toBeVisible();
  });

  test('agenda abre na semana do relógio do servidor', async ({ page }) => {
    await mockApi(page, {
      user: marina,
      now: '2026-09-08T15:00:00.000Z',
    });
    await injectSession(page, marina);
    await page.goto('/treinador/agenda');
    await expect(page.getByText('07 – 13 SET')).toBeVisible();
    await expect(page.getByText('Strength').first()).toBeVisible();
  });
});
