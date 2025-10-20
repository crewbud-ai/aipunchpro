// ==============================================
// app/auth/complete-profile/page.tsx - Complete Profile After Google Sign-In
// ==============================================

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, User, AlertCircle, CheckCircle2, UserCog } from 'lucide-react'
import { useCompleteProfile } from '@/hooks/auth/use-complete-profile'
import { PhoneInputComponent } from '@/components/ui/phone-input'
import { TRADE_SPECIALTIES } from '@/types/team-members'
import { cn } from '@/lib/utils'

export default function CompleteProfilePage() {
  const router = useRouter()
  const {
    formData,
    errors,
    message,
    state,
    userInfo,
    isLoading,
    isSuccess,
    isError,
    updateFormData,
    clearFieldError,
    submitProfile,
  } = useCompleteProfile()

  // Redirect if no user info
  useEffect(() => {
    if (!userInfo) {
      router.push('/auth/login')
    }
  }, [userInfo, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitProfile()
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    updateFormData(field, value)
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-600 rounded-full">
              <UserCog className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Complete Your Profile
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Welcome, {userInfo.firstName}! Let's finish setting up your account
          </p>
        </div>

        {/* Form Card */}
        <Card className="w-full shadow-sm">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl text-center">Additional Information</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              {userInfo?.email && (
                <span className="block text-xs sm:text-sm text-muted-foreground break-all">
                  {userInfo.email}
                </span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Error/Success Messages */}
              {isError && message && (
                <Alert className="border-red-200 bg-red-50">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <AlertDescription className="text-sm text-red-800 flex-1 min-w-0 break-words">
                      {message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {isSuccess && message && (
                <Alert className="border-green-200 bg-green-50">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <AlertDescription className="text-sm text-green-800 flex-1 min-w-0 break-words">
                      {message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Info Alert */}
              <Alert className="border-blue-200 bg-blue-50">
                <div className="flex items-start space-x-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm text-blue-800 flex-1 min-w-0">
                    These details help us set up your account properly. All fields are optional and can be updated later.
                  </AlertDescription>
                </div>
              </Alert>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm sm:text-base">
                  Phone Number <span className="text-gray-500">(Optional)</span>
                </Label>
                <PhoneInputComponent
                  value={formData.phone || ''}
                  onChange={(value) => handleInputChange('phone', value)}
                  placeholder="Enter phone number"
                  disabled={isLoading}
                  className={cn(
                    'text-sm xs:text-base',
                    errors.phone && 'border-red-500'
                  )}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="break-words">{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Trade Specialty */}
              <div className="space-y-2">
                <Label htmlFor="tradeSpecialty" className="text-sm sm:text-base">
                  Trade Specialty <span className="text-gray-500">(Optional)</span>
                </Label>
                <Select
                  value={formData.tradeSpecialty || ''}
                  onValueChange={(value) => handleInputChange('tradeSpecialty', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className={cn(
                    'h-11 sm:h-12 text-sm xs:text-base',
                    errors.tradeSpecialty && 'border-red-500'
                  )}>
                    <SelectValue placeholder="Select your trade specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_SPECIALTIES.map((specialty) => (
                      <SelectItem key={specialty.value} value={specialty.value}>
                        {specialty.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tradeSpecialty && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="break-words">{errors.tradeSpecialty}</span>
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm sm:text-base">
                  Start Date <span className="text-gray-500">(Optional)</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  disabled={isLoading}
                  className={cn(
                    'h-11 sm:h-12 text-sm xs:text-base',
                    errors.startDate && 'border-red-500'
                  )}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="break-words">{errors.startDate}</span>
                  </p>
                )}
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-base sm:text-lg font-medium">Emergency Contact <span className="text-gray-500 text-sm font-normal">(Optional)</span></h3>

                {/* Emergency Contact Name */}
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName" className="text-sm sm:text-base">
                    Contact Name
                  </Label>
                  <Input
                    id="emergencyContactName"
                    type="text"
                    placeholder="Enter emergency contact name"
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    onFocus={() => clearFieldError('emergencyContactName')}
                    disabled={isLoading}
                    className={cn(
                      'h-11 sm:h-12 text-sm xs:text-base',
                      errors.emergencyContactName && 'border-red-500'
                    )}
                  />
                  {errors.emergencyContactName && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="break-words">{errors.emergencyContactName}</span>
                    </p>
                  )}
                </div>

                {/* Emergency Contact Phone */}
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone" className="text-sm sm:text-base">
                    Contact Phone
                  </Label>
                  <PhoneInputComponent
                    value={formData.emergencyContactPhone || ''}
                    onChange={(value) => handleInputChange('emergencyContactPhone', value)}
                    placeholder="Enter emergency contact phone"
                    disabled={isLoading}
                    className={cn(
                      'text-sm xs:text-base',
                      errors.emergencyContactPhone && 'border-red-500'
                    )}
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="break-words">{errors.emergencyContactPhone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base sm:text-lg font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing Profile...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Profile Completed!
                    </>
                  ) : (
                    'Complete Profile & Continue'
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  You can skip this and complete your profile later from settings
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}