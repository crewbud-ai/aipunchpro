// projects/components/forms/DetailsStep.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PhoneInputComponent } from "@/components/ui/phone-input"
import {
  Calendar,
  DollarSign,
  User,
  Clock,
  AlertCircle,
  Mail,
  Globe,
  Plus,
  X,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreateProjectFormData, ProjectFormErrors } from "@/types/projects"

interface DetailsStepProps {
  mode?: 'create' | 'edit'  // NEW: Support both modes
  formData: Pick<CreateProjectFormData,
    'startDate' | 'endDate' | 'budget' | 'estimatedHours' |
    'clientName' | 'clientContactPerson' | 'clientEmail' | 'clientPhone' |
    'clientWebsite' | 'clientNotes' | 'tags'
  >
  errors: ProjectFormErrors
  onFieldChange: (field: keyof CreateProjectFormData, value: any) => void
  onFieldErrorClear: (field: keyof ProjectFormErrors) => void
  onStartDateChange: (startDate: string) => void
}

export function DetailsStep({
  mode = 'create', // Default to create mode
  formData,
  errors,
  onFieldChange,
  onFieldErrorClear,
  onStartDateChange,
}: DetailsStepProps) {
  const [tagInput, setTagInput] = useState('')

  // ==============================================
  // TAG MANAGEMENT
  // ==============================================
  const addTag = (tagText: string) => {
    const currentTags: string[] = formData.tags || []
    if (tagText.trim() && !currentTags.includes(tagText.trim()) && currentTags.length < 10) {
      onFieldChange('tags', [...currentTags, tagText.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags: string[] = formData.tags || []
    onFieldChange('tags', currentTags.filter((tag: string) => tag !== tagToRemove))
  }

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  // ==============================================
  // MAIN RENDER
  // ==============================================
  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Timeline Section - Mobile Responsive */}
      <div>
        <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-3 xs:mb-4 flex items-center gap-1.5 xs:gap-2">
          <Calendar className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
          <span>Project Timeline</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 xs:gap-4 sm:gap-6">
          <div>
            <Label htmlFor="startDate" className="text-sm xs:text-base font-medium">Start Date</Label>
            <div className="relative mt-1.5 xs:mt-2">
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => onStartDateChange(e.target.value)}
                className={cn(
                  "block text-sm xs:text-base h-10 xs:h-11",
                  errors.startDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
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
            <Label htmlFor="endDate" className="text-sm xs:text-base font-medium">End Date</Label>
            <div className="relative mt-1.5 xs:mt-2">
              <Input
                id="endDate"
                type="date"
                value={formData.endDate || ''}
                min={formData.startDate || undefined}
                onChange={(e) => {
                  onFieldChange('endDate', e.target.value)
                  onFieldErrorClear('endDate')
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
      </div>

      <Separator />

      {/* Budget Section - Mobile Responsive */}
      <div>
        <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-3 xs:mb-4 flex items-center gap-1.5 xs:gap-2">
          <DollarSign className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
          <span>Budget & Hours</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 xs:gap-4 sm:gap-6">
          <div>
            <Label htmlFor="budget" className="text-sm xs:text-base font-medium">Project Budget</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget || ''}
              onChange={(e) => {
                onFieldChange('budget', e.target.value ? parseFloat(e.target.value) : undefined)
                onFieldErrorClear('budget')
              }}
              placeholder="Enter budget amount"
              className={cn(
                "mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11",
                errors.budget && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
            {errors.budget && (
              <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                <span className="leading-tight">{errors.budget}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="estimatedHours" className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base font-medium">
              <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
              <span>Estimated Hours</span>
            </Label>
            <Input
              id="estimatedHours"
              type="number"
              value={formData.estimatedHours || ''}
              onChange={(e) => {
                onFieldChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : undefined)
                onFieldErrorClear('estimatedHours')
              }}
              placeholder="Enter estimated hours"
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
        </div>
      </div>

      <Separator />

      {/* Client Section - Mobile Responsive */}
      <div>
        <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-3 xs:mb-4 flex items-center gap-1.5 xs:gap-2">
          <User className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
          <span>Client Information</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 xs:gap-4 sm:gap-6">
          <div>
            <Label htmlFor="clientName" className="text-sm xs:text-base font-medium">Client Name</Label>
            <Input
              id="clientName"
              value={formData.clientName || ''}
              onChange={(e) => {
                onFieldChange('clientName', e.target.value)
                onFieldErrorClear('clientName')
              }}
              placeholder="Enter client name"
              className="mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11"
            />
          </div>

          <div>
            <Label htmlFor="clientContactPerson" className="text-sm xs:text-base font-medium">Contact Person</Label>
            <Input
              id="clientContactPerson"
              value={formData.clientContactPerson || ''}
              onChange={(e) => {
                onFieldChange('clientContactPerson', e.target.value)
                onFieldErrorClear('clientContactPerson')
              }}
              placeholder="Enter contact person name"
              className="mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 xs:gap-4 sm:gap-6 mt-3.5 xs:mt-4">
          <div>
            <Label htmlFor="clientEmail" className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base font-medium">
              <Mail className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
              <span>Email</span>
            </Label>
            <Input
              id="clientEmail"
              type="email"
              value={formData.clientEmail || ''}
              onChange={(e) => {
                onFieldChange('clientEmail', e.target.value)
                onFieldErrorClear('clientEmail')
              }}
              placeholder="client@example.com"
              className={cn(
                "mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11",
                errors.clientEmail && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
            {errors.clientEmail && (
              <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                <span className="leading-tight">{errors.clientEmail}</span>
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm xs:text-base font-medium">Phone</Label>
            <div className="mt-1.5 xs:mt-2">
              <PhoneInputComponent
                value={formData.clientPhone || ''}
                onChange={(value) => {
                  onFieldChange('clientPhone', value)
                  onFieldErrorClear('clientPhone')
                }}
                placeholder="Enter phone number"
              />
            </div>
            {errors.clientPhone && (
              <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                <span className="leading-tight">{errors.clientPhone}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-3.5 xs:mt-4">
          <Label htmlFor="clientWebsite" className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base font-medium">
            <Globe className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
            <span>Website (Optional)</span>
          </Label>
          <Input
            id="clientWebsite"
            value={formData.clientWebsite || ''}
            onChange={(e) => {
              onFieldChange('clientWebsite', e.target.value)
              onFieldErrorClear('clientWebsite')
            }}
            placeholder="https://example.com"
            className="mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11"
          />
          {errors.clientWebsite && (
            <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
              <span className="leading-tight">{errors.clientWebsite}</span>
            </p>
          )}
        </div>

        <div className="mt-3.5 xs:mt-4">
          <Label htmlFor="clientNotes" className="text-sm xs:text-base font-medium">Client Notes (Optional)</Label>
          <Textarea
            id="clientNotes"
            value={formData.clientNotes || ''}
            onChange={(e) => {
              onFieldChange('clientNotes', e.target.value)
              onFieldErrorClear('clientNotes')
            }}
            placeholder="Any additional notes about the client..."
            rows={3}
            className="mt-1.5 xs:mt-2 text-sm xs:text-base resize-none"
          />
        </div>
      </div>

      <Separator />

      {/* Tags Section - Mobile Responsive */}
      <div>
        <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-3 xs:mb-4">Project Tags</h3>
        <div className="space-y-2 xs:space-y-3">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              placeholder="Add a tag and press Enter"
              className="flex-1 text-sm xs:text-base h-10 xs:h-11"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim() || (formData.tags || []).length >= 10}
              className="h-10 xs:h-11 w-10 xs:w-11 p-0 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 leading-snug">
            Press Enter or comma to add tags. Maximum 10 tags allowed.
          </p>

          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 xs:gap-2 mt-2 xs:mt-3">
              {formData.tags.map((tag: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs xs:text-sm px-2 xs:px-3 py-0.5 xs:py-1 flex items-center gap-1"
                >
                  <span className="truncate max-w-[150px] xs:max-w-none">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 xs:ml-1 hover:bg-gray-300 rounded-full p-0.5 shrink-0"
                  >
                    <X className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {errors.tags && (
            <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
              <span className="leading-tight">{errors.tags}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}