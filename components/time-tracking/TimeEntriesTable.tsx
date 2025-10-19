import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Clock, DollarSign, ArrowRight } from 'lucide-react'
import { TimeEntryDetailsDialog } from '@/components/time-tracking/TimeEntryDetailsDialog'
import type { TimeEntrySummary } from '@/types/time-tracking'
import Link from 'next/link'
import { formatDateSmart, formatTime12Hour } from '@/utils/format-functions'

// ==============================================
// REUSABLE TIME ENTRIES TABLE
// Can be used in dashboard and time-tracking page
// ==============================================

interface TimeEntriesTableProps {
    timeEntries: TimeEntrySummary[]
    isLoading?: boolean
    title?: string
    showAll?: boolean
    limit?: number
}

export function TimeEntriesTable({
    timeEntries,
    isLoading = false,
    title = 'Recent Time Entries',
    showAll = false,
    limit = 5,
}: TimeEntriesTableProps) {
    const [selectedEntry, setSelectedEntry] = useState<TimeEntrySummary | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const handleViewDetails = (entry: TimeEntrySummary) => {
        setSelectedEntry(entry)
        setIsDetailOpen(true)
    }

    // Limit entries if not showing all
    const displayedEntries = showAll ? timeEntries : timeEntries.slice(0, limit)

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; className: string }> = {
            approved: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
            pending: { variant: 'secondary', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
            rejected: { variant: 'destructive', className: '' },
            clocked_in: { variant: 'outline', className: 'bg-blue-50 text-blue-800 border-blue-300' },
            clocked_out: { variant: 'outline', className: 'bg-gray-100 text-gray-800' },
        }

        const config = variants[status] || variants.pending
        return <Badge variant={config.variant} className={`text-xs ${config.className}`}>{status.replace('_', ' ')}</Badge>
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="p-4 xs:p-5 sm:p-6">
                    <CardTitle className="text-base xs:text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                    <div className="space-y-2.5 xs:space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse flex items-center gap-3 xs:gap-4 p-3 xs:p-4 border rounded">
                                <div className="flex-1 space-y-1.5 xs:space-y-2 min-w-0">
                                    <div className="h-3.5 xs:h-4 bg-gray-200 rounded w-28 xs:w-32"></div>
                                    <div className="h-3 xs:h-3.5 bg-gray-200 rounded w-40 xs:w-48"></div>
                                </div>
                                <div className="h-3.5 xs:h-4 bg-gray-200 rounded w-14 xs:w-16 shrink-0"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (displayedEntries.length === 0) {
        return (
            <Card>
                <CardHeader className="p-4 xs:p-5 sm:p-6">
                    <CardTitle className="text-base xs:text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                    <div className="text-center py-6 xs:py-8 sm:py-10 px-4">
                        <Clock className="h-10 w-10 xs:h-12 xs:w-12 text-gray-400 mx-auto mb-3 xs:mb-4" />
                        <p className="text-sm xs:text-base text-gray-600 font-medium">No time entries yet</p>
                        <p className="text-xs xs:text-sm text-gray-500 mt-1 xs:mt-1.5 leading-snug">
                            Clock in to start tracking your time
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader className='flex flex-col sm:flex-row justify-between xs:justify-center xs:items-center gap-2 xs:gap-3 p-4 xs:p-5 sm:p-6'>
                    <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                        <Clock className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                        {title}
                    </CardTitle>
                    {!showAll && timeEntries.length > 0 && (
                        <Link href="/dashboard/time-tracking" className="w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 xs:h-10 text-xs xs:text-sm">
                                View All
                                <ArrowRight className="ml-1.5 xs:ml-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                            </Button>
                        </Link>
                    )}
                </CardHeader>
                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                    <div className="space-y-2">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Date</th>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Project</th>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Time</th>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Hours</th>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Earnings</th>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Status</th>
                                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedEntries.map((entry) => (
                                        <tr key={entry.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatDateSmart(entry.date)}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="text-sm text-gray-900">
                                                    {(entry as any).project?.name || 'Unknown Project'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="text-xs text-gray-600">
                                                    {entry.startTime && formatTime12Hour(entry.startTime)} - {entry.endTime && formatTime12Hour(entry.endTime)}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {entry.totalHours.toFixed(2)}h
                                                </div>
                                                {entry.overtimeHours > 0 && (
                                                    <div className="text-xs text-amber-600">
                                                        +{entry.overtimeHours.toFixed(2)}h OT
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-3">
                                                {entry.totalPay !== undefined && entry.totalPay !== null ? (
                                                    <div>
                                                        <div className="text-sm font-semibold text-green-700">
                                                            ${entry.totalPay.toFixed(2)}
                                                        </div>
                                                        {entry.overtimeHours > 0 && (
                                                            <div className="text-xs text-gray-600">
                                                                Reg: ${(entry.regularHours * (entry.regularRate || 0)).toFixed(2)}
                                                                {entry.overtimeHours > 0 && (
                                                                    <> + OT: ${(entry.overtimeHours * (entry.overtimeRate || 0)).toFixed(2)}</>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-400">Calculating...</div>
                                                )}
                                            </td>
                                            <td className="py-3 px-3">
                                                {getStatusBadge(entry.status)}
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(entry)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards - Responsive */}
                        <div className="md:hidden space-y-2.5 xs:space-y-3">
                            {displayedEntries.map((entry) => (
                                <div key={entry.id} className="border rounded-lg p-3 xs:p-4 space-y-2.5 xs:space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-900 text-sm xs:text-base leading-snug">
                                                {formatDateSmart(entry.date)}
                                            </p>
                                            <p className="text-xs xs:text-sm text-gray-600 mt-0.5 truncate leading-snug">
                                                {(entry as any).project?.name || 'Unknown Project'}
                                            </p>
                                        </div>
                                        {getStatusBadge(entry.status)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5 xs:gap-3 text-xs xs:text-sm">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Time</p>
                                            <p className="font-medium text-gray-900 leading-snug">
                                                {entry.startTime && formatTime12Hour(entry.startTime)} - {entry.endTime && formatTime12Hour(entry.endTime)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Hours</p>
                                            <p className="font-medium text-gray-900 leading-snug">
                                                {entry.totalHours.toFixed(2)}h
                                                {entry.overtimeHours > 0 && (
                                                    <span className="text-xs text-amber-600 ml-1">
                                                        (+{entry.overtimeHours.toFixed(2)}h OT)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {entry.totalPay !== undefined && entry.totalPay !== null && (
                                        <div className="flex items-center justify-between pt-2 xs:pt-2.5 border-t">
                                            <span className="text-xs xs:text-sm text-gray-600 flex items-center gap-1">
                                                <DollarSign className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                                                Earnings
                                            </span>
                                            <span className="text-base xs:text-lg font-bold text-green-700">
                                                ${entry.totalPay.toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-9 xs:h-10 text-xs xs:text-sm"
                                        onClick={() => handleViewDetails(entry)}
                                    >
                                        <Eye className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                                        View Details
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            {selectedEntry && (
                <TimeEntryDetailsDialog
                    entry={selectedEntry}
                    isOpen={isDetailOpen}
                    onClose={() => {
                        setIsDetailOpen(false)
                        setSelectedEntry(null)
                    }}
                />
            )}
        </>
    )
}