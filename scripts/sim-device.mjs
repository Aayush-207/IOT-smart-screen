#!/usr/bin/env node
// Simulated CampusCast screen — stands in for a Raspberry Pi during a demo.
//
// It does exactly what the real device agent's online path does: polls
// GET /api/screens/{id} on an interval (each poll is a heartbeat), prints the
// announcement it was handed, and reacts to force_refresh / reboot_requested.
// No MQTT, no hardware.
//
// Usage:
//   node scripts/sim-device.mjs --screen <uuid> [--base http://localhost:3000] [--interval 10] [--offline]
//   npm run sim:device -- --screen <uuid>
//
// --offline simulates a pulled network cable: the loop keeps running but skips
// the poll, so the dashboard flips the device to stale then offline while the
// (imaginary) local cache "keeps rendering".

const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def
}
const flag = (name) => args.includes(`--${name}`)

const screenId = opt('screen')
const token = opt('token')
const base = (opt('base', process.env.CAMPUSCAST_BASE || 'http://localhost:3000')).replace(/\/$/, '')
const interval = Number(opt('interval', '10')) * 1000
let offline = flag('offline')

if (!screenId) {
  console.error('error: --screen <uuid> is required (register a screen in the Fleet dashboard first)')
  process.exit(1)
}

console.log(`[sim-device] screen=${screenId} ${token ? 'token=[SET] ' : ''}base=${base} interval=${interval / 1000}s offline=${offline}`)
console.log('[sim-device] press "o" + Enter to toggle offline, Ctrl+C to stop')

if (process.stdin.isTTY) {
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (d) => {
    if (d.trim().toLowerCase() === 'o') {
      offline = !offline
      console.log(`[sim-device] offline -> ${offline}`)
    }
  })
}

let lastShown = null

async function poll() {
  if (offline) {
    console.log(`[${new Date().toLocaleTimeString()}] offline — rendering last cached content: ${lastShown ?? '(none)'}`)
    return
  }
  try {
    const headers = { accept: 'application/json' }
    if (token) headers['x-device-token'] = token
    const res = await fetch(`${base}/api/screens/${screenId}`, { headers })
    if (!res.ok) {
      console.log(`[${new Date().toLocaleTimeString()}] poll failed: HTTP ${res.status}`)
      return
    }
    const data = await res.json()
    const a = data.announcement
    const label = a
      ? `${a.is_emergency ? '🚨 EMERGENCY ' : ''}"${a.title}"${a.attachment_url ? ' [image]' : ''}`
      : '(nothing targeted at this screen)'
    if (label !== lastShown) {
      console.log(`[${new Date().toLocaleTimeString()}] now displaying: ${label}`)
      lastShown = label
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] heartbeat ok — still: ${label}`)
    }
    if (data.force_refresh) console.log('   ↳ server requested force_refresh — reloading rotation')
    if (data.reboot_requested) console.log('   ↳ server requested reboot — restarting agent (simulated)')
  } catch (err) {
    console.log(`[${new Date().toLocaleTimeString()}] poll error: ${err.message}`)
  }
}

await poll()
setInterval(poll, interval)
