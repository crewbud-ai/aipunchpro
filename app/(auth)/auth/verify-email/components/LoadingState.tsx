import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Loader2
} from "lucide-react"

// ===================================================================
// Loading State Component - Mobile Optimized
// ===================================================================
export const LoadingState = () => {
  return (
    <Card className="w-full max-w-md mx-auto shadow-sm">
      <CardHeader className="text-center px-4 sm:px-6">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100">
          <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 animate-spin" />
        </div>
        <CardTitle className="text-xl sm:text-2xl">Verifying Email</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Please wait while we verify your email address...
        </CardDescription>
      </CardHeader>
    </Card>
  )
}