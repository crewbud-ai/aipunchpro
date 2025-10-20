// ==============================================
// hooks/auth/use-google-auth-errors.ts
// Hook to handle Google OAuth errors in login page
// ==============================================

import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { getGoogleAuthError } from '@/utils/google-auth-errors'

export const useGoogleAuthErrors = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasShownError = useRef(false)

  useEffect(() => {
    // Only run once when component mounts
    if (hasShownError.current) return

    const error = searchParams.get('error')
    
    if (error) {
      // Mark that we've shown this error
      hasShownError.current = true

      // Get the professional error message
      const errorConfig = getGoogleAuthError(error)
      
      // Small delay to ensure page is fully loaded before showing toast
      setTimeout(() => {
        toast({
          title: errorConfig.title,
          description: errorConfig.description,
          variant: errorConfig.variant,
          duration: 6000, // Show for 6 seconds
        })
      }, 100)

      // Clean up URL after a longer delay to ensure toast is shown first
      setTimeout(() => {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('error')
        router.replace(newUrl.pathname + newUrl.search, { scroll: false })
      }, 500)
    }
  }, [searchParams, router])
}