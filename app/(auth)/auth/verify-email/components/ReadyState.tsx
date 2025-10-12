import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Shield, CheckCircle, Loader2 } from "lucide-react"

interface ReadyStateProps {
  message: string
  onVerifyEmail: () => void
  isVerifying: boolean
  canVerify: boolean
}

export const ReadyState = ({
  message,
  onVerifyEmail,
  isVerifying,
  canVerify
}: ReadyStateProps) => {
  return (
    <Card className="w-full max-w-md mx-auto shadow-sm">
      <CardHeader className="text-center px-4 sm:px-6">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-orange-100">
          <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
        </div>
        <CardTitle className="text-xl sm:text-2xl">Verify Your Email</CardTitle>
        <CardDescription className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base break-words">{message}</p>

          {/* Security notice - Mobile Optimized */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-left">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-blue-800 flex-1 min-w-0">
                <p className="font-medium">Secure Verification</p>
                <p className="text-xs text-blue-600 mt-1">
                  Click the button below to securely verify your email address.
                  This ensures your account is properly activated.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits - Mobile Optimized */}
          <div className="text-left space-y-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Access your dashboard</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Receive important notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Secure your account</span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <Button
          className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
          onClick={onVerifyEmail}
          disabled={!canVerify || isVerifying}
          size="lg"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Verify My Email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}