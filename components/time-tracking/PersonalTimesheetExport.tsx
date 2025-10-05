// ==============================================
// components/time-tracking/PersonalTimesheetExport.tsx
// Member-Only Personal Timesheet Export
// ==============================================

"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, Loader2, Calendar, CheckCircle } from "lucide-react"
import { payrollReportsApi } from '@/lib/api/payroll'
import { toast } from '@/hooks/use-toast'

// ==============================================
// INTERFACES
// ==============================================
interface PersonalTimesheetExportProps {
    userId: string
    userName?: string
}

// ==============================================
// COMPONENT
// ==============================================
export function PersonalTimesheetExport({ userId, userName }: PersonalTimesheetExportProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [exportSuccess, setExportSuccess] = useState(false)

    // ==============================================
    // EXPORT HANDLER
    // ==============================================
    const handleExport = async (period: 'this-week' | 'this-month' | 'last-month' | 'this-year' | 'custom') => {
        setIsExporting(true)
        setExportSuccess(false)

        try {
            const now = new Date()
            let startDate: string
            let endDate: string = now.toISOString().split('T')[0]
            let periodLabel: string

            switch (period) {
                case 'this-week': {
                    // Fix: Get Sunday of current week
                    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
                    const startOfWeek = new Date(now)
                    startOfWeek.setDate(now.getDate() - dayOfWeek) // Go back to Sunday
                    startDate = startOfWeek.toISOString().split('T')[0]

                    // Set end to Saturday or today (whichever is earlier)
                    const endOfWeek = new Date(startOfWeek)
                    endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
                    const end = endOfWeek > now ? now : endOfWeek
                    endDate = end.toISOString().split('T')[0]

                    periodLabel = 'This Week'
                    console.log('This Week range:', { startDate, endDate }) // Debug log
                    break
                }
                case 'this-month': {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                    startDate = startOfMonth.toISOString().split('T')[0]
                    endDate = now.toISOString().split('T')[0]
                    periodLabel = 'This Month'
                    console.log('This Month range:', { startDate, endDate }) // Debug log
                    break
                }
                case 'last-month': {
                    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
                    startDate = startOfLastMonth.toISOString().split('T')[0]
                    endDate = endOfLastMonth.toISOString().split('T')[0]
                    periodLabel = 'Last Month'
                    console.log('Last Month range:', { startDate, endDate }) // Debug log
                    break
                }
                case 'this-year': {
                    const startOfYear = new Date(now.getFullYear(), 0, 1)
                    startDate = startOfYear.toISOString().split('T')[0]
                    endDate = now.toISOString().split('T')[0]
                    periodLabel = 'This Year'
                    console.log('This Year range:', { startDate, endDate }) // Debug log
                    break
                }
                case 'custom': {
                    // For custom, redirect to main reports page
                    window.location.href = `/dashboard/reports?userId=${userId}`
                    return
                }
                default:
                    return
            }

            console.log('Export params:', { startDate, endDate, userId })

            const filters = {
                startDate,
                endDate,
                userId, // Filter to only this user's entries
                status: 'all' as const,
                includeNotes: true,
                includeDetailedEntries: true
            }

            const filename = `my-timesheet-${period}`

            await payrollReportsApi.exportPayrollCSV(filters, filename)

            // Show success state briefly
            setExportSuccess(true)
            setTimeout(() => {
                setExportSuccess(false)
            }, 2000)

            toast({
                title: "Export Successful",
                description: `Your timesheet for ${periodLabel} has been exported.`,
            })
        } catch (error) {
            console.error('Export error:', error)
            toast({
                title: "Export Failed",
                description: "Failed to export timesheet. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsExporting(false)
        }
    }

    // ==============================================
    // RENDER
    // ==============================================
    return (
        <div className="flex items-center gap-2">
            {/* Simple Button Version */}
            <Button
                onClick={() => handleExport('this-month')}
                disabled={isExporting}
                variant="outline"
                size="sm"
            >
                {isExporting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                    </>
                ) : exportSuccess ? (
                    <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Exported!
                    </>
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" />
                        Export My Hours
                    </>
                )}
            </Button>

            {/* Dropdown with Options */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isExporting}>
                        <Calendar className="mr-2 h-4 w-4" />
                        More Options
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Export Timesheet</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => handleExport('this-week')} disabled={isExporting}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        This Week
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleExport('this-month')} disabled={isExporting}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        This Month
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleExport('last-month')} disabled={isExporting}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Last Month
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleExport('this-year')} disabled={isExporting}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        This Year
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

// ==============================================
// EXPORT CARD VERSION (Alternative)
// ==============================================
export function PersonalTimesheetExportCard({ userId, userName }: PersonalTimesheetExportProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleQuickExport = async (period: 'this-week' | 'this-month' | 'this-year') => {
        setIsExporting(true)

        try {
            const now = new Date()
            let startDate: string
            let endDate: string = now.toISOString().split('T')[0]

            switch (period) {
                case 'this-week': {
                    const dayOfWeek = now.getDay()
                    const startOfWeek = new Date(now)
                    startOfWeek.setDate(now.getDate() - dayOfWeek)
                    startDate = startOfWeek.toISOString().split('T')[0]
                    break
                }
                case 'this-month': {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                    startDate = startOfMonth.toISOString().split('T')[0]
                    break
                }
                case 'this-year': {
                    const startOfYear = new Date(now.getFullYear(), 0, 1)
                    startDate = startOfYear.toISOString().split('T')[0]
                    break
                }
            }

            const filters = {
                startDate,
                endDate,
                userId,
                status: 'all' as const,
                includeNotes: true,
                includeDetailedEntries: true
            }

            await payrollReportsApi.exportPayrollCSV(filters, `my-timesheet-${period}`)

            toast({
                title: "Export Successful",
                description: "Your timesheet has been exported.",
            })
        } catch (error) {
            console.error('Export error:', error)
            toast({
                title: "Export Failed",
                description: "Failed to export timesheet. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export My Timesheet
                </CardTitle>
                <CardDescription>
                    Download your personal time entries
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 md:grid-cols-3">
                    <Button
                        onClick={() => handleQuickExport('this-week')}
                        disabled={isExporting}
                        variant="outline"
                        size="sm"
                    >
                        This Week
                    </Button>

                    <Button
                        onClick={() => handleQuickExport('this-month')}
                        disabled={isExporting}
                        variant="outline"
                        size="sm"
                    >
                        This Month
                    </Button>

                    <Button
                        onClick={() => handleQuickExport('this-year')}
                        disabled={isExporting}
                        variant="outline"
                        size="sm"
                    >
                        This Year
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}