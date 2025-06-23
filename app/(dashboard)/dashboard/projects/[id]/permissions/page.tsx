"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/database-client"

type User = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  avatar_url?: string
}

type Permission = {
  id: string
  project_id: string
  user_id: string
  can_view: boolean
  can_edit: boolean
  can_manage: boolean
  user: User
}

export default function ProjectPermissionsPage() {
  const { id: projectId } = useParams()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [companyUsers, setCompanyUsers] = useState<User[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    userId: "",
    canView: true,
    canEdit: false,
    canManage: false
  })

  useEffect(() => {
    fetchPermissions()
    fetchCompanyUsers()
  }, [projectId])

  const fetchPermissions = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('project_permissions')
        .select(`
          *,
          user:users(id, first_name, last_name, email, role, avatar_url)
        `)
        .eq('project_id', projectId)
        
      if (error) throw error
      
      setPermissions(data || [])
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanyUsers = async () => {
    try {
      // In a real app, you would filter by the current company_id
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role, avatar_url')
