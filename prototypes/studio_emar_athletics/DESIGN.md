---
name: Studio EMAR Athletics
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c9c6c5'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c1600'
  on-tertiary-container: '#bf7100'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86f'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system embodies **High-Performance Minimalism**. It is built for a premium athletic audience that values precision, energy, and tech-forward aesthetics. The style combines a **Corporate Modern** structure with **High-Contrast Bold** accents to create an environment that feels both professional and highly motivating.

The visual narrative focuses on "Functional Power." Every element is intentional, stripping away decorative clutter to highlight performance data and calls to action. The interface should feel expansive and breathable, using stark contrasts to guide the eye toward movement and achievement.

## Colors
The palette is rooted in a monochromatic foundation to establish a sense of authority and clarity. 
- **Primary Black (#050505):** Used for primary text, structural borders, and high-impact containers.
- **Secondary White (#FFFFFF):** The main surface color to ensure maximum readability and a "clean" energy.
- **Vibrant Orange (#F79400):** Reserved strictly for interactive elements, progress indicators, and vital highlights. 
- **The Performance Gradient:** A transition from #F79400 to #FF6A1A is used sparingly for premium feature cards, active states in data visualizations, and high-conversion buttons to add depth and motion.
- **Secondary Surface (#F5F5F5):** Used for background sections to subtly differentiate content zones without introducing visual noise.

## Typography
The typography utilizes **Inter** for its systematic and athletic clarity. It is designed to scale from massive, aggressive display headers to highly legible body text. 

To introduce a "tech-forward" feel, **JetBrains Mono** is utilized for labels, data points, and metadata. This monospaced secondary font provides a rhythmic, precise contrast to the fluid nature of Inter. 

Headers should utilize tight letter-spacing to feel more compact and powerful. Large display text should always be set in extra-bold or black weights to mimic the impact of fitness branding.

## Layout & Spacing
This design system uses a **Fluid Grid** model based on an 8px square rhythm.
- **Desktop:** 12-column grid with 24px gutters and wide 48px margins to maintain a premium, spacious feel.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px margins.

Content is organized into vertical "stacks." Large gaps (stack-lg) are used between major sections to emphasize a minimalist, editorial layout. Smaller units (stack-sm) are used for grouping related metadata or form elements.

## Elevation & Depth
Depth is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. This maintains a flat, modern aesthetic suitable for tech-performance apps.

- **Level 0 (Base):** Background color #FFFFFF.
- **Level 1 (Sub-section):** Background color #F5F5F5.
- **Level 2 (Cards/Floating):** Background #FFFFFF with a 1px solid border of #050505 at 5% opacity.
- **Interactive States:** When an element is hovered or active, it utilizes a subtle "Performance Shadow"—a very soft, highly diffused orange tint (e.g., #F79400 at 10% opacity) to signify energy.

Avoid traditional drop shadows to keep the UI looking "crisp" and engineered.

## Shapes
The shape language is geometric and disciplined. A standard **12px (rounded-lg)** radius is the primary choice for cards and large containers, providing a modern feel that isn't overly "bubbly." 

- **Standard Elements:** 8px (rounded) for buttons and input fields.
- **Large Containers:** 16px (rounded-xl) for section-level cards.
- **Data Points:** Sharp 0px corners are reserved for small decorative accents or dividers to maintain a "tech" edge.

## Components

### Buttons
- **Primary:** Background #050505, Text #FFFFFF, 8px radius. High impact, solid.
- **Action/CTA:** Background Gradient (#F79400 to #FF6A1A), Text #FFFFFF. Used for the single most important action on a screen.
- **Ghost:** Border 1px #050505, Text #050505. Used for secondary navigation.

### Cards
Cards use a 12px corner radius. Premium "Member" or "Performance" cards should utilize a dark theme (Background #050505, Text #FFFFFF) to differentiate from standard content cards which remain white with light borders.

### Input Fields
Inputs should be minimalist: a 1px bottom border or a subtle #F5F5F5 fill. Focus states must clearly use the Vibrant Orange for the border or a 2px underline.

### Data Visualization & Chips
Chips for "Status" or "Categories" use the monospaced label font. Active chips use the Vibrant Orange background with white text; inactive chips use a light gray background with black text.

### Progress Indicators
Progress bars should always use the accent gradient to symbolize momentum and energy flow.