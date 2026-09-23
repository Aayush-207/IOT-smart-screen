'use client'

import React, { useState } from 'react'
import { AuditLogClient } from './AuditLogClient'
import { WithdrawClient } from './WithdrawClient'
import { ScrollText, ListOrdered } from 'lucide-react'

export function AuditTabsClient({
  auditRows,
  catalogRows,
  actorId
}: {
  auditRows: any[]
  catalogRows: any[]
  actorId: string
}) {
  const [activeTab, setActiveTab] = useState<'audit' | 'catalog'>('audit')

  return (
    <div className="space-y-6 max-w-7xl pb-16 text-slate-900 animate-fade-in-up">
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-slate-200 text-slate-900 bg-slate-100">
              System Logs & Records
            </span>
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-slate-900 flex items-center gap-3">
            {activeTab === 'audit' ? (
              <><ScrollText className="w-5 h-5 text-slate-900" /> Audit Log & System Telemetry</>
            ) : (
              <><ListOrdered className="w-5 h-5 text-slate-900" /> Broadcast Catalog Registry</>
            )}
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mt-1.5 leading-relaxed">
            {activeTab === 'audit' 
              ? 'Append-only telemetry of all approvals, emergency overrides, display changes, and poster broadcast records.'
              : 'Manage scheduled, live, and historical notices across campus screens. Review targeting, inspect visual media, and trigger instantaneous takedowns.'
            }
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'catalog' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Broadcast Catalog
          </button>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'audit' ? (
          <AuditLogClient rows={auditRows} hideHeader={true} />
        ) : (
          <WithdrawClient initialRows={catalogRows} actorId={actorId} hideHeader={true} />
        )}
      </div>
    </div>
  )
}
