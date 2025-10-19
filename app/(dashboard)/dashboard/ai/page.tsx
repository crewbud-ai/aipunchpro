// ==============================================
// app/(dashboard)/dashboard/ai/page.tsx - AI Assistant with Hooks
// ==============================================

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Send, Lightbulb, FileText, Calculator, Clock, Loader2, AlertCircle, Sparkles } from "lucide-react"

// Import hooks (following project pattern)
import { useAIChat } from "@/hooks/ai"

// ==============================================
// QUICK PROMPTS
// ==============================================
const quickPrompts = [
  "List all active projects we're working on",
  "Show me my team members and their roles",
  "Calculate total hours worked this week",
  "What's our payroll summary for this week?",
  "Show me pending punchlist items",
  "Generate a safety briefing checklist",
]

// ==============================================
// COMPONENT
// ==============================================
export default function AIAssistantPage() {
  // ==============================================
  // HOOKS (following project pattern)
  // ==============================================
  const {
    messages,
    conversationId,
    isLoading,
    hasError,
    error,
    isEmpty,
    hasMessages,
    messageCount,
    sendMessage,
    startNewConversation,
    clearError,
  } = useAIChat()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ==============================================
  // AUTO SCROLL TO BOTTOM
  // ==============================================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // ==============================================
  // HANDLE SEND MESSAGE
  // ==============================================
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    await sendMessage(message)
    setMessage("")
  }

  // ==============================================
  // HANDLE QUICK PROMPT
  // ==============================================
  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt)
  }

  // ==============================================
  // HANDLE KEY PRESS
  // ==============================================
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ==============================================
  // FORMAT TIMESTAMP
  // ==============================================
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex sm:items-center items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl xs:text-3xl font-bold text-gray-900 flex items-center gap-1.5 xs:gap-2">
                <Sparkles className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
                <span>AI Assistant</span>
              </h1>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 xs:mt-1 leading-snug">
                Get instant answers about your projects, team, and company data
              </p>
            </div>
            <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs whitespace-nowrap">
                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-green-500 rounded-full mr-1.5 xs:mr-2 animate-pulse"></div>
                Online
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 xs:gap-5 sm:gap-6 lg:grid-cols-3">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="h-[calc(100vh-200px)] xs:h-[calc(100vh-220px)] sm:h-[calc(100vh-250px)] flex flex-col">
                <CardHeader className="border-b px-3 xs:px-4 sm:px-6 py-3 xs:py-4">
                  <div className="flex items-center gap-2 xs:gap-3">
                    <Avatar className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        <Bot className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm xs:text-base truncate">CrewBud AI</CardTitle>
                      <CardDescription className="text-xs truncate">
                        Your intelligent construction assistant
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {/* Chat Messages */}
                <CardContent className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6 space-y-3 xs:space-y-4">
                  {/* Welcome Message */}
                  {isEmpty && (
                    <div className="flex justify-center items-center h-full px-4">
                      <div className="text-center max-w-md">
                        <div className="bg-orange-100 rounded-full w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 xs:mb-4">
                          <Bot className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 text-orange-600" />
                        </div>
                        <h3 className="text-lg xs:text-xl font-semibold mb-1.5 xs:mb-2">
                          Welcome to CrewBud AI!
                        </h3>
                        <p className="text-xs xs:text-sm sm:text-base text-gray-600 mb-3 xs:mb-4 leading-snug">
                          I can help you with:
                        </p>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs xs:text-sm text-left">
                          <div className="flex items-center gap-1.5 xs:gap-2">
                            <FileText className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600 flex-shrink-0" />
                            <span>Project information</span>
                          </div>
                          <div className="flex items-center gap-1.5 xs:gap-2">
                            <Calculator className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600 flex-shrink-0" />
                            <span>Calculations</span>
                          </div>
                          <div className="flex items-center gap-1.5 xs:gap-2">
                            <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600 flex-shrink-0" />
                            <span>Time tracking</span>
                          </div>
                          <div className="flex items-center gap-1.5 xs:gap-2">
                            <Lightbulb className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600 flex-shrink-0" />
                            <span>Safety standards</span>
                          </div>
                        </div>
                        <p className="text-xs xs:text-sm text-gray-500 mt-3 xs:mt-4 leading-snug">
                          Try a quick prompt below or ask me anything!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chat Messages */}
                  {messages.map((chat) => (
                    <div
                      key={chat.id}
                      className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] xs:max-w-[85%] rounded-lg p-2.5 xs:p-3 sm:p-4 ${chat.role === "user"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-100 text-gray-900"
                          }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap m-0 text-xs xs:text-sm leading-snug xs:leading-normal">{chat.content}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 xs:mt-2 gap-2">
                          <p className={`text-xs ${chat.role === "user" ? "text-orange-100" : "text-gray-500"
                            }`}>
                            {formatTime(chat.timestamp)}
                          </p>
                          {chat.metadata?.tokensUsed && (
                            <p className={`text-xs ${chat.role === "user" ? "text-orange-200" : "text-gray-400"
                              }`}>
                              {chat.metadata.tokensUsed} tokens
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-2.5 xs:p-3 sm:p-4 max-w-[90%] xs:max-w-[85%]">
                        <div className="flex items-center gap-2 xs:gap-3">
                          <Loader2 className="h-4 w-4 xs:h-5 xs:w-5 animate-spin text-orange-600 flex-shrink-0" />
                          <div className="space-y-1.5 xs:space-y-2">
                            <div className="h-2 w-24 xs:w-32 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-2 w-20 xs:w-24 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {hasError && error && (
                    <Alert variant="destructive" className="max-w-[90%] xs:max-w-[85%]">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <AlertDescription className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 text-xs xs:text-sm">
                        <span className="leading-snug">{error}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearError}
                          className="ml-0 xs:ml-2 h-7 xs:h-8 text-xs self-start xs:self-auto"
                        >
                          Dismiss
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Message Input */}
                <div className="p-2.5 xs:p-3 sm:p-4 border-t bg-gray-50">
                  {hasMessages && (
                    <div className="text-xs text-gray-500 mb-1.5 xs:mb-2 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-0">
                      <span>{messageCount} messages in this conversation</span>
                      {conversationId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={startNewConversation}
                          className="h-6 text-xs self-start xs:self-auto"
                        >
                          New Conversation
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="flex gap-1.5 xs:gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about projects, team, hours..."
                      className="flex-1 bg-white h-9 xs:h-10 text-sm xs:text-base"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isLoading}
                      className="bg-orange-600 hover:bg-orange-700 h-9 w-9 xs:h-10 xs:w-10 p-0 flex-shrink-0"
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-3 xs:space-y-4">
              {/* Quick Prompts */}
              <Card>
                <CardHeader className="px-4 xs:px-5 sm:px-6">
                  <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base">
                    <Lightbulb className="h-4 w-4 xs:h-5 xs:w-5 text-orange-600 flex-shrink-0" />
                    Quick Prompts
                  </CardTitle>
                  <CardDescription className="text-xs leading-snug">
                    Click to use these common queries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 xs:space-y-2 px-4 xs:px-5 sm:px-6">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto p-2.5 xs:p-3 hover:bg-orange-50 hover:border-orange-200"
                      onClick={() => handleQuickPrompt(prompt)}
                      disabled={isLoading}
                    >
                      <span className="text-xs xs:text-sm line-clamp-2 leading-snug">{prompt}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Capabilities */}
              <Card>
                <CardHeader className="px-4 xs:px-5 sm:px-6">
                  <CardTitle className="text-sm xs:text-base">What I Can Help With</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 xs:space-y-4 px-4 xs:px-5 sm:px-6">
                  <div className="flex items-start gap-2 xs:gap-3">
                    <div className="bg-orange-100 rounded-lg p-1.5 xs:p-2 flex-shrink-0">
                      <FileText className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs xs:text-sm truncate">Project Data</p>
                      <p className="text-xs text-gray-600 leading-snug">
                        View projects, status, budgets, and timelines
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 xs:gap-3">
                    <div className="bg-orange-100 rounded-lg p-1.5 xs:p-2 flex-shrink-0">
                      <Calculator className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs xs:text-sm truncate">Calculations</p>
                      <p className="text-xs text-gray-600 leading-snug">
                        Materials, labor hours, and cost estimates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 xs:gap-3">
                    <div className="bg-orange-100 rounded-lg p-1.5 xs:p-2 flex-shrink-0">
                      <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs xs:text-sm truncate">Time Tracking</p>
                      <p className="text-xs text-gray-600 leading-snug">
                        Hours worked, payroll, and attendance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 xs:gap-3">
                    <div className="bg-orange-100 rounded-lg p-1.5 xs:p-2 flex-shrink-0">
                      <Lightbulb className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs xs:text-sm truncate">Safety & Compliance</p>
                      <p className="text-xs text-gray-600 leading-snug">
                        OSHA requirements and best practices
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pro Tip */}
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                <CardContent className="pt-4 xs:pt-5 sm:pt-6 px-4 xs:px-5 sm:px-6">
                  <div className="flex items-start gap-2 xs:gap-3">
                    <Sparkles className="h-4 w-4 xs:h-5 xs:w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs xs:text-sm text-gray-900 mb-0.5 xs:mb-1">
                        Pro Tip
                      </p>
                      <p className="text-xs text-gray-600 leading-snug">
                        I can access your company's real data! Ask about specific projects, team members, or time entries for accurate information.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}