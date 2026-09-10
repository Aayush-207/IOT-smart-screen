import { Skeleton } from '@/components/ui/skeleton'

export default function SubmitterDashboardLoading() {
  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-white/10">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-80 md:w-96" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-48 rounded-full shrink-0" />
      </div>

      {/* Metrics Card Skeleton */}
      <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-[#ffffff]/50 dark:bg-black/40 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Skeleton className="w-3 h-3 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="border border-neutral-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-neutral-200 dark:divide-white/10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
