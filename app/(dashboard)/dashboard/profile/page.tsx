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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Profile</h3>
            <p className="text-gray-600 text-center mb-4">
              {profileErrors.general || 'Unable to load your profile information.'}
            </p>
            <Button onClick={loadProfile} variant="outline">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl">Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </div>
              {isViewing && (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            
            <CardContent>
              {/* Profile errors */}
              {profileErrors.general && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {profileErrors.general}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" alt={userFullName} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-lg">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{userFullName}</h3>
                    <p className="text-sm text-gray-600">{userRoleDisplay}</p>
                    <Badge variant="secondary" className="mt-1">
                      {profile.emailVerified ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter first name"
                        value={isEditing ? profileFormData.firstName : profile.firstName}
                        onChange={(e) => updateProfileFormData('firstName', e.target.value)}
                        onFocus={() => clearProfileFieldError('firstName')}
                        disabled={!isEditing || isSaving}
                        className={`pl-10 ${
                          profileErrors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                        readOnly={!isEditing}
                      />
                    </div>
                    {profileErrors.firstName && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {profileErrors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter last name"
                        value={isEditing ? profileFormData.lastName : profile.lastName}
                        onChange={(e) => updateProfileFormData('lastName', e.target.value)}
                        onFocus={() => clearProfileFieldError('lastName')}
                        disabled={!isEditing || isSaving}
                        className={`pl-10 ${
                          profileErrors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                        readOnly={!isEditing}
                      />
                    </div>
                    {profileErrors.lastName && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {profileErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="pl-10 bg-gray-50"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Email address cannot be changed. Contact support if needed.
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={isEditing ? profileFormData.phone : (profile.phone || '')}
                      onChange={(e) => updateProfileFormData('phone', e.target.value)}
                      onFocus={() => clearProfileFieldError('phone')}
                      disabled={!isEditing || isSaving}
                      className={`pl-10 ${
                        profileErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                      }`}
                      readOnly={!isEditing}
                    />
                  </div>
                  {profileErrors.phone && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {profileErrors.phone}
                    </p>
                  )}
                  {!isEditing && !profile.phone && (
                    <p className="text-sm text-gray-500">No phone number provided</p>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-2 pt-4">
                    <Button
                      type="submit"
                      disabled={!canSaveProfile}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Password success message */}
              {isPasswordSuccess && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Password changed successfully! All other sessions have been logged out for security.
                  </AlertDescription>
                </Alert>
              )}

              {/* Password errors */}
              {passwordErrors.general && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {passwordErrors.general}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordFormData.currentPassword}
                      onChange={(e) => updatePasswordFormData('currentPassword', e.target.value)}
                      onFocus={() => clearPasswordFieldError('currentPassword')}
                      disabled={isPasswordChanging}
                      className={`pl-10 pr-10 ${
                        passwordErrors.currentPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                      }`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordFormData.newPassword}
                      onChange={(e) => updatePasswordFormData('newPassword', e.target.value)}
                      onFocus={() => clearPasswordFieldError('newPassword')}
                      disabled={isPasswordChanging}
                      className={`pl-10 pr-10 ${
                        passwordErrors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordFormData.confirmPassword}
                      onChange={(e) => updatePasswordFormData('confirmPassword', e.target.value)}
                      onFocus={() => clearPasswordFieldError('confirmPassword')}
                      disabled={isPasswordChanging}
                      className={`pl-10 pr-10 ${
                        passwordErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
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
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isPasswordChanging ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-sm text-gray-600">
                    {profile.emailVerified ? 'Verified' : 'Pending Verification'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-gray-600">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {profile.lastLoginAt && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-gray-600">
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
              <CardHeader>
                <CardTitle className="text-lg">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-gray-600">{company.name}</p>
                  </div>
                </div>

                {company.industry && (
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5" /> {/* Spacer */}
                    <div>
                      <p className="text-sm font-medium">Industry</p>
                      <p className="text-sm text-gray-600">{company.industry}</p>
                    </div>
                  </div>
                )}

                {company.size && (
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5" /> {/* Spacer */}
                    <div>
                      <p className="text-sm font-medium">Company Size</p>
                      <p className="text-sm text-gray-600">{company.size}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-gray-600">
                    {formatPhoneNumber(profile.phone)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}