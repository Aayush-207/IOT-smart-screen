# API Contracts

The CampusCast backend is built using Next.js 14+ Route Handlers (`src/app/api`). The physical devices and scheduled jobs rely on specific HTTP contracts.

## 1. Screen Polling Contract

**Endpoint:** `GET /api/screens/[id]`
**Authentication:** Public (no auth token required, uses Supabase Anon key)

This endpoint acts as the heartbeat and content synchronizer for physical screens.

**Request:**
The screen sends its ID in the URL.

**Response (JSON):**
```json
{
  "announcement": {
    "id": "uuid",
    "title": "Announcement Title",
    "body": "Announcement Body",
    "attachment_url": "url_to_storage_if_any",
    "is_emergency": false,
    "severity": null
  } | null,
  "force_refresh": false,
  "reboot_requested": false
}
```

**Side Effects:**
- Updates `screens.last_seen_at` to `now()`.
- Determines the active announcement based on rules: Active Emergency > Highest Priority (`critical` > `timesensitive` > `routine`) > Newest.
- Updates `announcement_deliveries.state` to `acknowledged` or `displaying` for that screen.
- Clears the one-shot `force_refresh_requested` or `reboot_requested` flags from the database.

## 2. Scheduled Expiry (Cron)

**Endpoint:** `GET /api/cron/expire`
**Authentication:** Requires `Authorization: Bearer $CRON_SECRET`

**Purpose:**
Checks for approved announcements where `display_end` is in the past. It transitions these announcements to the `expired` status and also marks their associated `announcement_deliveries` rows as expired.

**Execution:**
Configured via `vercel.json` to run every 15 minutes, but can be manually triggered via `curl`.

## 3. AI Moderation Advisory

**Endpoint:** `POST /api/announcements/moderate`
**Authentication:** Internal/Server-side request using Anthropic API Key.

**Purpose:**
Invoked as a fire-and-forget background task when a submitter sends an announcement for approval. It performs two types of checks:
1. **Deterministic Checks:** Looks for basic errors like missing display windows or dates.
2. **LLM Check:** Calls `claude-haiku-4-5` to provide an advisory opinion on the tone or appropriateness of the message (e.g., detecting if the text is "shouting" or unprofessional).

The result is saved to the `announcements.ai_advisory` JSONB column. This process never rejects an announcement automatically; it solely provides metadata for the human approver.
