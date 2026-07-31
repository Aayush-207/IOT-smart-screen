import React, { useState } from 'react';
import { AuditLogRecord } from '../types';
import { Shield, Lock, Key, Server, Search, CheckCircle2, FileCode } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogRecord[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) =>
    log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400" />
            <span>Audit Immutability & Security Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Append-only security audit trail, Cognito token validation boundary, and AWS IoT credential lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge badge-emerald">Audit Table: Append-Only</span>
          <span className="badge badge-cyan font-mono">Organization Redacted</span>
        </div>
      </div>

      {/* Security Architecture Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <Lock className="h-4 w-4 text-cyan-400" />
            <span>Identity & Auth Domain</span>
          </div>
          <p className="text-xs text-slate-300">
            Amazon Cognito for human token authentication (JWT RS256 validation). Scoped RBAC authoritative in PostgreSQL.
          </p>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Key className="h-4 w-4 text-emerald-400" />
            <span>Device Hardware Trust</span>
          </div>
          <p className="text-xs text-slate-300">
            Unique per-device X.509 certificate mutual TLS. Bound strictly to AWS IoT Thing Policy. Zero shared private keys.
          </p>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
            <Server className="h-4 w-4 text-blue-400" />
            <span>Direct S3 Upload Quarantine</span>
          </div>
          <p className="text-xs text-slate-300">
            Pre-signed upload directly to S3 Quarantine. Media worker validates MIME, SHA-256, and malware before CDN promotion.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter audit logs by actor, action (e.g. APPROVE_CONTENT), or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <span className="text-xs text-slate-400">Showing {filteredLogs.length} Records</span>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor & Identity</th>
              <th>Action Type</th>
              <th>Resource & ID</th>
              <th>IP Address</th>
              <th>Audit Payload Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="font-mono text-xs text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="font-medium text-white text-xs">{log.actor}</td>
                  <td>
                    <span className="badge badge-cyan text-[10px] font-mono">{log.action}</span>
                  </td>
                  <td className="text-xs font-mono text-slate-300">
                    {log.resource} ({log.resourceId})
                  </td>
                  <td className="text-xs font-mono text-slate-400">{log.ipAddress}</td>
                  <td className="text-xs text-slate-300">{log.details}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  No security audit records recorded yet. User actions and system security events will appear here in real time.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
