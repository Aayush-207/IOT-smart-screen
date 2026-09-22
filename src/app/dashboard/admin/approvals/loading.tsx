import { Skeleton } from '@/components/ui/skeleton'

export default function AdminApprovalsLoading() {
  return (
    <div className="space-y-6 max-w-5xl pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 ">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white  border border-slate-200  rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
