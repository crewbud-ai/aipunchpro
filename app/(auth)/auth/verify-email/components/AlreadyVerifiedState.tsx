import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowRight } from "lucide-react"

interface AlreadyVerifiedStateProps {
  message: string
  userEmail?: string
  onGoToDashboard: () => void
  onGoToLogin: () => void
}

export const AlreadyVerifiedState = ({ 
  message, 
  userEmail, 
  onGoToDashboard, 
  onGoToLogin 
}: AlreadyVerifiedStateProps) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <CardTitle className="text-2xl">Already Verified</CardTitle>
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
        <Button 
          className="w-full bg-orange-600 hover:bg-orange-700" 
          onClick={onGoToDashboard}
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onGoToLogin}
        >
          Login to Account
        </Button>
      </CardContent>
    </Card>
  )
}