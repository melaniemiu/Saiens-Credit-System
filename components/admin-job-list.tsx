"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Edit, Trash2, Briefcase, Building2, Brain, Users, ChevronDown, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import CSVImportDialog from "@/components/csv-import-dialog"

interface Department {
  id: string
  name: string
}

interface Skill {
  id: string
  name: string
  category: string | {
    id: string
    name: string
    color: string
    icon?: string
  }
  JobSkill?: {
    // No more isRequired field
  }
}

interface Job {
  id: string
  name: string
  Department: Department
  skills: Skill[]
  skillCount: number
  userCount: number
  createdAt: string
  updatedAt: string
}

interface JobFormData {
  name: string
  departmentId: string
  skillIds: string[]
}

export function AdminJobList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("__all__")
  const [sortField, setSortField] = useState("name")
  const [sortOrder, setSortOrder] = useState("ASC")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState<JobFormData>({
    name: "",
    departmentId: "",
    skillIds: []
  })
  // New state for enhanced skill selection
  const [skillSearchTerm, setSkillSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAdminJobs({
        page,
        limit: 10,
        search: searchTerm,
        departmentId: departmentFilter === "__all__" ? undefined : departmentFilter,
        sortField,
        sortOrder
      })
      
      if (response.data) {
        setJobs(response.data.jobs || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "錯誤",
        description: "載入職位資料失敗",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.getDepartments()
      if (response.data) {
        setDepartments(response.data.departments || [])
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error)
    }
  }

  const fetchSkills = async () => {
    try {
      const response = await apiClient.getAdminSkills({ limit: 100 })
      if (response.data) {
        setSkills(response.data.skills || [])
      }
    } catch (error) {
      console.error("Failed to fetch skills:", error)
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchSkills()
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [page, searchTerm, departmentFilter, sortField, sortOrder])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
    setPage(1)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      departmentId: "",
      skillIds: []
    })
    // Reset skill search and expanded categories
    setSkillSearchTerm("")
    setExpandedCategories(new Set())
  }

  // Helper function to group skills by category
  const groupSkillsByCategory = (skills: Skill[]) => {
    const grouped = skills.reduce((acc, skill) => {
      const categoryName = typeof skill.category === 'string' 
        ? skill.category 
        : skill.category?.name || 'Uncategorized'
      
      const categoryColor = typeof skill.category === 'object' 
        ? skill.category?.color || '#6B7280'
        : '#6B7280'
      
      if (!acc[categoryName]) {
        acc[categoryName] = {
          skills: [],
          color: categoryColor
        }
      }
      acc[categoryName].skills.push(skill)
      return acc
    }, {} as Record<string, { skills: Skill[], color: string }>)
    
    return grouped
  }

  // Helper function to filter skills based on search term
  const filterSkills = (skills: Skill[], searchTerm: string) => {
    if (!searchTerm.trim()) return skills
    const term = searchTerm.toLowerCase()
    return skills.filter(skill => 
      skill.name.toLowerCase().includes(term) ||
      (typeof skill.category === 'string' 
        ? skill.category.toLowerCase().includes(term)
        : skill.category?.name?.toLowerCase().includes(term) || false)
    )
  }

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  const handleSkillToggle = (skillId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      skillIds: checked
        ? [...prev.skillIds, skillId]
        : prev.skillIds.filter(id => id !== skillId)
    }))
  }

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.departmentId) {
        toast({
          title: "錯誤",
          description: "請填寫所有必填欄位",
          variant: "destructive"
        })
        return
      }

      const response = await apiClient.createJob(formData)
      
      toast({
        title: "成功",
        description: "職位創建成功"
      })
      
      setIsCreateDialogOpen(false)
      resetForm()
      fetchJobs()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "創建職位失敗",
        variant: "destructive"
      })
    }
  }

  const handleEditClick = (job: Job) => {
    setEditingJob(job)
    setFormData({
      name: job.name,
      departmentId: job.Department?.id || "",
      skillIds: (job.skills || []).map(skill => skill.id)
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingJob) return

    try {
      const response = await apiClient.updateJob(editingJob.id, formData)
      
      toast({
        title: "成功",
        description: "職位更新成功"
      })
      
      setIsEditDialogOpen(false)
      setEditingJob(null)
      resetForm()
      fetchJobs()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "更新職位失敗",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (jobId: string) => {
    try {
      const response = await apiClient.deleteJob(jobId)
      
      toast({
        title: "成功",
        description: "職位刪除成功"
      })
      
      fetchJobs()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "刪除職位失敗",
        variant: "destructive"
      })
    }
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-3">
        <CardDescription className="text-sm">管理職位與部門技能關聯</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <div className="space-y-4">
          {/* 搜尋和篩選 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜尋職位..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="部門" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部部門</SelectItem>
                {(departments || []).map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortField} onValueChange={setSortField}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">名稱</SelectItem>
                <SelectItem value="createdAt">創建時間</SelectItem>
                <SelectItem value="updatedAt">更新時間</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASC">升序</SelectItem>
                <SelectItem value="DESC">降序</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                新增職位
              </Button>
              <CSVImportDialog 
                type="jobs" 
                title="職位"
                onImportComplete={fetchJobs}
              />
            </div>
          </div>

          {/* 職位列表 - Desktop */}
          <div className="md:block hidden">
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          職位名稱
                          {sortField === "name" && (
                            <span className="ml-1">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>所屬部門</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Brain className="h-4 w-4" />
                          技能數
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          用戶數
                        </div>
                      </TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-12 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          沒有找到職位
                        </TableCell>
                      </TableRow>
                    ) : (
                      (jobs || []).map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-gray-500" />
                              {job.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span className="text-sm">{job.Department?.name || '未分配'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {job.skillCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {job.userCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(job)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>確認刪除</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      您確定要刪除職位「{job.name}」嗎？此操作無法復原。
                                      {job.userCount > 0 && (
                                        <span className="text-red-600 block mt-2">
                                          注意：此職位目前有 {job.userCount} 位用戶，無法刪除。
                                        </span>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(job.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={job.userCount > 0}
                                    >
                                      刪除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* 職位列表 - Mobile */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array(5).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  沒有找到職位
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{job.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <Building2 className="h-3 w-3 inline mr-1" />
                            {job.Department?.name || '未分配'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {job.skillCount} 技能 · {job.userCount} 用戶
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClick(job)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>確認刪除</AlertDialogTitle>
                              <AlertDialogDescription>
                                您確定要刪除職位「{job.name}」嗎？此操作無法復原。
                                {job.userCount > 0 && (
                                  <span className="text-red-600 block mt-2">
                                    注意：此職位目前有 {job.userCount} 位用戶，無法刪除。
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(job.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={job.userCount > 0}
                              >
                                刪除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  上一頁
                </Button>
                <span className="flex items-center px-4 text-sm">
                  第 {page} 頁，共 {totalPages} 頁
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  下一頁
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* 新增職位對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增職位</DialogTitle>
            <DialogDescription>
              創建新的職位並分配技能要求
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">職位名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="請輸入職位名稱"
                />
              </div>
              <div>
                <Label htmlFor="department">所屬部門 *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇部門" />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments || []).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>技能要求</Label>
              
              {/* Search Input */}
              <div className="mt-2 mb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜尋技能或類別..."
                    value={skillSearchTerm}
                    onChange={(e) => setSkillSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Skills grouped by category */}
              <div className="max-h-80 overflow-y-auto border rounded-md">
                {(() => {
                  const filteredSkills = filterSkills(skills || [], skillSearchTerm)
                  const groupedSkills = groupSkillsByCategory(filteredSkills)
                  
                  return Object.entries(groupedSkills).map(([categoryName, categoryData]) => {
                    const isExpanded = expandedCategories.has(categoryName)
                    const selectedInCategory = categoryData.skills.filter(skill => 
                      formData.skillIds.some(s => s.id === skill.id)
                    ).length
                    
                    return (
                      <div key={categoryName} className="border-b last:border-b-0">
                        {/* Category Header with Color */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(categoryName)}
                          className="w-full flex items-center justify-between p-3 hover:opacity-90 transition-all"
                          style={{ 
                            backgroundColor: `${categoryData.color}15`,
                            borderLeft: `4px solid ${categoryData.color}`
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" style={{ color: categoryData.color }} />
                            ) : (
                              <ChevronRight className="h-4 w-4" style={{ color: categoryData.color }} />
                            )}
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoryData.color }}
                            />
                            <span className="font-medium">{categoryName}</span>
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${categoryData.color}25`,
                                color: categoryData.color,
                                border: `1px solid ${categoryData.color}40`
                              }}
                            >
                              {selectedInCategory}/{categoryData.skills.length}
                            </Badge>
                          </div>
                        </button>
                        
                        {/* Category Skills */}
                        {isExpanded && (
                          <div 
                            className="px-3 pb-3 space-y-2"
                            style={{ backgroundColor: `${categoryData.color}08` }}
                          >
                            {categoryData.skills.map((skill) => {
                              const isSelected = formData.skillIds.includes(skill.id)
                              
                              return (
                                <div 
                                  key={skill.id} 
                                  className="flex items-center justify-between space-x-2 p-2 rounded hover:shadow-sm transition-shadow"
                                  style={{ 
                                    borderLeft: `3px solid ${categoryData.color}`,
                                    borderTop: isSelected ? `1px solid ${categoryData.color}` : '1px solid #e5e7eb',
                                    borderRight: isSelected ? `1px solid ${categoryData.color}` : '1px solid #e5e7eb',
                                    borderBottom: isSelected ? `1px solid ${categoryData.color}` : '1px solid #e5e7eb',
                                    backgroundColor: isSelected ? `${categoryData.color}10` : 'white'
                                  }}
                                >
                                  <div className="flex items-center space-x-2 flex-1">
                                    <Checkbox
                                      id={`skill-${skill.id}`}
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleSkillToggle(skill.id, !!checked)}
                                    />
                                    <Label htmlFor={`skill-${skill.id}`} className="text-sm flex-1">
                                      <span className="font-medium">{skill.name}</span>
                                    </Label>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>
              創建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編輯職位對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯職位</DialogTitle>
            <DialogDescription>
              修改職位資訊與技能要求
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">職位名稱 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="請輸入職位名稱"
                />
              </div>
              <div>
                <Label htmlFor="edit-department">所屬部門 *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇部門" />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments || []).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>技能要求</Label>
              
              {/* Search Input */}
              <div className="mt-2 mb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜尋技能或類別..."
                    value={skillSearchTerm}
                    onChange={(e) => setSkillSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Skills grouped by category */}
              <div className="max-h-80 overflow-y-auto border rounded-md">
                {(() => {
                  const filteredSkills = filterSkills(skills || [], skillSearchTerm)
                  const groupedSkills = groupSkillsByCategory(filteredSkills)
                  
                  return Object.entries(groupedSkills).map(([categoryName, categoryData]) => {
                    const isExpanded = expandedCategories.has(categoryName)
                    const selectedInCategory = categoryData.skills.filter(skill => 
                      formData.skillIds.some(s => s.id === skill.id)
                    ).length
                    
                    return (
                      <div key={categoryName} className="border-b last:border-b-0">
                        {/* Category Header with Color */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(categoryName)}
                          className="w-full flex items-center justify-between p-3 hover:opacity-90 transition-all"
                          style={{ 
                            backgroundColor: `${categoryData.color}15`,
                            borderLeft: `4px solid ${categoryData.color}`
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" style={{ color: categoryData.color }} />
                            ) : (
                              <ChevronRight className="h-4 w-4" style={{ color: categoryData.color }} />
                            )}
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoryData.color }}
                            />
                            <span className="font-medium">{categoryName}</span>
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${categoryData.color}25`,
                                color: categoryData.color,
                                border: `1px solid ${categoryData.color}40`
                              }}
                            >
                              {selectedInCategory}/{categoryData.skills.length}
                            </Badge>
                          </div>
                        </button>
                        
                        {/* Category Skills */}
                        {isExpanded && (
                          <div 
                            className="px-3 pb-3 space-y-2"
                            style={{ backgroundColor: `${categoryData.color}08` }}
                          >
                            {categoryData.skills.map((skill) => {
                              const isSelected = formData.skillIds.includes(skill.id)
                              
                              return (
                                <div 
                                  key={skill.id} 
                                  className="flex items-center justify-between space-x-2 p-2 rounded hover:shadow-sm transition-shadow"
                                  style={{ 
                                    borderLeft: `3px solid ${categoryData.color}`,
                                    borderTop: isSelected ? `1px solid ${categoryData.color}` : '1px solid #e5e7eb',
                                    borderRight: isSelected ? `1px solid ${categoryData.color}` : '1px solid #e5e7eb',
                                    borderBottom: isSelected ? `1px solid ${categoryData.color}` : '1px solid #e5e7eb',
                                    backgroundColor: isSelected ? `${categoryData.color}10` : 'white'
                                  }}
                                >
                                  <div className="flex items-center space-x-2 flex-1">
                                    <Checkbox
                                      id={`edit-skill-${skill.id}`}
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleSkillToggle(skill.id, !!checked)}
                                    />
                                    <Label htmlFor={`edit-skill-${skill.id}`} className="text-sm flex-1">
                                      <span className="font-medium">{skill.name}</span>
                                    </Label>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}