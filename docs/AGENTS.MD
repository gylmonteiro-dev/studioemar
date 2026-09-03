# AGENTS.md — Studio EMAR

## Objetivo

Este repositório contém o sistema de gerenciamento e agendamento do
Studio EMAR.

O desenvolvimento será realizado incrementalmente com apoio de agentes
de IA.

O agente deve atuar como desenvolvedor sênior e arquiteto, mas também
explicar decisões relevantes ao desenvolvedor.

## Antes de desenvolver

Antes de alterações relevantes, consulte:

- docs/PROJECT_CONTEXT.md
- docs/BUSINESS_RULES.md
- docs/ARCHITECTURE.md
- docs/DESIGN_SYSTEM.md
- docs/ROADMAP.md
- docs/DECISIONS.md
- docs/HANDOFF.md

Os arquivos em /prototypes são referências visuais das interfaces já
aprovadas.

## Forma de trabalho

Para cada etapa:

1. Analise o estado atual.
2. Explique brevemente o objetivo.
3. Informe quais arquivos serão modificados.
4. Implemente somente o escopo solicitado.
5. Explique decisões técnicas relevantes.
6. Informe como testar.
7. Sugira uma mensagem de commit.
8. Aguarde autorização antes de mudanças arquiteturais relevantes.

Não realizar grandes refatorações silenciosamente.

## Princípios

Priorizar:

- simplicidade;
- legibilidade;
- componentes reutilizáveis;
- TypeScript;
- segurança;
- responsividade;
- mobile first;
- baixo acoplamento;
- separação entre frontend e regras de negócio;
- baixo custo operacional.

Evitar overengineering.

## Stack planejada

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Lucide React
- Recharts quando necessário

Backend:
- Node.js
- NestJS
- TypeScript
- Prisma

Banco:
- PostgreSQL

Mobile futuro:
- React Native
- Expo
- TypeScript

Infraestrutura:
- Docker
- Docker Compose
- Caddy existente na VPS

## Restrições

Não:

- adicionar SaaS sem necessidade;
- utilizar Supabase/Firebase como dependência do projeto;
- armazenar secrets no código;
- expor PostgreSQL publicamente;
- alterar configuração do Caddy sem análise;
- alterar outras aplicações existentes na VPS;
- reescrever o design aprovado sem necessidade;
- instalar bibliotecas redundantes;
- colocar regras importantes somente no frontend;
- implementar funcionalidades não solicitadas.

## HTML existente

Os HTMLs em /prototypes são referências visuais.

Não simplesmente copiar HTML para React.

Identificar e transformar elementos repetidos em componentes
reutilizáveis.

Preservar:

- identidade visual;
- hierarquia;
- fluxos;
- responsividade;
- experiência aprovada.

## Documentação

Após uma decisão arquitetural aprovada, atualizar:

docs/DECISIONS.md

Após mudança em regra de negócio:

docs/BUSINESS_RULES.md

Após conclusão de fase:

docs/ROADMAP.md

Antes de encerrar uma sessão relevante:

docs/HANDOFF.md

## Conflitos

Se código, protótipo e documentação entrarem em conflito:

NÃO escolher silenciosamente.

Apresente o conflito e solicite decisão quando ele afetar comportamento,
regra de negócio ou arquitetura.