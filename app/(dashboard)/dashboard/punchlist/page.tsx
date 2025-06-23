"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Plus, Search, Calendar, User, AlertTriangle, CheckCircle, Clock, Camera } from "lucide-react"

const punchlistItems = [
  {
    id: 1,
    title: "Fix electrical outlet in conference room",
    description: "Outlet on north wall not working properly",
    priority: "High",
    status: "Open",
    project: "Downtown Office Complex",
    assignedTo: "Sarah Chen",
    dueDate: "2024-01-20",
    createdDate: "2024-01-15",
    location: "Floor 15, Conference Room B",
    trade: "Electrical",
  },
  {
    id: 2,
    title: "Repair drywall damage in hallway",
    description: "Small hole in drywall near elevator bank",
    priority: "Medium",
    status: "In Progress",
    project: "Residential Tower A",
    assignedTo: "Mike Rodriguez",
    dueDate: "2024-01-22",
    createdDate: "2024-01-16",
    location: "Floor 8, East Hallway",
    trade: "Drywall",
  },
  {
    id: 3,
    title: "Install missing handrail",
    description: "Handrail missing on stairwell between floors 3-4",
    priority: "High",
    status: "Open",
    project: "Shopping Center Renovation",
    assignedTo: "Tom Williams",
    dueDate: "2024-01-18",
    createdDate: "2024-01-14",
    location: "Stairwell B, Floors 3-4",
    trade: "General",
  },
  {
    id: 4,
    title: "Touch up paint in lobby",
    description: "Scuff marks on walls near main entrance",
    priority: "Low",
    status: "Completed",
    project: "Downtown Office Complex",
    assignedTo: "David Johnson",
    dueDate: "2024-01-19",
    createdDate: "2024-01-17",
    location: "Main Lobby",
    trade: "Painting",
  },
  {
    id: 5,
    title: "Adjust door alignment",
    description: "Door not closing properly, needs adjustment",
    priority: "Medium",
    status: "Open",
    project: "Highway Bridge Repair",
    assignedTo: "Jessica Martinez",
    dueDate: "2024-01-21",
    createdDate: "2024-01-18",
    location: "Site Office",
    trade: "Carpentry",
  },
]

export default function PunchlistPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800"
      case "In Progress":
        return "bg-orange-100 text-orange-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <AlertTriangle className="h-4 w-4" />
      case "In Progress":
        return <Clock className="h-4 w-4" />
      case "Completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredItems = punchlistItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase().replace(" ", "-") === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Punchlist</h1>
          <p className="text-gray-600">Track and manage construction defects and completion items</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Punchlist Item</DialogTitle>
              <DialogDescription>Create a new item that needs to be completed or fixed.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Brief description of the issue" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Detailed description of the work needed" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trade">Trade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="drywall">Drywall</SelectItem>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="carpentry">Carpentry</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
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
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Specific location within project" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assigned">Assign To</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mike">Mike Rodriguez</SelectItem>
                      <SelectItem value="sarah">Sarah Chen</SelectItem>
                      <SelectItem value="tom">Tom Williams</SelectItem>
                      <SelectItem value="jessica">Jessica Martinez</SelectItem>
                      <SelectItem value="david">David Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input id="due-date" type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="photo">Photo (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input id="photo" type="file" accept="image/*" />
                  <Button type="button" variant="outline" size="icon">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setIsCreateDialogOpen(false)}>
                Create Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search punchlist items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Punchlist Items */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(item.status)}
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{item.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Due Date</p>
                        <p className="text-gray-600">{new Date(item.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Assigned To</p>
                        <p className="text-gray-600">{item.assignedTo}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Project</p>
                      <p className="text-gray-600">{item.project}</p>
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">{item.location}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  {item.status !== "Completed" && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
