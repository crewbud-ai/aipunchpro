"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Plus, Download, DollarSign, TrendingUp, Users } from "lucide-react"

const timeEntries = [
  {
    id: 1,
    user: { first_name: "Mike", last_name: "Rodriguez" },
    project: { name: "Downtown Office Complex" },
    date: "2024-01-19",
    start_time: "07:00",
    end_time: "15:30",
    break_minutes: 30,
    total_hours: 8,
    overtime_hours: 0,
    hourly_rate: 35,
    description: "Foundation work and concrete pouring",
    status: "approved",
  },
  {
    id: 2,
    user: { first_name: "Sarah", last_name: "Chen" },
    project: { name: "Residential Tower A" },
    date: "2024-01-19",
    start_time: "08:00",
    end_time: "17:00",
    break_minutes: 60,
    total_hours: 8,
    overtime_hours: 0,
    hourly_rate: 42,
    description: "Electrical rough-in floors 15-17",
    status: "pending",
  },
  {
    id: 3,
    user: { first_name: "Tom", last_name: "Williams" },
    project: { name: "Shopping Center Renovation" },
    date: "2024-01-19",
    start_time: "06:00",
    end_time: "16:30",
    break_minutes: 30,
    total_hours: 10,
    overtime_hours: 2,
    hourly_rate: 38,
    description: "Plumbing installation and repairs",
    status: "approved",
  },
]

export default function TimeTrackingPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState("2024-01-15")

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.total_hours, 0)
  const totalOvertimeHours = timeEntries.reduce((sum, entry) => sum + entry.overtime_hours, 0)
  const totalRegularPay = timeEntries.reduce(
    (sum, entry) => sum + (entry.total_hours - entry.overtime_hours) * entry.hourly_rate,
    0,
  )
  const totalOvertimePay = timeEntries.reduce((sum, entry) => sum + entry.overtime_hours * entry.hourly_rate * 1.5, 0)
  const pendingEntries = timeEntries.filter((entry) => entry.status === "pending").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600">Track work hours and generate payroll reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Log Time
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Log Work Hours</DialogTitle>
                <DialogDescription>Record time worked on a project or task</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" defaultValue="2024-01-19" />
                  </div>
                  <div>
                    <Label htmlFor="project">Project</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="downtown">Downtown Office Complex</SelectItem>
                        <SelectItem value="residential">Residential Tower A</SelectItem>
                        <SelectItem value="bridge">Highway Bridge Repair</SelectItem>
                        <SelectItem value="shopping">Shopping Center Renovation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input id="start_time" type="time" />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input id="end_time" type="time" />
                  </div>
                  <div>
                    <Label htmlFor="break_minutes">Break (min)</Label>
                    <Input id="break_minutes" type="number" placeholder="30" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Work Description</Label>
                  <Textarea id="description" placeholder="Describe the work performed..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setIsAddDialogOpen(false)}>
                  Log Time
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOvertimeHours}</div>
            <p className="text-xs text-muted-foreground">Above 40 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRegularPay + totalOvertimePay).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Regular + overtime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEntries}</div>
            <p className="text-xs text-muted-foreground">Entries to review</p>
          </CardContent>
        </Card>
      </div>

      {/* Week Selector */}
      <div className="flex items-center gap-4">
        <Label htmlFor="week">Week of:</Label>
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-01-15">Jan 15 - Jan 21, 2024</SelectItem>
            <SelectItem value="2024-01-08">Jan 8 - Jan 14, 2024</SelectItem>
            <SelectItem value="2024-01-01">Jan 1 - Jan 7, 2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>Review and approve team member time entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Employee</th>
                  <th className="text-left p-2">Project</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Hours</th>
                  <th className="text-left p-2">Rate</th>
                  <th className="text-left p-2">Total Pay</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map((entry) => {
                  const regularHours = entry.total_hours - entry.overtime_hours
                  const regularPay = regularHours * entry.hourly_rate
                  const overtimePay = entry.overtime_hours * entry.hourly_rate * 1.5
                  const totalPay = regularPay + overtimePay

                  return (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">
                            {entry.user.first_name} {entry.user.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{entry.description}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <p className="font-medium">{entry.project.name}</p>
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{new Date(entry.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">
                            {entry.start_time} - {entry.end_time}
                          </p>
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{entry.total_hours}h</p>
                          {entry.overtime_hours > 0 && (
                            <p className="text-sm text-orange-600">+{entry.overtime_hours}h OT</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">${entry.hourly_rate}/h</p>
                          {entry.overtime_hours > 0 && (
                            <p className="text-sm text-gray-600">${(entry.hourly_rate * 1.5).toFixed(2)}/h OT</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <p className="font-medium text-green-600">${totalPay.toFixed(2)}</p>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          {entry.status === "pending" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
