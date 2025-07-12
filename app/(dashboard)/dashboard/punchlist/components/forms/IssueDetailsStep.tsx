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
        <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                    {getLabel('Issue Title')} <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className={cn(errors.title && "border-red-500")}
                />
                {errors.title && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            {errors.title}
                        </AlertDescription>
                    </Alert>
                )}
                <p className="text-xs text-gray-500">
                    Enter a clear, concise title that describes the issue
                </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                    {getLabel('Description')}
                </Label>
                <Textarea
                    id="description"
                    placeholder="Provide additional details about the work needed..."
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    rows={3}
                    className={cn(errors.description && "border-red-500")}
                />
                {errors.description && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            {errors.description}
                        </AlertDescription>
                    </Alert>
                )}
                <p className="text-xs text-gray-500">
                    Optional: Add more context about what needs to be done
                </p>
            </div>

            {/* Issue Type and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Issue Type */}
                <div className="space-y-2">
                    <Label htmlFor="issueType" className="text-sm font-medium">
                        {getLabel('Issue Type')} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.issueType} onValueChange={handleIssueTypeChange}>
                        <SelectTrigger className={cn(errors.issueType && "border-red-500")}>
                            <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent>
                            {ISSUE_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
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
                        <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                {errors.issueType}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm font-medium">
                        {getLabel('Priority')} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.priority} onValueChange={handlePriorityChange}>
                        <SelectTrigger className={cn(errors.priority && "border-red-500")}>
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {PUNCHLIST_PRIORITY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <span>{option.label}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.priority && (
                        <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                {errors.priority}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    )
})