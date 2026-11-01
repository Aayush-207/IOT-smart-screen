<div align="center">

# 📡 CampusCast — IoT Smart Screen & Digital Signage Network

**An enterprise-grade governance, priority routing, and delivery network for campus digital displays.**

[![Live Production](https://img.shields.io/badge/Netlify-Live%20Deployment-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://campuscast-smart-screen.netlify.app)
[![Next.js 16](https://img.shields.io/badge/Next.js%2016-App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<br />

### 🌐 [https://campuscast-smart-screen.netlify.app](https://campuscast-smart-screen.netlify.app)

</div>

---

## 🖥️ Live Application Preview

<div align="center">

### 1. Central Admin & Governance Overview
*Real-time overview of active broadcasts, approval queues, and system telemetry.*
<br />
<img src="./public/screenshots/admin-dashboard.png" alt="Admin Overview Dashboard" width="95%" style="border-radius: 8px; border: 1px solid #333;" />

<br /><br />

### 2. IoT Fleet Monitor & Display Telemetry
*Live health monitoring, heartbeat tracking, and zone allocation across physical smart screens.*
<br />
<img src="./public/screenshots/fleet.png" alt="IoT Screen Fleet Management" width="95%" style="border-radius: 8px; border: 1px solid #333;" />

<br /><br />

### 3. Academic & Event Calendar
*Synchronized campus schedules and event timelines routed to dedicated departmental screens.*
<br />
<img src="./public/screenshots/calendar.png" alt="Academic Calendar" width="95%" style="border-radius: 8px; border: 1px solid #333;" />

</div>

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Users["👥 Campus Stakeholders"]
        SUB["Submitter<br/>(Faculty & Staff)"]
        HOD["HOD Approver<br/>(Department Head)"]
        ADM["Campus Admin<br/>(Central Governance)"]
        EMG["Emergency Authority<br/>(Campus Security)"]
    end

    subgraph Core["⚡ Next.js 16 Core Engine"]
        AUTH["Proxy & Auth Middleware"]
        MOD["Priority & Advisory Engine"]
        POLL_API["IoT Gateway API<br/><code>/api/display/poll</code>"]
        CRON["Auto-Expiry Daemon<br/><code>/api/cron/expire</code>"]
    end

    subgraph Cloud["🗄️ Supabase Cloud (Postgres 15)"]
        RLS["Row Level Security (RLS)"]
        TBL_ANN["Announcements"]
        TBL_FLEET["Screens & Heartbeats"]
        TBL_AUDIT["Immutable Audit Trail"]
        MEDIA["Media Storage"]
    end

    subgraph Hardware["📟 Physical Edge Displays"]
        D1["Screen: Main Auditorium"]
        D2["Screen: Engineering Foyer"]
        D3["Screen: Central Cafeteria"]
        D4["Screen: Library Entrance"]
    end

    SUB -->|Create Post| AUTH
    HOD -->|Approve Routine| MOD
    ADM -->|Approve Critical / Manage Fleet| MOD
    EMG -->|Override All Screens| MOD

    AUTH --> RLS
    MOD --> RLS
    RLS --> TBL_ANN
    RLS --> TBL_FLEET
    RLS --> TBL_AUDIT
    RLS --> MEDIA

    D1 & D2 & D3 & D4 <-->|Poll Every 15-30s + Heartbeat| POLL_API
    CRON -->|Revoke Expired Content| TBL_ANN
```

---

## 🛡️ Priority & Approval Routing

| Priority Level | Visual Tag | Approver | Target Scope | Expiry Behavior |
| :--- | :---: | :--- | :--- | :--- |
| **Routine** | 🟢 Routine | **HOD** of owning department | Departmental screens | 7 Days |
| **Time-Sensitive**| 🟡 Urgent | **HOD** of owning department | Specified zones / event dates | Scheduled event end |
| **Critical** | 🟠 Critical | **Campus Admin** (`/dashboard/admin`) | Campus-wide screens | 48 Hours |
| **Emergency** | 🔴 Emergency | **Zero-Approval** (Instant Override) | 100% of all online screens | 4 Hours / Manual Clear |

---

## 👥 Role-Based Access Control (RBAC)

| Role | Primary Dashboard | Permissions & Capabilities |
| :--- | :--- | :--- |
| **`submitter`** | `/dashboard/submitter` | Draft announcements, attach media creatives, select target physical zones, track live broadcast status. |
| **`hod`** | `/dashboard/hod` | Review departmental routine & time-sensitive items; approve or reject with audit comments. |
| **`admin`** | `/dashboard/admin` | Campus-wide governance, approve critical announcements, monitor IoT screen fleet, manage user roles, review audit logs. |
| **`emergency`** | `/dashboard/admin/emergency` | Dispatch high-priority emergency alerts that immediately take over all physical screens. |

---

## 📟 IoT Edge Display Polling Contract

Smart display kiosks securely poll the central server over authenticated HTTP:

```http
GET /api/display/poll?screen_id=SCREEN_UUID&token=DEVICE_SECRET
```

### JSON Response Specification

```json
{
  "status": "active",
  "screen_name": "Main Auditorium Screen",
  "refresh_interval_sec": 30,
  "active_broadcast": {
    "id": "e42718e2-...",
    "priority": "critical",
    "headline": "Annual Convocation 2026",
    "content": "All students are requested to assemble by 09:30 AM in formal attire.",
    "media_url": "https://...supabase.co/storage/v1/object/public/campuscast-media/...",
    "expires_at": "2026-11-05T18:00:00Z"
  },
  "emergency_active": false
}
```

*Displays feature **Offline Resilience**: in case of network interruptions, the edge display continues rendering the last securely cached broadcast.*

---

<div align="center">

**Live Production Link:** [https://campuscast-smart-screen.netlify.app](https://campuscast-smart-screen.netlify.app)

</div>
