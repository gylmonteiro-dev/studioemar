# Arquitetura — Studio EMAR

## Status

Arquitetura inicial proposta.

Alterações relevantes devem ser registradas em DECISIONS.md.

## Stack

### Web

Next.js
React
TypeScript
Tailwind CSS

Bibliotecas previstas:

React Hook Form
Zod
Lucide React
Recharts

### Backend

Node.js
NestJS
TypeScript

### ORM

Prisma

### Banco

PostgreSQL

### Mobile

Futuramente:

React Native
Expo
TypeScript

---

# Arquitetura lógica

Web Next.js
      |
      |
      v
NestJS REST API
      |
      |
      v
PostgreSQL


Futuramente:

React Native
      |
      +---------> NestJS REST API

Web e mobile deverão utilizar a mesma API.

---

# API

Inicialmente utilizar REST.

Documentação:

OpenAPI / Swagger.

Módulos previstos:

auth
users
students
trainers
plans
schedules
bookings
cancellations
credits
dashboard

Não criar todos imediatamente.

---

# Autenticação

Planejada:

JWT Access Token
Refresh Token

Perfis:

STUDENT
TRAINER
ADMIN

Detalhes definitivos serão definidos antes da implementação.

---

# Banco

PostgreSQL deverá funcionar inicialmente em container.

Persistência:

Docker Volume.

Conexão através de:

DATABASE_URL

O PostgreSQL NÃO deverá ser exposto publicamente.

---

# Containers

Estrutura conceitual:

studio-web
studio-api
studio-postgres

---

# VPS

A VPS já possui outras aplicações.

Existe um Caddy funcionando como reverse proxy.

NÃO criar outro Caddy automaticamente.

NÃO modificar outras aplicações.

Arquitetura:

Internet
   |
   v
Caddy existente
   |
   +----> Studio Web
   |
   +----> Studio API

O domínio temporário será configurado posteriormente.

---

# Produção

A aplicação deverá ser preparada para:

Docker
Docker Compose
Variáveis de ambiente
Volumes persistentes
Health checks
Logs
Backup PostgreSQL
Atualização controlada

---

# Segurança

Obrigatório:

- secrets fora do Git;
- senhas com hash;
- validação de entrada;
- autorização;
- CORS controlado;
- banco não exposto;
- logs sem informações sensíveis;
- HTTPS através do Caddy.

---

# Princípio arquitetural importante

Regras como:

cancelamento;
crédito;
capacidade;
reposição;
permissões;

NÃO devem depender exclusivamente do frontend.

O backend deverá ser a autoridade dessas regras.

Isso é necessário porque futuramente existirão:

Web
+
Android
+
iOS

utilizando a mesma API.