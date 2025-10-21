"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Clock
} from "lucide-react"
import { useProfile } from "@/hooks/dashboard/use-profile"
import { formatPhoneNumber } from "@/types/dashboard/profile"
import { ProfileSkeleton } from "@/components/skeletons/profile"
import { formatIndustryLabel } from "@/utils/format-functions"

export default function ProfilePage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    profileState,
    passwordState,
    profile,
    company,
    profileErrors,
    passwordErrors,
    profileFormData,
    passwordFormData,
    isLoading,
    isViewing,
    isEditing,
    isSaving,
    isError,
    isPasswordChanging,
    isPasswordSuccess,
    isPasswordError,
    hasProfileErrors,
    hasPasswordErrors,
    canSaveProfile,
    canChangePassword,
    userInitials,
    userFullName,
    userRoleDisplay,
    loadProfile,
    updateProfile,
    changePassword,
    updateProfileFormData,
    updatePasswordFormData,
    clearProfileFieldError,
    clearPasswordFieldError,
    startEditing,
    cancelEditing,
  } = useProfile()

  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProfile()
  }

  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await changePassword()
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword)
        break
      case 'new':
        setShowNewPassword(!showNewPassword)
        break
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword)
        break
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <ProfileSkeleton />
    )
  }

  // Error state
  if (isError) {
    return (
      // Error State - Responsive
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between px-2 xs:px-0">
          <h1 className="text-2xl xs:text-3xl font-bold text-gray-900">Profile</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 xs:py-10 sm:py-12 px-4 xs:px-6">
            <AlertCircle className="h-10 w-10 xs:h-12 xs:w-12 text-red-500 mb-3 xs:mb-4 flex-shrink-0" />
            <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-1.5 xs:mb-2 text-center">
              Failed to Load Profile
            </h3>
            <p className="text-sm xs:text-base text-gray-600 text-center mb-3 xs:mb-4 max-w-md leading-snug xs:leading-normal">
              {profileErrors.general || 'Unable to load your profile information.'}
            </p>
            <Button
              onClick={loadProfile}
              variant="outline"
              className="h-9 xs:h-10 text-sm xs:text-base px-4 xs:px-6"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between px-2 xs:px-0">
            <div>
              <h1 className="text-2xl xs:text-3xl font-bold text-gray-900">Profile</h1>
              <p className="mt-1 text-xs xs:text-sm text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 xs:pb-4 px-4 xs:px-5 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg xs:text-xl truncate">Personal Information</CardTitle>
                    <CardDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                  {isViewing && (
                    <Button variant="outline" size="sm" onClick={startEditing} className="h-8 xs:h-9 text-xs xs:text-sm ml-2 flex-shrink-0">
                      <Edit3 className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                      Edit
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="px-4 xs:px-5 sm:px-6">
                  {/* Profile errors */}
                  {profileErrors.general && (
                    <Alert className="mb-4 xs:mb-5 sm:mb-6 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <AlertDescription className="text-xs xs:text-sm text-red-800 leading-snug">
                        {profileErrors.general}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleProfileSubmit} className="space-y-3 xs:space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center space-x-3 xs:space-x-4 mb-4 xs:mb-5 sm:mb-6">
                      <Avatar className="h-16 w-16 xs:h-18 xs:w-18 sm:h-20 sm:w-20 flex-shrink-0">
                        <AvatarImage src="" alt={userFullName} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-base xs:text-lg">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base xs:text-lg font-medium text-gray-900 truncate">{userFullName}</h3>
                        <p className="text-xs xs:text-sm text-gray-600 truncate">{userRoleDisplay}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {profile.emailVerified ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                              Verified
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                              Unverified
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
                      {/* First Name */}
                      <div className="space-y-1.5 xs:space-y-2">
                        <Label htmlFor="firstName" className="text-sm xs:text-base">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-2.5 xs:left-3 top-2.5 xs:top-3 h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Enter first name"
                            value={isEditing ? profileFormData.firstName : profile.firstName}
                            onChange={(e) => updateProfileFormData('firstName', e.target.value)}
                            onFocus={() => clearProfileFieldError('firstName')}
                            disabled={!isEditing || isSaving}
                            className={`pl-8 xs:pl-10 h-9 xs:h-10 text-sm xs:text-base ${profileErrors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                              }`}
                            readOnly={!isEditing}
                          />
                        </div>
                        {profileErrors.firstName && (
                          <p className="text-xs xs:text-sm text-red-600 flex items-center leading-snug">
                            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                            {profileErrors.firstName}
                          </p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div className="space-y-1.5 xs:space-y-2">
                        <Label htmlFor="lastName" className="text-sm xs:text-base">Last Name</Label>
                        <div className="relative">
                          <User className="absolute left-2.5 xs:left-3 top-2.5 xs:top-3 h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Enter last name"
                            value={isEditing ? profileFormData.lastName : profile.lastName}
                            onChange={(e) => updateProfileFormData('lastName', e.target.value)}
                            onFocus={() => clearProfileFieldError('lastName')}
                            disabled={!isEditing || isSaving}
                            className={`pl-8 xs:pl-10 h-9 xs:h-10 text-sm xs:text-base ${profileErrors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                              }`}
                            readOnly={!isEditing}
                          />
                        </div>
                        {profileErrors.lastName && (
                          <p className="text-xs xs:text-sm text-red-600 flex items-center leading-snug">
                            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                            {profileErrors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 xs:space-y-2">
                      <Label htmlFor="email" className="text-sm xs:text-base">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 xs:left-3 top-2.5 xs:top-3 h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="pl-8 xs:pl-10 h-9 xs:h-10 text-sm xs:text-base bg-gray-50"
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-gray-500 leading-snug">
                        Email address cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5 xs:space-y-2">
                      <Label htmlFor="phone" className="text-sm xs:text-base">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 xs:left-3 top-2.5 xs:top-3 h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={isEditing ? profileFormData.phone : (profile.phone || '')}
                          onChange={(e) => updateProfileFormData('phone', e.target.value)}
                          onFocus={() => clearProfileFieldError('phone')}
                          disabled={!isEditing || isSaving}
                          className={`pl-8 xs:pl-10 h-9 xs:h-10 text-sm xs:text-base ${profileErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                            }`}
                          readOnly={!isEditing}
                        />
                      </div>
                      {profileErrors.phone && (
                        <p className="text-xs xs:text-sm text-red-600 flex items-center leading-snug">
                          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                          {profileErrors.phone}
                        </p>
                      )}
                      {!isEditing && !profile.phone && (
                        <p className="text-xs xs:text-sm text-gray-500">No phone number provided</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2 pt-3 xs:pt-4">
                        <Button
                          type="submit"
                          disabled={!canSaveProfile}
                          className="bg-orange-600 hover:bg-orange-700 h-9 xs:h-10 text-sm xs:text-base w-full xs:w-auto"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="h-9 xs:h-10 text-sm xs:text-base w-full xs:w-auto"
                        >
                          <X className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Change Password Card */}
              <Card className="mt-4 xs:mt-5 sm:mt-6">
                <CardHeader className="px-4 xs:px-5 sm:px-6">
                  <CardTitle className="text-lg xs:text-xl flex items-center">
                    <Lock className="h-4 w-4 xs:h-5 xs:w-5 mr-1.5 xs:mr-2 flex-shrink-0" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-4 xs:px-5 sm:px-6">
                  {/* Password success message */}
                  {isPasswordSuccess && (
                    <Alert className="mb-4 xs:mb-5 sm:mb-6 border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <AlertDescription className="text-xs xs:text-sm text-green-800 leading-snug">
                        Password changed successfully! All other sessions have been logged out for security.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Password errors */}
                  {passwordErrors.general && (
                    <Alert className="mb-4 xs:mb-5 sm:mb-6 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <AlertDescription className="text-xs xs:text-sm text-red-800 leading-snug">
                        {passwordErrors.general}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-3 xs:space-y-4">
                    {/* Current Password */}
                    <div className="space-y-1.5 xs:space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm xs:text-base">Current Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 xs:left-3 top-2.5 xs:top-3 h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          value={passwordFormData.currentPassword}
                          onChange={(e) => updatePasswordFormData('currentPassword', e.target.value)}
                          onFocus={() => clearPasswordFieldError('currentPassword')}
                          disabled={isPasswordChanging}
                          className={`pl-8 xs:pl-10 pr-9 xs:pr-10 h-9 xs:h-10 text-sm xs:text-base ${passwordErrors.currentPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                            }`}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-2.5 xs:right-3 top-2.5 xs:top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                          tabIndex={-1}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-xs xs:text-sm text-red-600 flex items-center leading-snug">
                          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5 xs:space-y-2">
                      <Label htmlFor="newPassword" className="text-sm xs:text-base">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 xs:left-3 top-2.5 xs:top-3 h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={passwordFormData.newPassword}
                          onChange={(e) => updatePasswordFormData('newPassword', e.target.value)}
                          onFocus={() => clearPasswordFieldError('newPassword')}
                          disabled={isPasswordChanging}
                          className={`pl-8 xs:pl-10 pr-9 xs:pr-10 h-9 xs:h-10 text-sm xs:text-base ${passwordErrors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                            }`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-2.5 xs:right-3 top-2.5 xs:top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                          tabIndex={-1}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-xs xs:text-sm text-red-600 flex items-center leading-snug">
                          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5 xs:space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm xs:text-base">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 xs:left-3 top-2.5 xs:top-3 h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={passwordFormData.confirmPassword}
                          onChange={(e) => updatePasswordFormData('confirmPassword', e.target.value)}
                          onFocus={() => clearPasswordFieldError('confirmPassword')}
                          disabled={isPasswordChanging}
                          className={`pl-8 xs:pl-10 pr-9 xs:pr-10 h-9 xs:h-10 text-sm xs:text-base ${passwordErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                            }`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-2.5 xs:right-3 top-2.5 xs:top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-xs xs:text-sm text-red-600 flex items-center leading-snug">
                          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 xs:p-4">
                      <h4 className="text-xs xs:text-sm font-medium text-gray-800 mb-1.5 xs:mb-2">Password Requirements:</h4>
                      <ul className="text-xs xs:text-sm text-gray-600 space-y-0.5 xs:space-y-1 list-disc list-inside leading-snug">
                        <li>At least 8 characters long</li>
                        <li>Contains uppercase and lowercase letters</li>
                        <li>Contains at least one number</li>
                        <li>Contains at least one special character</li>
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={!canChangePassword}
                      className="w-full bg-orange-600 hover:bg-orange-700 h-9 xs:h-10 text-sm xs:text-base"
                    >
                      {isPasswordChanging ? (
                        <>
                          <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-4 xs:space-y-5 sm:space-y-6">
              {/* Account Overview */}
              <Card>
                <CardHeader className="px-4 xs:px-5 sm:px-6">
                  <CardTitle className="text-base xs:text-lg">Account Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 xs:space-y-4 px-4 xs:px-5 sm:px-6">
                  <div className="flex items-center space-x-2.5 xs:space-x-3">
                    <Shield className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs xs:text-sm font-medium truncate">Account Status</p>
                      <p className="text-xs xs:text-sm text-gray-600 truncate">
                        {profile.emailVerified ? 'Verified' : 'Pending Verification'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 xs:space-x-3">
                    <Calendar className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs xs:text-sm font-medium truncate">Member Since</p>
                      <p className="text-xs xs:text-sm text-gray-600 truncate">
                        {new Date(profile.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {profile.lastLoginAt && (
                    <div className="flex items-center space-x-2.5 xs:space-x-3">
                      <Clock className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs xs:text-sm font-medium truncate">Last Login</p>
                        <p className="text-xs xs:text-sm text-gray-600 truncate">
                          {new Date(profile.lastLoginAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Info */}
              {company && (
                <Card>
                  <CardHeader className="px-4 xs:px-5 sm:px-6">
                    <CardTitle className="text-base xs:text-lg">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 xs:space-y-4 px-4 xs:px-5 sm:px-6">
                    <div className="flex items-center space-x-2.5 xs:space-x-3">
                      <Building2 className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs xs:text-sm font-medium truncate">Company</p>
                        <p className="text-xs xs:text-sm text-gray-600 truncate">{company.name}</p>
                      </div>
                    </div>

                    {company.industry && (
                      <div className="flex items-center space-x-2.5 xs:space-x-3">
                        <div className="h-4 w-4 xs:h-5 xs:w-5 flex-shrink-0" /> {/* Spacer */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs xs:text-sm font-medium truncate">Industry</p>
                          <p className="text-xs xs:text-sm text-gray-600 truncate">{formatIndustryLabel(company.industry)}</p>
                        </div>
                      </div>
                    )}

                    {company.size && (
                      <div className="flex items-center space-x-2.5 xs:space-x-3">
                        <div className="h-4 w-4 xs:h-5 xs:w-5 flex-shrink-0" /> {/* Spacer */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs xs:text-sm font-medium truncate">Company Size</p>
                          <p className="text-xs xs:text-sm text-gray-600 truncate">{company.size}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contact Info */}
              <Card>
                <CardHeader className="px-4 xs:px-5 sm:px-6">
                  <CardTitle className="text-base xs:text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 xs:space-y-4 px-4 xs:px-5 sm:px-6">
                  <div className="flex items-center space-x-2.5 xs:space-x-3">
                    <Mail className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs xs:text-sm font-medium truncate">Email</p>
                      <p className="text-xs xs:text-sm text-gray-600 truncate">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 xs:space-x-3">
                    <Phone className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs xs:text-sm font-medium truncate">Phone</p>
                      <p className="text-xs xs:text-sm text-gray-600 truncate">
                        {formatPhoneNumber(profile.phone)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}