<div align="center">

<img src="./public/MIT_circular.png" alt="MIT-ADT University" width="100" />
<br />
<img src="./public/logo.png" alt="CampusCast Logo" width="220" />

# 📡 CampusCast — Governed Campus Display Network & IoT Smart Screen

**An enterprise-grade, multi-role digital signage governance & automated IoT display network.**

[![Live on Netlify](https://img.shields.io/badge/Netlify-Live%20Deploy-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://campuscast-smart-screen.netlify.app)
[![Next.js 16](https://img.shields.io/badge/Next.js%2016-App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br />

🌐 **Live Production Link:** [https://campuscast-smart-screen.netlify.app](https://campuscast-smart-screen.netlify.app)  
📦 **Repository:** [https://github.com/Aayush-207/IOT-smart-screen](https://github.com/Aayush-207/IOT-smart-screen)

<br />

<img src="./public/smart_campus_iot.jpg" alt="CampusCast IoT Smart Screen Fleet" width="95%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);" />

</div>

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client["👥 Campus Users & Stakeholders"]
        SUB["Submitter<br/>(Faculty / Staff)"]
        HOD["HOD Approver<br/>(Department Head)"]
        ADM["Campus Admin<br/>(Central Governance)"]
        EMG["Emergency Authority<br/>(Campus Security)"]
    end

    subgraph Core["⚡ Next.js 16 Core Engine"]
        API_AUTH["Next.js Proxy & Auth Guard"]
        API_MOD["Moderation & Priority Engine"]
        API_POLL["IoT Fleet Gateway<br/><code>/api/display/poll</code>"]
        API_CRON["Auto-Expire Scheduler<br/><code>/api/cron/expire</code>"]
    end

    subgraph DB["🗄️ Supabase Cloud (Postgres 15)"]
        RLS["Row Level Security (RLS)"]
        ANN["Announcements Table"]
        SCR["Screens & Fleet Table"]
        AUD["Audit Log & Analytics"]
        STORAGE["Asset Storage (Posters/Media)"]
    end

    subgraph Fleet["🖥️ IoT Physical Hardware Fleet"]
        HW1["Screen #1: Main Auditorium"]
        HW2["Screen #2: CS Department Foyer"]
        HW3["Screen #3: Student Cafeteria"]
        HW4["Screen #4: Library Entrance"]
    end

    SUB -->|Submit Content| API_AUTH
    HOD -->|Approve Routine| API_MOD
    ADM -->|Approve Critical / Manage Fleet| API_MOD
    EMG -->|Override All Screens| API_MOD

    API_AUTH --> RLS
    API_MOD --> RLS
    RLS --> ANN
    RLS --> SCR
    RLS --> AUD
    RLS --> STORAGE

    HW1 & HW2 & HW3 & HW4 <-->|Poll Every 15-30s + Heartbeat| API_POLL
    API_CRON -->|Revoke Expired Posts| ANN
```

---

## 🛡️ Priority & Approval Matrix

| Priority Level | Visual Badge | Approval Workflow | Target Scope | Auto-Expiry |
| :--- | :---: | :--- | :--- | :---: |
| **Routine** | 🟢 Routine | **HOD** of owning department | Department screens | 7 Days |
| **Time-Sensitive**| 🟡 Urgent | **HOD** of owning department | Specific zones / event dates | Custom Date |
| **Critical** | 🟠 Critical | **Campus Admin** (`/dashboard/admin`) | Campus-wide broadcast | 48 Hours |
| **Emergency** | 🔴 Emergency | **Zero-Approval** (Pre-authorized override) | 100% of all online displays | 4 Hours / Manual |

---

## 👥 Role-Based Access Control (RBAC)

| Role | Primary Dashboard | Key Capabilities |
| :--- | :--- | :--- |
| **`submitter`** | `/dashboard/submitter` | Draft rich announcements, select target physical zones, upload creatives, track live delivery status. |
| **`hod`** | `/dashboard/hod` | Review routine and time-sensitive departmental announcements; approve or reject with comments. |
| **`admin`** | `/dashboard/admin` | Campus-wide governance, approve critical announcements, real-time fleet health monitor, user access manager, audit logs. |
| **`emergency`** | `/dashboard/admin/emergency` | Send instantaneous campus-wide emergency banners overriding all active schedules. |

---

## 📟 IoT Hardware & Display Polling

Every edge device (Raspberry Pi, Android display, ESP32 kiosk) securely connects to CampusCast via token authentication:

```http
GET /api/display/poll?screen_id=SCREEN_UUID&token=DEVICE_SECRET
```

### Response Payload Contract

```json
{
  "status": "active",
  "screen_name": "Auditorium Main Screen",
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

*Displays feature **Offline Resilience**: in case of Wi-Fi degradation, the edge screen continues showing the last cached broadcast.*

---

## 🚀 Quickstart & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Aayush-207/IOT-smart-screen.git
cd IOT-smart-screen
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-secure-cron-secret
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

<div align="center">

**Built with ❤️ for MIT Art, Design & Technology University**  
*Empowering connected, secure, and governed campus communications.*

</div>
