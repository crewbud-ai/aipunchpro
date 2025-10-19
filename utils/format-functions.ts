import { format, isToday, isTomorrow, isYesterday } from "date-fns"
import { AlertTriangle, Calendar, CheckCircle, Clock, Crown, Eye, FileImage, FileSpreadsheet, FileText, FileType, FileVideo, Play, Shield, User, Users, XCircle } from "lucide-react"


export const TRADE_OPTIONS = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'framing', label: 'Framing' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'general', label: 'General' },
  { value: 'management', label: 'Management' },
  { value: 'safety', label: 'Safety' },
]

export const getTradeLabel = (tradeSpecialty?: string) => {
  if (!tradeSpecialty) return "General"
  const trade = TRADE_OPTIONS.find(t => t.value === tradeSpecialty)
  return trade?.label || tradeSpecialty
}

export const formatIndustryLabel = (industry: string) => {
  switch (industry) {
    case 'general-construction': return 'General Construction'
    case 'residential-construction': return 'Residential Construction'
    case 'commercial-construction': return 'Commercial Construction'
    case 'industrial-construction': return 'Industrial Construction'
    case 'civil-engineering': return 'Civil Engineering'
    case 'electrical-construction': return 'Electrical Contracting'
    case 'plumbing-construction': return 'Plumbing Contracting'
    case 'hvac-construction': return 'HVAC Contracting'
    case 'roofing': return 'Roofing'
    case 'other': return 'Other'
    default: return industry
  }
}

export const getStatusConfig = (status: string) => {
  switch (status) {
    case 'planned':
      return {
        label: 'Planned',
        variant: 'secondary' as const,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: Calendar,
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        variant: 'default' as const,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: Play,
      }
    case 'completed':
      return {
        label: 'Completed',
        variant: 'default' as const,
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircle,
      }
    case 'delayed':
      return {
        label: 'Delayed',
        variant: 'destructive' as const,
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: AlertTriangle,
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        variant: 'outline' as const,
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: XCircle,
      }
    default:
      return {
        label: 'Unknown',
        variant: 'outline' as const,
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: Clock,
      }
  }
}

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

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
]


export const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'critical':
      return { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-500' }
    case 'high':
      return { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-500' }
    case 'medium':
      return { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-500' }
    case 'low':
      return { label: 'Low', color: 'text-green-600', bgColor: 'bg-green-500' }
    default:
      return { label: 'Medium', color: 'text-gray-600', bgColor: 'bg-gray-500' }
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

export const getTeamMemberStatusConfig = (isActive: boolean, assignmentStatus?: string) => {
  if (!isActive) {
    return {
      label: 'Inactive',
      className: 'bg-gray-100 text-gray-800'
    }
  }

  switch (assignmentStatus) {
    case 'assigned':
      return {
        label: 'Active',
        className: 'bg-green-100 text-green-800'
      }
    case 'not_assigned':
      return {
        label: 'Available',
        className: 'bg-yellow-100 text-yellow-800'
      }
    default:
      return {
        label: 'Active',
        className: 'bg-blue-100 text-blue-800'
      }
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


export const getRoleColor = (role: string) => {
  switch (role) {
    case 'super_admin': return 'bg-red-100 text-red-800 border-red-200'
    case 'admin': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'supervisor': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'member': return 'bg-blue-100 text-blue-800 border-blue-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const getPunchListTeamRoleIcon = (role: string) => {
  switch (role) {
    case 'primary':
      return Crown
    case 'secondary':
      return Users
    case 'inspector':
      return Eye
    case 'supervisor':
      return Shield
    default:
      return User
  }
}
export const getPunchListTeamRoleColor = (role: string) => {
  switch (role) {
    case 'primary': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'secondary': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'inspector': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'supervisor': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

export const formatDateTime = (dateString: string) => {
  if (!dateString) return "Not set"
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export const formatDateSmart = (dateString: string) => {
  const date = new Date(dateString)

  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'

  return format(date, 'MMM d, yyyy')
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

export const formatPhone = (phone?: string) => {
  if (!phone) return "No phone"
  // Format +1XXXXXXXXXX to (XXX) XXX-XXXX
  if (phone.startsWith('+1') && phone.length === 12) {
    const number = phone.slice(2)
    return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
  }
  return phone
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

// Get status color classes for UI display
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

export   const getTimeEntryStatusColor = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'clocked_out':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'approved':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }


// File Related Functions

export function getFileIcon(fileType: string, mimeType: string) {
  if (mimeType?.startsWith('image/')) {
    return { icon: FileImage, color: 'text-blue-600', bgColor: 'bg-blue-100' }
  } else if (mimeType === 'application/pdf') {
    return { icon: FileType, color: 'text-red-600', bgColor: 'bg-red-100' }
  } else if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    return { icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-100' }
  } else if (mimeType?.startsWith('video/')) {
    return { icon: FileVideo, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  } else {
    return { icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100' }
  }
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFolderConfig(folder: string) {
  switch (folder) {
    case 'blueprints':
      return { label: 'Blueprints', color: 'bg-blue-100 text-blue-800' }
    case 'documents':
      return { label: 'Documents', color: 'bg-gray-100 text-gray-800' }
    case 'photos':
      return { label: 'Photos', color: 'bg-green-100 text-green-800' }
    case 'contracts':
      return { label: 'Contracts', color: 'bg-purple-100 text-purple-800' }
    case 'reports':
      return { label: 'Reports', color: 'bg-orange-100 text-orange-800' }
    default:
      return { label: 'General', color: 'bg-gray-100 text-gray-800' }
  }
}


// Rates
export const formatRate = (rate: number | null | undefined) => {
  if (!rate) return 'Not set'
  return `$${rate}/hr`
}


// Hours & Percentages

export  const formatHours = (hours: number) => {
    return hours.toFixed(2) + 'h'
  }

export  const formatPercent = (percent: number) => {
    return percent.toFixed(2) + '%'
  }