// ==============================================
// components/time-tracking/skeletons/TimeTrackingSkeletons.tsx - Mobile Responsive
// ==============================================

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// ==============================================
// CLOCK IN OUT WIDGET SKELETON - Mobile Responsive
// ==============================================
export function ClockInOutWidgetSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="p-4 xs:p-5 sm:p-6">
        <div className="flex items-center gap-1.5 xs:gap-2">
          <Skeleton className="h-4 w-4 xs:h-5 xs:w-5 rounded shrink-0" />
          <Skeleton className="h-4 xs:h-5 w-28 xs:w-32" />
        </div>
      </CardHeader>
      <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
        <div className="space-y-3 xs:space-y-4">
          {/* Button skeleton */}
          <Skeleton className="h-9 xs:h-10 sm:h-11 w-full rounded-md" />
          
          {/* Summary skeleton */}
          <div className="pt-3 xs:pt-4 border-t space-y-1.5 xs:space-y-2">
            <Skeleton className="h-3.5 xs:h-4 w-20 xs:w-24 mx-auto" />
            <Skeleton className="h-5 xs:h-6 w-14 xs:w-16 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==============================================
// TODAY'S SUMMARY SKELETON - Mobile Responsive
// ==============================================
export function TodaysSummarySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2.5 xs:pb-3 p-4 xs:p-5 sm:p-6">
        <div className="flex items-center gap-2.5 xs:gap-3">
          <Skeleton className="w-9 h-9 xs:w-10 xs:h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5 xs:space-y-2 min-w-0">
            <Skeleton className="h-3.5 xs:h-4 w-28 xs:w-32" />
            <Skeleton className="h-3 w-20 xs:w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
        <div className="space-y-2.5 xs:space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3.5 xs:h-4 w-16 xs:w-20" />
            <Skeleton className="h-4 xs:h-5 w-14 xs:w-16" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-3.5 xs:h-4 w-20 xs:w-24" />
            <Skeleton className="h-4 xs:h-5 w-10 xs:w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==============================================
// RECENT ENTRIES SKELETON - Mobile Responsive
// ==============================================
export function RecentEntriesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Card>
      <CardHeader className="p-4 xs:p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 xs:gap-3">
          <div className="flex items-center gap-2.5 xs:gap-3 min-w-0 flex-1">
            <Skeleton className="w-9 h-9 xs:w-10 xs:h-10 rounded-lg shrink-0" />
            <div className="space-y-1.5 xs:space-y-2 min-w-0 flex-1">
              <Skeleton className="h-3.5 xs:h-4 w-28 xs:w-32" />
              <Skeleton className="h-3 w-32 xs:w-40" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
        <div className="space-y-2.5 xs:space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-2.5 xs:p-3 border rounded-lg">
              <div className="flex-1 space-y-1.5 xs:space-y-2 min-w-0">
                <Skeleton className="h-3.5 xs:h-4 w-40 xs:w-48" />
                <Skeleton className="h-3 w-28 xs:w-32" />
              </div>
              <div className="flex xs:flex-col justify-between xs:text-right gap-2 xs:space-y-1.5 xs:space-y-2">
                <Skeleton className="h-3.5 xs:h-4 w-14 xs:w-16 xs:ml-auto" />
                <Skeleton className="h-3 w-16 xs:w-20 xs:ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ==============================================
// STATS CARD SKELETON - Mobile Responsive
// ==============================================
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2.5 xs:pb-3 p-4 xs:p-5 sm:p-6">
        <div className="flex items-center gap-2.5 xs:gap-3">
          <Skeleton className="w-9 h-9 xs:w-10 xs:h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5 xs:space-y-2 min-w-0">
            <Skeleton className="h-3.5 xs:h-4 w-20 xs:w-24" />
            <Skeleton className="h-3 w-24 xs:w-32" />
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}