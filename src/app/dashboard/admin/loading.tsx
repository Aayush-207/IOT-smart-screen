import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-72 md:w-96" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
      </div>

      {/* Telemetry Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-5 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-7 w-32 rounded-full" />
        ))}
      </div>

      {/* Governance Section */}
      <div className="pt-6 border-t border-neutral-200 dark:border-[#212327] space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-60" />
        <div className="border border-neutral-200 dark:border-[#212327] rounded-lg p-6 space-y-4 bg-white dark:bg-[#141414]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
