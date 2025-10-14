"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertCircle, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type CreateScheduleProjectFormData,
  type UpdateScheduleProjectFormData
} from "@/types/schedule-projects"

// ==============================================
// GENERIC FORM DATA TYPE
// ==============================================
type ScheduleProjectFormData = CreateScheduleProjectFormData | UpdateScheduleProjectFormData

// ==============================================
// PROPS INTERFACE
// ==============================================
interface TimingStepProps {
  mode?: 'create' | 'edit'
  formData: Pick<ScheduleProjectFormData, 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'estimatedHours'> &
  Partial<Pick<UpdateScheduleProjectFormData, 'actualHours'>>
  errors: any
  updateFormData: (field: string, value: any) => void // Made more flexible
  clearFieldError: (field: string) => void
  handleStartDateChange: (date: string) => void
}

// ==============================================
// COMPONENT
// ==============================================
export const TimingStep = React.memo<TimingStepProps>(({
  mode = 'create',
  formData,
  errors,
  updateFormData,
  clearFieldError,
  handleStartDateChange
}) => {
  // Dynamic labels based on mode
  const getLabel = (base: string) => {
    return mode === 'edit' ? `${base}` : `${base}`
  }

  // Check if we have actual hours (edit mode)
  const hasActualHours = mode === 'edit' && 'actualHours' in formData

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Mode indicator */}
      {mode === 'edit' && (
        <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
          <Badge variant="secondary" className="text-xs">
            Editing Schedule
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Timing & Duration
          </Badge>
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 xs:gap-4 sm:gap-6">
        <div>
          <Label htmlFor="startDate" className="text-sm xs:text-base font-medium">
            {getLabel("Start Date")} <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1.5 xs:mt-2">
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className={cn(
                "block text-sm xs:text-base h-10 xs:h-11",
                errors.startDate && "border-red-500 focus:border-red-500 focus:ring-red-500 w-full"
              )}
              style={{
                colorScheme: 'light',
              }}
            />
          </div>
          {errors.startDate && (
            <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
              <span className="leading-tight">{errors.startDate}</span>
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="endDate" className="text-sm xs:text-base font-medium">
            {getLabel("End Date")} <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1.5 xs:mt-2">
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => {
                updateFormData('endDate', e.target.value)
                clearFieldError('endDate')
              }}
              className={cn(
                "block text-sm xs:text-base h-10 xs:h-11",
                errors.endDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              style={{
                colorScheme: 'light',
              }}
            />
          </div>
          {errors.endDate && (
            <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
              <span className="leading-tight">{errors.endDate}</span>
            </p>
          )}
        </div>
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 xs:gap-4 sm:gap-6">
        <div>
          <Label htmlFor="startTime" className="text-sm xs:text-base font-medium">
            {getLabel("Start Time")}
          </Label>
          <div className="relative mt-1.5 xs:mt-2">
            <Input
              id="startTime"
              type="time"
              value={formData.startTime || "08:00"}
              onChange={(e) => {
                updateFormData('startTime', e.target.value)
                clearFieldError('startTime')
              }}
              className={cn(
                "block text-sm xs:text-base h-10 xs:h-11",
                errors.startTime && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
          </div>
          {errors.startTime && (
            <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
              <span className="leading-tight">{errors.startTime}</span>
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="endTime" className="text-sm xs:text-base font-medium">
            {getLabel("End Time")}
          </Label>
          <div className="relative mt-1.5 xs:mt-2">
            <Input
              id="endTime"
              type="time"
              value={formData.endTime || "17:00"}
              onChange={(e) => {
                updateFormData('endTime', e.target.value)
                clearFieldError('endTime')
              }}
              className={cn(
                "block text-sm xs:text-base h-10 xs:h-11",
                errors.endTime && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
          </div>
          {errors.endTime && (
            <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
              <span className="leading-tight">{errors.endTime}</span>
            </p>
          )}
        </div>
      </div>

      {/* Hours Section */}
      <div className={cn(
        "grid gap-3.5 xs:gap-4 sm:gap-6",
        hasActualHours ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
      )}>
        {/* Estimated Hours */}
        <div>
          <Label htmlFor="estimatedHours" className="text-sm xs:text-base font-medium">
            {getLabel("Estimated Hours")}
          </Label>
          <Input
            id="estimatedHours"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g., 8.5"
            value={formData.estimatedHours || ''}
            onChange={(e) => {
              updateFormData('estimatedHours', e.target.value ? parseFloat(e.target.value) : undefined)
              clearFieldError('estimatedHours')
            }}
            className={cn(
              "mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11",
              errors.estimatedHours && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
          />
          {errors.estimatedHours && (
            <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
              <span className="leading-tight">{errors.estimatedHours}</span>
            </p>
          )}
        </div>

        {/* Actual Hours (Edit Mode Only) */}
        {hasActualHours && (
          <div>
            <Label htmlFor="actualHours" className="text-sm xs:text-base font-medium">
              Actual Hours
              <Badge variant="outline" className="ml-1.5 xs:ml-2 text-xs">
                Edit Mode
              </Badge>
            </Label>
            <Input
              id="actualHours"
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g., 9.0"
              value={formData.actualHours || ''}
              onChange={(e) => {
                updateFormData('actualHours', e.target.value ? parseFloat(e.target.value) : 0)
                clearFieldError('actualHours')
              }}
              className={cn(
                "mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11",
                errors.actualHours && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
            {errors.actualHours && (
              <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                <span className="leading-tight">{errors.actualHours}</span>
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Track actual time spent on this work
            </p>
          </div>
        )}
      </div>

      {/* Hours comparison (Edit Mode) */}
      {hasActualHours && formData.estimatedHours && formData.actualHours && (
        <Alert className={cn( "border-l-4", formData.actualHours > formData.estimatedHours ? "border-l-yellow-400 bg-yellow-50" : "border-l-green-400 bg-green-50" )}>
          <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
          <AlertDescription className="text-xs xs:text-sm leading-snug">
            {formData.actualHours > formData.estimatedHours ? (
              <>
                <strong>Over estimate:</strong> Actual hours ({formData.actualHours}h) exceed estimated hours ({formData.estimatedHours}h) by {(formData.actualHours - formData.estimatedHours).toFixed(1)} hours.
              </>
            ) : (
              <>
                <strong>Under estimate:</strong> Actual hours ({formData.actualHours}h) are {(formData.estimatedHours - formData.actualHours).toFixed(1)} hours under the estimate ({formData.estimatedHours}h).
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
})

TimingStep.displayName = 'TimingStep'