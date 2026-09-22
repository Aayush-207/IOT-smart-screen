# CampusCast Architecture

## Overview
CampusCast is the **governance, priority, and delivery-verification layer** for campus digital signage. It acts as an orchestrator and manager for announcements across a fleet of physical screens, rather than a standard Content Management System (CMS). 

The primary goal is to ensure that correct, authorized content (routine announcements, time-sensitive updates, or emergencies) is displayed on specific screens, with a complete audit trail of authorization and delivery verification.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth)
- **Storage**: Supabase Storage (for attachments/posters)
- **Styling**: Tailwind CSS, class-variance-authority, shadcn (customized per DESIGN.md)

## Role-Based Access Control (RBAC)
Access is heavily gated by four explicit roles assigned in the `profiles` table:

1. **`submitter`**: Can create announcements (text/image, targets, schedule, priority). Tracks delivery of their own items.
2. **`hod` (Head of Department)**: Approves or rejects routine/time-sensitive announcements originating from their own department.
3. **`admin` (Campus Admin)**: Can approve critical announcements across any department, withdraw live content, manage users and roles, and monitor the entire screen fleet.
4. **`emergency`**: Specific role allowed to broadcast campus-wide emergency overrides that take precedence over all other content and do not require approval.

## High-Level Data Flow

1. **Submission**: A `submitter` creates an announcement. An optional, non-blocking AI advisory check is run via Anthropic (`claude-haiku-4-5`) to check for basic formatting or moderation flags (e.g., missing dates, shouting).
2. **Approval**: 
   - Routine/Time-sensitive: Routed to the `hod` of the submitter's department.
   - Critical: Routed to a Campus `admin`.
3. **Dispatch**: Once approved, the announcement becomes eligible for display if it's within its scheduled timeframe.
4. **Delivery & Heartbeat**: Screens are not strictly connected via WebSockets or MQTT in this HTTP version; instead, they poll an endpoint (`GET /api/screens/[id]`). This heartbeat:
   - Registers the screen as online.
   - Resolves the current winning announcement (Emergency > Priority > Newest).
   - Acknowledges the delivery back to the server (`announcement_deliveries` table updates to `acknowledged` or `displaying`).
5. **Expiry**: A Vercel Cron job (`/api/cron/expire`) runs periodically to sweep approved announcements past their `display_end` date, marking them as `expired`.

## System Boundaries
- **In Scope**: The web dashboard, database schema, RBAC rules, HTTP polling endpoints, Vercel cron job for expiry, and AI moderation integration.
- **Out of Scope (Future/Hardware layer)**: The physical Raspberry Pi Python agent, AWS IoT Core/MQTT layer (for actual push-based updates), and Institutional SSO configurations.
