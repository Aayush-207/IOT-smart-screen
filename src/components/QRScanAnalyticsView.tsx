import React, { useState } from 'react';
import { BarChart3, ExternalLink, QrCode, Smartphone, SmartphoneCharging, TrendingUp, Users } from 'lucide-react';
import type { Device, Registration, ScanEvent } from '../types';

interface QRScanAnalyticsViewProps {
  registrations: Registration[];
  scanEvents: ScanEvent[];
  devices: Device[];
  onGenerateQrRedirect?: (eventId: string, targetUrl: string) => void;
}

export const QRScanAnalyticsView: React.FC<QRScanAnalyticsViewProps> = ({
  registrations,
  scanEvents,
  devices,
}) => {
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);

  const totalScans = scanEvents.length;
  const filteredScanEvents = selectedRegId
    ? scanEvents.filter((s) => s.registrationId === selectedRegId)
    : scanEvents;

  // Calculate scans per device
  const deviceScanCounts = devices.map((device) => {
    const scansForDevice = scanEvents.filter((s) => s.deviceId === device.id).length;
    return {
      device,
      scans: scansForDevice,
      pctShare: totalScans > 0 ? Math.round((scansForDevice / totalScans) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1">
              <QrCode className="w-4 h-4" />
              <span>Section 10 — QR Registration & Dynamic Per-Screen Scan Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-white">QR Registration & Scan Attribution</h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time scan analytics capturing engagement per display screen via dynamic HTTP 302 short redirect overlays (`/r/:shortCode`).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Stateless Redirect Active
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Poster Scans</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalScans}</div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+24.5% vs last 7 days</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active QR Campaigns</span>
            <QrCode className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{registrations.length}</div>
          <div className="text-xs text-slate-400 mt-2">Campus-wide event links</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Top Performing Screen</span>
            <SmartphoneCharging className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white truncate">
            {deviceScanCounts.sort((a, b) => b.scans - a.scans)[0]?.device.displayName || 'Tech Block A Foyer'}
          </div>
          <div className="text-xs text-cyan-400 mt-2">
            {deviceScanCounts[0]?.scans || 0} scans ({deviceScanCounts[0]?.pctShare || 0}% share)
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Scans / Broadcast Day</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {totalScans > 0 ? (totalScans / 5).toFixed(1) : '0.0'}
          </div>
          <div className="text-xs text-slate-400 mt-2">Within 21-day window</div>
        </div>
      </div>

      {/* Registrations List & Scan Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active QR Registrations */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Event QR Registrations ({registrations.length})</span>
            {selectedRegId && (
              <button
                onClick={() => setSelectedRegId(null)}
                className="text-xs text-indigo-400 hover:underline"
              >
                Clear Filter
              </button>
            )}
          </h2>

          <div className="space-y-4">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                onClick={() => setSelectedRegId(selectedRegId === reg.id ? null : reg.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedRegId === reg.id
                    ? 'bg-indigo-950/40 border-indigo-500'
                    : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                      <img src={reg.qrAssetUrl} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{reg.eventTitle}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono">
                          campusiot.app/r/{reg.shortCode}
                        </span>
                        <a
                          href={reg.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>External Target</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <div className="text-2xl font-extrabold text-indigo-400">{reg.totalScans}</div>
                    <div className="text-xs text-slate-400">Total Scans</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Per-Screen Scan Attribution Share */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <span>Per-Screen Attribution</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Scans attributed to individual kiosk displays via bottom-corner dynamic QR overlay code.
          </p>

          <div className="space-y-4">
            {deviceScanCounts.map(({ device, scans, pctShare }) => (
              <div key={device.id} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white truncate max-w-[180px]">
                    {device.displayName}
                  </span>
                  <span className="text-indigo-400 font-bold">
                    {scans} scans ({pctShare}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                    style={{ width: `${pctShare}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {device.location.building} · {device.location.zone}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Scan Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">
          Recent Scan Activity Log ({filteredScanEvents.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event Campaign</th>
                <th className="px-4 py-3">Attributed Display Screen</th>
                <th className="px-4 py-3">User Agent / Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredScanEvents.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {new Date(scan.scannedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{scan.eventTitle}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {scan.deviceName || scan.deviceId || 'Campus Screen'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 truncate max-w-[220px]">
                    {scan.userAgent || 'Mobile Web Browser'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
