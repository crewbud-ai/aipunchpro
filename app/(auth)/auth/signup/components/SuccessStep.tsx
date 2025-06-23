// ==============================================
// src/components/auth/signup/SuccessStep.tsx - Step 3 Component
// ==============================================

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle } from "lucide-react"

interface SuccessStepProps {
  email: string
  onGoToDashboard: () => void
  onResendVerification: () => void
}

export const SuccessStep = ({ email, onGoToDashboard, onResendVerification }: SuccessStepProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to CrewBudAI!</CardTitle>
          <CardDescription className="space-y-2">
            <p>Your account has been created successfully!</p>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Verify your email</p>
                  <p>We've sent a verification email to <span className="font-medium">{email}</span>. Please check your inbox and click the verification link to activate your account.</p>
                </div>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full bg-orange-600 hover:bg-orange-700" 
            onClick={onGoToDashboard}
          >
            Go to Dashboard
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onResendVerification}
          >
            Resend Verification Email
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}