export const getStatusColor = (status: string) => {
    switch (status) {
        case 'not_started':
            return 'bg-gray-100 text-gray-800 border-gray-200'
        case 'in_progress':
            return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'on_track':
            return 'bg-green-100 text-green-800 border-green-200'
        case 'ahead_of_schedule':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200'
        case 'behind_schedule':
            return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'on_hold':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'completed':
            return 'bg-green-100 text-green-800 border-green-200'
        case 'cancelled':
            return 'bg-red-100 text-red-800 border-red-200'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}

export const formatStatusLabel = (status: string) => {
    switch (status) {
        case 'not_started': return 'Not Started'
        case 'in_progress': return 'In Progress'
        case 'on_track': return 'On Track'
        case 'ahead_of_schedule': return 'Ahead of Schedule'
        case 'behind_schedule': return 'Behind Schedule'
        case 'on_hold': return 'On Hold'
        case 'completed': return 'Completed'
        case 'cancelled': return 'Cancelled'
        default: return status
    }
}

export const formatRoleLabel = (role: string) => {
    switch (role) {
        case 'super_admin': return 'Super Admin'
        case 'admin': return 'Admin'
        case 'supervisor': return 'Supervisor'
        case 'member': return 'Member'
        default: return role
    }
}


export const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500"
    if (progress >= 70) return "bg-blue-500"
    if (progress >= 50) return "bg-yellow-500"
    return "bg-gray-400"
}

export const formatStatus = (status: string) => {
    return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

export const formatToUpperCase = (text: string) => {
    return text
        .split('_')
        .map(word => word.toUpperCase())
        .join(' ')
}

export const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

export const formatCurrency = (amount?: number) => {
    if (!amount) return "$0"
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export const getDaysUntilDeadline = (endDate?: string) => {
    if (!endDate) return null
    const deadline = new Date(endDate)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}

// ==============================================
// lib/utils/time-format.ts - Time Formatting Utilities
// ==============================================

/**
 * Format 24-hour time to 12-hour format with AM/PM
 * @param time - Time string in HH:MM format (24-hour)
 * @returns Formatted time string (12-hour with AM/PM)
 */
export function formatTime12Hour(time: string): string {
  if (!time) return ''
  
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  
  return `${displayHour}:${minutes} ${ampm}`
}

/**
 * Format time entry status to human-readable label
 */
export function formatTimeEntryStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'clocked_in': 'Clocked In',
    'clocked_out': 'Clocked Out',
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'modified': 'Modified'
  }
  
  return statusMap[status] || status
}

/**
 * Get status badge variant for UI display
 */
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'approved':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'rejected':
      return 'destructive'
    case 'clocked_in':
      return 'outline'
    default:
      return 'outline'
  }
}

/**
 * Get status color classes for UI display
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-amber-100 text-amber-800'
    case 'clocked_in':
      return 'bg-blue-100 text-blue-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}