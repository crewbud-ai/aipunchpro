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
    <Card className="w-full max-w-md mx-auto shadow-sm">
      <CardHeader className="text-center px-4 sm:px-6">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
        </div>
        <CardTitle className="text-xl sm:text-2xl">Already Verified</CardTitle>
        <CardDescription className="space-y-2 text-sm sm:text-base">
          <p className="break-words">{message}</p>
          {userEmail && (
            <p className="text-xs sm:text-sm text-muted-foreground break-all">
              Email: <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6 pb-6">
        <Button
          className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base"
          onClick={onGoToDashboard}
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 sm:h-12 text-base"
          onClick={onGoToLogin}
        >
          Login to Account
        </Button>
      </CardContent>
    </Card>
  )
}