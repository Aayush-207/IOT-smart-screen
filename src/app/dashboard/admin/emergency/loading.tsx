import { Skeleton } from '@/components/ui/skeleton'

export default function EmergencyLoading() {
  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="rounded-xl border border-slate-200  bg-white  p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-10 w-44 rounded-full" />
      </div>
    </div>
  )
}
