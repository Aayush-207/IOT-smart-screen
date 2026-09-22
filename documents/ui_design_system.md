# UI Design System

CampusCast utilizes a sleek, professional, and confident light-themed design language across its administrative and submission interfaces. It blends robust enterprise usability with the official MIT-ADT University brand identity.

## Core Aesthetic Principles

- **Canvas & Backgrounds**: The application is built on a clean slate-themed canvas (`slate-50` to `slate-100`). The goal is an airy, breathable, and highly legible workspace.
- **Interactive Elements**: Buttons are styled starkly using a specific grey-black hex (`#121826`) for primary actions to provide strong contrast without being stark black, ensuring a premium feel.
- **Branding**: The official MIT-ADT University circular logo is paired with a distinct 3-color divider (purple `#a855f7`, orange `#f97316`, green `#10b981`) and the "Intelligent Broadcasts" tagline. This logo block is tightly packed and centrally featured in authentication and navigation components.
- **Vibe**: Professional, sleek, minimal, and explicitly designed to avoid the generic "AI-generated" look. 

## Typography

Typography relies on premium Google Fonts injected globally into layout containers via CSS variable overrides to maintain consistency and override default tailwind `sans` configurations.

- **Display & Body Fonts**: `Plus Jakarta Sans` (`--font-sans`). Used for all headings and body copy to convey a modern corporate aesthetic.
- **Mono / Eyebrows**: `Space Grotesk` (`--font-mono`). Used for technical data, small badges, and tags to provide a sophisticated, technical edge.

## Color Palette

- **Canvas (Background)**: `#f8fafc` (slate-50) up to `#f1f5f9` (slate-100).
- **Ink (Text/Foreground)**: `#0f172a` (slate-900) for primary text, softening to `#64748b` (slate-500) for muted or secondary information.
- **Borders**: Soft dividers using `#e2e8f0` (slate-200).
- **Accents**: 
  - Grey-Black Primary: `#121826`
  - Critical/Emergency: `#ef2045` (Red)
  - MIT-ADT Divider: `#a855f7`, `#f97316`, `#10b981`

## Implementation Details

The design system is implemented using:
- **Tailwind CSS**: Heavy use of `slate` color palettes. All components have been migrated away from `dark:` utility classes to enforce the pristine light mode experience.
- **Framer Motion**: Smooth, native-feeling micro-interactions (such as the accordion drill-downs in the Organization Hierarchy).
- **Lucide Icons**: Consistent, clean iconography scaled proportionally alongside the typography.

When creating new UI components, developers must ensure they inherit from the global CSS variables set in the root layouts and avoid reintroducing default fonts (like Inter or Roboto) that dilute the bespoke design system.
