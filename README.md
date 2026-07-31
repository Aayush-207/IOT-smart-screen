# CampusCast

CampusCast replaces paper posters with centrally managed campus screens. Each
club follows a verified approval chain before an event poster can be displayed.

## How it works

```text
[ Design Lead ] -> [ President ] -> [ Club HOD ] -> [ Campus Admin ]
                                                           |
                                              [ Auto-schedule: event - 21 days ]
                                                           |
                                               [ AWS IoT -> Campus screens ]
                                                           |
                                      [ Heartbeat and playback status return ]
```

The working workflow is:

1. A club **Design Lead** submits the poster and event date.
2. The **Club President** verifies the club and poster details.
3. The **Club HOD** verifies the event.
4. The **Campus Admin** gives final approval.
5. CampusCast automatically schedules the poster from exactly **21 days before
   the event** until the end of the event day.
6. Screens cache and play the approved poster, then report health and playback
   status to the dashboard.

## Run the working local application

```bash
pnpm install
pnpm build
pnpm start
```

Open `http://localhost:8080`. The local server runs the dashboard and demo API
together. Use the account menu to switch between Design Lead, President, Club
HOD, and Campus Admin, and walk one poster through the complete hierarchy.

Application data is saved in `.data/campuscast.json`, so submissions, approvals,
schedules, device health, updates, and playback events survive a restart. Use
**Reset demo workspace** in the account menu when you need a clean demonstration.

## Run a campus screen

Open a screen from **Screens → Open screen player**, or use:

```text
http://localhost:8080/?kiosk=dev_tech_f1_01
```

The player is installable as a fullscreen web app on an Android box, Raspberry
Pi, or smart display browser. It downloads the active manifest, caches the app
and last valid playlist, keeps playing when offline, sends a heartbeat every
minute, and reports playback results when connected.

To demonstrate device operations:

1. Open **Screens** and select the hostel screen.
2. Choose **Install update** to move it to the current kiosk version.
3. Choose **Restart app** to test remote recovery.
4. Open **Health** to review uptime, incidents, and playback proof.

## Verify it

```bash
pnpm lint
pnpm test
pnpm build
```

## Production mapping

| Simple layer | Production service |
|---|---|
| Dashboard and cloud workflow | Vite/React dashboard + Node.js API |
| Data and media | PostgreSQL + S3/CloudFront |
| Background validation | Redis/BullMQ worker |
| Screen messaging | AWS IoT Core + device gateway |
| Display | Android kiosk with local cache |

The local prototype is complete and can be demonstrated without cloud accounts
or physical hardware. The API, worker, gateway, shared contracts, PostgreSQL
schema, Cognito validation, S3 upload flow, SQS heartbeat ingestion, and IoT
message contracts provide the production path. Connecting real AWS resources
and enrolling a physical screen still require the institution's AWS
credentials, domain/certificates, and selected Android or Raspberry Pi device.

## Technical reference

- [Architecture specification](docs/architecture/ARCHITECTURE_SPECIFICATION.md)
- [Simple IoT diagram](docs/architecture/IOT_SYSTEM_DIAGRAM.puml)
- [Database schema](docs/architecture/DATABASE_SCHEMA.sql)
- [OpenAPI specification](docs/api/OPENAPI_SPECIFICATION.yaml)
- [Android kiosk specification](docs/android/ANDROID_KIOSK_SPECIFICATION.md)
- [Deployment runbook](docs/operations/DEPLOYMENT_RUNBOOK.md)
