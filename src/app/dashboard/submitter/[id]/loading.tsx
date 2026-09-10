import { Skeleton } from '@/components/ui/skeleton'

export default function SubmitterAnnouncementDetailLoading() {
  return (
    <div className="space-y-8 max-w-5xl pb-16">
      <Skeleton className="h-8 w-44 rounded-full" />

      {/* Hero Notice Skeleton */}
      <div className="p-6 md:p-8 rounded-lg border border-neutral-200 dark:border-[#212327] bg-[#ffffff] dark:bg-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-12 w-full max-w-xl" />
        </div>
        <Skeleton className="w-28 h-28 rounded-lg shrink-0" />
      </div>

      {/* 3 Display Screens Skeleton */}
      <div className="bg-[#ffffff] dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-[#212327]">
          <div className="space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[16/9] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Timeline Skeleton */}
      <div className="bg-[#ffffff] dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-6 space-y-4">
        <Skeleton className="h-4 w-44" />
        <div className="space-y-3 pl-4 border-l border-neutral-200 dark:border-[#212327]">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
