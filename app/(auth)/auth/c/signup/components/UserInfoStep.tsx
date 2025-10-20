"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInputComponent } from "@/components/ui/phone-input"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { type SignupFormData } from "@/types/auth/signup"

interface UserInfoStepProps {
  formData: SignupFormData
  errors: Record<string, string>
  isLoading: boolean
  showPassword: boolean
  showConfirmPassword: boolean
  onInputChange: (field: keyof SignupFormData, value: string) => void
  onSubmit: () => void
  onBack: () => void
  onTogglePassword: () => void
  onToggleConfirmPassword: () => void
}

export const UserInfoStep = ({ 
  formData, 
  errors, 
  isLoading,
  showPassword,
  showConfirmPassword,
  onInputChange, 
  onSubmit, 
  onBack,
  onTogglePassword,
  onToggleConfirmPassword
}: UserInfoStepProps) => {
  return (
    <>
      {/* Name Fields - Mobile Optimized with Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm sm:text-base">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onInputChange("firstName", e.target.value)}
            placeholder="John"
            className={`h-11 sm:h-12 text-base ${errors.firstName ? "border-red-500" : ""}`}
          />
          {errors.firstName && (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="break-words">{errors.firstName}</span>
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm sm:text-base">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onInputChange("lastName", e.target.value)}
            placeholder="Doe"
            className={`h-11 sm:h-12 text-base ${errors.lastName ? "border-red-500" : ""}`}
          />
          {errors.lastName && (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="break-words">{errors.lastName}</span>
            </p>
          )}
        </div>
      </div>
      
      {/* Email Field - Mobile Optimized */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm sm:text-base">
          Work Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange("email", e.target.value)}
          placeholder="john@company.com"
          className={`h-11 sm:h-12 text-base ${errors.email ? "border-red-500" : ""}`}
        />
        {errors.email && (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="break-words">{errors.email}</span>
          </p>
        )}
      </div>
      
      {/* Password Field - Mobile Optimized */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm sm:text-base">
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => onInputChange("password", e.target.value)}
            placeholder="Create a strong password"
            className={`pr-10 h-11 sm:h-12 text-base ${errors.password ? "border-red-500" : ""}`}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center p-1"
            onClick={onTogglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="break-words">{errors.password}</span>
          </p>
        )}
      </div>
      
      {/* Confirm Password Field - Mobile Optimized */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm sm:text-base">
          Confirm Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => onInputChange("confirmPassword", e.target.value)}
            placeholder="Re-enter your password"
            className={`pr-10 h-11 sm:h-12 text-base ${errors.confirmPassword ? "border-red-500" : ""}`}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center p-1"
            onClick={onToggleConfirmPassword}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="break-words">{errors.confirmPassword}</span>
          </p>
        )}
      </div>

      {/* Password Requirements - Mobile Optimized */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Password must contain:</h4>
        <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>At least 8 characters</li>
          <li>One uppercase & one lowercase letter</li>
          <li>At least one number</li>
          <li>At least one special character</li>
        </ul>
      </div>
      
      {/* Phone Field - Mobile Optimized */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm sm:text-base">
          Phone Number (Optional)
        </Label>
        <PhoneInputComponent
          value={formData.phone}
          onChange={(value) => onInputChange("phone", value || "")}
          placeholder="(555) 123-4567"
          error={!!errors.phone}
          className={`h-11 sm:h-12 text-base ${errors.phone ? "border-red-500" : ""}`}
        />
        {errors.phone && (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="break-words">{errors.phone}</span>
          </p>
        )}
      </div>
      
      {/* Action Buttons - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          className="w-full sm:flex-1 h-11 sm:h-12 text-base order-2 sm:order-1" 
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button 
          type="button" 
          className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base order-1 sm:order-2" 
          disabled={isLoading}
          onClick={onSubmit}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </div>
    </>
  )
}