# AWS IoT Core & Android Kiosk Primary Source Research

**Author:** CampusCast Engineering Team  
**Date:** 30 July 2026  
**Status:** Validated Technical Research Specification  
**Target Region:** `ap-south-1` (AWS Mumbai)

---

## 1. AWS IoT Core Named Shadow State Reconciliation

### Primary Sources
- [AWS IoT Core Named Shadows Developer Guide](https://docs.aws.amazon.com/iot/latest/developerguide/iot-device-shadows.html)
- [AWS IoT Core MQTT Topics Reference](https://docs.aws.amazon.com/iot/latest/developerguide/topics.html)

### Key Findings & Specifications
1. **MQTT Topic Hierarchy**:
   - Get Shadow: `$aws/things/{thingName}/shadow/name/{shadowName}/get`
   - Update Shadow Desired: `$aws/things/{thingName}/shadow/name/{shadowName}/update`
   - Shadow Accepted Subscriptions: `$aws/things/{thingName}/shadow/name/{shadowName}/update/accepted`
   - Shadow Delta Subscriptions: `$aws/things/{thingName}/shadow/name/{shadowName}/update/delta`

2. **QoS and Connection SLA**:
   - All playback manifest synchronization events MUST publish with **MQTT QoS 1** (At least once delivery) to guarantee receipt over unstable campus Wi-Fi networks.
   - Device Named Shadows maintain a maximum JSON payload size of **8 KB**. Manifest lists exceeding 8 KB are referenced via pre-signed S3 CDN URLs embedded inside the shadow payload.

3. **Delta Processing Rule**:
   - When an administrator approves a poster or updates a schedule, the BullMQ worker updates `desired.manifestVersion`.
   - AWS IoT Core automatically computes the difference between `desired` and `reported` and publishes a payload to `/update/delta`.
   - The Android Kiosk client receives the delta, downloads media assets, and updates `reported.manifestVersion` upon successful local playback initialization.

---

## 2. Direct S3 Upload Quarantine & Malware Scanning

### Primary Sources
- [AWS S3 Presigned POST Signature V4 Documentation](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-post-example.html)
- [Amazon GuardDuty Malware Protection for S3](https://docs.aws.amazon.com/guardduty/latest/ug/gdm-s3-malware-protection.html)

### Key Findings & Specifications
1. **Presigned Upload Grants**:
   - Web application clients never upload directly to the core application server or CDN S3 bucket.
   - Client requests a presigned upload URL with strict S3 policy condition checks:
     - `Content-Length-Range`: `[1024, 52428800]` (1 KB to 50 MB)
     - `Content-Type`: `image/jpeg`, `image/png`, `video/mp4`
     - Key Prefix: `quarantine/{organization_id}/${filename}`

2. **Asynchronous Quarantine Promotion Pipeline**:
   - `s3:ObjectCreated:*` triggers an AWS EventBridge rule routing to BullMQ worker queue `media-quarantine-processor`.
   - BullMQ worker executes:
     1. Magic byte MIME verification (e.g. `FF D8 FF` for JPEG, `89 50 4E 47` for PNG).
     2. SHA-256 checksum computation for immutable manifest hashing.
     3. Image dimension validation (must conform to standard display aspect ratios `16:9` or `9:16`).
   - Upon successful scan, asset is copied to `s3://cdn-mit-adt-approved/` and purged from quarantine bucket.

---

## 3. Android 14 Kiosk DPC & LockTask Provisioning

### Primary Sources
- [Android Enterprise Dedicated Devices (Kiosk Mode) Guide](https://developer.android.com/work/dpc/dedicated-devices)
- [Android ExoPlayer / Media3 Offline Caching Spec](https://developer.android.com/media/media3/exoplayer/downloading-media)

### Key Findings & Specifications
1. **Device Policy Controller (DPC) Enforcements**:
   - Campus displays are provisioned via Android Device Owner (`setDeviceOwnerApp`).
   - Key system policies enabled:
     - `setLockTaskPackages`: Prevents users or power button presses from leaving the CampusCast player.
     - `setStatusBarDisabled`: Hides notifications and navigation bar.
     - `setKeyguardDisabled`: Bypasses lock screen on boot.
     - `SET_UNINSTALL_BLOCKED`: Blocks unauthorized app removal.

2. **Offline Resilience with Room DB & ExoPlayer Cache**:
   - The Android client uses **Android Room DB** for local SQLite schema persistence of active schedules and manifest rules.
   - Video posters are cached locally using `SimpleCache` and `CacheDataSource.Factory` in ExoPlayer.
   - In the event of a total Wi-Fi outage or MQTT gateway disconnection:
     1. ExoPlayer continues looping cached video and image assets seamlessly.
     2. Telemetry events (playback start, stop, QR scan counts) are buffered in an encrypted SQLite outbox table (`telemetry_outbox`).
     3. When connectivity is restored, buffered events are flushed in 50-item batches to AWS IoT Core over MQTT.
