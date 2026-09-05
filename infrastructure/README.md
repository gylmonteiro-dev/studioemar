# Infraestrutura — Studio EMAR

Docker de desenvolvimento e de produção, incluindo a publicação na VPS.

Na VPS, web e API continuam publicadas somente em `127.0.0.1` e também
participam da rede Docker externa `edge`. O Caddy compartilhado acessa os
containers por essa rede; o PostgreSQL permanece apenas na rede `studio`.

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

### Containers e Caddy

| Container         | Porta publicada  | Observação                  |
| ----------------- | ---------------- | --------------------------- |
| `studio-web`      | `127.0.0.1:3000` | Next standalone             |
| `studio-api`      | `127.0.0.1:3001` | NestJS + Prisma             |
| `studio-postgres` | nenhuma          | só na rede interna `studio` |

Nada da aplicação escuta em `0.0.0.0`: o Caddy existente é o único
container publicado nas portas 80/443. Antes de subir a stack na VPS, a
rede compartilhada precisa existir:

```
docker network inspect edge >/dev/null 2>&1 || docker network create edge
```

Blocos adicionados ao Caddyfile compartilhado da VPS:

```caddyfile
studioemar.com.br {
	encode gzip
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options nosniff
		X-Frame-Options DENY
		Referrer-Policy strict-origin-when-cross-origin
		-Server
	}
	reverse_proxy studio-web:3000
}

api.studioemar.com.br {
	encode gzip
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options nosniff
		X-Frame-Options DENY
		Referrer-Policy strict-origin-when-cross-origin
		-Server
	}
	reverse_proxy studio-api:3001
}
```

O Caddyfile deve ser copiado antes da edição e validado antes do reload:

```
docker exec nexus_caddy caddy validate --config /etc/caddy/Caddyfile
docker exec nexus_caddy caddy reload --config /etc/caddy/Caddyfile
```

Se o arquivo no host e `/etc/caddy/Caddyfile` dentro do container tiverem
quantidades de linhas diferentes, o bind mount aponta para um inode antigo.
Valide o arquivo atual num container temporário e recrie somente o serviço
do proxy para remontá-lo; um simples restart ou reload não corrige o mount.

Na configuração atual, o Caddyfile pertence ao checkout do Genius Certify e
fica modificado naquele repositório. Antes de atualizar o Genius, preserve
os blocos do Studio EMAR e a cópia `Caddyfile.before-studioemar-*`; um pull
ou checkout forçado pode remover o proxy do Studio.

Os registros DNS A de `@` e `api` devem apontar para a VPS. Não configure
AAAA enquanto a VPS não tiver IPv6 preparado para o serviço.

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

Não execute o seed local em produção: ele usa a senha pública
`studioemar`. Para uma homologação descartável, a imagem contém uma
rotina compilada que gera senhas aleatórias e substitui todo o banco:

```
docker compose -f infrastructure/docker-compose.prod.yml exec \
  -e CONFIRM_PREVIEW_SEED=APAGAR_E_CARREGAR_HOMOLOGACAO \
  api node apps/api/dist/scripts/seed-preview.js
```

A saída mostra uma única vez as credenciais do treinador e dos alunos.
Guarde-as fora do Git e dos logs. O treinador padrão da homologação é
`Elissandro <elissandro@mail.com>`; nome e e-mail podem ser sobrescritos
com `PREVIEW_TRAINER_NAME` e `PREVIEW_TRAINER_EMAIL`.

### Encerrar a homologação

O reset abaixo é irreversível e deve ser executado somente com autorização
explícita. Ele remove apenas os containers e o volume do Studio EMAR:

```
docker compose -f infrastructure/docker-compose.prod.yml down
docker volume rm studio_postgres_data
docker compose -f infrastructure/docker-compose.prod.yml up -d
```

Na subida, as migrations criam um banco limpo. Antes do reset, preserve o
último dump pelo período acordado. O seed de homologação não deve ser
executado no ambiente definitivo.

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
0 3 * * * cd /opt/studioemar && bash infrastructure/scripts/backup.sh >> /var/log/studioemar-backup.log 2>&1
```

Backup só vale se o restore for testado. Restaure num banco de teste
isolado antes de precisar de verdade. Os dumps locais protegem contra
erro operacional, mas não contra perda da VPS; cópia off-site permanece
obrigatória antes do uso definitivo.

## Deploy e atualização na VPS

A VPS não precisa de Node nem pnpm: o build acontece dentro do Docker.
Primeira publicação:

```
git clone https://github.com/gylmonteiro-dev/studioemar.git /opt/studioemar
cd /opt/studioemar
cp infrastructure/.env.example infrastructure/.env
# editar segredos e domínios antes do build
docker compose -f infrastructure/docker-compose.prod.yml build api
docker compose -f infrastructure/docker-compose.prod.yml build web
docker compose -f infrastructure/docker-compose.prod.yml up -d
```

Atualização controlada:

```
cd /opt/studioemar
bash infrastructure/scripts/backup.sh
git pull --ff-only origin main
docker compose -f infrastructure/docker-compose.prod.yml build api
docker compose -f infrastructure/docker-compose.prod.yml build web
docker compose -f infrastructure/docker-compose.prod.yml up -d
docker compose -f infrastructure/docker-compose.prod.yml ps
```

Faça sempre um backup antes de atualização com migration. Se a nova
versão falhar, volte ao commit anterior, reconstrua as imagens e restaure
o dump apenas se a migration tiver alterado dados de forma incompatível.
`NEXT_PUBLIC_API_URL` é build-time, portanto troca de domínio exige rebuild
da web.
