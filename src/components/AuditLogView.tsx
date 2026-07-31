import React, { useState } from 'react';
import { AuditLogRecord } from '../types';
import { Shield, Lock, Key, Server, Search, CheckCircle2 } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogRecord[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(
    (log) =>
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="cc-page">
      {/* Header */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="cc-eyebrow">Security Governance</p>
          <h1 className="cc-page-title flex items-center gap-2">
            <Shield className="h-6 w-6 text-[var(--accent)]" />
            <span>Audit Immutability & Access Governance</span>
          </h1>
          <p className="cc-page-description">
            Append-only security audit trail, Cognito token validation boundary, and AWS IoT credential lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="cc-status cc-status-success font-mono text-xs">
            Append-Only Log
          </span>
          <span className="cc-status cc-status-neutral font-mono text-xs">
            org_mit_adt
          </span>
        </div>
      </section>

      {/* Security Architecture Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cc-panel p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
            <Lock className="h-4 w-4" />
            <span>Identity & Auth Domain</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Amazon Cognito for human token authentication (JWT RS256 validation). Scoped RBAC authoritative in PostgreSQL.
          </p>
        </div>

        <div className="cc-panel p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--success)]">
            <Key className="h-4 w-4" />
            <span>Device Hardware Trust</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Unique per-device X.509 certificate mutual TLS. Bound strictly to AWS IoT Thing Policy. Zero shared private keys.
          </p>
        </div>

        <div className="cc-panel p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--warning)]">
            <Server className="h-4 w-4" />
            <span>Direct S3 Upload Quarantine</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Pre-signed upload directly to S3 Quarantine. Media worker validates MIME, SHA-256, and malware before CDN promotion.
          </p>
        </div>
      </section>

      {/* Search Toolbar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="cc-search-field max-w-md w-full">
          <Search className="h-4 w-4" />
          <span className="sr-only">Filter audit logs</span>
          <input
            type="text"
            placeholder="Filter by actor, action (e.g. APPROVE_CONTENT), or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        <span className="text-xs text-[var(--muted-foreground)]">
          Showing {filteredLogs.length} audit records
        </span>
      </section>

      {/* Audit Log Table */}
      <section className="cc-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor & Identity</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Resource & ID</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredLogs.length ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-[var(--surface-raised)]">
                    <td className="p-3 font-mono text-[var(--muted-foreground)] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-[var(--foreground)]">{log.actor}</td>
                    <td className="p-3">
                      <span className="cc-status cc-status-neutral font-mono text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[var(--muted-foreground)]">
                      {log.resource} ({log.resourceId})
                    </td>
                    <td className="p-3 font-mono text-[var(--muted-foreground)]">{log.ipAddress}</td>
                    <td className="p-3 text-[var(--foreground)]">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-[var(--muted-foreground)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-[var(--accent)] opacity-60" />
                      <p className="font-medium">No security audit records found</p>
                      <p className="text-[11px]">User actions, approvals, device registrations, and security events will log here in real time.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
