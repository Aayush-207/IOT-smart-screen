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

The API, worker, gateway, shared contracts, and database packages are production-shaped foundations. AWS provisioning and the Android kiosk application remain deployment work, not requirements for running the complete local demo.

## Technical reference

- [Architecture specification](docs/architecture/ARCHITECTURE_SPECIFICATION.md)
- [Simple IoT diagram](docs/architecture/IOT_SYSTEM_DIAGRAM.puml)
- [Database schema](docs/architecture/DATABASE_SCHEMA.sql)
- [OpenAPI specification](docs/api/OPENAPI_SPECIFICATION.yaml)
- [Android kiosk specification](docs/android/ANDROID_KIOSK_SPECIFICATION.md)
- [Deployment runbook](docs/operations/DEPLOYMENT_RUNBOOK.md)
