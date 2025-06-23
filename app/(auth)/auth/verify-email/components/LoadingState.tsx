import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export const LoadingState = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
        <CardTitle className="text-2xl">Verifying Email</CardTitle>
        <CardDescription>
          Please wait while we verify your email address...
        </CardDescription>
      </CardHeader>
    </Card>
  )
}