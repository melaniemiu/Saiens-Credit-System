"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Search, Edit, Trash2, Palette, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"

interface SkillCategory {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
  sortOrder: number
  skillCount?: number
  createdAt: string
  updatedAt: string
}

interface CategoryFormData {
  name: string
  description: string
  color: string
  icon: string
  isActive: boolean
  sortOrder: number
}

export function AdminCategoryList() {
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    color: "#6B7280",
    icon: "",
    isActive: true,
    sortOrder: 0
  })
  const { toast } = useToast()

  // Default colors for quick selection
  const defaultColors = [
    "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", 
    "#EC4899", "#F97316", "#6B7280", "#84CC16", "#06B6D4"
  ]

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSkillCategories({ includeSkillCount: true })
      if (response.data) {
        setCategories(response.data.categories || [])
      }
    } catch (error) {
      toast({
        title: "錯誤",
        description: "載入類別資料失敗",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#6B7280",
      icon: "",
      isActive: true,
      sortOrder: 0
    })
  }

  const handleCreate = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "錯誤",
          description: "類別名稱為必填項目",
          variant: "destructive"
        })
        return
      }

      await apiClient.createSkillCategory(formData)
      
      toast({
        title: "成功",
        description: "類別創建成功"
      })
      
      setIsCreateDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "創建類別失敗",
        variant: "destructive"
      })
    }
  }

  const handleEditClick = (category: SkillCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#6B7280",
      icon: category.icon || "",
      isActive: category.isActive,
      sortOrder: category.sortOrder
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingCategory) return

    try {
      await apiClient.updateSkillCategory(editingCategory.id, formData)
      
      toast({
        title: "成功",
        description: "類別更新成功"
      })
      
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "更新類別失敗",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (categoryId: string) => {
    try {
      await apiClient.deleteSkillCategory(categoryId)
      
      toast({
        title: "成功",
        description: "類別刪除成功"
      })
      
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "刪除類別失敗",
        variant: "destructive"
      })
    }
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5" />
          技能類別管理
        </CardTitle>
        <CardDescription className="text-sm">管理所有技能類別設定</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <div className="space-y-4">
          {/* 搜尋和新增 */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜尋類別..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新增類別
            </Button>
          </div>

          {/* 類別列表 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>類別</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="text-center">技能數量</TableHead>
                    <TableHead className="text-center">狀態</TableHead>
                    <TableHead className="text-center">排序</TableHead>
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
                  ) : filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        沒有找到類別
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {category.color && (
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            <div>
                              <div className="font-medium">{category.name}</div>
                              {category.icon && (
                                <div className="text-xs text-muted-foreground">{category.icon}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm text-muted-foreground">
                            {category.description || "無描述"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {category.skillCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "啟用" : "停用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {category.sortOrder}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(category)}
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
                                    您確定要刪除類別「{category.name}」嗎？
                                    {category.skillCount ? (
                                      <span className="text-red-600 font-medium block mt-2">
                                        此類別目前有 {category.skillCount} 個技能正在使用，刪除後這些技能將失去類別關聯。
                                      </span>
                                    ) : (
                                      "此操作無法復原。"
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(category.id)}
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
      </CardContent>

      {/* 新增類別對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新增技能類別</DialogTitle>
            <DialogDescription>
              創建新的技能類別
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">類別名稱 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="請輸入類別名稱"
              />
            </div>
            
            <div>
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="請輸入類別描述"
              />
            </div>
            
            <div>
              <Label htmlFor="color">顏色</Label>
              <div className="space-y-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-20 h-10"
                />
                <div className="flex gap-2 flex-wrap">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color, borderColor: formData.color === color ? '#000' : 'transparent' }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="icon">圖標 (可選)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="圖標字符或emoji"
              />
            </div>
            
            <div>
              <Label htmlFor="sortOrder">排序順序</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">啟用類別</Label>
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

      {/* 編輯類別對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>編輯技能類別</DialogTitle>
            <DialogDescription>
              修改類別資訊
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">類別名稱 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="請輸入類別名稱"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">描述</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="請輸入類別描述"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-color">顏色</Label>
              <div className="space-y-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-20 h-10"
                />
                <div className="flex gap-2 flex-wrap">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color, borderColor: formData.color === color ? '#000' : 'transparent' }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-icon">圖標 (可選)</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="圖標字符或emoji"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-sortOrder">排序順序</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="edit-isActive">啟用類別</Label>
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