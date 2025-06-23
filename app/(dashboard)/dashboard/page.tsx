import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">+5 new hires</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week's Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,847</div>
            <p className="text-xs text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$284,500</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your most active construction projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Downtown Office Complex</p>
                <p className="text-sm text-gray-600">Phase 2 - Foundation</p>
              </div>
              <Badge className="bg-green-100 text-green-800">On Track</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Residential Tower A</p>
                <p className="text-sm text-gray-600">Floor 15-20 Framing</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Behind</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Highway Bridge Repair</p>
                <p className="text-sm text-gray-600">Deck Replacement</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Ahead</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Shopping Center Renovation</p>
                <p className="text-sm text-gray-600">HVAC Installation</p>
              </div>
              <Badge className="bg-green-100 text-green-800">On Track</Badge>
            </div>
            <Link href="/dashboard/projects">
              <Button variant="outline" className="w-full">
                View All Projects
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Priority Tasks</CardTitle>
            <CardDescription>Critical items that need attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Safety inspection overdue</p>
                <p className="text-sm text-gray-600">Downtown Office Complex - Due 2 days ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Material delivery scheduled</p>
                <p className="text-sm text-gray-600">Residential Tower A - Steel beams arriving at 2 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Electrical rough-in completed</p>
                <p className="text-sm text-gray-600">Shopping Center - Ready for inspection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Crew meeting scheduled</p>
                <p className="text-sm text-gray-600">Bridge project team - 4 PM site office</p>
              </div>
            </div>
            <Link href="/dashboard/punchlist">
              <Button variant="outline" className="w-full">
                View All Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get things done faster</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/projects">
              <Button variant="outline" className="h-20 w-full flex-col">
                <Building2 className="h-6 w-6 mb-2" />
                Create Project
              </Button>
            </Link>
            <Link href="/dashboard/team">
              <Button variant="outline" className="h-20 w-full flex-col">
                <Users className="h-6 w-6 mb-2" />
                Add Team Member
              </Button>
            </Link>
            <Link href="/dashboard/schedule">
              <Button variant="outline" className="h-20 w-full flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                Schedule Task
              </Button>
            </Link>
            <Link href="/dashboard/payroll">
              <Button variant="outline" className="h-20 w-full flex-col">
                <DollarSign className="h-6 w-6 mb-2" />
                Process Payroll
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
