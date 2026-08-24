"use client";

import React, { useState, useEffect } from "react";
import {
  Monitor,
  Wifi,
  Cpu,
  MapPin,
  RefreshCw,
  Plus,
  Code,
} from "lucide-react";

export const DeviceFleetView: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [inspectingShadow, setInspectingShadow] = useState<any | null>(null);
  const [shadowPayload, setShadowPayload] = useState<any | null>(null);
  const [loadingShadow, setLoadingShadow] = useState<boolean>(false);

  // New Device Form State
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [zone, setZone] = useState<string>("Library Zone");

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (Array.isArray(data)) setDevices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleInspectShadow = async (device: any) => {
    setInspectingShadow(device);
    setLoadingShadow(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/shadow`);
      const data = await res.json();
      setShadowPayload(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShadow(false);
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationTag: deviceName ? `${deviceName} (${location})` : location,
          zone: zone,
          firmwareVersion: "v1.0.4-esp32",
        }),
      });
      if (res.ok) {
        setIsRegisterOpen(false);
        setDeviceName("");
        setLocation("");
        fetchDevices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredDevices = devices.filter((d) => {
    if (selectedZone === "all") return true;
    const searchTarget = `${d.zone || ""} ${d.locationTag || ""} ${d.location || ""} ${d.name || ""}`.toLowerCase();
    return searchTarget.includes(selectedZone.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="geist-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-[4px]">
            HARDWARE // ESP32 DIGITAL DISPLAY FLEET
          </span>
          <h2 className="text-xl font-semibold tracking-heading-lg text-[var(--ink)] mt-1 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-emerald-500" /> Screen Fleet & AWS IoT Shadows
          </h2>
          <p className="text-xs text-[var(--body)] mt-1">
            Real-time display heartbeats, location zone mappings, 1080x1920 poster schedules, and MQTT shadow state synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDevices}
            className="p-2 rounded-[6px] bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)] transition-all"
            title="Refresh Display Heartbeats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 transition-all flex items-center gap-1.5 whisper-shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Register New Screen
          </button>
        </div>
      </div>

      {/* Zone Filters */}
      <div className="flex space-x-1.5 overflow-x-auto p-1 bg-[var(--canvas-inset)] rounded-[8px] border border-[var(--hairline)]">
        {[
          { id: "all", label: "All Campus Displays" },
          { id: "library", label: "Library Zone" },
          { id: "engineering", label: "Engineering Block" },
          { id: "student union", label: "Student Union Kiosk" },
        ].map((z) => (
          <button
            key={z.id}
            onClick={() => setSelectedZone(z.id)}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-all ${
              selectedZone === z.id
                ? "bg-[var(--canvas-elevated)] text-[var(--ink)] shadow-sm font-semibold"
                : "text-[var(--mute)] hover:text-[var(--ink)]"
            }`}
          >
            {z.label}
          </button>
        ))}
      </div>

      {/* Devices Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 geist-card">
          <p className="font-geist-mono text-xs text-[var(--mute)]">Connecting to AWS IoT Broker & Reading Heartbeats...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => {
            const isOnline = device.status === "online";

            return (
              <div
                key={device.id}
                className="geist-card p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ink)] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-geist-mono text-[10px] text-[var(--mute)] uppercase tracking-wider block">
                        ESP32 DEVICE ID: {device.id.substring(0, 8)}...
                      </span>
                      <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] mt-0.5">
                        {device.locationTag || device.name || "Display Screen"}
                      </h3>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[10px] font-geist-mono font-semibold uppercase tracking-wider border ${
                        isOnline
                          ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : "border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 pulse-dot" : "bg-rose-500"}`} />
                      {isOnline ? "ONLINE" : "OFFLINE"}
                    </div>
                  </div>

                  {/* Location & Specs */}
                  <div className="p-3 bg-[var(--canvas-inset)] rounded-[6px] border border-[var(--hairline)] space-y-1.5 font-geist-mono text-[11px] text-[var(--body)]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#0070f3]" />
                      <span>{device.zone ? `${device.zone} - ${device.locationTag || device.location || ""}` : (device.locationTag || device.location || "Main Campus")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      <span>PORTRAIT LCD // 1080x1920 FHD</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span>MQTT TOPIC: campuscast/screen/{device.id.substring(0, 6)}</span>
                    </div>
                  </div>
                </div>

                {/* Inspect Shadow Button */}
                <div className="pt-3 border-t border-[var(--hairline)]">
                  <button
                    onClick={() => handleInspectShadow(device)}
                    className="w-full py-2 rounded-[6px] bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--ink)] text-xs font-semibold hover:border-[var(--ink)] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Code className="w-3.5 h-3.5 text-[#0070f3]" /> Inspect AWS IoT Shadow Payload
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IoT Shadow Modal */}
      {inspectingShadow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--canvas-elevated)] max-w-xl w-full p-6 rounded-xl border border-[var(--hairline)] floating-shadow space-y-4 font-geist-sans">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div>
                <span className="font-geist-mono text-[10px] uppercase text-[#0070f3]">
                  AWS IOT DEVICE SHADOW // JSON PAYLOAD
                </span>
                <h3 className="text-base font-semibold text-[var(--ink)]">
                  {inspectingShadow.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectingShadow(null)}
                className="text-[var(--mute)] hover:text-[var(--ink)] text-sm"
              >
                ✕
              </button>
            </div>

            {loadingShadow ? (
              <p className="font-geist-mono text-xs text-[var(--mute)] text-center py-6">
                Fetching AWS IoT Shadow JSON state...
              </p>
            ) : (
              <div className="bg-slate-950 p-4 rounded-[8px] border border-slate-800 text-xs font-geist-mono text-emerald-400 overflow-x-auto max-h-80">
                <pre>{JSON.stringify(shadowPayload, null, 2)}</pre>
              </div>
            )}

            <button
              onClick={() => setInspectingShadow(null)}
              className="w-full py-2 rounded-[6px] bg-[var(--ink)] text-[var(--canvas)] text-xs font-semibold"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* Register Device Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--canvas-elevated)] max-w-md w-full p-6 rounded-xl border border-[var(--hairline)] floating-shadow space-y-4 font-geist-sans">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <h3 className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0070f3]" /> Register New Digital Billboard Screen
              </h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-[var(--mute)] hover:text-[var(--ink)] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterDevice} className="space-y-4">
              <div>
                <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                  SCREEN DISPLAY NAME *
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Science Library North Wing Kiosk"
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                  CAMPUS ZONE *
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none"
                >
                  <option value="Library Zone">Library Zone</option>
                  <option value="Engineering Block">Engineering Block</option>
                  <option value="Student Union">Student Union Kiosk</option>
                  <option value="Main Auditorium">Main Auditorium Hall</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                  SPECIFIC LOCATION / ROOM *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Ground Floor Lobby (Right Pillared Wall)"
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="flex-1 py-2 rounded-[6px] bg-[var(--canvas-inset)] text-[var(--body)] text-xs font-medium hover:text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-[6px] bg-[#0070f3] text-white text-xs font-semibold hover:bg-[#0060df] transition-all"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
