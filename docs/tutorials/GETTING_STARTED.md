# Tutorial: Setting Up Your First CampusCast Display Kiosk

**Goal:** Learn how to provision a physical display kiosk, bind its X.509 security certificate, connect it to the CampusCast dashboard, and verify live poster playback.

---

## What You Will Learn
1. How to register a new display kiosk device in the CampusCast command center.
2. How to provision an Android 14 kiosk hardware unit.
3. How to verify live MQTT heartbeat telemetry and manifest playback.

---

## Prerequisites
- A display screen running Android 14 with Android Device Owner (DPC) privileges.
- Network access to `ap-south-1` AWS IoT Core endpoint over TLS port 8883.
- Administrative access to the CampusCast Dashboard (`http://localhost:3001`).

---

## Step 1: Register the Display Device in CampusCast
1. Open your browser and navigate to the **CampusCast Command Center**.
2. From the left sidebar menu, click **Fleet & Kiosk Devices**.
3. Click the **Register New Display** button in the top toolbar.
4. Fill in the hardware details:
   - **Display Name**: `Tech Block A - Central Foyer`
   - **Building / Zone**: `Tech Block A` / `Central Foyer`
   - **Thing Name**: `mit_adt_techblock_f1_01`
5. Click **Generate X.509 Certificate Grant**. The system binds a unique X.509 device certificate and returns a device provisioning token.

---

## Step 2: Provision the Android Kiosk Hardware
1. Power on the Android display device.
2. During initial setup, scan the CampusCast QR Provisioning Code to set the CampusCast player app as **Device Owner**.
3. Enter the device provisioning token generated in Step 1.
4. The CampusCast app locks into **LockTask Kiosk Mode**, hiding system navigation bars and preventing app exit without admin credentials.

---

## Step 3: Verify MQTT Heartbeat & Live Telemetry
1. Return to the CampusCast Dashboard and click **Fleet & Kiosk Devices**.
2. Locate `Tech Block A - Central Foyer` in the device inventory table.
3. Check the status badge:
   - It should transition from `OFFLINE` to `ONLINE` within 60 seconds.
   - The manifest version should display `v1.0.4`.
4. Click **Simulate Screen** or **Shadow JSON** to inspect the active shadow state payload.

---

## Next Steps
Congratulations! Your first display kiosk is live and synchronized with the CampusCast Cloud. Proceed to the **Content & Approvals** tab to upload and authorize your first event poster broadcast.
