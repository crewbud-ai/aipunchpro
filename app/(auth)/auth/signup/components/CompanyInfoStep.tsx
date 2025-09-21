// ==============================================
// src/components/auth/signup/CompanyInfoStep.tsx - Step 1 Component
// ==============================================
"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
      <div>
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => onInputChange("companyName", e.target.value)}
          placeholder="ABC Construction Co."
          className={errors.companyName ? "border-red-500" : ""}
        />
        {errors.companyName && (
          <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="companySlug">Company URL *</Label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            crewbudai.com/
          </span>
          <Input
            id="companySlug"
            value={formData.companySlug}
            disabled
            onChange={(e) => onInputChange("companySlug", e.target.value)}
            className={`rounded-l-none !opacity-100 text-gray-500 ${errors.companySlug ? "border-red-500" : ""}`}
            placeholder="abc-construction"
          />
        </div>
        {errors.companySlug && (
          <p className="text-sm text-red-600 mt-1">{errors.companySlug}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="industry">Industry</Label>
        <Select value={formData.industry} onValueChange={(value) => onInputChange("industry", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {industryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="companySize">Company Size</Label>
        <Select value={formData.companySize} onValueChange={(value) => onInputChange("companySize", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select company size" />
          </SelectTrigger>
          <SelectContent>
            {companySizeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        type="button" 
        className="w-full bg-orange-600 hover:bg-orange-700" 
        onClick={onNext}
      >
        Continue
      </Button>
    </>
  )
}