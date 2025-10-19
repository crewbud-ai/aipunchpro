// ==============================================
// app/(dashboard)/dashboard/punchlist/components/forms/IssueDetailsStep.tsx
// ==============================================

"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    ISSUE_TYPE_OPTIONS,
    PUNCHLIST_PRIORITY_OPTIONS,
    type CreatePunchlistItemFormData,
    type UpdatePunchlistItemFormData
} from "@/types/punchlist-items"

// ==============================================
// GENERIC FORM DATA TYPE
// ==============================================
type PunchlistItemFormData = CreatePunchlistItemFormData | UpdatePunchlistItemFormData

// ==============================================
// PROPS INTERFACE
// ==============================================
interface IssueDetailsStepProps {
    mode?: 'create' | 'edit'
    formData: Pick<PunchlistItemFormData, 'title' | 'description' | 'issueType' | 'priority'>
    errors: any
    updateFormData: (field: string, value: any) => void
    clearFieldError: (field: string) => void
}

// ==============================================
// COMPONENT
// ==============================================
export const IssueDetailsStep = React.memo<IssueDetailsStepProps>(({
    mode = 'create',
    formData,
    errors,
    updateFormData,
    clearFieldError,
}: IssueDetailsStepProps) => {

    // Dynamic labels based on mode
    const getLabel = (base: string) => {
        return mode === 'edit' ? `Update ${base}` : base
    }

    // ==============================================
    // EVENT HANDLERS
    // ==============================================

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        updateFormData('title', value)
        if (errors.title) clearFieldError('title')
    }

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        updateFormData('description', value)
        if (errors.description) clearFieldError('description')
    }

    const handleIssueTypeChange = (value: string) => {
        updateFormData('issueType', value)
        if (errors.issueType) clearFieldError('issueType')
    }

    const handlePriorityChange = (value: string) => {
        updateFormData('priority', value)
        if (errors.priority) clearFieldError('priority')
    }

    // ==============================================
    // RENDER
    // ==============================================
    return (
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            {/* Title */}
            <div className="space-y-1.5 xs:space-y-2">
                <Label htmlFor="title" className="text-sm xs:text-base font-medium">
                    {getLabel('Issue Title')} <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11",
                        errors.title && "border-red-500"
                    )}
                />
                {errors.title && (
                    <Alert variant="destructive" className="py-1.5 xs:py-2 mt-1.5 xs:mt-2">
                        <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                        <AlertDescription className="text-xs xs:text-sm">
                            {errors.title}
                        </AlertDescription>
                    </Alert>
                )}
                <p className="text-xs text-gray-500 mt-1 xs:mt-1.5">
                    Enter a clear, concise title that describes the issue
                </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5 xs:space-y-2">
                <Label htmlFor="description" className="text-sm xs:text-base font-medium">
                    {getLabel('Description')}
                </Label>
                <Textarea
                    id="description"
                    placeholder="Provide additional details about the work needed..."
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    rows={3}
                    className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base",
                        errors.description && "border-red-500"
                    )}
                />
                {errors.description && (
                    <Alert variant="destructive" className="py-1.5 xs:py-2 mt-1.5 xs:mt-2">
                        <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                        <AlertDescription className="text-xs xs:text-sm">
                            {errors.description}
                        </AlertDescription>
                    </Alert>
                )}
                <p className="text-xs text-gray-500 mt-1 xs:mt-1.5">
                    Optional: Add more context about what needs to be done
                </p>
            </div>

            {/* Issue Type and Priority Row - Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 xs:gap-4 sm:gap-6">
                {/* Issue Type */}
                <div className="space-y-1.5 xs:space-y-2">
                    <Label htmlFor="issueType" className="text-sm xs:text-base font-medium">
                        {getLabel('Issue Type')} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.issueType} onValueChange={handleIssueTypeChange}>
                        <SelectTrigger className={cn(
                            "mt-1.5 xs:mt-2 h-10 xs:h-11 text-sm xs:text-base",
                            errors.issueType && "border-red-500"
                        )}>
                            <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent>
                            {ISSUE_TYPE_OPTIONS.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-sm xs:text-base"
                                >
                                    <div className="flex items-center gap-1.5 xs:gap-2">
                                        <span>{option.label}</span>
                                        {option.description && (
                                            <span className="text-xs text-gray-500">
                                                - {option.description}
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.issueType && (
                        <Alert variant="destructive" className="py-1.5 xs:py-2 mt-1.5 xs:mt-2">
                            <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                            <AlertDescription className="text-xs xs:text-sm">
                                {errors.issueType}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Priority */}
                <div className="space-y-1.5 xs:space-y-2">
                    <Label htmlFor="priority" className="text-sm xs:text-base font-medium">
                        {getLabel('Priority')} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.priority} onValueChange={handlePriorityChange}>
                        <SelectTrigger className={cn(
                            "mt-1.5 xs:mt-2 h-10 xs:h-11 text-sm xs:text-base",
                            errors.priority && "border-red-500"
                        )}>
                            <SelectValue className="text-sm xs:text-base" placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {PUNCHLIST_PRIORITY_OPTIONS.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="block text-sm xs:text-base h-10 xs:h-11"
                                >
                                    <span>{option.label}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.priority && (
                        <Alert variant="destructive" className="py-1.5 xs:py-2 mt-1.5 xs:mt-2">
                            <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                            <AlertDescription className="text-xs xs:text-sm">
                                {errors.priority}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    )
})