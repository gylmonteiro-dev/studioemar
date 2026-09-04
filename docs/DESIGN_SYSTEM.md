# Design System — Studio EMAR Athletics

## 1. Objetivo

Este documento define a identidade visual e os principais design tokens
do sistema Studio EMAR Athletics.

Ele deve ser considerado a FONTE DE VERDADE para cores e decisões
visuais da aplicação.

Os protótipos HTML existentes em `/prototypes` continuam sendo referência
para composição, navegação, hierarquia e experiência do usuário.

Entretanto, em caso de divergência de cores entre os protótipos e este
documento, ESTE DOCUMENTO PREVALECE.

---

# 2. Princípios Visuais

A interface deve transmitir:

- energia;
- performance;
- modernidade;
- simplicidade;
- tecnologia;
- qualidade premium.

A identidade do Studio EMAR utiliza como elementos centrais:

- preto profundo;
- branco;
- laranja EMAR;
- gradientes em laranja;
- superfícies claras e neutras.

O laranja deve ser utilizado estrategicamente.

Evitar transformar grandes partes da aplicação em superfícies laranjas.

Priorizar o laranja para:

- CTAs;
- estados ativos;
- ícones importantes;
- indicadores;
- destaques;
- elementos de interação.

---

# 3. Paleta Oficial

## 3.1 Brand / Core

### Laranja EMAR

Token:

`accent` (`--color-accent`)

HEX:

`#F79400`

RGB:

`rgb(247, 148, 0)`

Uso:

- CTAs (sólido `accent` ou gradiente `bg-cta`);
- seleção ativa;
- ícones de ação;
- indicadores;
- destaques importantes.

O botão sólido preto continua `primary`. Não usar laranja
em superfícies grandes (login, cards escuros).

---

### Laranja Gradiente

Token:

`accent-end` (`--color-accent-end`)

Utility:

`bg-cta`

HEX:

`#FF6A1A`

RGB:

`rgb(255, 106, 26)`

Uso:

- gradientes;
- hover states;
- badges de destaque;
- elementos visuais de alta energia.

Gradiente oficial recomendado:

`#F79400 → #FF6A1A`

---

### Preto Profundo

Token:

`surface-dark` (`--color-surface-dark`) — superfícies escuras

`primary` (`--color-primary`) — botão sólido preto

HEX:

`#050505`

RGB:

`rgb(5, 5, 5)`

Uso:

- tela de login;
- cards escuros de destaque;
- card "Seu próximo treino";
- detalhes de headers;
- superfícies premium;
- elementos de contraste.

---

### Branco

Token:

`surface` (`--color-surface`) e `accent-foreground` / `primary-foreground` / `surface-dark-foreground` (`#FFFFFF`)

HEX:

`#FFFFFF`

RGB:

`rgb(255, 255, 255)`

Uso:

- cards;
- modais;
- superfícies;
- textos sobre fundos escuros;
- textos sobre botões primários.

---

# 4. Superfícies

## Background principal

Token:

`background` (`--color-background`)

HEX:

`#F9F9F9`

Uso:

Background geral da aplicação.

---

## Surface

Token:

`surface` (`--color-surface`)

HEX:

`#FFFFFF`

Uso:

- cards;
- modais;
- containers;
- painéis.

---

## Surface Low

Token:

`muted` (`--color-muted`)

HEX:

`#F3F3F3`

Uso:

- inputs secundários;
- tags neutras;
- botões desativados;
- seletores de data;
- superfícies secundárias.

---

## Border

Token:

`border` (`--color-border`)

HEX:

`#EAEAEA`

Uso:

- divisores;
- bordas de cards;
- separadores.

---

## Border Strong / Hover

Token:

`border-hover` (`--color-border-hover`)

HEX:

`#DADADA`

Uso:

- hover;
- focus;
- bordas de botões secundários;
- cards destacados.

---

# 5. Tipografia

## Text Primary

Token:

`foreground` (`--color-foreground`)

HEX:

`#111111`

Uso:

- H1;
- H2;
- títulos;
- horários;
- valores;
- informações prioritárias.

---

## Text Secondary

Token:

`muted-foreground` (`--color-muted-foreground`)

HEX:

`#717171`

Uso:

- legendas;
- descrições;
- metadados;
- datas;
- capacidade de horários;
- validade de créditos.

---

## Text Muted

Token:

`faint` (`--color-faint`)

HEX:

`#A3A3A3`

Uso:

- placeholders;
- textos desabilitados;
- ícones inativos;
- informações de baixa prioridade.

---

## Text Inverse

Token:

`surface-dark-foreground` / `accent-foreground` / `primary-foreground`

HEX:

`#FFFFFF`

Uso:

Texto sobre:

- `#050505`;
- `#F79400`;
- superfícies escuras.

---

# 6. Estados Semânticos

As cores semânticas representam ESTADOS FUNCIONAIS.

Não devem ser substituídas automaticamente pelo laranja da marca.

---

## Success / Available

Tokens:

`success-subtle` / `success`

Background:

`#EBF7EE`

Text:

`#166534`

Uso:

- horários disponíveis;
- confirmação;
- ações concluídas;
- créditos disponíveis.

Exemplo:

`2 VAGAS`

---

## Warning

Tokens:

`warning-subtle` / `warning`

Background:

`#FEF9C3`

Text:

`#854D0E`

Uso:

- última vaga;
- alertas;
- situações que exigem atenção.

Exemplo:

`1 VAGA`

---

## Full / Disabled

Tokens:

`full-subtle` / `full`

Background:

`#F1F1F1`

Text:

`#717171`

Uso:

- horário lotado;
- ações indisponíveis;
- controles desabilitados.

Exemplo:

`LOTADO`

---

## Danger

Tokens:

`danger-subtle` / `danger`

Background:

`#FEE2E2`

Text:

`#DC2626`

Uso:

- cancelamentos;
- erros;
- ações destrutivas;
- cancelamento fora do prazo.

---

# 7. CSS Variables Oficiais

Fonte no código: `apps/web/src/styles/tokens.css`.

Não espalhar HEX nos componentes. Preferir classes Tailwind
(`bg-accent`, `bg-surface-dark`, `text-foreground`, `bg-cta`).

```css
@theme {
  --color-background: #f9f9f9;
  --color-foreground: #111111;
  --color-primary: #050505;
  --color-primary-foreground: #ffffff;
  --color-surface: #ffffff;
  --color-surface-dark: #050505;
  --color-surface-dark-foreground: #ffffff;
  --color-muted: #f3f3f3;
  --color-muted-foreground: #717171;
  --color-faint: #a3a3a3;
  --color-border: #eaeaea;
  --color-border-hover: #dadada;
  --color-accent: #f79400;
  --color-accent-end: #ff6a1a;
  --color-accent-foreground: #ffffff;
  --color-success: #166534;
  --color-success-subtle: #ebf7ee;
  --color-warning: #854d0e;
  --color-warning-subtle: #fef9c3;
  --color-danger: #dc2626;
  --color-danger-subtle: #fee2e2;
  --color-full: #717171;
  --color-full-subtle: #f1f1f1;
}
```

Gradiente oficial: utility `bg-cta` (`#F79400 → #FF6A1A`).

---

# 8. Mapeamento Tailwind

| Papel | Classe | HEX |
|---|---|---|
| Laranja EMAR | `accent` | `#F79400` |
| Gradiente | `bg-cta` | `#F79400 → #FF6A1A` |
| Superfície escura | `surface-dark` | `#050505` |
| Botão sólido preto | `primary` | `#050505` |
| Fundo da página | `background` | `#F9F9F9` |
| Card / modal | `surface` | `#FFFFFF` |
| Superfície baixa | `muted` | `#F3F3F3` |
| Texto principal | `foreground` | `#111111` |
| Texto secundário | `muted-foreground` | `#717171` |
| Placeholder / inativo | `faint` | `#A3A3A3` |
| Borda | `border` | `#EAEAEA` |

`primary` **não** é o laranja da marca. O laranja vive em `accent` e `bg-cta`, para não pintar login, cards escuros e o botão preto.

---

# 9. Tipografia e forma

- Inter: texto e títulos (`next/font`).
- JetBrains Mono: labels, metadados, badges.
- Ícones: Lucide React.
- Raios: botão/input `0.5rem`; cards `1rem`.

Validar aproximadamente 390px, 768px, 1024px e 1440px.

---

# 10. Modo dark (padrão)

A aplicação inicia em dark. O light permanece o modo
documentado nas seções 3–8.

O laranja EMAR e o gradiente não mudam.

| Papel | Dark |
|---|---|
| `background` | `#050505` |
| `foreground` | `#FFFFFF` |
| `primary` (botão sólido) | `#FFFFFF` (texto `#050505`) |
| `surface` | `#141414` |
| `surface-dark` | `#1A1A1A` |
| `muted` | `#1C1C1C` |
| `muted-foreground` | `#A3A3A3` |
| `faint` | `#717171` |
| `border` | `#2A2A2A` |

Preferência gravada em `localStorage` (`studioemar.theme`).
O login continua com superfície escura de marca.
