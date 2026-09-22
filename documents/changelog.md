# Changelog

All notable changes to the CampusCast codebase and architecture will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created the initial `documents/` folder to store comprehensive system documentation.
- Created `architecture.md` to explain RBAC and high-level data flow.
- Created `database_schema.md` detailing tables, relationships, and RLS policies.
- Created `api_contracts.md` outlining the hardware polling and internal endpoints.
- Created `ui_design_system.md` reflecting the initial styling guidelines.
- Created `src/lib/data/orgData.ts` by parsing Google Sheets CSVs, mapping 59 total active student clubs across 11 schools and institutes, and linking 757 scheduled events.
- Created a new interactive organizational explorer (`AdminOverviewDashboard`) on the Admin Dashboard using `framer-motion` for a drill-down accordion view of Schools -> Clubs -> Events.

### Changed
- Re-styled the `/login` page and the `AppSidebar` to firmly feature the official MIT-ADT University branding, integrating the circular MIT-ADT logo, the trademark 3-color divider line, and the "Intelligent Broadcasts" tagline tightly packed into a unified logo block.
- Executed a major UI migration across the Admin Dashboard (`/dashboard/admin`), moving away from the initial dark xAI-inspired design to a premium, sleek light theme utilizing Slate backgrounds and grey-black (`#121826`) button accents.
- Overhauled the Admin Dashboard typography, globally importing and injecting `Plus Jakarta Sans` for body text/headings and `Space Grotesk` for monospace badges to avoid generic AI-generated aesthetics.

### Deprecated
- (No deprecations yet)

### Removed
- Removed and archived old AI-generated images of the Peace Dome, excluding them from version control.
- Removed hardcoded dark-mode (`dark:`) utility classes from all admin component files via an automated migration script.

### Fixed
- Fixed missing `framer-motion` dependency by running `npm install framer-motion`.

---
*Note for future modifications: When making changes to the codebase, add an entry to the `[Unreleased]` section above.*
