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
    <div className="space-y-6">
      {/* Timeline Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Project Timeline
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="startDate" className="text-base font-medium">Start Date</Label>
            <div className="relative mt-2">
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => onStartDateChange(e.target.value)}
                className={cn(
                  "block", // Add padding for calendar icon
                  errors.startDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                )}
                style={{
                  colorScheme: 'light', // Ensures proper calendar icon display
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
            <Label htmlFor="endDate" className="text-base font-medium">End Date</Label>
            <div className="relative mt-2">
              <Input
                id="endDate"
                type="date"
                value={formData.endDate || ''}
                min={formData.startDate || undefined} // Prevent selecting dates before start date
                onChange={(e) => {
                  onFieldChange('endDate', e.target.value)
                  onFieldErrorClear('endDate')
                }}
                className={cn(
                  "block", // Add padding for calendar icon
                  errors.endDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                )}
                style={{
                  colorScheme: 'light', // Ensures proper calendar icon display
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
      </div>

      <Separator />

      {/* Budget Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Budget & Hours
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="budget" className="text-base font-medium">Project Budget</Label>
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
                "mt-2",
                errors.budget && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
            {errors.budget && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.budget}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="estimatedHours" className="flex items-center gap-2 text-base font-medium">
              <Clock className="h-4 w-4" />
              Estimated Hours
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
      </div>

      <Separator />

      {/* Client Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Client Information
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="clientName" className="text-base font-medium">Client Name</Label>
            <Input
              id="clientName"
              value={formData.clientName || ''}
              onChange={(e) => {
                onFieldChange('clientName', e.target.value)
                onFieldErrorClear('clientName')
              }}
              placeholder="Enter client name"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="clientContactPerson" className="text-base font-medium">Contact Person</Label>
            <Input
              id="clientContactPerson"
              value={formData.clientContactPerson || ''}
              onChange={(e) => {
                onFieldChange('clientContactPerson', e.target.value)
                onFieldErrorClear('clientContactPerson')
              }}
              placeholder="Enter contact person name"
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div>
            <Label htmlFor="clientEmail" className="flex items-center gap-2 text-base font-medium">
              <Mail className="h-4 w-4" />
              Email
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
                "mt-2",
                errors.clientEmail && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
            {errors.clientEmail && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.clientEmail}
              </p>
            )}
          </div>

          <div>
            <Label className="text-base font-medium">Phone</Label>
            <div className="mt-2">
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
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.clientPhone}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="clientWebsite" className="flex items-center gap-2 text-base font-medium">
            <Globe className="h-4 w-4" />
            Website (Optional)
          </Label>
          <Input
            id="clientWebsite"
            value={formData.clientWebsite || ''}
            onChange={(e) => {
              onFieldChange('clientWebsite', e.target.value)
              onFieldErrorClear('clientWebsite')
            }}
            placeholder="https://example.com"
            className="mt-2"
          />
          {errors.clientWebsite && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.clientWebsite}
            </p>
          )}
        </div>

        <div className="mt-4">
          <Label htmlFor="clientNotes" className="text-base font-medium">Client Notes (Optional)</Label>
          <Textarea
            id="clientNotes"
            value={formData.clientNotes || ''}
            onChange={(e) => {
              onFieldChange('clientNotes', e.target.value)
              onFieldErrorClear('clientNotes')
            }}
            placeholder="Any additional notes about the client..."
            rows={3}
            className="mt-2 resize-none"
          />
        </div>
      </div>

      <Separator />

      {/* Tags Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Tags</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              placeholder="Add a tag and press Enter"
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim() || (formData.tags || []).length >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Press Enter or comma to add tags. Maximum 10 tags allowed.
          </p>
          
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.map((tag: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-sm px-3 py-1 flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          {errors.tags && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.tags}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}