# Reference: Playback Manifest JSON Schema & MQTT Topics

**Goal:** Technical reference specification for CampusCast manifest structures and AWS IoT MQTT topic topics.

---

## 1. AWS IoT MQTT Topics

| Topic | QoS | Direction | Purpose |
|-------|-----|-----------|---------|
| `$aws/things/{id}/shadow/get` | 1 | Kiosk $\rightarrow$ Cloud | Request current shadow state |
| `$aws/things/{id}/shadow/update` | 1 | Kiosk $\rightarrow$ Cloud | Report active manifest & health telemetry |
| `$aws/things/{id}/shadow/update/delta` | 1 | Cloud $\rightarrow$ Kiosk | Pushes compiled manifest version updates |
| `campuscast/telemetry/{org_id}/{id}` | 0 | Kiosk $\rightarrow$ Cloud | Real-time playback analytics event stream |

---

## 2. Playback Manifest JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CompiledPlaybackManifest",
  "type": "object",
  "required": [
    "manifestVersion",
    "organizationId",
    "targetDeviceId",
    "compiledAt",
    "validUntil",
    "defaultFallbackAssetId",
    "playlist"
  ],
  "properties": {
    "manifestVersion": { "type": "string", "example": "v1.0.4" },
    "organizationId": { "type": "string", "example": "org_mit_adt" },
    "targetDeviceId": { "type": "string", "example": "mit_adt_techblock_f1_01" },
    "compiledAt": { "type": "string", "format": "date-time" },
    "validUntil": { "type": "string", "format": "date-time" },
    "defaultFallbackAssetId": { "type": "string" },
    "playlist": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "scheduleId",
          "contentId",
          "title",
          "mediaUrl",
          "mimeType",
          "sha256",
          "priority",
          "durationSeconds",
          "displayMode"
        ],
        "properties": {
          "scheduleId": { "type": "string" },
          "contentId": { "type": "string" },
          "title": { "type": "string" },
          "mediaUrl": { "type": "string", "format": "uri" },
          "mimeType": { "type": "string", "enum": ["image/jpeg", "image/png", "video/mp4"] },
          "sha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
          "priority": { "type": "integer", "minimum": 1, "maximum": 100 },
          "durationSeconds": { "type": "integer", "minimum": 5, "maximum": 300 },
          "displayMode": { "type": "string", "enum": ["FULLSCREEN", "SPLIT_BANNER"] }
        }
      }
    }
  }
}
```
