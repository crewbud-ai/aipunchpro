"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreateScheduleProjectFormData } from "@/types/schedule-projects"

interface TimingStepProps {
  mode?: 'create' | 'edit'
  formData: Pick<CreateScheduleProjectFormData, 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'estimatedHours'>
  errors: any
  updateFormData: (field: keyof CreateScheduleProjectFormData, value: any) => void
  clearFieldError: (field: string) => void
  handleStartDateChange: (date: string) => void
}

export const TimingStep = React.memo<TimingStepProps>(({ 
  mode = 'create',
  formData, 
  errors, 
  updateFormData, 
  clearFieldError,
  handleStartDateChange
}) => (
  <div className="space-y-6">
    {/* Date Range */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Label htmlFor="startDate" className="text-base font-medium">
          Start Date <span className="text-red-500">*</span>
        </Label>
        <div className="relative mt-2">
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className={cn(
              "pr-10",
              errors.startDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
            style={{
              colorScheme: 'light',
            }}
          />
        </div>
        {errors.startDate && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.startDate}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="endDate" className="text-base font-medium">
          End Date <span className="text-red-500">*</span>
        </Label>
        <div className="relative mt-2">
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            min={formData.startDate || undefined}
            onChange={(e) => {
              updateFormData('endDate', e.target.value)
              clearFieldError('endDate')
            }}
            className={cn(
              "pr-10",
              errors.endDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
            style={{
              colorScheme: 'light',
            }}
          />
        </div>
        {errors.endDate && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.endDate}
          </p>
        )}
      </div>
    </div>

    {/* Time Range */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Label htmlFor="startTime" className="text-base font-medium">Start Time</Label>
        <Input
          id="startTime"
          type="time"
          value={formData.startTime}
          onChange={(e) => {
            updateFormData('startTime', e.target.value)
            clearFieldError('startTime')
          }}
          className={cn(
            "mt-2",
            errors.startTime && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
        />
        {errors.startTime && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.startTime}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="endTime" className="text-base font-medium">End Time</Label>
        <Input
          id="endTime"
          type="time"
          value={formData.endTime}
          onChange={(e) => {
            updateFormData('endTime', e.target.value)
            clearFieldError('endTime')
          }}
          className={cn(
            "mt-2",
            errors.endTime && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
        />
        {errors.endTime && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.endTime}
          </p>
        )}
      </div>
    </div>

    {/* Estimated Hours */}
    <div>
      <Label htmlFor="estimatedHours" className="flex items-center gap-2 text-base font-medium">
        <Clock className="h-4 w-4" />
        Estimated Hours
      </Label>
      <Input
        id="estimatedHours"
        type="number"
        min="0"
        max="999.99"
        step="0.25"
        placeholder="e.g., 8.5"
        value={formData.estimatedHours || ''}
        onChange={(e) => {
          updateFormData('estimatedHours', e.target.value ? parseFloat(e.target.value) : undefined)
          clearFieldError('estimatedHours')
        }}
        className={cn(
          "mt-2",
          errors.estimatedHours && "border-red-500 focus:border-red-500 focus:ring-red-500"
        )}
      />
      {errors.estimatedHours && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors.estimatedHours}
        </p>
      )}
    </div>
  </div>
))

TimingStep.displayName = 'TimingStep'