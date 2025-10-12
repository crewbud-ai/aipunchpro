"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { type SignupFormData, industryOptions, companySizeOptions } from "@/types/auth/signup"

interface CompanyInfoStepProps {
  formData: SignupFormData
  errors: Record<string, string>
  onInputChange: (field: keyof SignupFormData, value: string) => void
  onNext: () => void
}

export const CompanyInfoStep = ({ formData, errors, onInputChange, onNext }: CompanyInfoStepProps) => {
  return (
    <>
      {/* Company Name - Mobile Optimized */}
      <div className="space-y-2">
        <Label htmlFor="companyName" className="text-sm sm:text-base">
          Company Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => onInputChange("companyName", e.target.value)}
          placeholder="ABC Construction Co."
          className={`h-11 sm:h-12 text-base ${errors.companyName ? "border-red-500" : ""}`}
        />
        {errors.companyName && (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="break-words">{errors.companyName}</span>
          </p>
        )}
      </div>
      
      {/* Company URL - Mobile Optimized */}
      <div className="space-y-2">
        <Label htmlFor="companySlug" className="text-sm sm:text-base">
          Company URL <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-stretch">
          <span className="inline-flex items-center px-2 sm:px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm whitespace-nowrap">
            crewbudai.com/
          </span>
          <Input
            id="companySlug"
            value={formData.companySlug}
            disabled
            onChange={(e) => onInputChange("companySlug", e.target.value)}
            className={`rounded-l-none !opacity-100 text-gray-500 h-11 sm:h-12 text-base flex-1 min-w-0 ${
              errors.companySlug ? "border-red-500" : ""
            }`}
          />
        </div>
        {errors.companySlug && (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="break-words">{errors.companySlug}</span>
          </p>
        )}
        <p className="text-xs sm:text-sm text-gray-500">
          This will be your unique company URL
        </p>
      </div>
      
      {/* Industry - Mobile Optimized */}
      <div className="space-y-2">
        <Label htmlFor="industry" className="text-sm sm:text-base">
          Industry (Optional)
        </Label>
        <Select 
          value={formData.industry} 
          onValueChange={(value) => onInputChange("industry", value)}
        >
          <SelectTrigger className="h-11 sm:h-12 text-base">
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {industryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Company Size - Mobile Optimized */}
      <div className="space-y-2">
        <Label htmlFor="companySize" className="text-sm sm:text-base">
          Company Size (Optional)
        </Label>
        <Select 
          value={formData.companySize} 
          onValueChange={(value) => onInputChange("companySize", value)}
        >
          <SelectTrigger className="h-11 sm:h-12 text-base">
            <SelectValue placeholder="Select company size" />
          </SelectTrigger>
          <SelectContent>
            {companySizeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Next Button - Mobile Optimized */}
      <Button 
        type="button" 
        className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base"
        onClick={onNext}
      >
        Continue
      </Button>
    </>
  )
}