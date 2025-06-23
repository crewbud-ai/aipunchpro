// ==============================================
// src/lib/api/auth.ts - Authentication API Service
// ==============================================

import { toast } from '@/hooks/use-toast'

// ==============================================
// API CLIENT CONFIGURATION
// ==============================================
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public details?: any[]
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

// ==============================================
// GENERIC API CLIENT
// ==============================================
async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    }

    try {
        const response = await fetch(url, config)
        const data = await response.json()

        if (!response.ok) {
            // Create detailed error based on response structure
            const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
            const errorDetails = data.details || []

            console.error('API Error:', {
                status: response.status,
                message: errorMessage,
                details: errorDetails,
                url,
                data
            })

            throw new ApiError(
                response.status,
                errorMessage,
                errorDetails
            )
        }

        return data
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }

        // Network or other errors
        console.error('Network Error:', error)
        throw new ApiError(
            0,
            'Network error. Please check your connection and try again.'
        )
    }
}

// ==============================================
// TYPE DEFINITIONS
// ==============================================
export interface SignupRequest {
    company: {
        name: string
        slug: string
        industry?: string
        size?: string
    }
    user: {
        firstName: string
        lastName: string
        email: string
        password: string
        phone?: string
    }
}

export interface SignupResponse {
    success: boolean
    message: string
    data: {
        company: {
            id: string
            name: string
            slug: string
            industry?: string
            size?: string
        }
        user: {
            id: string
            email: string
            firstName: string
            lastName: string
            role: string
            phone?: string
            emailVerified: boolean
        }
        session: {
            token: string
            expiresAt: string
        }
        emailSent: boolean
    }
    notifications: {
        emailVerification: string
    }
}

export interface LoginRequest {
    email: string
    password: string
    rememberMe?: boolean
}

export interface LoginResponse {
    success: boolean
    message: string
    data: {
        user: {
            id: string
            email: string
            firstName: string
            lastName: string
            role: string
            phone?: string
            emailVerified: boolean
            lastLoginAt: string
        }
        company: {
            id: string
            name: string
            slug: string
            industry?: string
            size?: string
        }
        session: {
            token: string
            expiresAt: string
            rememberMe: boolean
        }
    }
    notifications: {
        message: string
    }
}

export interface LogoutResponse {
    success: boolean
    message: string
}

export interface VerifyEmailRequest {
    token: string
    userId?: string
}

export interface ForgotPasswordRequest {
    email: string
}

export interface ForgotPasswordResponse {
    success: boolean
    message: string
    data?: {
        emailSent: boolean
        expiresAt: string
    }
    notifications?: {
        message: string
    }
    actions?: {
        resendVerification?: string
    }
}

export interface ResetPasswordRequest {
    token: string
    email: string
    newPassword: string
    confirmPassword: string
}
export interface ResetPasswordResponse {
    success: boolean
    message: string
    data?: {
        user: {
            id: string
            email: string
            firstName: string
            lastName: string
        }
        passwordReset: {
            resetAt: string
        }
        emailSent: boolean
        sessionsInvalidated: boolean
    }
    notifications?: {
        message: string
        confirmationEmailSent?: string
    }
    actions?: {
        login: string
        loginUrl: string
    }
}

export interface VerifyResetTokenRequest {
    token: string
    email?: string
}

export interface VerifyResetTokenResponse {
    success: boolean
    message: string
    data?: {
        token: string
        user: {
            id: string
            email: string
            firstName: string
            lastName: string
        }
        tokenExpiry: string
    }
    notifications?: {
        message: string
    }
    actions?: {
        resendVerification?: string
    }
}


export interface GetProfileRequest {
    // No parameters needed - gets current user's profile
}

export interface GetProfileResponse {
    success: boolean
    message: string
    data: {
        user: {
            id: string
            email: string
            firstName: string
            lastName: string
            phone?: string
            role: string
            emailVerified: boolean
            lastLoginAt?: string
            createdAt: string
            updatedAt: string
        }
        company: {
            id: string
            name: string
            slug: string
            industry?: string
            size?: string
        }
    }
}

export interface UpdateProfileRequest {
    firstName: string
    lastName: string
    phone?: string
}

export interface UpdateProfileResponse {
    success: boolean
    message: string
    data: {
        user: {
            id: string
            email: string
            firstName: string
            lastName: string
            phone?: string
            role: string
            emailVerified: boolean
            lastLoginAt?: string
            createdAt: string
            updatedAt: string
        }
    }
    notifications?: {
        message: string
    }
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

export interface ChangePasswordResponse {
    success: boolean
    message: string
    data?: {
        passwordChanged: boolean
        changedAt: string
    }
    notifications?: {
        message: string
    }
}



// ==============================================
// AUTHENTICATION API METHODS
// ==============================================
export const authApi = {
    // Signup
    async signup(data: SignupRequest): Promise<SignupResponse> {
        try {
            console.log('Attempting signup with data:', data)

            const response = await apiCall<SignupResponse>('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            console.log('Signup successful:', response)

            // Show success toast
            toast({
                title: '🎉 Account Created Successfully!',
                description: response.notifications.emailVerification,
            })

            return response
        } catch (error) {
            console.error('Signup failed:', error)

            if (error instanceof ApiError) {
                // Handle validation errors
                if (error.details && error.details.length > 0) {
                    // Show each validation error separately for better readability
                    error.details.forEach(detail => {
                        const fieldName = detail.field.replace(/^(company|user)\./, '').charAt(0).toUpperCase() + detail.field.replace(/^(company|user)\./, '').slice(1)
                        toast({
                            title: 'Validation Error',
                            description: `${fieldName}: ${detail.message}`,
                            variant: 'destructive',
                        })
                    })
                } else {
                    // Handle specific error cases
                    if (error.status === 409) {
                        toast({
                            title: 'Account Already Exists',
                            description: error.message,
                            variant: 'destructive',
                        })
                    } else {
                        toast({
                            title: 'Signup Failed',
                            description: error.message,
                            variant: 'destructive',
                        })
                    }
                }
            } else {
                toast({
                    title: 'Signup Failed',
                    description: 'Something went wrong. Please try again.',
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    // Login
    async login(data: LoginRequest): Promise<LoginResponse> {
        try {
            const response = await apiCall<LoginResponse>('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: 'Welcome Back!',
                description: response.notifications.message,
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: 'Login Failed',
                    description: error.message,
                    variant: 'destructive',
                })
            } else {
                toast({
                    title: 'Login Failed',
                    description: 'Something went wrong. Please try again.',
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    async logout(): Promise<LogoutResponse> {
        try {
            const response = await apiCall<LogoutResponse>('/api/auth/logout', {
                method: 'POST',
            })

            // Show success toast
            toast({
                title: 'Signed Out Successfully',
                description: 'You have been logged out of your account.',
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: 'Logout Error',
                    description: error.message,
                    variant: 'destructive',
                })
            } else {
                toast({
                    title: 'Logout Error',
                    description: 'Something went wrong during logout.',
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    // Verify Email
    async verifyEmail(data: VerifyEmailRequest): Promise<any> {
        try {
            const response = await apiCall('/api/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            toast({
                title: '✅ Email Verified!',
                description: 'Your email has been verified successfully.',
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: 'Verification Failed',
                    description: error.message,
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    // Forgot Password
    async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
        try {
            const response = await apiCall<ForgotPasswordResponse>('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: '📧 Reset Email Sent',
                description: response.notifications?.message || 'Please check your email for password reset instructions.',
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                // Handle specific error cases
                if (error.status === 429) {
                    toast({
                        title: 'Too Many Requests',
                        description: 'You\'ve requested too many password resets. Please wait before trying again.',
                        variant: 'destructive',
                    })
                } else if (error.message.includes('Email not verified')) {
                    toast({
                        title: 'Email Not Verified',
                        description: 'Please verify your email address before requesting a password reset.',
                        variant: 'destructive',
                    })
                } else {
                    toast({
                        title: 'Reset Request Failed',
                        description: error.message,
                        variant: 'destructive',
                    })
                }
            } else {
                toast({
                    title: 'Reset Request Failed',
                    description: 'Something went wrong. Please try again.',
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    // Verify Reset Password Token
    async verifyResetToken(data: VerifyResetTokenRequest): Promise<VerifyResetTokenResponse> {
        try {
            const response = await apiCall<VerifyResetTokenResponse>('/api/auth/verify-reset-token', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            // Show success toast for valid token
            if (response.success) {
                toast({
                    title: '✅ Valid Reset Link',
                    description: 'You can now set your new password.',
                })
            }

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                // Handle specific error cases
                if (error.message.includes('expired')) {
                    toast({
                        title: 'Link Expired',
                        description: 'This password reset link has expired. Please request a new one.',
                        variant: 'destructive',
                    })
                } else if (error.message.includes('invalid')) {
                    toast({
                        title: 'Invalid Link',
                        description: 'This password reset link is invalid or has been used.',
                        variant: 'destructive',
                    })
                } else {
                    toast({
                        title: 'Verification Failed',
                        description: error.message,
                        variant: 'destructive',
                    })
                }
            } else {
                toast({
                    title: 'Verification Failed',
                    description: 'Unable to verify reset link. Please try again.',
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    // Reset Password
    async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
        try {
            // Create API payload without confirmPassword
            const apiPayload: ResetPasswordRequest = {
                token: data.token,
                email: data.email,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword
            }

            const response = await apiCall<ResetPasswordResponse>('/api/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify(apiPayload),
            })

            // Show success toast
            toast({
                title: '🎉 Password Reset!',
                description: response.notifications?.message || 'Your password has been successfully updated.',
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                // Handle specific error cases
                if (error.message.includes('expired') || error.message.includes('invalid')) {
                    toast({
                        title: 'Reset Failed',
                        description: 'The password reset link is invalid or has expired.',
                        variant: 'destructive',
                    })
                } else if (error.message.includes('mismatch')) {
                    toast({
                        title: 'Email Mismatch',
                        description: 'The email address does not match the reset token.',
                        variant: 'destructive',
                    })
                } else if (error.message.includes('Password')) {
                    toast({
                        title: 'Invalid Password',
                        description: error.message,
                        variant: 'destructive',
                    })
                } else {
                    toast({
                        title: 'Password Reset Failed',
                        description: error.message,
                        variant: 'destructive',
                    })
                }
            } else {
                toast({
                    title: 'Password Reset Failed',
                    description: 'Something went wrong while resetting your password. Please try again.',
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    // Resend Verification
    async resendVerification(email: string): Promise<any> {
        try {
            const response = await apiCall('/api/auth/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email }),
            })

            toast({
                title: '📧 Verification Email Sent',
                description: 'Please check your email for the verification link.',
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: 'Failed to Send Email',
                    description: error.message,
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    // Get Single User Data
    async getProfile(): Promise<GetProfileResponse> {
        try {
            const response = await apiCall<GetProfileResponse>('/api/user/profile', {
                method: 'GET',
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: 'Failed to Load Profile',
                    description: error.message,
                    variant: 'destructive',
                })
            } else {
                toast({
                    title: 'Failed to Load Profile',
                    description: 'Something went wrong while loading your profile.',
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    // Update Profile - Update user's profile information
    async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
        try {
            const response = await apiCall<UpdateProfileResponse>('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: '✅ Profile Updated',
                description: response.notifications?.message || 'Your profile has been updated successfully.',
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                // Handle validation errors
                if (error.details && error.details.length > 0) {
                    error.details.forEach(detail => {
                        const fieldName = detail.field.charAt(0).toUpperCase() + detail.field.slice(1)
                        toast({
                            title: 'Validation Error',
                            description: `${fieldName}: ${detail.message}`,
                            variant: 'destructive',
                        })
                    })
                } else {
                    toast({
                        title: 'Update Failed',
                        description: error.message,
                        variant: 'destructive',
                    })
                }
            } else {
                toast({
                    title: 'Update Failed',
                    description: 'Something went wrong while updating your profile.',
                    variant: 'destructive',
                })
            }
            throw error
        }
    },

    // Change Password - Update user's password
    async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
        try {
            const response = await apiCall<ChangePasswordResponse>('/api/user/change-password', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: '🔐 Password Changed',
                description: response.notifications?.message || 'Your password has been changed successfully.',
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                // Handle specific error cases
                if (error.message.includes('current password') || error.message.includes('incorrect')) {
                    toast({
                        title: 'Incorrect Password',
                        description: 'The current password you entered is incorrect.',
                        variant: 'destructive',
                    })
                } else if (error.message.includes('Password')) {
                    toast({
                        title: 'Invalid Password',
                        description: error.message,
                        variant: 'destructive',
                    })
                } else {
                    toast({
                        title: 'Password Change Failed',
                        description: error.message,
                        variant: 'destructive',
                    })
                }
            } else {
                toast({
                    title: 'Password Change Failed',
                    description: 'Something went wrong while changing your password.',
                    variant: 'destructive',
                })
            }
            throw error
        }
    },


}

// ==============================================
// SESSION MANAGEMENT
// ==============================================
export const sessionManager = {
    setSession(token: string, expiresAt: string) {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_expires', expiresAt)
    },

    getSession() {
        const token = localStorage.getItem('auth_token')
        const expiresAt = localStorage.getItem('auth_expires')

        if (!token || !expiresAt) return null

        // Check if token is expired
        if (new Date(expiresAt) < new Date()) {
            this.clearSession()
            return null
        }

        return { token, expiresAt }
    },

    clearSession() {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_expires')
    },

    isAuthenticated(): boolean {
        return this.getSession() !== null
    },
}

// ==============================================
// EXPORTS
// ==============================================
export { ApiError }
export default authApi