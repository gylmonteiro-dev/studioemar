# Infraestrutura — Studio EMAR

Docker de desenvolvimento e de produção (FASE 8).

A publicação na VPS, o domínio e o Caddy são a FASE 9. Aqui a stack
sobe fechada em `127.0.0.1`, pronta para receber o proxy depois.

## Arquivos

```
docker-compose.dev.yml     só o Postgres de desenvolvimento
docker-compose.prod.yml    postgres + api + web
Dockerfile.api             imagem da API NestJS
Dockerfile.web             imagem do Next.js (output standalone)
.env.example               variáveis da stack de produção
scripts/api-entrypoint.sh  migrations + start da API
scripts/backup.sh          dump comprimido do Postgres
scripts/restore.sh         restaura um dump
```

## Desenvolvimento

```
pnpm db:up          # sobe studio-postgres-dev na 127.0.0.1:5434
pnpm prisma:deploy
pnpm prisma:seed
pnpm db:down
```

O container de desenvolvimento se chama `studio-postgres-dev` para
conviver com o `studio-postgres` de produção na mesma máquina.

## Produção

```
cp infrastructure/.env.example infrastructure/.env
# edite: senhas, segredos JWT, WEB_ORIGIN, NEXT_PUBLIC_API_URL

pnpm prod:build
pnpm prod:up
pnpm prod:ps
pnpm prod:logs
pnpm prod:down
```

Gere cada segredo com `openssl rand -base64 48`. O `.env` não é
versionado.

### Containers

| Container         | Porta publicada  | Observação                  |
| ----------------- | ---------------- | --------------------------- |
| `studio-web`      | `127.0.0.1:3000` | Next standalone             |
| `studio-api`      | `127.0.0.1:3001` | NestJS + Prisma             |
| `studio-postgres` | nenhuma          | só na rede interna `studio` |

Nada escuta em `0.0.0.0`: na FASE 9 o Caddy existente faz o proxy para
essas portas locais. O Postgres não publica porta nenhuma (ARCHITECTURE).

Dados em `studio_postgres_data`, um volume nomeado que sobrevive a
`down` e a troca de imagem. `pnpm prod:down` não apaga o volume;
`docker compose ... down -v` apaga.

### NEXT_PUBLIC_API_URL é build-time

O Next embute as variáveis `NEXT_PUBLIC_*` no bundle que vai para o
navegador. Mudar `NEXT_PUBLIC_API_URL` exige `pnpm prod:build` de novo;
só reiniciar o container não adianta.

`WEB_ORIGIN` é o outro lado da mesma moeda: é a origem que o CORS da
API aceita. As duas precisam bater com o domínio real.

### Migrations

O entrypoint da API roda `prisma migrate deploy` antes de subir o Nest.
Para atualizar o schema em janela controlada, suba com
`RUN_MIGRATIONS=false` e aplique manualmente:

```
docker compose -f infrastructure/docker-compose.prod.yml exec api \
  sh -c 'cd /repo/apps/api && ./node_modules/.bin/prisma migrate deploy'
```

Não há seed em produção: a imagem não carrega `tsx`. As contas reais
são criadas pelo professor (ADR-010).

### Health checks

Os três serviços têm health check e o Compose respeita a ordem:
o Postgres precisa estar `healthy` antes da API, e a API antes da web.
A API responde em `GET /health`; a web é verificada em `GET /login`,
que não exige sessão.

## Backup

```
pnpm prod:backup                          # dump em infrastructure/backups
pnpm prod:restore infrastructure/backups/studioemar-AAAAMMDD-HHMMSS.sql.gz
```

O dump é `pg_dump --clean --if-exists` comprimido com gzip. O arquivo só
recebe o nome definitivo quando termina, então um backup interrompido
nunca se passa por válido. `BACKUP_RETENTION_DAYS` (padrão 14) controla
o expurgo.

O restore para a API, aplica o dump e sobe a API de novo. Ele pede
confirmação digitada porque sobrescreve os dados atuais.

Backup diário via cron na VPS:

```
0 3 * * * cd /caminho/do/studioemar && bash infrastructure/scripts/backup.sh >> /var/log/studioemar-backup.log 2>&1
```

Backup só vale se o restore for testado. Restaure num banco de teste
antes de precisar de verdade.

## Atualização

```
git pull
pnpm prod:build
pnpm prod:up          # recria só o que mudou
```

Faça um backup antes de qualquer atualização que traga migration.
