// ==============================================
// app/(dashboard)/dashboard/ai/page.tsx - AI Assistant Page
// ==============================================

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Send, Lightbulb, FileText, Calculator, Clock, Loader2, AlertCircle } from "lucide-react"
import { aiChatApi } from "@/lib/api/ai-chat"
import type { ChatMessage } from "@/types/ai"

// ==============================================
// QUICK PROMPTS
// ==============================================
const quickPrompts = [
  "Calculate concrete needed for 50x30 foundation",
  "OSHA safety requirements for working at height",
  "How to fix electrical outlet not working",
  "Best practices for winter concrete pouring",
  "Generate daily safety briefing checklist",
  "Calculate labor hours for drywall installation",
]

// ==============================================
// COMPONENT
// ==============================================
export default function AIAssistantPage() {
  // ==============================================
  // STATE
  // ==============================================
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ==============================================
  // AUTO SCROLL TO BOTTOM
  // ==============================================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  // ==============================================
  // HANDLE SEND MESSAGE
  // ==============================================
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage("")
    setError(null)
    setIsLoading(true)

    // Add user message to chat immediately
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }

    setChatHistory(prev => [...prev, userChatMessage])

    try {
      // Send to API
      const response = await aiChatApi.sendMessage({
        message: userMessage,
        conversationId,
        includeContext: true,
      })

      // Save conversation ID for follow-up messages
      if (!conversationId && response.data.conversationId) {
        setConversationId(response.data.conversationId)
      }

      // Add AI response to chat
      const aiChatMessage: ChatMessage = {
        id: response.data.messageId,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        metadata: {
          tokensUsed: response.data.tokensUsed,
        },
      }

      setChatHistory(prev => [...prev, aiChatMessage])
    } catch (error) {
      console.error('Send message error:', error)
      setError('Failed to get AI response. Please try again.')
      
      // Remove user message on error
      setChatHistory(prev => prev.filter(msg => msg.id !== userChatMessage.id))
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-gray-600">Get instant answers to construction questions and automate routine tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Online
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-100 text-orange-600">
                    <Bot className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>CrewBud AI Assistant</CardTitle>
                  <CardDescription>Specialized in construction and skilled trades</CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Chat Messages */}
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {/* Welcome Message */}
              {chatHistory.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center max-w-md">
                    <Bot className="h-16 w-16 mx-auto text-orange-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to CrewBud AI!</h3>
                    <p className="text-gray-600 mb-4">
                      I'm here to help with construction calculations, safety standards, 
                      problem-solving, and project management questions.
                    </p>
                    <p className="text-sm text-gray-500">
                      Try one of the quick prompts below or ask me anything!
                    </p>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {chatHistory.map((chat) => (
                <div key={chat.id} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      chat.role === "user" 
                        ? "bg-orange-600 text-white" 
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{chat.content}</p>
                    <p className={`text-xs mt-1 ${
                      chat.role === "user" ? "text-orange-100" : "text-gray-500"
                    }`}>
                      {formatTime(chat.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about construction, safety, calculations, or project management..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="bg-orange-600 hover:bg-orange-700"
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
        <div className="space-y-6">
          {/* Quick Prompts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Quick Prompts
              </CardTitle>
              <CardDescription>Common questions to get you started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calculator className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Construction Calculations</p>
                  <p className="text-sm text-gray-600">Material quantities, labor hours, costs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Code & Standards</p>
                  <p className="text-sm text-gray-600">Building codes, OSHA requirements, best practices</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Problem Solving</p>
                  <p className="text-sm text-gray-600">Troubleshooting, repair guidance, solutions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Project Planning</p>
                  <p className="text-sm text-gray-600">Scheduling, resource allocation, timelines</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation Info */}
          {conversationId && (
            <Card>
              <CardHeader>
                <CardTitle>Current Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Messages</span>
                  <span className="font-medium">{chatHistory.length}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setChatHistory([])
                    setConversationId(undefined)
                    setError(null)
                  }}
                >
                  Start New Conversation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}