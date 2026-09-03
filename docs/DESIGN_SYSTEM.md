# Design System — Studio EMAR

## Referência

As interfaces HTML existentes e a identidade visual oficial do Studio
EMAR são as referências do sistema.

## Princípios

O produto deverá transmitir:

- energia;
- performance;
- modernidade;
- simplicidade;
- tecnologia;
- qualidade premium.

## Estratégia

Mobile First.

Não redesenhar arbitrariamente interfaces já aprovadas.

---

# Paleta oficial

ATUALIZAR COM A PALETA FORNECIDA PELO STUDIO.

Primary:
PENDENTE

Secondary:
PENDENTE

Accent:
PENDENTE

Background:
PENDENTE

Foreground:
PENDENTE

Surface:
PENDENTE

Muted:
PENDENTE

Border:
PENDENTE

---

# Cores semânticas

Também serão necessárias:

success
warning
danger
info

Elas devem:

- possuir contraste adequado;
- harmonizar com a identidade;
- ser definidas centralmente.

---

# Tailwind

Não espalhar valores HEX pelos componentes.

EVITAR:

bg-[#xxxxxx]

PREFERIR:

bg-primary
text-foreground
bg-surface
text-muted-foreground
border-border

As cores deverão ser centralizadas através de design tokens.

---

# Componentes

Criar componentes reutilizáveis para:

Button
Card
Input
Select
Badge
Modal
BottomSheet
Avatar
Toast

ScheduleCard
WorkoutCard
TimeSlotCard
AvailabilityBadge

MetricCard
OccupancyChart
OccupancyHeatmap

MobileNavigation
DesktopSidebar
Header

---

# Mobile

Priorizar:

- bottom navigation;
- cards;
- CTAs acessíveis;
- áreas de toque adequadas;
- pouca informação simultânea;
- hierarquia visual.

---

# Desktop

No painel administrativo utilizar:

- sidebar;
- cards;
- gráficos;
- tabelas;
- agenda expandida;
- aproveitamento horizontal.

---

# Responsividade

Validar aproximadamente:

390px
768px
1024px
1440px

Não aceitar overflow horizontal não intencional.