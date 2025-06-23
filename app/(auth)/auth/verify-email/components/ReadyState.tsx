import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Shield, CheckCircle } from "lucide-react"

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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <Mail className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <CardDescription className="space-y-3">
          <p>{message}</p>
          
          {/* Security notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Secure Verification</p>
                <p className="text-xs text-blue-600 mt-1">
                  Click the button below to securely verify your email address. 
                  This ensures your account is properly activated.
                </p>
              </div>
            </div>
          </div>
          
          {/* Benefits */}
          <div className="text-left space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Access your dashboard</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Receive important notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Secure your account</span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
          onClick={onVerifyEmail}
          disabled={!canVerify || isVerifying}
          size="lg"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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