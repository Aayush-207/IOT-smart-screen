import { Skeleton } from '@/components/ui/skeleton'

export default function AnnouncementsCatalogLoading() {
  return (
    <div className="space-y-6 max-w-6xl pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 ">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200  bg-white  flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
