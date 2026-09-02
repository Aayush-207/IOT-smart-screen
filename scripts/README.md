# Demo tooling

These stand in for a Raspberry Pi so the full
submit → approve → dispatch → acknowledged → displaying pipeline (blueprint
Part 34) can be shown end-to-end without hardware. They talk to the same
public contract a real device would: `GET /api/screens/:id`.

## `sim-device.mjs` — headless device agent

Polls the screen endpoint on an interval, treating each poll as a heartbeat,
and logs whatever content the backend hands back.

```bash
# 1. Register a screen in the Fleet dashboard, copy its UUID.
npm run sim:device -- --screen <uuid>

# options
#   --base <url>       default http://localhost:3000 (or $CAMPUSCAST_BASE)
#   --interval <sec>   default 10
#   --offline          start "unplugged" — keeps looping, skips the poll
# press "o" + Enter while running to toggle offline
```

Offline mode is the Part 34 resilience demo: the dashboard flips the device
to **stale** then **offline**, and it reconnects and catches up when toggled
back on.

## `public/kiosk.html` — the screen itself

Served by Next, so open it same-origin (no CORS): with `npm run dev` running,

```
http://localhost:3000/kiosk.html?id=<uuid>
```

Add `&base=<url>` only to point a kiosk at a different deployment. Re-polls
every 10 s, renders the image/text, and turns the whole screen red when an
emergency broadcast is active. Pair it with `sim-device.mjs` on the same
screen UUID, or run it alone (each poll is itself a heartbeat).
