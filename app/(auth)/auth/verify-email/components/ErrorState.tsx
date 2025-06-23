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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-2xl">Verification Failed</CardTitle>
        <CardDescription>
          {message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {canResend && (
          <Button 
            variant="outline" 
            className="w-full"
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
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onGoToLogin}
          >
            Login
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
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