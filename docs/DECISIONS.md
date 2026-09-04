# Registro de Decisões Técnicas

Este documento registra decisões relevantes e seus motivos.

---

## ADR-001 — PostgreSQL

Status: ACEITO

Decisão:

Utilizar PostgreSQL como banco principal.

Motivos:

- open source;
- robusto;
- sem assinatura obrigatória;
- excelente suporte a aplicações transacionais;
- pode funcionar na própria VPS;
- integração com Prisma;
- possibilidade futura de migrar para serviço gerenciado.

Validado na FASE 0.

---

## ADR-002 — Backend NestJS

Status: ACEITO

Decisão:

Utilizar NestJS + TypeScript.

Motivos:

- mesmo ecossistema TypeScript do frontend;
- arquitetura modular;
- boa organização para crescimento;
- integração com Prisma;
- OpenAPI/Swagger;
- adequado para API utilizada posteriormente pelo mobile.

Validado na FASE 0.

---

## ADR-003 — React Native + Expo

Status: ACEITO

O aplicativo mobile será desenvolvido após estabilização
da versão web.

Web e mobile utilizarão a mesma API.

Validado na FASE 0. Não antecipar a FASE 10.

---

## ADR-004 — Caddy

Status: DEFINIDO

Utilizar o Caddy já existente na VPS.

Não adicionar Caddy específico ao projeto sem necessidade.

---

## ADR-005 — Containers

Status: ACEITO

Produção deverá utilizar containers separados para:

Web
API
PostgreSQL

Validado na FASE 0. Docker de produção permanece na FASE 8.

---

## ADR-006 — Monorepo

Status: ACEITO

Decisão:

Organizar o repositório como monorepo com pnpm workspaces.

Estrutura:

```
apps/web
apps/api
apps/mobile
packages/shared
infrastructure
docs
prototypes
```

Motivos:

- um time e um produto;
- tipos e validações compartilhados entre Next, Nest e,
  futuramente, Expo;
- mudança de regra sobe schema, API e UI no mesmo PR;
- Docker Compose e deploy na VPS a partir da raiz;
- mobile futuro consome o pacote shared sem publicar
  pacote privado;
- baixo custo operacional.

Não compartilhar componentes React nem CSS entre web e
mobile.

Critério para rever: times distintos ou ciclos de release
independentes. Hoje nenhum dos dois existe.

---

## ADR-007 — Pacote shared

Status: ACEITO

Decisão:

Criar `packages/shared` para tipos TypeScript, enums,
constantes de domínio e schemas Zod.

O NestJS e o Next.js deverão consumir esse pacote.
O Expo também o consumirá na FASE 10.

Motivos:

- backend é a autoridade das regras, mas o contrato
  precisa ser o mesmo nos clientes;
- evita o frontend da FASE 2 nascer desconectado da API.

O esqueleto nasce na FASE 1.
O vocabulário de domínio entra na FASE 1b.

---

## ADR-008 — Um app Next.js para web

Status: ACEITO

Decisão:

Aluno e treinador convivem no mesmo app Next.js,
separados por rota e layout.

Motivos:

- um único deploy web na VPS;
- mesma autenticação e design tokens;
- não justifica dois apps web neste momento.

---

## ADR-009 — TRAINER e ADMIN no início

Status: ACEITO

Decisão:

No início, TRAINER e ADMIN são o mesmo operador (dono /
professor do Studio).

Os dois papéis permanecem no enum para evolução futura.
A FASE 2 usa somente STUDENT.

---

## ADR-010 — Provisionamento de conta

Status: ACEITO

Decisão:

O professor cria a conta. O aluno não se auto-cadastra.

Após a criação, o aluno define senha no primeiro acesso
e pode recuperar senha.

A FASE 2 cobre essas telas com UI mínima e sessão mock.
Cadastro pelo professor permanece na FASE 3.

JWT real permanece para a FASE 5.

---

## ADR-011 — Paleta oficial e tokens Tailwind

Status: ACEITO

Decisão:

A paleta de docs/DESIGN_SYSTEM.md é a fonte de verdade.

Mapeamento no código:

- laranja EMAR → accent e bg-cta (gradiente)
- preto #050505 → surface-dark nas superfícies;
  primary permanece o botão sólido preto
- texto #111111 → foreground

Não usar --color-primary para o laranja, para não
pintar login e cards escuros.

---

## ADR-012 — Temas light e dark

Status: ACEITO

Decisão:

Dois modos. Dark é o padrão.

Light usa a paleta oficial das seções 3–8.
Dark reusa as mesmas classes Tailwind e troca
as variáveis em html.dark.

Preferência em localStorage (studioemar.theme).
O laranja EMAR não muda entre os modos.

---

## ADR-013 — Prisma em apps/api e passwordHash

Status: ACEITO

Decisão:

O schema Prisma vive em `apps/api/prisma`. Não há pacote
`packages/database`. Só o Nest consome o client.

`User.passwordHash` existe somente na tabela. Não entra no
schema Zod `User` nem nas respostas de domínio.

Motivos:

- um único consumidor do ORM nesta fase;
- o contrato público não carrega credencial;
- a coluna nula evita uma migration só para hash na FASE 5.

JWT e verificação de senha: ADR-014.

---

## ADR-014 — JWT no corpo da resposta

Status: ACEITO

Decisão:

Access token JWT HS256, 1 hora, `Authorization: Bearer`.
Refresh token JWT HS256, 7 dias, secret separado, enviado
no JSON (`refreshToken`). Sem cookie e sem tabela de
refresh.

Payload do access: `sub`, `email`, `role`, `typ: "access"`.
Payload do refresh: `sub`, `typ: "refresh"`.

Recuperação de senha: token opaco (32 bytes), hash SHA-256
em `User.passwordResetTokenHash`, validade 1 hora. Sem
e-mail nesta fase; o token só é logado fora de production.

Motivos:

- o contrato já é REST + JSON; o mobile futuro consome o
  mesmo par de tokens;
- um Studio pequeno não precisa de denylist agora;
- `passwordHash` e o token de reset não entram no Zod User.

CLOCK_NOW (opcional) fixa o relógio do backend para
validar RN-012 sem mudar a fórmula do shared.

---

## ADR-015 — Sessão web no sessionStorage

Status: ACEITO

Decisão:

O web guarda `accessToken`, `refreshToken`, `expiresAt` e
`user` em `sessionStorage` (`studioemar.session`). Sem cookie.
Logout descarta a sessão localmente.

Chamadas autenticadas enviam `Authorization: Bearer`. Em 401,
o cliente tenta `POST /auth/refresh` uma vez; se falhar, limpa
a sessão.

Motivos:

- ADR-014 entrega o par JWT no JSON; o storage é do cliente;
- `sessionStorage` mantém o logout ao fechar a aba, como a
  sessão mock (`userId`) da FASE 2;
- o mobile futuro pode escolher outro armazenamento sem
  mudar o contrato da API.

---

## ADR-016 — Imagens de produção e migrations no entrypoint

Status: ACEITO

Decisão:

Duas imagens multi-stage com contexto na raiz do monorepo:
`infrastructure/Dockerfile.api` e `Dockerfile.web`. Base
`node:22-bookworm-slim`.

A web usa `output: 'standalone'` do Next, com
`outputFileTracingRoot` na raiz para o tracing enxergar
`packages/shared`, que é symlink do pnpm.

A API separa os estágios de build e de dependências de produção
(`pnpm install --prod --filter api...`) e só copia o `dist`. Por
isso `prisma` saiu de devDependencies: a imagem de runtime precisa
do CLI para `prisma migrate deploy`, executado no entrypoint antes
de subir o Nest. `RUN_MIGRATIONS=false` desliga isso quando a
atualização de schema precisa de janela controlada.

`apps/api/tsconfig.build.json` passou a excluir também `src/test`,
que a FASE 7 criou e que quebrava o `nest build`.

Motivos:

- o Nest exige `@studioemar/shared` em CJS e o Prisma Client
  gerado; ambos entram prontos na imagem, sem build no runtime;
- `prisma generate` roda dentro da imagem final, contra a libssl
  dela, e não contra a da máquina de build;
- Debian slim evita compilar `bcrypt` e caçar engine do Prisma
  para musl;
- um `docker compose up -d` deixa o banco no schema certo, sem
  passo manual esquecido.

`NEXT_PUBLIC_API_URL` é build arg, não variável de runtime: o Next
embute `NEXT_PUBLIC_*` no bundle do navegador. Trocar o domínio
exige rebuild da imagem web.

---

## ADR-017 — Exposição só em 127.0.0.1

Status: ACEITO

Decisão:

Em produção, `studio-web` e `studio-api` publicam portas apenas em
`127.0.0.1`. O `studio-postgres` não publica porta nenhuma e só é
alcançável pela rede interna `studio` do Compose.

Motivos:

- o Caddy já existente na VPS é quem fala com a internet (ADR-004),
  e ele alcança as portas locais;
- a stack pode subir na VPS antes da FASE 9 sem expor nada;
- atende "o PostgreSQL NÃO deverá ser exposto publicamente"
  (ARCHITECTURE) sem depender de firewall.

O container de desenvolvimento passou a se chamar
`studio-postgres-dev` para não colidir com o de produção.

---

## Fora de escopo destas decisões

Não foram decididos ainda:

- envio real de e-mail de recuperação.
