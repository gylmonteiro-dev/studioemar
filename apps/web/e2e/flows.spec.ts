import { expect, test } from '@playwright/test';
import { carlos, injectSession, joao, marina, mockApi } from './helpers';

test.describe('fluxos do aluno', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, { user: joao });
    await injectSession(page, joao);
  });

  test('home mostra treinos da semana e créditos', async ({ page }) => {
    await page.goto('/aluno');
    await expect(page.getByRole('heading', { name: /Olá, João/ })).toBeVisible();
    await expect(page.getByText('Seu próximo treino')).toBeVisible();
    await expect(page.getByText('Treinos da semana')).toBeVisible();
    await expect(page.getByText('31 – 06 SET')).toBeVisible();
    await expect(page.getByText('reposição disponível')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agendar reposição' })).toBeEnabled();
  });

  test('home desabilita reposição sem crédito', async ({ page }) => {
    await mockApi(page, { user: joao, credits: [] });
    await page.goto('/aluno');
    await expect(page.getByRole('button', { name: 'Agendar reposição' })).toBeDisabled();
  });

  test('cancelamento com 4h+ oferece agendar reposição agora', async ({ page }) => {
    await page.goto('/aluno/agenda/booking-seg-com-credito');
    await page.getByRole('button', { name: 'Desmarcar treino' }).click();
    await expect(
      page.getByText('Esta aula gerará 1 crédito de reposição.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar cancelamento' }).click();
    await expect(page.getByRole('heading', { name: 'Treino desmarcado' })).toBeVisible();
    await expect(
      page.getByText('Treino desmarcado com sucesso. Você ganhou 1 crédito de reposição.'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Agendar reposição agora' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Usar depois' })).toBeVisible();
    await page.getByRole('button', { name: 'Usar depois' }).click();
    await expect(page.getByText('Cancelado')).toBeVisible();
    await page.getByRole('button', { name: 'Desfazer cancelamento' }).click();
    await expect(page.getByRole('heading', { name: 'Aula remarcada' })).toBeVisible();
    await expect(
      page.getByText('Cancelamento desfeito com sucesso. Você voltou para a sua turma.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ok' }).click();
    await expect(page).toHaveURL(/\/aluno\/agenda\/booking-remarcado$/);
    await expect(page.getByText('Confirmado')).toBeVisible();
    await page.goto('/aluno/agenda');
    await page.getByRole('button', { name: 'Próxima semana' }).click();
    await expect(page.getByText('Cancelado')).toHaveCount(0);
    await expect(page.getByText(/Regular · Confirmado/)).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Treino desmarcado' })).toBeVisible();
    await expect(
      page.getByText('Treino desmarcado com sucesso. Sem crédito de reposição.'),
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

  test('créditos mostram os mais próximos de vencer e os dias restantes', async ({
    page,
  }) => {
    await page.goto('/aluno/creditos');
    await expect(page.getByText('Faltam 28 dias').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Usar crédito' })).toBeEnabled();
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
    await expect(page.getByLabel('Segunda')).not.toBeChecked();
    await expect(page.getByLabel('Limite de alunos')).toHaveValue('4');
    await page.getByLabel('Segunda').check();
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

  test('admin cadastra aluno com CPF, plano 3x e horários com vaga', async ({
    page,
  }) => {
    await mockApi(page, { user: marina });
    await injectSession(page, marina);
    await page.goto('/treinador/alunos/novo');
    await page.getByLabel('Nome completo').fill('Ana Souza');
    await page.getByLabel('CPF').fill('52998224725');
    await page.getByLabel('E-mail').fill('ana.souza@studioemar.local');
    await page.getByLabel('Aula 1').selectOption({ index: 1 });
    await page.getByLabel('Aula 2').selectOption({ index: 1 });
    await page.getByLabel('Aula 3').selectOption({ index: 1 });
    await page.getByText('Carlos', { exact: true }).click();
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByRole('heading', { name: 'Ana Souza' })).toBeVisible();
    await expect(page.getByText('CPF 529.982.247-25')).toBeVisible();
    await expect(page.getByText('Segunda · Manhã 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Aguardando primeiro acesso')).toBeVisible();
  });

  test('admin exclui cadastro de aluno na ficha', async ({ page }) => {
    await mockApi(page, { user: marina });
    await injectSession(page, marina);
    await page.goto('/treinador/alunos/user-joao');
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(
      page.getByText(/Apaga o cadastro de João/),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Excluir cadastro' }).click();
    await expect(page.getByText('Cadastro excluído.')).toBeVisible();
    await expect(page).toHaveURL(/\/treinador\/alunos$/);
  });

  test('ficha do aluno mostra a agenda da semana', async ({ page }) => {
    await mockApi(page, { user: marina });
    await injectSession(page, marina);
    await page.goto('/treinador/alunos/user-joao');
    await expect(page.getByRole('heading', { name: 'João' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agenda regular' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agenda', exact: true })).toBeVisible();
    await expect(page.getByText('31 – 06 SET')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Próxima semana' })).toBeVisible();
    await expect(page.getByText('Nenhum treino nesta semana.')).toHaveCount(0);
    await expect(page.getByLabel('Aula 1')).toHaveCount(0);
    await page.getByRole('button', { name: 'Plano e horários' }).click();
    await page.getByRole('button', { name: 'Editar plano e horários' }).click();
    await expect(page.getByLabel('Plano', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Aula 1')).toBeVisible();
  });

  test('treinador não vê o botão de excluir aluno', async ({ page }) => {
    await mockApi(page, { user: carlos });
    await injectSession(page, carlos);
    await page.goto('/treinador/alunos/user-joao');
    await expect(page.getByRole('heading', { name: 'João' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Excluir' })).toHaveCount(0);
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
