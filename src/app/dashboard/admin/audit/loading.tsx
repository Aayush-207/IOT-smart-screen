import { Skeleton } from '@/components/ui/skeleton'

export default function AuditLoading() {
  return (
    <div className="space-y-6 max-w-6xl pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-200 dark:divide-[#212327]">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
