"use client"

import { SelectItem } from "@/components/ui/select"

import { SelectContent } from "@/components/ui/select"

import { SelectValue } from "@/components/ui/select"

import { SelectTrigger } from "@/components/ui/select"

import { Select } from "@/components/ui/select"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Eye, Download, Trash2, Bot, List, Calendar, CheckSquare, Loader2 } from "lucide-react"
import { supabase } from "@/lib/database-client"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

type Blueprint = {
  id: string
  name: string
  file_url: string
  version: string
  description: string
  uploaded_at: string
  uploaded_by: {
    first_name: string
    last_name: string
  }
  is_current: boolean
}

type AIAnalysis = {
  id: string
  blueprint_id: string
  analysis_type: string
  results: any
  created_at: string
}

export default function BlueprintsPage() {
  const { id: projectId } = useParams()
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isAnalyzeDialogOpen, setIsAnalyzeDialogOpen] = useState(false)
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisType, setAnalysisType] = useState<string>("material_list")

  const [uploadForm, setUploadForm] = useState({
    name: "",
    version: "",
    description: "",
    file: null as File | null,
  })

  useEffect(() => {
    fetchBlueprints()
  }, [projectId])

  const fetchBlueprints = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("blueprints")
        .select(`
          *,
          uploaded_by:users(first_name, last_name)
        `)
        .eq("project_id", projectId)
        .order("uploaded_at", { ascending: false })

      if (error) throw error

      setBlueprints(data || [])

      // Fetch analyses for all blueprints
      if (data && data.length > 0) {
        const blueprintIds = data.map((b) => b.id)
        const { data: analysesData, error: analysesError } = await supabase
          .from("ai_analysis_results")
          .select("*")
          .in("blueprint_id", blueprintIds)

        if (!analysesError) {
          setAnalyses(analysesData || [])
        }
      }
    } catch (error) {
      console.error("Error fetching blueprints:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm((prev) => ({ ...prev, file: e.target.files![0] }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setUploadForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleUploadBlueprint = async () => {
    if (!uploadForm.file || !uploadForm.name) return

    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${uploadForm.file.name}`
      const filePath = `blueprints/${projectId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("project-files").upload(filePath, uploadForm.file)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(filePath)

      // Save blueprint metadata to database
      const { data, error } = await supabase
        .from("blueprints")
        .insert([
          {
            project_id: projectId,
            name: uploadForm.name,
            version: uploadForm.version,
            description: uploadForm.description,
            file_url: urlData.publicUrl,
            uploaded_by: "current-user-id", // In a real app, get from auth context
            is_current: true,
          },
        ])
        .select(`
          *,
          uploaded_by:users(first_name, last_name)
        `)

      if (error) throw error

      // Update other blueprints to not be current
      if (data) {
        await supabase
          .from("blueprints")
          .update({ is_current: false })
          .eq("project_id", projectId)
          .neq("id", data[0].id)

        setBlueprints((prev) => [data[0], ...prev.map((b) => ({ ...b, is_current: false }))])
      }

      setIsUploadDialogOpen(false)
      resetUploadForm()
    } catch (error) {
      console.error("Error uploading blueprint:", error)
    }
  }

  const resetUploadForm = () => {
    setUploadForm({
      name: "",
      version: "",
      description: "",
      file: null,
    })
  }

  const handleDeleteBlueprint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blueprint? This action cannot be undone.")) return

    try {
      // Delete the blueprint
      const { error } = await supabase.from("blueprints").delete().eq("id", id)

      if (error) throw error

      // Update the UI
      setBlueprints((prev) => prev.filter((b) => b.id !== id))
    } catch (error) {
      console.error("Error deleting blueprint:", error)
    }
  }

  const handleAnalyzeBlueprint = async () => {
    if (!selectedBlueprint) return

    setIsAnalyzing(true)
    try {
      // In a real app, you would send the blueprint to an AI service for analysis
      // Here we'll simulate the analysis with a simple AI prompt

      const prompt = `You are an AI assistant for construction professionals. Analyze this blueprint: ${selectedBlueprint.name} (${selectedBlueprint.description || "No description"})
      
      ${analysisType === "material_list" ? "Generate a detailed list of materials needed for this project, including quantities and specifications." : ""}
      ${analysisType === "schedule_suggestion" ? "Create a suggested construction schedule with milestones and estimated durations." : ""}
      ${analysisType === "punchlist" ? "Generate a comprehensive punchlist of items to check during construction and before completion." : ""}
      
      Format your response as a JSON object with appropriate structure.`

      // Use AI SDK to generate analysis
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        temperature: 0.7,
      })

      // Parse the response
      let results
      try {
        results = JSON.parse(text)
      } catch (e) {
        // If parsing fails, use the raw text
        results = { rawAnalysis: text }
      }

      // Save the analysis to the database
      const { data, error } = await supabase
        .from("ai_analysis_results")
        .insert([
          {
            blueprint_id: selectedBlueprint.id,
            analysis_type: analysisType,
            results: results,
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setAnalyses((prev) => [...prev, data[0]])
      }

      setIsAnalyzeDialogOpen(false)
    } catch (error) {
      console.error("Error analyzing blueprint:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getAnalysisForBlueprint = (blueprintId: string, type: string) => {
    return analyses.find((a) => a.blueprint_id === blueprintId && a.analysis_type === type)
  }

  const renderAnalysisResults = (analysis: AIAnalysis) => {
    if (!analysis) return null

    switch (analysis.analysis_type) {
      case "material_list":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Materials Needed</h3>
            {analysis.results.materials ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-left">Quantity</th>
                      <th className="px-4 py-2 text-left">Unit</th>
                      <th className="px-4 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analysis.results.materials.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">{item.unit}</td>
                        <td className="px-4 py-2">{item.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-gray-50">
                <p>{analysis.results.rawAnalysis || "No structured data available"}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Materials List
              </Button>
            </div>
          </div>
        )

      case "schedule_suggestion":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Suggested Schedule</h3>
            {analysis.results.schedule ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Estimated Duration:</span>
                    <span>{analysis.results.totalDuration || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Recommended Start:</span>
                    <span>{analysis.results.recommendedStart || "N/A"}</span>
                  </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Phase</th>
                        <th className="px-4 py-2 text-left">Duration</th>
                        <th className="px-4 py-2 text-left">Dependencies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {analysis.results.schedule.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{item.phase}</td>
                          <td className="px-4 py-2">{item.duration}</td>
                          <td className="px-4 py-2">{item.dependencies?.join(", ") || "None"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-gray-50">
                <p>{analysis.results.rawAnalysis || "No structured data available"}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Create Schedule
              </Button>
            </div>
          </div>
        )

      case "punchlist":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Punchlist Items</h3>
            {analysis.results.items ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analysis.results.items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2">{item.location}</td>
                        <td className="px-4 py-2">{item.category}</td>
                        <td className="px-4 py-2">
                          <Badge
                            className={
                              item.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : item.priority === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {item.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-gray-50">
                <p>{analysis.results.rawAnalysis || "No structured data available"}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline">
                <CheckSquare className="mr-2 h-4 w-4" />
                Create Punchlist Tasks
              </Button>
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 border rounded-md bg-gray-50">
            <p>Analysis results not available in a structured format.</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Blueprints</h1>
          <p className="text-gray-600">Upload, view, and analyze construction blueprints</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Upload className="mr-2 h-4 w-4" />
              Upload Blueprint
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Blueprint</DialogTitle>
              <DialogDescription>Upload a new blueprint for this project</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Blueprint Name</Label>
                <Input
                  id="name"
                  value={uploadForm.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., First Floor Electrical Plan"
                  required
                />
              </div>

              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={uploadForm.version}
                  onChange={(e) => handleInputChange("version", e.target.value)}
                  placeholder="e.g., v1.0, Rev A"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of this blueprint"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="file">Blueprint File</Label>
                <div className="mt-1">
                  <Input id="file" type="file" onChange={handleFileChange} accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png" />
                  <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DWG, DXF, JPG, PNG</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  resetUploadForm()
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleUploadBlueprint}
                disabled={!uploadForm.file || !uploadForm.name}
              >
                Upload Blueprint
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Blueprints List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p>Loading blueprints...</p>
            </CardContent>
          </Card>
        ) : blueprints.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blueprints yet</h3>
              <p className="text-gray-600 mb-4">Upload your first blueprint to get started.</p>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Blueprint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="blueprints">
            <TabsList className="mb-4">
              <TabsTrigger value="blueprints">All Blueprints</TabsTrigger>
              <TabsTrigger value="current">Current Version</TabsTrigger>
              <TabsTrigger value="analyses">AI Analyses</TabsTrigger>
            </TabsList>

            <TabsContent value="blueprints" className="space-y-4">
              {blueprints.map((blueprint) => (
                <Card key={blueprint.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="bg-gray-100 p-3 rounded-md">
                        <FileText className="h-8 w-8 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {blueprint.name}
                          {blueprint.is_current && <Badge className="bg-green-100 text-green-800">Current</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {blueprint.version && `Version: ${blueprint.version} • `}
                          Uploaded on {new Date(blueprint.uploaded_at).toLocaleDateString()} by{" "}
                          {blueprint.uploaded_by.first_name} {blueprint.uploaded_by.last_name}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={blueprint.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={blueprint.file_url} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBlueprint(blueprint)
                          setIsAnalyzeDialogOpen(true)
                        }}
                      >
                        <Bot className="h-4 w-4 mr-1" />
                        Analyze
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteBlueprint(blueprint.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {blueprint.description && <p className="text-gray-600 mb-4">{blueprint.description}</p>}

                    <div className="flex flex-wrap gap-2">
                      {getAnalysisForBlueprint(blueprint.id, "material_list") && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <List className="h-3 w-3" />
                          Materials List
                        </Badge>
                      )}
                      {getAnalysisForBlueprint(blueprint.id, "schedule_suggestion") && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Schedule
                        </Badge>
                      )}
                      {getAnalysisForBlueprint(blueprint.id, "punchlist") && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckSquare className="h-3 w-3" />
                          Punchlist
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="current" className="space-y-4">
              {blueprints
                .filter((b) => b.is_current)
                .map((blueprint) => (
                  <Card key={blueprint.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="bg-gray-100 p-3 rounded-md">
                          <FileText className="h-8 w-8 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {blueprint.name}
                            <Badge className="bg-green-100 text-green-800">Current</Badge>
                          </CardTitle>
                          <CardDescription>
                            {blueprint.version && `Version: ${blueprint.version} • `}
                            Uploaded on {new Date(blueprint.uploaded_at).toLocaleDateString()} by{" "}
                            {blueprint.uploaded_by.first_name} {blueprint.uploaded_by.last_name}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={blueprint.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={blueprint.file_url} download>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBlueprint(blueprint)
                            setIsAnalyzeDialogOpen(true)
                          }}
                        >
                          <Bot className="h-4 w-4 mr-1" />
                          Analyze
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {blueprint.description && <p className="text-gray-600 mb-4">{blueprint.description}</p>}

                      <div className="flex flex-wrap gap-2">
                        {getAnalysisForBlueprint(blueprint.id, "material_list") && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <List className="h-3 w-3" />
                            Materials List
                          </Badge>
                        )}
                        {getAnalysisForBlueprint(blueprint.id, "schedule_suggestion") && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Schedule
                          </Badge>
                        )}
                        {getAnalysisForBlueprint(blueprint.id, "punchlist") && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            Punchlist
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {blueprints.filter((b) => b.is_current).length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p>No current blueprint set. Upload a new blueprint or set an existing one as current.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analyses" className="space-y-6">
              {analyses.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p>No AI analyses yet. Select a blueprint and click "Analyze" to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <List className="h-5 w-5" />
                          Materials Lists
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analyses
                            .filter((a) => a.analysis_type === "material_list")
                            .map((analysis) => {
                              const blueprint = blueprints.find((b) => b.id === analysis.blueprint_id)
                              return (
                                <div key={analysis.id} className="border rounded-md p-3 hover:bg-gray-50">
                                  <p className="font-medium">{blueprint?.name}</p>
                                  <p className="text-sm text-gray-600">
                                    Generated on {new Date(analysis.created_at).toLocaleDateString()}
                                  </p>
                                  <Button variant="link" className="p-0 h-auto text-sm">
                                    View Materials
                                  </Button>
                                </div>
                              )
                            })}

                          {analyses.filter((a) => a.analysis_type === "material_list").length === 0 && (
                            <p className="text-sm text-gray-600">No material lists generated yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Schedule Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analyses
                            .filter((a) => a.analysis_type === "schedule_suggestion")
                            .map((analysis) => {
                              const blueprint = blueprints.find((b) => b.id === analysis.blueprint_id)
                              return (
                                <div key={analysis.id} className="border rounded-md p-3 hover:bg-gray-50">
                                  <p className="font-medium">{blueprint?.name}</p>
                                  <p className="text-sm text-gray-600">
                                    Generated on {new Date(analysis.created_at).toLocaleDateString()}
                                  </p>
                                  <Button variant="link" className="p-0 h-auto text-sm">
                                    View Schedule
                                  </Button>
                                </div>
                              )
                            })}

                          {analyses.filter((a) => a.analysis_type === "schedule_suggestion").length === 0 && (
                            <p className="text-sm text-gray-600">No schedules generated yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckSquare className="h-5 w-5" />
                          Punchlists
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analyses
                            .filter((a) => a.analysis_type === "punchlist")
                            .map((analysis) => {
                              const blueprint = blueprints.find((b) => b.id === analysis.blueprint_id)
                              return (
                                <div key={analysis.id} className="border rounded-md p-3 hover:bg-gray-50">
                                  <p className="font-medium">{blueprint?.name}</p>
                                  <p className="text-sm text-gray-600">
                                    Generated on {new Date(analysis.created_at).toLocaleDateString()}
                                  </p>
                                  <Button variant="link" className="p-0 h-auto text-sm">
                                    View Punchlist
                                  </Button>
                                </div>
                              )
                            })}

                          {analyses.filter((a) => a.analysis_type === "punchlist").length === 0 && (
                            <p className="text-sm text-gray-600">No punchlists generated yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Analysis Details */}
                  {analyses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Latest Analysis Results</CardTitle>
                        <CardDescription>Showing results for the most recent analysis</CardDescription>
                      </CardHeader>
                      <CardContent>{renderAnalysisResults(analyses[0])}</CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Analyze Dialog */}
      <Dialog open={isAnalyzeDialogOpen} onOpenChange={setIsAnalyzeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Analyze Blueprint with AI</DialogTitle>
            <DialogDescription>{selectedBlueprint && `Analyzing: ${selectedBlueprint.name}`}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="analysis-type">Analysis Type</Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="material_list">Materials List</SelectItem>
                  <SelectItem value="schedule_suggestion">Schedule Suggestion</SelectItem>
                  <SelectItem value="punchlist">Punchlist Generation</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {analysisType === "material_list" && "Generate a list of materials needed for this project."}
                {analysisType === "schedule_suggestion" && "Create a suggested construction schedule with milestones."}
                {analysisType === "punchlist" && "Generate a comprehensive punchlist of items to check."}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAnalyzeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleAnalyzeBlueprint}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Analyze Blueprint
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
