# Explanation: Offline Resilience Architecture in CampusCast

**Goal:** Understand the design rationale behind CampusCast's deterministic offline playback and local caching mechanisms.

---

## 1. The Challenge of Campus Network Instability
In university environments, Wi-Fi networks experience frequent dead zones, power fluctuations, and bandwidth congestion during peak class changes. Digital signage that relies on real-time video streaming or web iframe rendering fails catastrophically under these conditions, presenting black screens or loading spinners to students.

---

## 2. The Deterministic Edge Manifest Model
Rather than streaming media over the network, CampusCast decouples **Schedule Compilation** from **Playback Rendering**:

```
[ Central Control Plane ] ---> (AWS IoT Shadow Delta) ---> [ Kiosk Edge Player ]
                                                                 |
                                                                 v
                                                      [ Local Room DB & Disk ]
```

1. **Pre-Fetched Assets**: When a new manifest version is issued over AWS IoT Named Shadow, the Android client immediately downloads all required images and videos from AWS CloudFront CDN into local storage.
2. **SHA-256 Checksum Locking**: Before adding an asset to the playback engine, the client verifies its cryptographic digest against the manifest. Tampered or partial downloads are discarded.
3. **Room SQLite Persistence**: Playback schedules and manifest rules are stored in an on-device Android Room SQLite database.
4. **ExoPlayer SimpleCache**: Videos are rendered directly from disk storage rather than HTTP live streams.

---

## 3. Telemetry Buffering & Outbox Flushing
When network connectivity drops:
- Playback continues seamlessly without frame drop or interruption.
- Telemetry events (play counts, QR scan redirects, hardware temperature) are appended to a local SQLite outbox table (`telemetry_outbox`).
- Upon Wi-Fi reconnection, an asynchronous background sync thread flushes buffered telemetry events in 50-item batches to AWS IoT Core.

This guarantees **100% SLA playback availability** even during multi-day campus internet outages.
