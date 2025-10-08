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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-orange-600" />
            AI Assistant
          </h1>
          <p className="text-gray-600 mt-1">
            Get instant answers about your projects, team, and company data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Online
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-250px)] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-100 text-orange-600">
                    <Bot className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>CrewBud AI</CardTitle>
                  <CardDescription>
                    Your intelligent construction assistant
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Chat Messages */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Welcome Message */}
              {isEmpty && (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center max-w-md">
                    <div className="bg-orange-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-10 w-10 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Welcome to CrewBud AI!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      I can help you with:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-left">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        <span>Project information</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-orange-600" />
                        <span>Calculations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span>Time tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-orange-600" />
                        <span>Safety standards</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
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
                    className={`max-w-[85%] rounded-lg p-4 ${
                      chat.role === "user" 
                        ? "bg-orange-600 text-white" 
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap m-0">{chat.content}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${
                        chat.role === "user" ? "text-orange-100" : "text-gray-500"
                      }`}>
                        {formatTime(chat.timestamp)}
                      </p>
                      {chat.metadata?.tokensUsed && (
                        <p className={`text-xs ${
                          chat.role === "user" ? "text-orange-200" : "text-gray-400"
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
                  <div className="bg-gray-100 rounded-lg p-4 max-w-[85%]">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                      <div className="space-y-2">
                        <div className="h-2 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-2 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {hasError && error && (
                <Alert variant="destructive" className="max-w-[85%]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                      className="ml-2"
                    >
                      Dismiss
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t bg-gray-50">
              {hasMessages && (
                <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
                  <span>{messageCount} messages in this conversation</span>
                  {conversationId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startNewConversation}
                      className="h-6 text-xs"
                    >
                      New Conversation
                    </Button>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about projects, team, hours, safety, or anything..."
                  className="flex-1 bg-white"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Prompts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-orange-600" />
                Quick Prompts
              </CardTitle>
              <CardDescription className="text-xs">
                Click to use these common queries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto p-3 hover:bg-orange-50 hover:border-orange-200"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isLoading}
                >
                  <span className="text-sm line-clamp-2">{prompt}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What I Can Help With</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 rounded-lg p-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Project Data</p>
                  <p className="text-xs text-gray-600">
                    View projects, status, budgets, and timelines
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 rounded-lg p-2">
                  <Calculator className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Calculations</p>
                  <p className="text-xs text-gray-600">
                    Materials, labor hours, and cost estimates
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 rounded-lg p-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Time Tracking</p>
                  <p className="text-xs text-gray-600">
                    Hours worked, payroll, and attendance
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 rounded-lg p-2">
                  <Lightbulb className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Safety & Compliance</p>
                  <p className="text-xs text-gray-600">
                    OSHA requirements and best practices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pro Tip */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-900 mb-1">
                    Pro Tip
                  </p>
                  <p className="text-xs text-gray-600">
                    I can access your company's real data! Ask about specific projects, team members, or time entries for accurate information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}