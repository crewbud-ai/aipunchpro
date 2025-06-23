"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/database-client"

type Role = {
  id: string
  name: string
  permissions: {
    projects: {
      view: boolean
      create: boolean
      edit: boolean
      delete: boolean
    }
    team: {
      view: boolean
      invite: boolean
      edit: boolean
      remove: boolean
    }
    schedule: {
      view: boolean
      create: boolean
      edit: boolean
    }
    punchlist: {
      view: boolean
      create: boolean
      edit: boolean
      complete: boolean
    }
    blueprints: {
      view: boolean
      upload: boolean
      analyze: boolean
    }
    reports: {
      view: boolean
      export: boolean
    }
  }
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const defaultPermissions = {
    projects: { view: false, create: false, edit: false, delete: false },
    team: { view: false, invite: false, edit: false, remove: false },
    schedule: { view: false, create: false, edit: false },
    punchlist: { view: false, create: false, edit: false, complete: false },
    blueprints: { view: false, upload: false, analyze: false },
    reports: { view: false, export: false },
  }

  const [formData, setFormData] = useState<{
    name: string
    permissions: Role["permissions"]
  }>({
    name: "",
    permissions: defaultPermissions,
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("user_roles").select("*").order("name")

      if (error) throw error

      setRoles(data || [])
    } catch (error) {
      console.error("Error fetching roles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePermissionChange = (category: keyof Role["permissions"], permission: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions[category],
          [permission]: value,
        },
      },
    }))
  }

  const handleAddRole = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .insert([
          {
            name: formData.name,
            permissions: formData.permissions,
            company_id: "current-company-id", // In a real app, get from auth context
          },
        ])
        .select()

      if (error) throw error

      setRoles((prev) => [...prev, data[0]])
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error adding role:", error)
    }
  }

  const handleEditRole = async () => {
    if (!currentRole) return

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({
          name: formData.name,
          permissions: formData.permissions,
        })
        .eq("id", currentRole.id)

      if (error) throw error

      setRoles((prev) =>
        prev.map((role) =>
          role.id === currentRole.id ? { ...role, name: formData.name, permissions: formData.permissions } : role,
        ),
      )
      setIsEditDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error updating role:", error)
    }
  }

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) return

    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", id)

      if (error) throw error

      setRoles((prev) => prev.filter((role) => role.id !== id))
    } catch (error) {
      console.error("Error deleting role:", error)
    }
  }

  const editRole = (role: Role) => {
    setCurrentRole(role)
    setFormData({
      name: role.name,
      permissions: role.permissions,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      permissions: defaultPermissions,
    })
    setCurrentRole(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Create and manage user roles and permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Define a new role with specific permissions</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Project Manager, Site Foreman"
                  required
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-lg">Permissions</h3>

                {/* Projects Permissions */}
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">Projects</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="projects-view"
                        checked={formData.permissions.projects.view}
                        onCheckedChange={(checked) => handlePermissionChange("projects", "view", checked as boolean)}
                      />
                      <Label htmlFor="projects-view">View Projects</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="projects-create"
                        checked={formData.permissions.projects.create}
                        onCheckedChange={(checked) => handlePermissionChange("projects", "create", checked as boolean)}
                      />
                      <Label htmlFor="projects-create">Create Projects</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="projects-edit"
                        checked={formData.permissions.projects.edit}
                        onCheckedChange={(checked) => handlePermissionChange("projects", "edit", checked as boolean)}
                      />
                      <Label htmlFor="projects-edit">Edit Projects</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="projects-delete"
                        checked={formData.permissions.projects.delete}
                        onCheckedChange={(checked) => handlePermissionChange("projects", "delete", checked as boolean)}
                      />
                      <Label htmlFor="projects-delete">Delete Projects</Label>
                    </div>
                  </div>
                </div>

                {/* Team Permissions */}
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">Team</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="team-view"
                        checked={formData.permissions.team.view}
                        onCheckedChange={(checked) => handlePermissionChange("team", "view", checked as boolean)}
                      />
                      <Label htmlFor="team-view">View Team</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="team-invite"
                        checked={formData.permissions.team.invite}
                        onCheckedChange={(checked) => handlePermissionChange("team", "invite", checked as boolean)}
                      />
                      <Label htmlFor="team-invite">Invite Members</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="team-edit"
                        checked={formData.permissions.team.edit}
                        onCheckedChange={(checked) => handlePermissionChange("team", "edit", checked as boolean)}
                      />
                      <Label htmlFor="team-edit">Edit Members</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="team-remove"
                        checked={formData.permissions.team.remove}
                        onCheckedChange={(checked) => handlePermissionChange("team", "remove", checked as boolean)}
                      />
                      <Label htmlFor="team-remove">Remove Members</Label>
                    </div>
                  </div>
                </div>

                {/* Blueprints Permissions */}
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">Blueprints</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="blueprints-view"
                        checked={formData.permissions.blueprints.view}
                        onCheckedChange={(checked) => handlePermissionChange("blueprints", "view", checked as boolean)}
                      />
                      <Label htmlFor="blueprints-view">View Blueprints</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="blueprints-upload"
                        checked={formData.permissions.blueprints.upload}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("blueprints", "upload", checked as boolean)
                        }
                      />
                      <Label htmlFor="blueprints-upload">Upload Blueprints</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="blueprints-analyze"
                        checked={formData.permissions.blueprints.analyze}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("blueprints", "analyze", checked as boolean)
                        }
                      />
                      <Label htmlFor="blueprints-analyze">Analyze with AI</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleAddRole}>
                Create Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p>Loading roles...</p>
            </CardContent>
          </Card>
        ) : roles.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="mb-4">No roles defined yet.</p>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Role
              </Button>
            </CardContent>
          </Card>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <CardDescription>
                    {Object.entries(role.permissions).reduce((count, [category, perms]) => {
                      const enabledPerms = Object.values(perms).filter(Boolean).length
                      return count + enabledPerms
                    }, 0)}{" "}
                    permissions enabled
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => editRole(role)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-600"
                    onClick={() => handleDeleteRole(role.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(role.permissions).map(([category, permissions]) => (
                    <div key={category} className="border rounded-md p-3">
                      <h4 className="font-medium capitalize mb-2">{category}</h4>
                      <ul className="text-sm space-y-1">
                        {Object.entries(permissions).map(([perm, enabled]) => (
                          <li key={perm} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500" : "bg-gray-300"}`}></div>
                            <span className={`capitalize ${enabled ? "text-gray-900" : "text-gray-500"}`}>{perm}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Modify role permissions</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">Permissions</h3>

              {/* Projects Permissions */}
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">Projects</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-projects-view"
                      checked={formData.permissions.projects.view}
                      onCheckedChange={(checked) => handlePermissionChange("projects", "view", checked as boolean)}
                    />
                    <Label htmlFor="edit-projects-view">View Projects</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-projects-create"
                      checked={formData.permissions.projects.create}
                      onCheckedChange={(checked) => handlePermissionChange("projects", "create", checked as boolean)}
                    />
                    <Label htmlFor="edit-projects-create">Create Projects</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-projects-edit"
                      checked={formData.permissions.projects.edit}
                      onCheckedChange={(checked) => handlePermissionChange("projects", "edit", checked as boolean)}
                    />
                    <Label htmlFor="edit-projects-edit">Edit Projects</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-projects-delete"
                      checked={formData.permissions.projects.delete}
                      onCheckedChange={(checked) => handlePermissionChange("projects", "delete", checked as boolean)}
                    />
                    <Label htmlFor="edit-projects-delete">Delete Projects</Label>
                  </div>
                </div>
              </div>

              {/* Other permission sections would follow the same pattern */}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleEditRole}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
