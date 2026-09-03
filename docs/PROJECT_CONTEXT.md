# Contexto do Projeto — Studio EMAR

## 1. Visão geral

O projeto consiste no desenvolvimento de um sistema de gerenciamento
para o Studio EMAR.

O primeiro módulo a ser desenvolvido será o módulo de agendamento de
treinos.

O sistema deverá ser simples, moderno, responsivo e mobile first.

## 2. Situação atual

Já existem protótipos/telas desenvolvidos em HTML.

Eles estão disponíveis em:

/prototypes

Essas interfaces serão utilizadas como referência para construção do
frontend React/Next.js.

## 3. Usuários

Inicialmente existem:

### Aluno

Poderá:

- visualizar sua agenda;
- visualizar próximos treinos;
- editar perfil;
- cancelar aulas;
- visualizar créditos;
- utilizar crédito para reposição;
- visualizar horários disponíveis.

### Treinador / Proprietário

Poderá:

- gerenciar alunos;
- configurar planos;
- configurar agenda recorrente;
- acompanhar agenda;
- acompanhar ocupação;
- visualizar cancelamentos;
- acompanhar créditos;
- visualizar indicadores e dashboards.

## 4. Princípio central

O aluno normalmente NÃO escolhe livremente seus treinos semanais.

O treinador estabelece sua programação recorrente conforme o pacote
contratado.

Exemplo:

Plano:
3 treinos por semana

Agenda:

SEG 18:00
QUA 18:00
SEX 17:00

## 5. Reposição

Quando um aluno cancela uma aula dentro do prazo permitido, poderá
receber um crédito.

Esse crédito poderá ser utilizado para reservar outro horário com vaga.

## 6. Visibilidade

Aluno e treinador deverão visualizar em tempo atualizado:

- horários disponíveis;
- horários lotados;
- quantidade de vagas.

O aluno não precisa visualizar quem são os demais alunos do horário.

O treinador poderá visualizar os participantes.

## 7. Dashboard

O treinador/proprietário deverá visualizar indicadores como:

- taxa de ocupação;
- horários mais ocupados;
- horários menos ocupados;
- quantidade de vagas;
- cancelamentos;
- reposições;
- ocupação diária;
- ocupação semanal.

## 8. Estratégia de desenvolvimento

Primeiro:

WEB.

Posteriormente:

APP Android e iOS.

O aplicativo utilizará a mesma API do sistema web.

## 9. Objetivo futuro

A arquitetura deverá permitir adicionar posteriormente outros módulos
de gerenciamento do Studio sem reconstruir o núcleo do sistema.