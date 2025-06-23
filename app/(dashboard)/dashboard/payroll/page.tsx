import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, Users, TrendingUp, Download, Play } from "lucide-react"

const payrollData = [
  {
    id: 1,
    name: "Mike Rodriguez",
    role: "Site Foreman",
    hoursWorked: 42,
    overtimeHours: 2,
    regularRate: 35,
    overtimeRate: 52.5,
    grossPay: 1575,
    deductions: 315,
    netPay: 1260,
    status: "Approved",
  },
  {
    id: 2,
    name: "Sarah Chen",
    role: "Electrician",
    hoursWorked: 40,
    overtimeHours: 0,
    regularRate: 42,
    overtimeRate: 63,
    grossPay: 1680,
    deductions: 336,
    netPay: 1344,
    status: "Pending",
  },
  {
    id: 3,
    name: "Tom Williams",
    role: "Plumber",
    hoursWorked: 38,
    overtimeHours: 0,
    regularRate: 38,
    overtimeRate: 57,
    grossPay: 1444,
    deductions: 289,
    netPay: 1155,
    status: "Approved",
  },
  {
    id: 4,
    name: "Jessica Martinez",
    role: "Project Manager",
    hoursWorked: 45,
    overtimeHours: 5,
    regularRate: 45,
    overtimeRate: 67.5,
    grossPay: 2137.5,
    deductions: 427.5,
    netPay: 1710,
    status: "Approved",
  },
]

export default function PayrollPage() {
  const totalGrossPay = payrollData.reduce((sum, emp) => sum + emp.grossPay, 0)
  const totalNetPay = payrollData.reduce((sum, emp) => sum + emp.netPay, 0)
  const totalHours = payrollData.reduce((sum, emp) => sum + emp.hoursWorked, 0)
  const pendingApprovals = payrollData.filter((emp) => emp.status === "Pending").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600">Manage employee payroll and time tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Play className="mr-2 h-4 w-4" />
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalGrossPay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This pay period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalNetPay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">After deductions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
            <p className="text-xs text-muted-foreground">Hours worked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Require approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll - Week of Jan 15, 2024</CardTitle>
          <CardDescription>Review and approve employee timesheets and pay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Employee</th>
                  <th className="text-left p-2">Hours</th>
                  <th className="text-left p-2">Rate</th>
                  <th className="text-left p-2">Gross Pay</th>
                  <th className="text-left p-2">Deductions</th>
                  <th className="text-left p-2">Net Pay</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-600">{employee.role}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{employee.hoursWorked}h</p>
                        {employee.overtimeHours > 0 && (
                          <p className="text-sm text-orange-600">+{employee.overtimeHours}h OT</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">${employee.regularRate}/h</p>
                        {employee.overtimeHours > 0 && (
                          <p className="text-sm text-gray-600">${employee.overtimeRate}/h OT</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">${employee.grossPay.toLocaleString()}</p>
                    </td>
                    <td className="p-2">
                      <p className="text-red-600">-${employee.deductions}</p>
                    </td>
                    <td className="p-2">
                      <p className="font-medium text-green-600">${employee.netPay.toLocaleString()}</p>
                    </td>
                    <td className="p-2">
                      <Badge
                        className={
                          employee.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {employee.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        {employee.status === "Pending" && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
