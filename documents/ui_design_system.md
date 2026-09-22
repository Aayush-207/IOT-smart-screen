# UI Design System

CampusCast implements a strict, xAI-inspired design language defined in `DESIGN.md`. The design aesthetic emphasizes an "engineered-cosmic, unmarketed" feel. It is characterized by dark canvases, stark contrasts, specific typography, and minimalist borders.

## Core Aesthetic Principles

- **Canvas & Backgrounds**: The application is built on a near-black canvas (`#0a0a0a`). There are no bright gradient heroes or atmospheric backdrops.
- **Interactive Elements**: Primarily styled as white pill outlines or stark white solid buttons.
- **Vibe**: Confidently sparse. It looks like a research tool or a raw engineering interface rather than a consumer SaaS product.

## Typography

Typography relies primarily on a geometric sans-serif (intended to be Universal Sans, gracefully falling back to Inter or system fonts) and a monospace font for captions.

- **Display Fonts**: Universal Sans / Inter (`display-xl` down to `display-xs`). Used for headlines and prominent labels.
- **Body Fonts**: Universal Sans / Inter (`body-lg` down to `body-sm`).
- **Mono / Eyebrows**: GeistMono / ui-monospace (`caption-mono`, `caption-mono-sm`). Used for technical data, small labels, and overlines (eyebrows).

## Color Palette

- **Canvas (Background)**: `#0a0a0a` (`canvas`) up to `#363a3f` (`canvas-mid`) for layering.
- **Ink (Text/Foreground)**: `#ffffff` (`ink`), softening to `#dadbdf` (`body`) and `#7d8187` (`mute`).
- **Borders**: `#212327` (`hairline`). Borders should be thin and subtle.
- **Accents**: Used sparingly. Include sunset (`#ff7a17`), dusk (`#7c3aed`), breeze (`#a0c3ec`), and twilight.

## Implementation Details

The design system is implemented using:
- **Tailwind CSS**: Custom configuration (`tailwind.config.ts` equivalent via PostCSS/v4 styling) utilizing CSS variables mapped to the design tokens.
- **shadcn/ui**: Components are heavily customized to strip away generic aesthetics (like default borders and rounded corners) to match the strict `pill` or sharp `sm` border radius rules defined in the design specs.
- **class-variance-authority (CVA)**: For managing complex component states (e.g., button variants like `primary` vs `outline-on-dark`).

When creating new UI components, developers must consult the `colors`, `typography`, and `components` specifications inside the root `DESIGN.md` file rather than reaching for default Tailwind utility colors.
