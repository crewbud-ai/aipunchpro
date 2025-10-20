"use client"

import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Mail } from "lucide-react"

interface SuccessStepProps {
  email: string
  onGoToDashboard: () => void
  onResendVerification: () => void
}

export const SuccessStep = ({ email, onGoToDashboard, onResendVerification }: SuccessStepProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Logo Header - Mobile Optimized */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
            <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
        </div>

        {/* Success Card - Mobile Optimized */}
        <Card className="w-full shadow-sm">
          <CardHeader className="text-center px-4 sm:px-6 pt-6">
            {/* Success Icon */}
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
            </div>
            
            {/* Title */}
            <CardTitle className="text-xl sm:text-2xl mb-2">
              Welcome to CrewBudAI!
            </CardTitle>
            
            {/* Description */}
            <CardDescription className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base">
                Your account has been created successfully!
              </p>
              
              {/* Email Verification Alert - Mobile Optimized */}
              <div className="bg-amber-50 p-3 sm:p-4 rounded-lg border border-amber-200 text-left">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm sm:text-base text-amber-800 flex-1 min-w-0">
                    <p className="font-medium mb-1">Verify your email</p>
                    <p className="break-words">
                      We've sent a verification email to{" "}
                      <span className="font-medium break-all">{email}</span>. 
                      Please check your inbox and click the verification link to activate your account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info - Mobile Optimized */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 text-left">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs sm:text-sm text-blue-800 flex-1 min-w-0">
                    <p className="font-medium mb-1">Check your spam folder</p>
                    <p>
                      If you don't see the email in your inbox, please check your spam or junk folder.
                    </p>
                  </div>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          
          {/* Action Buttons - Mobile Optimized */}
          <CardContent className="space-y-3 px-4 sm:px-6 pb-6">
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base" 
              onClick={onGoToDashboard}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-11 sm:h-12 text-base"
              onClick={onResendVerification}
            >
              <Mail className="mr-2 h-4 w-4" />
              Resend Verification Email
            </Button>
          </CardContent>
        </Card>

        {/* Footer - Mobile Optimized */}
        <div className="text-center px-4">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <Link href="/contact" className="font-medium text-orange-600 hover:text-orange-500">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}