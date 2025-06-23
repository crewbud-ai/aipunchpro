"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, Lightbulb, FileText, Calculator, Clock } from "lucide-react"

const quickPrompts = [
  "Calculate concrete needed for 50x30 foundation",
  "OSHA safety requirements for working at height",
  "How to fix electrical outlet not working",
  "Best practices for winter concrete pouring",
  "Generate daily safety briefing checklist",
  "Calculate labor hours for drywall installation",
]

const chatHistory = [
  {
    id: 1,
    type: "user",
    message: "What's the standard spacing for electrical outlets in commercial buildings?",
    timestamp: "10:30 AM",
  },
  {
    id: 2,
    type: "ai",
    message:
      "For commercial buildings, electrical outlets should typically be spaced no more than 12 feet apart along walls, with at least one outlet on each wall that's 3 feet or longer. Key requirements include:\n\n• Maximum 12-foot spacing between outlets\n• GFCI protection in wet locations\n• Dedicated circuits for high-power equipment\n• Emergency power outlets where required\n\nWould you like me to provide specific code references or help calculate outlet requirements for your project?",
    timestamp: "10:31 AM",
  },
  {
    id: 3,
    type: "user",
    message: "Yes, please calculate outlets needed for a 40x60 office space",
    timestamp: "10:32 AM",
  },
  {
    id: 4,
    type: "ai",
    message:
      "For a 40x60 office space (2,400 sq ft), here's the outlet calculation:\n\n**Wall Outlets:**\n• Perimeter: 200 linear feet\n• Required outlets: ~17 outlets (12-foot spacing)\n• Recommended: 20-24 outlets for flexibility\n\n**Floor Outlets:**\n• Open office areas: 4-6 floor outlets\n• Conference areas: 2-4 additional outlets\n\n**Special Circuits:**\n• HVAC equipment: 2 dedicated circuits\n• IT/Server equipment: 2-4 dedicated circuits\n• Kitchen/break room: 4-6 GFCI outlets\n\n**Total Recommendation:** 30-40 outlets with 8-12 circuits\n\nWould you like me to break this down by room or provide wire gauge recommendations?",
    timestamp: "10:33 AM",
  },
]

export default function AIAssistantPage() {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    // Simulate AI response delay
    setTimeout(() => {
      setIsLoading(false)
      setMessage("")
    }, 2000)
  }

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt)
  }

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
              {chatHistory.map((chat) => (
                <div key={chat.id} className={`flex ${chat.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      chat.type === "user" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{chat.message}</p>
                    <p className={`text-xs mt-1 ${chat.type === "user" ? "text-orange-100" : "text-gray-500"}`}>
                      {chat.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about construction, safety, calculations, or project management..."
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="h-4 w-4" />
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

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Questions Asked</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Calculations Done</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Time Saved</span>
                <span className="font-medium">2.5 hours</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
