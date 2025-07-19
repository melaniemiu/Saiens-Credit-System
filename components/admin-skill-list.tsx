"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Edit, Trash2, Brain, Building2, BookOpen, CheckCircle, Users, GitBranch, X, ChevronDown, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import CSVImportDialog from "@/components/csv-import-dialog"
import { CategoryComboInput, CategoryDisplay } from "@/components/ui/category-combo-input"

interface Department {
  id: string
  name: string
}

interface SkillCategory {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
  sortOrder: number
}

interface Skill {
  id: string
  name: string
  category: SkillCategory
  categoryId: string
  learningMethod: string
  assessmentMethod: string
  departments: Department[]
  departmentCount: number
  jobCount: number
  createdAt: string
  updatedAt: string
}

interface SkillFormData {
  name: string
  categoryName: string
  learningMethod: string
  assessmentMethod: string
  departmentIds: string[]
}

interface SkillPrerequisite {
  id: string
  name: string
  category: SkillCategory
}

export function AdminSkillList() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("__all__")
  const [departmentFilter, setDepartmentFilter] = useState("__all__")
  const [sortField, setSortField] = useState("name")
  const [sortOrder, setSortOrder] = useState("ASC")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [isPrerequisitesDialogOpen, setIsPrerequisitesDialogOpen] = useState(false)
  const [managingSkill, setManagingSkill] = useState<Skill | null>(null)
  const [prerequisites, setPrerequisites] = useState<SkillPrerequisite[]>([])
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [prerequisiteSearchTerm, setPrerequisiteSearchTerm] = useState("")
  const [expandedPrerequisiteCategories, setExpandedPrerequisiteCategories] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<SkillFormData>({
    name: "",
    categoryName: "",
    learningMethod: "",
    assessmentMethod: "",
    departmentIds: []
  })
  const { toast } = useToast()

  const fetchSkills = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAdminSkills({
        page,
        limit: 10,
        search: searchTerm,
        category: categoryFilter === "__all__" ? "" : categoryFilter,
        departmentId: departmentFilter === "__all__" ? "" : departmentFilter,
        sortField,
        sortOrder
      })
      
      if (response.data) {
        setSkills(response.data.skills)
        // Map category objects to strings for the filter dropdown
        const categoryNames = response.data.categories?.map((cat: any) => 
          typeof cat === 'string' ? cat : cat.name
        ) || []
        setCategories(categoryNames)
        setTotalPages(response.data.pagination.totalPages)
      }
    } catch (error) {
      toast({
        title: "錯誤",
        description: "載入技能資料失敗",
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
        setDepartments(response.data.departments)
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error)
    }
  }

  const fetchSkillCategories = async () => {
    try {
      const response = await apiClient.getSkillCategories()
      if (response.data) {
        setSkillCategories(response.data.categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch skill categories:", error)
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchSkillCategories()
  }, [])


  useEffect(() => {
    fetchSkills()
  }, [page, searchTerm, categoryFilter, departmentFilter, sortField, sortOrder])

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
      categoryName: "",
      learningMethod: "",
      assessmentMethod: "",
      departmentIds: []
    })
  }

  const handleCategoryCreated = (newCategory: SkillCategory) => {
    // Add the new category to the local state so it appears in dropdown immediately
    setSkillCategories(prev => [...prev, newCategory])
  }

  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: checked
        ? [...prev.departmentIds, departmentId]
        : prev.departmentIds.filter(id => id !== departmentId)
    }))
  }

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.categoryName || !formData.learningMethod || !formData.assessmentMethod) {
        toast({
          title: "錯誤",
          description: "請填寫所有必填欄位",
          variant: "destructive"
        })
        return
      }

      const response = await apiClient.createSkill({
        ...formData,
        category: formData.categoryName // Send as 'category' to backend
      })
      
      toast({
        title: "成功",
        description: "技能創建成功"
      })
      
      setIsCreateDialogOpen(false)
      resetForm()
      fetchSkills()
      await fetchSkillCategories() // Refresh categories to get the newly created ones
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "創建技能失敗",
        variant: "destructive"
      })
    }
  }

  const handleEditClick = (skill: Skill) => {
    setEditingSkill(skill)
    setFormData({
      name: skill.name,
      categoryName: skill.category?.name || '',
      learningMethod: skill.learningMethod,
      assessmentMethod: skill.assessmentMethod,
      departmentIds: skill.departments?.map(d => d.id) || []
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingSkill) return

    try {
      const response = await apiClient.updateSkill(editingSkill.id, {
        ...formData,
        category: formData.categoryName // Send as 'category' to backend
      })
      
      toast({
        title: "成功",
        description: "技能更新成功"
      })
      
      setIsEditDialogOpen(false)
      setEditingSkill(null)
      resetForm()
      fetchSkills()
      fetchSkillCategories() // Refresh categories to get any newly created ones
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "更新技能失敗",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (skillId: string) => {
    try {
      const response = await apiClient.deleteSkill(skillId)
      
      toast({
        title: "成功",
        description: "技能刪除成功"
      })
      
      fetchSkills()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "刪除技能失敗",
        variant: "destructive"
      })
    }
  }

  const handleManagePrerequisites = async (skill: Skill) => {
    setManagingSkill(skill)
    // Reset search and expanded categories
    setPrerequisiteSearchTerm("")
    setExpandedPrerequisiteCategories(new Set())
    
    try {
      // Fetch current prerequisites
      const prereqResponse = await apiClient.getSkillPrerequisites(skill.id)
      setPrerequisites(prereqResponse.data?.prerequisites || [])
      
      // Fetch all skills as available options (excluding the current skill)
      const skillsResponse = await apiClient.getAdminSkills({ limit: 1000 })
      const allSkills = skillsResponse.data?.skills || []
      setAvailableSkills(allSkills.filter(s => s.id !== skill.id))
      
      setIsPrerequisitesDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "載入前置技能失敗",
        variant: "destructive"
      })
    }
  }

  const handleAddPrerequisite = async (prerequisiteSkillId: string) => {
    if (!managingSkill) return
    
    try {
      await apiClient.addSkillPrerequisite(managingSkill.id, {
        prerequisiteSkillId,
        isRequired: true
      })
      
      toast({
        title: "成功",
        description: "前置技能新增成功"
      })
      
      // Refresh prerequisites
      const response = await apiClient.getSkillPrerequisites(managingSkill.id)
      setPrerequisites(response.data?.prerequisites || [])
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "新增前置技能失敗",
        variant: "destructive"
      })
    }
  }

  const handleRemovePrerequisite = async (prerequisiteSkillId: string) => {
    if (!managingSkill) return
    
    try {
      await apiClient.removeSkillPrerequisite(managingSkill.id, prerequisiteSkillId)
      
      toast({
        title: "成功",
        description: "前置技能移除成功"
      })
      
      // Refresh prerequisites
      const response = await apiClient.getSkillPrerequisites(managingSkill.id)
      setPrerequisites(response.data?.prerequisites || [])
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "移除前置技能失敗",
        variant: "destructive"
      })
    }
  }

  // Helper function to group skills by category for prerequisites
  const groupPrerequisiteSkillsByCategory = (skills: Skill[]) => {
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

  // Helper function to toggle prerequisite category expansion
  const togglePrerequisiteCategory = (categoryName: string) => {
    setExpandedPrerequisiteCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }


  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-3">
        <CardDescription className="text-sm">管理技能庫與部門關聯</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <div className="space-y-4">
          {/* 搜尋和篩選 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜尋技能..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="類別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部類別</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortField} onValueChange={setSortField}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">名稱</SelectItem>
                <SelectItem value="category">類別</SelectItem>
                <SelectItem value="createdAt">創建時間</SelectItem>
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
                新增技能
              </Button>
              <CSVImportDialog 
                type="skills" 
                title="技能"
                onImportComplete={fetchSkills}
              />
            </div>
          </div>

          {/* 技能列表 - Desktop */}
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
                          技能名稱
                          {sortField === "name" && (
                            <span className="ml-1">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("category")}
                      >
                        <div className="flex items-center gap-1">
                          類別
                          {sortField === "category" && (
                            <span className="ml-1">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>學習方式</TableHead>
                      <TableHead>評估方式</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Building2 className="h-4 w-4" />
                          部門數
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          職位數
                        </div>
                      </TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={8}>
                            <Skeleton className="h-12 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : skills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          沒有找到技能
                        </TableCell>
                      </TableRow>
                    ) : (
                      skills.map((skill) => (
                        <TableRow key={skill.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Brain className="h-4 w-4 text-gray-500" />
                              {skill.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <CategoryDisplay 
                              category={skill.category}
                              className="text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span className="text-sm">{skill.learningMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-sm">{skill.assessmentMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {skill.departmentCount || skill.departments?.length || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {skill.jobCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(skill)}
                                title="編輯技能"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleManagePrerequisites(skill)}
                                title="管理前置技能"
                              >
                                <GitBranch className="h-4 w-4" />
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
                                      您確定要刪除技能「{skill.name}」嗎？此操作無法復原。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(skill.id)}
                                      className="bg-red-600 hover:bg-red-700"
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

          {/* 技能列表 - Mobile */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array(5).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : skills.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  沒有找到技能
                </CardContent>
              </Card>
            ) : (
              skills.map((skill) => (
                <Card key={skill.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <Brain className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{skill.name}</div>
                          <div className="mt-1">
                            <CategoryDisplay 
                              category={skill.category}
                              className="text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {skill.learningMethod}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {skill.assessmentMethod}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {skill.departmentCount || skill.departments?.length || 0} 部門 · {skill.jobCount} 職位
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClick(skill)}
                          title="編輯技能"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleManagePrerequisites(skill)}
                          title="管理前置技能"
                        >
                          <GitBranch className="h-4 w-4" />
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
                                您確定要刪除技能「{skill.name}」嗎？此操作無法復原。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(skill.id)}
                                className="bg-red-600 hover:bg-red-700"
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

      {/* 新增技能對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增技能</DialogTitle>
            <DialogDescription>
              創建新的技能并指定所屬部門
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">技能名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="請輸入技能名稱"
                />
              </div>
              <div>
                <Label htmlFor="category">技能類別 *</Label>
                <CategoryComboInput
                  categories={skillCategories}
                  value={formData.categoryName}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryName: value }))}
                  placeholder="選擇或輸入技能類別..."
                  allowCreate={true}
                  onCategoryCreated={handleCategoryCreated}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="learningMethod">學習方式 *</Label>
                <Select
                  value={formData.learningMethod}
                  onValueChange={(value: '實體' | '線上') => setFormData(prev => ({ ...prev, learningMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇學習方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="實體">實體</SelectItem>
                    <SelectItem value="線上">線上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assessmentMethod">評估方式 *</Label>
                <Select
                  value={formData.assessmentMethod}
                  onValueChange={(value: '考卷考核' | '實作考核') => setFormData(prev => ({ ...prev, assessmentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇評估方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="考卷考核">考卷考核</SelectItem>
                    <SelectItem value="實作考核">實作考核</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div>
              <Label>所屬部門</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {departments.map((department) => (
                  <div key={department.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${department.id}`}
                      checked={formData.departmentIds.includes(department.id)}
                      onCheckedChange={(checked) => handleDepartmentToggle(department.id, !!checked)}
                    />
                    <Label htmlFor={`dept-${department.id}`} className="text-sm">
                      {department.name}
                    </Label>
                  </div>
                ))}
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

      {/* 編輯技能對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯技能</DialogTitle>
            <DialogDescription>
              修改技能資訊與部門關聯
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">技能名稱 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="請輸入技能名稱"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">技能類別 *</Label>
                <CategoryComboInput
                  categories={skillCategories}
                  value={formData.categoryName}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryName: value }))}
                  placeholder="選擇或輸入技能類別..."
                  allowCreate={true}
                  onCategoryCreated={handleCategoryCreated}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-learningMethod">學習方式 *</Label>
                <Select
                  value={formData.learningMethod}
                  onValueChange={(value: '實體' | '線上') => setFormData(prev => ({ ...prev, learningMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇學習方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="實體">實體</SelectItem>
                    <SelectItem value="線上">線上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-assessmentMethod">評估方式 *</Label>
                <Select
                  value={formData.assessmentMethod}
                  onValueChange={(value: '考卷考核' | '實作考核') => setFormData(prev => ({ ...prev, assessmentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇評估方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="考卷考核">考卷考核</SelectItem>
                    <SelectItem value="實作考核">實作考核</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div>
              <Label>所屬部門</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {departments.map((department) => (
                  <div key={department.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-dept-${department.id}`}
                      checked={formData.departmentIds.includes(department.id)}
                      onCheckedChange={(checked) => handleDepartmentToggle(department.id, !!checked)}
                    />
                    <Label htmlFor={`edit-dept-${department.id}`} className="text-sm">
                      {department.name}
                    </Label>
                  </div>
                ))}
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

      {/* Prerequisites Management Dialog */}
      <Dialog open={isPrerequisitesDialogOpen} onOpenChange={setIsPrerequisitesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>管理前置技能 - {managingSkill?.name}</DialogTitle>
            <DialogDescription>
              設定此技能需要先完成的前置技能
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Prerequisites */}
            <div>
              <h4 className="font-medium mb-3">目前的前置技能</h4>
              {prerequisites.length === 0 ? (
                <p className="text-muted-foreground text-sm">尚未設定前置技能</p>
              ) : (
                <div className="space-y-2">
                  {prerequisites.map((prerequisite) => (
                    <div key={prerequisite.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{prerequisite.name}</div>
                          <div className="text-sm text-muted-foreground">
                            <CategoryDisplay 
                              category={prerequisite.category}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          必須先完成
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePrerequisite(prerequisite.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Prerequisite */}
            <div>
              <h4 className="font-medium mb-3">新增前置技能</h4>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜尋技能名稱或類別..."
                  value={prerequisiteSearchTerm}
                  onChange={(e) => setPrerequisiteSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {(() => {
                const filteredSkills = availableSkills.filter(skill => 
                  !prerequisites.find(p => p.id === skill.id) &&
                  (prerequisiteSearchTerm === '' || 
                   skill.name.toLowerCase().includes(prerequisiteSearchTerm.toLowerCase()) ||
                   (typeof skill.category === 'string' ? skill.category : skill.category?.name || '').toLowerCase().includes(prerequisiteSearchTerm.toLowerCase()))
                )
                
                if (filteredSkills.length === 0) {
                  return (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      {prerequisiteSearchTerm ? '沒有找到符合條件的技能' : '沒有可用的技能可以新增為前置技能'}
                    </p>
                  )
                }

                const groupedSkills = groupPrerequisiteSkillsByCategory(filteredSkills)
                
                return (
                  <div className="space-y-3">
                    {Object.entries(groupedSkills).map(([categoryName, { skills, color }]) => {
                      const isExpanded = expandedPrerequisiteCategories.has(categoryName)
                      
                      return (
                        <div key={categoryName} className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-between p-4 h-auto border-l-4 hover:bg-opacity-50 transition-all duration-200"
                            style={{ 
                              borderLeftColor: color,
                              backgroundColor: isExpanded ? `${color}15` : 'transparent'
                            }}
                            onClick={() => togglePrerequisiteCategory(categoryName)}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="font-medium">{categoryName}</span>
                              <Badge variant="secondary" className="text-xs">
                                {skills.length}
                              </Badge>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {isExpanded && (
                            <div className="space-y-2 mt-2">
                              {skills.map((skill) => (
                                <div 
                                  key={skill.id} 
                                  className="ml-6 flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                                  style={{
                                    borderLeftColor: color,
                                    borderLeftWidth: '2px'
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <Brain className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">{skill.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {skill.learningMethod} · {skill.assessmentMethod}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleAddPrerequisite(skill.id)}
                                    className="shrink-0"
                                    style={{
                                      backgroundColor: color,
                                      borderColor: color
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = color;
                                      e.currentTarget.style.opacity = '0.8';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = color;
                                      e.currentTarget.style.opacity = '1';
                                    }}
                                  >
                                    新增為前置技能
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsPrerequisitesDialogOpen(false)}>
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}