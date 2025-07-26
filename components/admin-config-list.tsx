"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { clearConfigCache } from "@/hooks/use-system-config"
import { Settings, Edit, Trash2, Plus, Search, Save, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Config {
  id: string
  key: string
  value: string
  parsedValue: any
  type: 'string' | 'number' | 'boolean' | 'json'
  description: string | null
  category: string | null
  isEditable: boolean
  createdAt: string
  updatedAt: string
}

interface ConfigFormData {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
  description: string
  category: string
  isEditable: boolean
}

export function AdminConfigList() {
  const [configs, setConfigs] = useState<Config[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [categories, setCategories] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<Config | null>(null)
  const [formData, setFormData] = useState<ConfigFormData>({
    key: '',
    value: '',
    type: 'string',
    description: '',
    category: '',
    isEditable: true
  })
  const [formErrors, setFormErrors] = useState<Partial<ConfigFormData>>({})

  useEffect(() => {
    fetchConfigs()
    fetchCategories()
  }, [page, search, categoryFilter])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      // Always use real API for config management to ensure admin can always access real configs
      const response = await apiClient.getConfigsReal({
        page,
        limit: 10,
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      })

      if (response.data) {
        setConfigs(response.data.configs || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching configs:', error)
      toast({
        title: "錯誤",
        description: "無法載入系統設定",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      // Always use real API for config categories
      const response = await apiClient.getConfigCategoriesReal()
      if (response.data) {
        setCategories(response.data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleCreate = async (data: ConfigFormData) => {
    try {
      // Always use real API for config creation
      const response = await apiClient.createConfigReal(data)

      if (response.data?.success) {
        // Clear cache for the new config key
        clearConfigCache(data.key)
        
        toast({
          title: "成功",
          description: "設定已建立",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        fetchConfigs()
        fetchCategories()
      } else {
        throw new Error(response.data?.message || 'Failed to create config')
      }
    } catch (error: any) {
      console.error('Error creating config:', error)
      toast({
        title: "錯誤",
        description: error.message || "無法建立設定",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (data: ConfigFormData) => {
    if (!selectedConfig) return

    try {
      console.log(`🔧 Updating config ${selectedConfig.key} with value:`, data.value)
      
      // Always use real API for config updates to ensure database is actually updated
      const response = await apiClient.updateConfigReal(selectedConfig.key, data)

      console.log(`📝 Config update response for ${selectedConfig.key}:`, response)

      if (response.data?.success) {
        // Clear cache for the updated config key
        clearConfigCache(selectedConfig.key)
        
        console.log(`✅ Successfully updated ${selectedConfig.key} = ${data.value}`)
        
        // Trigger global system config refresh if system_name or use_mock_api was updated
        if (selectedConfig.key === 'system_name' || selectedConfig.key === 'use_mock_api') {
          console.log(`🔄 Triggering global config refresh for ${selectedConfig.key}`)
          const event = new CustomEvent('systemConfigUpdated')
          window.dispatchEvent(event)
        }
        
        toast({
          title: "成功",
          description: "設定已更新",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchConfigs()
        fetchCategories()
      } else {
        throw new Error(response.data?.message || 'Failed to update config')
      }
    } catch (error: any) {
      console.error('Error updating config:', error)
      toast({
        title: "錯誤",
        description: error.message || "無法更新設定",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedConfig) return

    try {
      // Always use real API for config deletion
      const response = await apiClient.deleteConfigReal(selectedConfig.key)

      if (response.data?.success) {
        // Clear cache for the deleted config key
        clearConfigCache(selectedConfig.key)
        
        toast({
          title: "成功",
          description: "設定已刪除",
        })
        setIsDeleteDialogOpen(false)
        fetchConfigs()
        fetchCategories()
      } else {
        throw new Error(response.data?.message || 'Failed to delete config')
      }
    } catch (error: any) {
      console.error('Error deleting config:', error)
      toast({
        title: "錯誤",
        description: error.message || "無法刪除設定",
        variant: "destructive",
      })
    }
  }

  const validateForm = (data: ConfigFormData): Partial<ConfigFormData> => {
    const errors: Partial<ConfigFormData> = {}

    if (!data.key.trim()) {
      errors.key = "設定鍵值是必填的"
    }

    if (!data.value.trim()) {
      errors.value = "設定值是必填的"
    }

    if (data.type === 'number' && isNaN(Number(data.value))) {
      errors.value = "數字類型的值必須是有效數字"
    }

    if (data.type === 'json') {
      try {
        JSON.parse(data.value)
      } catch {
        errors.value = "JSON類型的值必須是有效的JSON格式"
      }
    }

    return errors
  }

  const resetForm = () => {
    setFormData({
      key: '',
      value: '',
      type: 'string',
      description: '',
      category: '',
      isEditable: true
    })
    setFormErrors({})
  }

  const openEditDialog = (config: Config) => {
    setSelectedConfig(config)
    setFormData({
      key: config.key,
      value: config.value,
      type: config.type,
      description: config.description || '',
      category: config.category || '',
      isEditable: config.isEditable
    })
    setIsEditDialogOpen(true)
  }

  const formatValue = (config: Config) => {
    switch (config.type) {
      case 'boolean':
        return config.parsedValue ? '是' : '否'
      case 'json':
        return JSON.stringify(config.parsedValue, null, 2)
      default:
        return config.value
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'bg-blue-100 text-blue-800'
      case 'number':
        return 'bg-green-100 text-green-800'
      case 'boolean':
        return 'bg-purple-100 text-purple-800'
      case 'json':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          系統設定管理
        </CardTitle>
        <CardDescription>
          管理系統的各項設定參數，包括系統名稱、每日Credit限制等
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜尋和篩選 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜尋設定..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="選擇分類" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有分類</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新增設定
          </Button>
          <Button variant="outline" onClick={fetchConfigs} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            重新整理
          </Button>
        </div>

        {/* 設定列表 */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>設定鍵值</TableHead>
                <TableHead>設定值</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>分類</TableHead>
                <TableHead>描述</TableHead>
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
              ) : configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    沒有找到設定
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-mono font-medium">
                      {config.key}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={formatValue(config)}>
                        {formatValue(config)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(config.type)}>
                        {config.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {config.category ? (
                        <Badge variant="outline">{config.category}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={config.description || ''}>
                        {config.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(config)}
                          disabled={!config.isEditable}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedConfig(config)
                            setIsDeleteDialogOpen(true)
                          }}
                          disabled={!config.isEditable}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
      </CardContent>

      {/* 新增設定對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>新增系統設定</DialogTitle>
            <DialogDescription>
              建立新的系統設定參數
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const errors = validateForm(formData)
            if (Object.keys(errors).length > 0) {
              setFormErrors(errors)
              return
            }
            handleCreate(formData)
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key">設定鍵值 *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className={formErrors.key ? "border-red-500" : ""}
                  placeholder="例如: system_name"
                />
                {formErrors.key && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.key}</p>
                )}
              </div>
              <div>
                <Label htmlFor="type">資料類型 *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">字串 (string)</SelectItem>
                    <SelectItem value="number">數字 (number)</SelectItem>
                    <SelectItem value="boolean">布林值 (boolean)</SelectItem>
                    <SelectItem value="json">JSON 物件 (json)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">設定值 *</Label>
                {formData.type === 'boolean' ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={formData.value === 'true'}
                      onCheckedChange={(checked) => setFormData({ ...formData, value: checked ? 'true' : 'false' })}
                    />
                    <Label>{formData.value === 'true' ? '是' : '否'}</Label>
                  </div>
                ) : formData.type === 'json' ? (
                  <Textarea
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className={formErrors.value ? "border-red-500 font-mono" : "font-mono"}
                    placeholder='{"key": "value"}'
                    rows={4}
                  />
                ) : (
                  <Input
                    id="value"
                    type={formData.type === 'number' ? 'number' : 'text'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className={formErrors.value ? "border-red-500" : ""}
                    placeholder="輸入設定值"
                  />
                )}
                {formErrors.value && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.value}</p>
                )}
              </div>
              <div>
                <Label htmlFor="category">分類</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="例如: system, credits, ui"
                />
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述這個設定的用途"
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isEditable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEditable: checked })}
                />
                <Label>允許編輯</Label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}>
                取消
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                建立
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 編輯設定對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>編輯系統設定</DialogTitle>
            <DialogDescription>
              修改 {selectedConfig?.key} 的設定值
            </DialogDescription>
          </DialogHeader>
          {selectedConfig && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const errors = validateForm(formData)
              if (Object.keys(errors).length > 0) {
                setFormErrors(errors)
                return
              }
              handleUpdate(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-key">設定鍵值</Label>
                  <Input
                    id="edit-key"
                    value={formData.key}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">資料類型</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">字串 (string)</SelectItem>
                      <SelectItem value="number">數字 (number)</SelectItem>
                      <SelectItem value="boolean">布林值 (boolean)</SelectItem>
                      <SelectItem value="json">JSON 物件 (json)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-value">設定值 *</Label>
                  {formData.type === 'boolean' ? (
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={formData.value === 'true'}
                        onCheckedChange={(checked) => setFormData({ ...formData, value: checked ? 'true' : 'false' })}
                      />
                      <Label>{formData.value === 'true' ? '是' : '否'}</Label>
                    </div>
                  ) : formData.type === 'json' ? (
                    <Textarea
                      id="edit-value"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className={formErrors.value ? "border-red-500 font-mono" : "font-mono"}
                      rows={4}
                    />
                  ) : (
                    <Input
                      id="edit-value"
                      type={formData.type === 'number' ? 'number' : 'text'}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className={formErrors.value ? "border-red-500" : ""}
                    />
                  )}
                  {formErrors.value && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.value}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-category">分類</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">描述</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isEditable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isEditable: checked })}
                  />
                  <Label>允許編輯</Label>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditDialogOpen(false)
                  resetForm()
                }}>
                  取消
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  更新
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除設定 "{selectedConfig?.key}" 嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}