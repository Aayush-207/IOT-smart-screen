import React, { useState } from 'react';
import { AuditLogRecord } from '../types';
import { Shield, Lock, Key, Server, Search, FileText } from 'lucide-react';

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-[var(--primary)]" />
            <span>Audit Immutability & Security Governance</span>
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Append-only security audit trail, Cognito token validation boundary, and AWS IoT credential lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="cc-status cc-status-success">Audit Table: Append-Only</span>
          <span className="cc-status cc-status-neutral">Organization Bound</span>
        </div>
      </div>

      {/* Security Architecture Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
            <Lock className="h-4 w-4 text-[var(--accent)]" />
            <span>Identity & Auth Domain</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Amazon Cognito for human token authentication (JWT RS256 validation). Scoped RBAC authoritative in PostgreSQL.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
            <Key className="h-4 w-4 text-[var(--success)]" />
            <span>Device Hardware Trust</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Unique per-device X.509 certificate mutual TLS. Bound strictly to AWS IoT Thing Policy. Zero shared private keys.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
            <Server className="h-4 w-4 text-[var(--accent)]" />
            <span>Direct S3 Upload Quarantine</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Pre-signed upload directly to S3 Quarantine. Media worker validates MIME, SHA-256, and malware before CDN promotion.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Filter audit logs by actor, action (e.g. APPROVE_CONTENT), or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] py-1.5 pl-9 pr-3 text-xs focus:outline-none"
          />
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">Showing {filteredLogs.length} Records</span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {filteredLogs.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor & Identity</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Resource & ID</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Audit Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--surface-raised)]">
                  <td className="p-3 font-mono text-[var(--muted-foreground)]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-medium text-[var(--foreground)]">{log.actor}</td>
                  <td className="p-3">
                    <span className="cc-status cc-status-neutral font-mono text-[10px]">{log.action}</span>
                  </td>
                  <td className="p-3 font-mono text-[var(--foreground)]">
                    {log.resource} ({log.resourceId})
                  </td>
                  <td className="p-3 font-mono text-[var(--muted-foreground)]">{log.ipAddress}</td>
                  <td className="p-3 text-[var(--foreground)]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center space-y-2">
            <FileText className="h-8 w-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
            <p className="text-sm font-semibold text-[var(--foreground)]">No Matching Audit Log Records</p>
            <p className="text-xs text-[var(--muted-foreground)]">Try clearing or adjusting your search filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
