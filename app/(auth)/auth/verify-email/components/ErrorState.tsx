import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home, Mail } from "lucide-react"

interface ErrorStateProps {
  message: string
  canResend: boolean
  isResending: boolean
  onResendEmail: () => void
  onGoHome: () => void
  onGoToLogin: () => void
}

export const ErrorState = ({ 
  message, 
  canResend, 
  isResending, 
  onResendEmail, 
  onGoHome,
  onGoToLogin 
}: ErrorStateProps) => {
  return (
    <Card className="w-full max-w-md mx-auto shadow-sm">
      <CardHeader className="text-center px-4 sm:px-6">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
        </div>
        <CardTitle className="text-xl sm:text-2xl">Verification Failed</CardTitle>
        <CardDescription className="text-sm sm:text-base break-words">
          {message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6 pb-6">
        {canResend && (
          <Button 
            variant="outline" 
            className="w-full h-11 sm:h-12 text-base"
            onClick={onResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <Button 
            variant="outline" 
            className="w-full sm:flex-1 h-11 sm:h-12 text-base"
            onClick={onGoToLogin}
          >
            Login
          </Button>
          <Button 
            variant="outline" 
            className="w-full sm:flex-1 h-11 sm:h-12 text-base"
            onClick={onGoHome}
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}