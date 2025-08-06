"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Search, Edit, Trash2, Building2, Users, Brain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import CSVImportDialog from "@/components/csv-import-dialog"

interface Department {
  id: string
  name: string
  description?: string
  skillCount: number
  userCount: number
  createdAt: string
  updatedAt: string
}

interface DepartmentFormData {
  name: string
  description: string
}

export function AdminDepartmentList() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("name")
  const [sortOrder, setSortOrder] = useState("ASC")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    description: ""
  })
  const { toast } = useToast()

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAdminDepartments({
        page,
        limit: 10,
        search: searchTerm,
        sortField,
        sortOrder
      })
      
      if (response && response.data) {
        setDepartments(response.data.departments || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
      }
    } catch (error) {
      toast({
        title: "錯誤",
        description: "載入部門資料失敗",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [page, searchTerm, sortField, sortOrder])

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
      description: ""
    })
  }

  const handleCreate = async () => {
    try {
      const response = await apiClient.createDepartment(formData)
      
      toast({
        title: "成功",
        description: "部門創建成功"
      })
      
      setIsCreateDialogOpen(false)
      resetForm()
      fetchDepartments()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "創建部門失敗",
        variant: "destructive"
      })
    }
  }

  const handleEditClick = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingDepartment) return

    try {
      const response = await apiClient.updateDepartment(editingDepartment.id, formData)
      
      toast({
        title: "成功",
        description: "部門更新成功"
      })
      
      setIsEditDialogOpen(false)
      setEditingDepartment(null)
      resetForm()
      fetchDepartments()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "更新部門失敗",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (departmentId: string) => {
    try {
      const response = await apiClient.deleteDepartment(departmentId)
      
      toast({
        title: "成功",
        description: "部門刪除成功"
      })
      
      fetchDepartments()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.error || error.message || "刪除部門失敗",
        variant: "destructive"
      })
    }
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-3">
        <CardDescription className="text-sm">管理公司部門結構</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <div className="space-y-4">
          {/* 搜尋和篩選 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜尋部門..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
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
                新增部門
              </Button>
              <CSVImportDialog 
                type="departments" 
                title="部門"
                onImportComplete={fetchDepartments}
              />
            </div>
          </div>

          {/* 部門列表 - Desktop */}
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
                          部門名稱
                          {sortField === "name" && (
                            <span className="ml-1">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          員工數
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Brain className="h-4 w-4" />
                          技能數
                        </div>
                      </TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-12 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          沒有找到部門
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((department) => (
                        <TableRow key={department.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              {department.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600 max-w-xs truncate block">
                              {department.description || "無描述"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {department.userCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {department.skillCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(department)}
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
                                      您確定要刪除部門「{department.name}」嗎？此操作無法復原。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(department.id)}
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

          {/* 部門列表 - Mobile */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array(5).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : departments.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  沒有找到部門
                </CardContent>
              </Card>
            ) : (
              departments.map((department) => (
                <Card key={department.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{department.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {department.description || "無描述"}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {department.userCount} 員工 · {department.skillCount} 技能
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClick(department)}
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
                                您確定要刪除部門「{department.name}」嗎？此操作無法復原。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(department.id)}
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

      {/* 新增部門對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新增部門</DialogTitle>
            <DialogDescription>
              創建新的部門
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">部門名稱</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="請輸入部門名稱"
              />
            </div>
            <div>
              <Label htmlFor="description">部門描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="請輸入部門描述（選填）"
              />
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

      {/* 編輯部門對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>編輯部門</DialogTitle>
            <DialogDescription>
              修改部門資訊
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">部門名稱</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="請輸入部門名稱"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">部門描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="請輸入部門描述（選填）"
              />
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