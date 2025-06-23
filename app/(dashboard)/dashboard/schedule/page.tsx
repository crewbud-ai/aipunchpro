"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, MapPin, Plus } from "lucide-react"

const scheduleData = [
  {
    id: 1,
    title: "Foundation Pour - Building A",
    project: "Downtown Office Complex",
    time: "6:00 AM - 2:00 PM",
    date: "2024-01-20",
    crew: ["Mike Rodriguez", "David Johnson", "Tom Williams"],
    location: "Site A - Foundation Level",
    status: "Scheduled",
    priority: "High",
  },
  {
    id: 2,
    title: "Electrical Rough-in",
    project: "Residential Tower A",
    time: "8:00 AM - 4:00 PM",
    date: "2024-01-20",
    crew: ["Sarah Chen", "Lisa Thompson"],
    location: "Floors 15-17",
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Safety Inspection",
    project: "Highway Bridge Repair",
    time: "10:00 AM - 12:00 PM",
    date: "2024-01-20",
    crew: ["Jessica Martinez"],
    location: "Bridge Deck Section 2",
    status: "Scheduled",
    priority: "High",
  },
  {
    id: 4,
    title: "HVAC Installation",
    project: "Shopping Center Renovation",
    time: "7:00 AM - 3:00 PM",
    date: "2024-01-21",
    crew: ["Tom Williams", "Mike Rodriguez"],
    location: "Retail Units 5-8",
    status: "Scheduled",
    priority: "Medium",
  },
]

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState("2024-01-20")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800"
      case "In Progress":
        return "bg-orange-100 text-orange-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredSchedule = scheduleData.filter((item) => item.date === selectedDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Manage crew schedules and project timelines</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Task
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["2024-01-20", "2024-01-21", "2024-01-22", "2024-01-23", "2024-01-24"].map((date) => (
                <Button
                  key={date}
                  variant={selectedDate === date ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedDate(date)}
                >
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Items */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <Badge variant="outline">{filteredSchedule.length} tasks scheduled</Badge>
          </div>

          {filteredSchedule.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                    </div>

                    <p className="text-gray-600 mb-3">{item.project}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{item.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{item.crew.length} crew members</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Assigned Crew:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.crew.map((member, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    {item.status === "Scheduled" && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredSchedule.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks scheduled</h3>
                <p className="text-gray-600 mb-4">No tasks are scheduled for this date.</p>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
