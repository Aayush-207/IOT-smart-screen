# IoT Smart Digital Billboard Network — Proof of Concept

A simple, reliable, visually polished proof-of-concept digital signage network. This system allows a central administrator to remotely control and broadcast dynamic posters across multiple connected IoT billboard display screens.

Designed specifically for local academic demonstrations, local network (LAN) presentations, and multi-screen kiosk setups.

---

## 🏛️ System Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                    Central Admin Dashboard                  │
 │                            (/admin)                         │
 └──────┬────────────────────────┬─────────────────────┬───────┘
        │ Upload Poster          │ Remote Assign       │ Live Status (5s)
        ▼                        ▼                     ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                   Next.js App Router API                    │
 │               (REST API / Local Image Storage)              │
 └──────┬────────────────────────┬─────────────────────┬───────┘
        │                        │                     │
        │ SQLite (dev.db)        │ Heartbeat (5s)      │ Playlist Poll (5s)
        ▼                        ▼                     ▼
 ┌──────────────┐         ┌──────────────┐      ┌──────────────┐
 │   Screen 1   │         │   Screen 2   │      │   Screen 3   │
 │ Main Entrance│         │   Library    │      │  Cafeteria   │
 └──────────────┘         └──────────────┘      └──────────────┘
```

The system consists of two primary interfaces:
1. **Central Admin Dashboard (`/admin`)**: Upload poster images, enter titles, preview designs, remotely assign posters to screens, monitor online/offline telemetry, and manage screen playlists.
2. **Public Display Screens (`/display/[slug]`)**: Fullscreen, borderless display kiosks with automated background heartbeats, 5-second playlist polling, 8-second continuous slideshow transitions, fallback states, and offline resilience.

---

## 🚀 Technology Stack

- **Framework**: Next.js (App Router)
- **UI & Logic**: React 18, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Database & ORM**: SQLite (`prisma/dev.db`), Prisma ORM v5
- **Media Storage**: Local Filesystem (`public/uploads`)
- **Telemetry & Updates**: HTTP Polling (5s status & heartbeat)
- **Slideshow Engine**: Client-side timed fade slideshow (8s rotation)

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **pnpm** (or `npm` / `npx`)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd "AI - IoT Based Smart Screen"
pnpm install
```

### 2. Environment Configuration
Create a `.env` file (or copy `.env.example`):
```bash
DATABASE_URL="file:./dev.db"
PORT=3000
```

### 3. Initialize & Seed Database
Sync the SQLite database schema and seed initial screens:
```bash
# Push database schema to SQLite
npx prisma db push

# Seed initial 3 screens (Screen 1 - Main Entrance, Screen 2 - Library, Screen 3 - Cafeteria)
pnpm seed
```

### 4. Run Automated Tests
```bash
pnpm test
```

### 5. Start Development Server
```bash
pnpm dev
```
The server will start listening on all network interfaces (`http://0.0.0.0:3000`).

---

## 🌐 URLs & Access

| Component | URL Path | Description |
| :--- | :--- | :--- |
| **Admin Dashboard** | `http://localhost:3000/admin` | Management portal for posters & screens |
| **Screen 1 — Main Entrance** | `http://localhost:3000/display/screen-1` | Display Kiosk for Main Entrance |
| **Screen 2 — Library** | `http://localhost:3000/display/screen-2` | Display Kiosk for Central Library |
| **Screen 3 — Cafeteria** | `http://localhost:3000/display/screen-3` | Display Kiosk for Student Cafeteria |

### 📶 Accessing from Other Devices on the Same Wi-Fi Network

Because `pnpm dev` binds to `0.0.0.0`, any mobile phone, tablet, laptop, or physical smart TV on the same local network can access the system!

1. Find your computer's local IP address:
   - **Windows**: Run `ipconfig` in Command Prompt (look for `IPv4 Address`, e.g., `192.168.1.150`).
   - **macOS/Linux**: Run `ifconfig` or `ip a`.
2. On secondary devices (e.g. tablet or phone), open:
   - Admin: `http://<YOUR_LAN_IP>:3000/admin`
   - Display: `http://<YOUR_LAN_IP>:3000/display/screen-1`

---

## 🎭 Step-by-Step Live Demonstration Script

Follow this step-by-step workflow during an academic or technical presentation:

1. **Open Admin Dashboard**:
   - Open `http://localhost:3000/admin` on the presenter's laptop.
   - Point out the 3 initial screens registered in the database.

2. **Open Displays in Separate Tabs or Devices**:
   - Open `http://localhost:3000/display/screen-1` in Tab 1 (Main Entrance).
   - Open `http://localhost:3000/display/screen-2` in Tab 2 (Library).
   - Open `http://localhost:3000/display/screen-3` in Tab 3 (Cafeteria).
   - Notice that each screen displays a polished fallback card: *"Screen Ready • Waiting for Content"*.
   - Return to `/admin` and point out that all 3 screens now show **Online (Green Indicator)** with live heartbeat timestamps.

3. **Upload Poster A & Assign to Screens 1 & 3**:
   - On `/admin`, fill out title *"Spring Tech Expo 2026"*.
   - Select an image file (PNG/JPEG/WebP) and view the live image preview.
   - Check boxes for **Screen 1 — Main Entrance** and **Screen 3 — Cafeteria**.
   - Click **Upload & Publish**.
   - Observe: **Screen 1** and **Screen 3** automatically display Poster A within 5 seconds without refreshing the page! **Screen 2 (Library)** remains unchanged.

4. **Upload Poster B & Assign to All Screens**:
   - Fill out title *"Library Quiet Hours Notice"*.
   - Select another image file.
   - Click **Select All Screens** and click **Upload & Publish**.
   - Observe: All screens automatically receive the update.

5. **Demonstrate Slideshow Rotation (Multiple Posters)**:
   - Observe **Screen 1** (which now has 2 assigned posters).
   - Watch the screen automatically switch between Poster A and Poster B every **8 seconds** with a subtle fade transition.

6. **Demonstrate Offline Telemetry Detection**:
   - Close the browser tab for **Screen 2** (`/display/screen-2`).
   - Wait 15 seconds.
   - Look at the Admin Dashboard: **Screen 2** status indicator turns **Offline (Gray)** automatically.

---

## ☁️ Deploying to Free Cloud Services for Remote Testing

This application includes multi-tier fallback logic for zero-cost remote testing on cloud services (Netlify, Vercel, Render):

### 1. Host Application (Vercel or Netlify)
- **Netlify**: Includes a pre-configured `netlify.toml`. Connect your GitHub repo to Netlify, set build command to `npm run build` and publish directory to `.next`.
- **Vercel**: Import the GitHub repo on Vercel. Native Next.js App Router support is enabled automatically.

### 2. Cloud Media Storage (Cloudinary / Fallback)
To store uploaded posters in the cloud when running on read-only serverless hosts:
- **Cloudinary (Free Tier)**:
  1. Create a free account at [cloudinary.com](https://cloudinary.com).
  2. Create an unsigned Upload Preset in settings.
  3. Add environment variables to Netlify/Vercel:
     ```env
     CLOUDINARY_CLOUD_NAME="your_cloud_name"
     CLOUDINARY_UPLOAD_PRESET="your_upload_preset"
     ```
- **Automatic Fallback**: If Cloudinary variables are omitted on serverless hosts, uploads automatically fall back to Base64 data URLs, guaranteeing zero upload failures!

### 3. Remote Physical TV Testing (ngrok)
To test physical Smart TVs or tablets using your local dev server without cloud deployment:
```bash
npx ngrok http 3001
```
Open the generated HTTPS URL on any smart display around the world!

---

## 📝 Storage Note & Future Production Improvements

### Known Limitations
- Heartbeat and status polling rely on client HTTP requests (5s polling interval).

### Suggested Future Enhancements
- WebSockets / Server-Sent Events (SSE) for sub-second push notifications.
- Granular scheduling calendar (set posters to display only between specific start/end dates).
- User authentication and role-based permissions (Admin vs Content Editor).
- Display hardware telemetry (CPU temp, storage capacity, display resolution reporting).

