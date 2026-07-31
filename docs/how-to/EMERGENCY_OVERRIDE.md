# How-To: Trigger an Emergency Campus Broadcast Override

**Goal:** Issue an immediate, high-priority emergency broadcast across all campus screens that overrides standard event schedules.

---

## Overview
CampusCast features a deterministic precedence scheduling engine. Schedules with **Priority $\ge$ 100** instantly halt normal poster rotation and force all targeted kiosk displays to show emergency announcements (e.g. extreme weather advisories, security alerts, or campus evacuations).

---

## Step-by-Step Instructions

### 1. Navigate to Content Approvals
1. In the left navigation menu, select **Content & Approvals**.
2. Click **Submit Event Poster**.
3. In the category dropdown, select **EMERGENCY (Weather Alert, Safety)**.
4. Input the title (e.g. `CAMPUS ALERT: Heatwave Advisory & Hydration Notice`) and poster URL.
5. Click **Submit for Review**.

### 2. Fast-Track Authorization
1. Select the submitted emergency poster under the **Pending Review** queue.
2. Click **Review & Decide**.
3. Review the SHA-256 checksum and click **Approve & Authorize for Broadcast**.

### 3. Issue the High-Priority Schedule Target
1. Click **Schedules & Manifests** in the sidebar.
2. Click **Create Schedule Target**.
3. Configure the emergency rule:
   - **Schedule Name**: `Emergency Campus Heatwave Notice`
   - **Approved Poster Asset**: Select the emergency poster.
   - **Targeting Scope**: `Entire Campus` (or specific building/zone).
   - **Priority**: Enter `100` (Emergency Level).
4. Click **Compile & Publish**.

---

## Expected Result
- The BullMQ worker immediately compiles a new manifest version (`v1.0.4`).
- An MQTT Named Shadow delta update is published to all connected kiosk displays.
- Within **< 500 ms**, all screens display the red **EMERGENCY CAMPUS OVERRIDE** top banner and emergency poster.

---

## How to Cancel an Emergency Broadcast
To return screens to normal playlist operation:
1. Go to **Schedules & Manifests**.
2. Locate the active emergency schedule.
3. Toggle its status to `INACTIVE` or delete the target rule.
4. The system automatically re-compiles the manifest and resumes standard schedules.
