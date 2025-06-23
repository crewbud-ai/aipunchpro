import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"

interface SuccessStateProps {
  message: string
  userEmail?: string
  onGoToDashboard: () => void
  onGoToLogin: () => void
  canAccessDashboard: boolean
}

export const SuccessState = ({ 
  message, 
  userEmail, 
  onGoToDashboard, 
  onGoToLogin,
  canAccessDashboard 
}: SuccessStateProps) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Email Verified!</CardTitle>
        <CardDescription className="space-y-2">
          <p>{message}</p>
          {userEmail && (
            <p className="text-sm text-muted-foreground">
              Email: <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {canAccessDashboard ? (
          <Button 
            className="w-full bg-orange-600 hover:bg-orange-700" 
            onClick={onGoToDashboard}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            className="w-full bg-orange-600 hover:bg-orange-700" 
            onClick={onGoToLogin}
          >
            Continue to Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}