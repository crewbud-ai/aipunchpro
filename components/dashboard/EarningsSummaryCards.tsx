import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Calendar, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// ==============================================
// EARNINGS SUMMARY CARDS
// Shows today, this week, and this month earnings
// ==============================================

interface EarningsSummary {
  today: {
    total: number
    approved: number
    pending: number
  }
  thisWeek: {
    total: number
    approved: number
    pending: number
  }
  thisMonth: {
    total: number
    approved: number
    pending: number
  }
}

export function EarningsSummaryCards() {
  const [earnings, setEarnings] = useState<EarningsSummary>({
    today: { total: 0, approved: 0, pending: 0 },
    thisWeek: { total: 0, approved: 0, pending: 0 },
    thisMonth: { total: 0, approved: 0, pending: 0 },
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch earnings data
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setIsLoading(true)
        
        // Fetch time entries
        const response = await fetch('/api/time-entries')
        if (!response.ok) throw new Error('Failed to fetch')
        
        const result = await response.json()
        const timeEntries = result.data?.timeEntries || []

        // Get date ranges
        const now = new Date()
        const today = now.toISOString().split('T')[0]
        
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        const weekStart = startOfWeek.toISOString().split('T')[0]
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthStart = startOfMonth.toISOString().split('T')[0]

        // Calculate totals
        const todayEntries = timeEntries.filter((e: any) => e.date === today)
        const weekEntries = timeEntries.filter((e: any) => e.date >= weekStart)
        const monthEntries = timeEntries.filter((e: any) => e.date >= monthStart)

        const calculateTotals = (entries: any[]) => {
          const approved = entries
            .filter((e: any) => e.status === 'approved')
            .reduce((sum: number, e: any) => sum + (parseFloat(e.totalPay) || 0), 0)
          
          const pending = entries
            .filter((e: any) => e.status === 'pending' || e.status === 'clocked_out')
            .reduce((sum: number, e: any) => sum + (parseFloat(e.totalPay) || 0), 0)
          
          return {
            total: approved + pending,
            approved,
            pending,
          }
        }

        setEarnings({
          today: calculateTotals(todayEntries),
          thisWeek: calculateTotals(weekEntries),
          thisMonth: calculateTotals(monthEntries),
        })
      } catch (error) {
        console.error('Error fetching earnings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEarnings()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchEarnings, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Today's Earnings */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-700">
              Today's Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            ${earnings.today.total.toFixed(2)}
          </div>
          <div className="mt-2 space-y-1">
            {earnings.today.approved > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-700 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Approved
                </span>
                <span className="font-semibold text-green-700">
                  ${earnings.today.approved.toFixed(2)}
                </span>
              </div>
            )}
            {earnings.today.pending > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700">Pending</span>
                <span className="font-semibold text-amber-700">
                  ${earnings.today.pending.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* This Week's Earnings */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-700">
              This Week
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            ${earnings.thisWeek.approved.toFixed(2)}
          </div>
          <div className="mt-2">
            {earnings.thisWeek.pending > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                ${earnings.thisWeek.pending.toFixed(2)} pending
              </Badge>
            )}
            {earnings.thisWeek.pending === 0 && (
              <p className="text-xs text-gray-600">All approved ✓</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* This Month's Earnings */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-700">
              This Month
            </CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            ${earnings.thisMonth.approved.toFixed(2)}
          </div>
          <div className="mt-2">
            {earnings.thisMonth.pending > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                ${earnings.thisMonth.pending.toFixed(2)} pending
              </Badge>
            )}
            {earnings.thisMonth.pending === 0 && (
              <p className="text-xs text-gray-600">All approved ✓</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}