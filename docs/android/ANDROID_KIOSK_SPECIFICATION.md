# CampusCast Android Kiosk Application Architecture & Implementation Guide

## 1. Executive Kiosk Design & Operating Mode

The CampusCast Android Application is a dedicated Kotlin kiosk application engineered for Android 10+ (API Level 29+) hardware displays. It operates in **Dedicated Device / Lock-Task Mode** under Android Enterprise device management.

```
+-------------------------------------------------------------------+
|                        CampusCast Player                          |
|  [ Full-Screen ExoPlayer Activity ] <---> [ Kiosk Lock-Task ]     |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                     Kiosk Foreground Service                      |
|  +-------------------------------------------------------------+  |
|  | AWS IoT MQTT Client (Mutual TLS v1.3 with Android Keystore) |  |
|  +-------------------------------------------------------------+  |
|  | Room Local Storage (Manifests, Asset Cache, Telemetry Outbox)|  |
|  +-------------------------------------------------------------+  |
|  | WorkManager (Background Resumable Downloads & SHA-256 Ver)  |  |
|  +-------------------------------------------------------------+  |
|  | Heartbeat & Local Watchdog (60s Ping & Crash Recovery)      |  |
+-------------------------------------------------------------------+
```

---

## 2. Core Android Subsystems

### A. AWS IoT Core Mutual TLS Connection
- Uses `aws-iot-device-sdk-java-v2` over Paho MQTT v3/v5.
- Credentials: X.509 device certificate imported into **Android Keystore System** (`KeyChain` / `KeyStore`). Private keys never leave hardware-backed security modules (TEE / StrongBox).

### B. Room Persistence Schema
Local SQLite database via Android Room library:
1. `manifest_table`: Stores current, previous, and fallback manifest JSON payloads.
2. `asset_cache_table`: Tracks local storage paths, MIME types, file sizes, SHA-256 hashes, and eviction priority.
3. `telemetry_outbox`: Batches playback completion logs when network connectivity is offline.

### C. Download & Verification Manager
- Uses `WorkManager` for network-aware, exponential backoff downloads over HTTPS / CDN.
- Verification step: Once downloaded to `.tmp` file, computes SHA-256 hash using `MessageDigest`. Only promotes to `active_cache/` if SHA-256 matches manifest exact value.

### D. Playback Engine
- ExoPlayer / Media3 implementation for seamless video and image rendering.
- Zero-flicker transitions between playlist items.
- If an item fails to render or file is missing, automatically falls back to bundled `default_slate.png`.

---

## 3. Resilience & Failure Recovery Matrix

| Trigger Event | Kiosk App Action |
|---|---|
| **Wi-Fi Disconnected** | Kiosk continues displaying last-known-good manifest cached in Room DB. Telemetry events buffer in Room outbox. |
| **Power Loss / Reboot** | App launches automatically on `BOOT_COMPLETED` via `KioskBootReceiver` and re-enters Lock-Task mode. |
| **Corrupted Media Download** | SHA-256 mismatch detected; file discarded, error reported over telemetry outbox, fallback slate rendered. |
| **Clock Drift / Invalid Time** | Syncs device time using `NTPClient` before evaluating schedule window boundaries. |
