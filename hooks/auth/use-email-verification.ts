// ==============================================
// src/hooks/use-email-verification.ts - Professional Email Verification Hook
// ==============================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { 
  type VerificationState, 
  type VerificationResult,
  type EmailVerificationData,
  validateVerifyEmailParams,
  VERIFICATION_MESSAGES
} from '@/types/auth/verify-email'

export const useEmailVerification = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<VerificationState>('ready') // Start with 'ready' instead of 'loading'
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verificationData, setVerificationData] = useState<EmailVerificationData | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Extract token and userId from URL params
  const getParamsFromUrl = useCallback(() => {
    const token = searchParams.get('token')
    const userId = searchParams.get('userId')
    const email = searchParams.get('email') // Add this
    
    return {
      ...validateVerifyEmailParams({ 
        token, 
        ...(userId && { userId }) 
      }),
      email // Include email in return
    }
  }, [searchParams])

  // Verify email with token (now called manually)
  const verifyEmail = useCallback(async (data?: EmailVerificationData) => {
    const verifyData = data || verificationData
    if (!verifyData) return

    try {
      setIsVerifying(true)
      setState('loading')
      
      const response = await authApi.verifyEmail(verifyData)
      
      setResult(response)
      
      if (response.success) {
        if (response.data?.user.emailVerified && response.message.includes('already verified')) {
          setState('already-verified')
        } else {
          setState('success')
        }
      } else {
        setState('error')
      }
    } catch (error: any) {
      console.error('Email verification error:', error)
      
      // Handle specific error types
      if (error?.message?.includes('expired')) {
        setState('expired')
      } else if (error?.message?.includes('invalid')) {
        setState('invalid')
      } else {
        setState('error')
      }
      
      setResult({
        success: false,
        message: error?.message || 'Verification failed',
      })
    } finally {
      setIsVerifying(false)
    }
  }, [verificationData])

  // Manual verification trigger
  const handleVerifyEmail = useCallback(() => {
    verifyEmail()
  }, [verifyEmail])

  // Resend verification email
  const resendVerificationEmail = useCallback(async () => {
    // Try to get email from successful result first, then from URL params
    const email = result?.data?.user?.email || userEmail;
    
    if (!email) {
      console.error('No email available for resend')
      return
    }

    setIsResending(true)
    try {
      await authApi.resendVerification(email)
    } catch (error) {
      console.error('Resend verification error:', error)
    } finally {
      setIsResending(false)
    }
  }, [result?.data?.user?.email, userEmail])

  // Navigate to different pages
  const goToDashboard = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const goToLogin = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  const goHome = useCallback(() => {
    router.push('/')
  }, [router])

  // Validate params on component mount (but don't auto-verify)
  useEffect(() => {
    const params = getParamsFromUrl()
    
    // Check if validation was successful and we have data
    if (!params.success || !params.data) {
      setState('invalid')
      setResult({
        success: false,
        message: params.errors?.[0]?.message || 'Invalid verification link',
      })
      return
    }

    // Store verification data for manual verification
    setVerificationData({
      token: params.data.token,
      userId: params.data.userId,
    })
    
    // Store email if available from URL
    if (params.email) {
      setUserEmail(params.email)
    }
    
    // Set state to ready for user action
    setState('ready')
  }, [getParamsFromUrl])

  // Get current message based on state
  const getCurrentMessage = useCallback(() => {
    if (result?.message) {
      return result.message
    }
    return VERIFICATION_MESSAGES[state]
  }, [state, result?.message])

  // Check if user can access dashboard
  const canAccessDashboard = useCallback(() => {
    return state === 'success' || state === 'already-verified'
  }, [state])

  return {
    // State
    state,
    result,
    isVerifying,
    isResending,
    verificationData,
    
    // Computed values
    isLoading: state === 'loading',
    isReady: state === 'ready',
    isSuccess: state === 'success' || state === 'already-verified',
    isError: state === 'error' || state === 'expired' || state === 'invalid',
    canResend: state === 'expired' || state === 'error',
    canVerify: state === 'ready' && verificationData !== null,
    message: getCurrentMessage(),
    canAccessDashboard: canAccessDashboard(),
    
    // Actions
    handleVerifyEmail,
    resendVerificationEmail,
    goToDashboard,
    goToLogin,
    goHome,
  }
}