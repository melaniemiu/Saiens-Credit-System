"use client"

import { useEffect, useState } from "react"
import { AdminDepartmentList } from "@/components/admin-department-list"
import { AdminSkillList } from "@/components/admin-skill-list"
import { AdminCategoryList } from "@/components/admin-category-list"
import { AdminJobList } from "@/components/admin-job-list"
import { AdminEvaluationList } from "@/components/admin-evaluation-list"
import { AdminConfigList } from "@/components/admin-config-list"
import CSVImportDialog from "@/components/csv-import-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { triggerPromotionConfetti } from "@/lib/confetti"
import { DateRange } from "react-day-picker"
import { CalendarIcon, Download, Search, UserPlus, Edit, Trash2, User, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, Award, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface User {
  id: string
  employeeId: string
  name: string
  email: string
  profilePicture: string | null
  role: 'user' | 'admin'
  department: {
    id: string
    name: string
  }
  job?: {
    id: string
    name: string
  }
  totalCreditsReceived: number
  totalCreditsSent: number
  remainingDailyCredits: number
  createdAt: string
  lastLogin: string | null
}

interface Credit {
  id: string
  reason: string
  createdAt: string
  sender: {
    id: string
    name: string
    employeeId: string
    department: {
      name: string
    }
  }
  receiver: {
    id: string
    name: string
    employeeId: string
    department: {
      name: string
    }
  }
}

interface Department {
  id: string
  name: string
}

interface UserFormData {
  name: string
  email: string
  employeeId: string
  role: 'user' | 'admin'
  departmentId: string
  jobId?: string
}

// Helper component for sortable table headers
function SortableTableHead({
  children,
  sortField,
  currentSortField,
  currentSortOrder,
  onSort,
  className
}: {
  children: React.ReactNode
  sortField: string
  currentSortField: string
  currentSortOrder: 'ASC' | 'DESC'
  onSort: (field: string) => void
  className?: string
}) {
  const isActive = currentSortField === sortField

  return (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50 transition-colors", className)}
      onClick={() => onSort(sortField)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive ? (
          currentSortOrder === 'ASC' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </TableHead>
  )
}

export default function AdminPage() {
  // Sidebar state
  const [activeSection, setActiveSection] = useState<'users' | 'credits' | 'departments' | 'skills' | 'categories' | 'jobs' | 'evaluations' | 'configs'>('users')

  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userDepartmentFilter, setUserDepartmentFilter] = useState<string>("all")
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all")
  const [userPage, setUserPage] = useState(1)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false)
  const [promotionData, setPromotionData] = useState<any>(null)
  const [promotionLoading, setPromotionLoading] = useState(false)

  // Sorting state for users
  const [userSortField, setUserSortField] = useState<string>('createdAt')
  const [userSortOrder, setUserSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  // Form states for create user
  const [createUserForm, setCreateUserForm] = useState<UserFormData>({
    name: '',
    email: '',
    employeeId: '',
    role: 'user',
    departmentId: '',
    jobId: 'none'
  })
  const [createUserErrors, setCreateUserErrors] = useState<Partial<UserFormData>>({})

  // Credits state
  const [credits, setCredits] = useState<Credit[]>([])
  const [creditSearchTerm, setCreditSearchTerm] = useState("")
  const [creditDepartmentFilter, setCreditDepartmentFilter] = useState<string>("all")
  const [creditDateRange, setCreditDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [creditPage, setCreditPage] = useState(1)
  const [creditTotalPages, setCreditTotalPages] = useState(1)

  // Sorting state for credits
  const [creditSortField, setCreditSortField] = useState<string>('createdAt')
  const [creditSortOrder, setCreditSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  // Common state
  const [departments, setDepartments] = useState<Department[]>([])
  const [availableJobs, setAvailableJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure client-side hydration
  useEffect(() => {
    setMounted(true)
    
    // Listen for section changes from the layout sidebar
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail)
    }
    
    window.addEventListener('adminSectionChange', handleSectionChange as EventListener)
    
    return () => {
      window.removeEventListener('adminSectionChange', handleSectionChange as EventListener)
    }
  }, [])

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  // Fetch data based on active section
  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers()
    } else if (activeSection === 'credits') {
      fetchCredits()
    }
    // For other sections (evaluations, departments, skills, jobs), data is managed by their respective components
  }, [activeSection, userPage, userSearchTerm, userDepartmentFilter, userRoleFilter, userSortField, userSortOrder,
      creditPage, creditSearchTerm, creditDepartmentFilter, creditDateRange, creditSortField, creditSortOrder])

  // Load jobs when edit dialog opens
  useEffect(() => {
    if (isEditDialogOpen && selectedUser) {
      fetchJobsForDepartment(selectedUser.department.id)
    }
  }, [isEditDialogOpen, selectedUser])

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.getDepartments()
      if (response.data?.departments) {
        setDepartments(response.data.departments)
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error)
      toast({
        title: "錯誤",
        description: "無法載入部門資料",
        variant: "destructive",
      })
    }
  }

  const fetchJobsForDepartment = async (departmentId: string) => {
    if (!departmentId || departmentId === 'all') {
      setAvailableJobs([])
      return
    }

    try {
      const response = await apiClient.getJobsForDepartment(departmentId)
      if (response.data?.jobs) {
        setAvailableJobs(response.data.jobs)
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
      setAvailableJobs([])
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: userPage,
        limit: 10,
        sortField: userSortField,
        sortOrder: userSortOrder,
      }
      if (userSearchTerm) params.search = userSearchTerm
      if (userDepartmentFilter && userDepartmentFilter !== "all") params.departmentId = userDepartmentFilter
      if (userRoleFilter && userRoleFilter !== "all") params.role = userRoleFilter

      const response = await apiClient.getAdminUsers(params)
      if (response.data) {
        setUsers(response.data.users)
        setUserTotalPages(response.data.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "錯誤",
        description: "無法載入使用者資料",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCredits = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: creditPage,
        limit: 10,
        sortField: creditSortField,
        sortOrder: creditSortOrder,
      }
      if (creditSearchTerm) params.search = creditSearchTerm
      if (creditDepartmentFilter && creditDepartmentFilter !== "all") params.departmentId = creditDepartmentFilter
      if (creditDateRange.from) params.startDate = format(creditDateRange.from, 'yyyy-MM-dd')
      if (creditDateRange.to) params.endDate = format(creditDateRange.to, 'yyyy-MM-dd')

      const response = await apiClient.getAllCredits(
        params.page,
        params.limit,
        params.departmentId,
        params.startDate,
        params.endDate,
        params.search
      )
      if (response && response.data) {
        // Real API format: response.data.items (PaginatedResponse)
        setCredits(response.data.items || [])
        setCreditTotalPages(response.data.totalPages || 1)
      } else {
        console.error('Invalid response structure:', response)
        setCredits([])
        setCreditTotalPages(1)
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error)
      toast({
        title: "錯誤",
        description: "無法載入 Credit 資料",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (data: UserFormData) => {
    try {
      await apiClient.createUser(data)
      toast({
        title: "成功",
        description: "使用者已建立",
      })
      setIsCreateDialogOpen(false)
      // Reset form and errors
      setCreateUserForm({
        name: '',
        email: '',
        employeeId: '',
        role: 'user',
        departmentId: '',
        jobId: 'none'
      })
      setCreateUserErrors({})
      fetchUsers()
    } catch (error: any) {
      console.error("Failed to create user:", error)

      // Show specific error message if available
      if (error.response?.data?.message) {
        const message = error.response.data.message
        // Map backend errors to form fields
        if (message.includes("Email already exists")) {
          setCreateUserErrors({ email: "此 Email 已被使用" })
        } else if (message.includes("Employee ID already exists")) {
          setCreateUserErrors({ employeeId: "此員工編號已被使用" })
        } else if (message.includes("Invalid department")) {
          setCreateUserErrors({ departmentId: "請選擇有效的部門" })
        } else {
          toast({
            title: "錯誤",
            description: message,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "錯誤",
          description: "無法建立使用者",
          variant: "destructive",
        })
      }
    }
  }

  const handleUpdateUser = async (data: UserFormData) => {
    if (!selectedUser) return
    try {
      await apiClient.updateUser(selectedUser.id, data)
      toast({
        title: "成功",
        description: "使用者已更新",
      })
      setIsEditDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Failed to update user:", error)
      toast({
        title: "錯誤",
        description: "無法更新使用者",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    try {
      await apiClient.deleteUser(selectedUser.id)
      toast({
        title: "成功",
        description: "使用者已刪除",
      })
      setIsDeleteDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast({
        title: "錯誤",
        description: "無法刪除使用者",
        variant: "destructive",
      })
    }
  }

  // Helper function to handle sorting
  const handleUserSort = (field: string) => {
    if (userSortField === field) {
      setUserSortOrder(userSortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setUserSortField(field)
      setUserSortOrder('ASC')
    }
    setUserPage(1) // Reset to first page when sorting changes
  }

  const handleCreditSort = (field: string) => {
    if (creditSortField === field) {
      setCreditSortOrder(creditSortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setCreditSortField(field)
      setCreditSortOrder('ASC')
    }
    setCreditPage(1) // Reset to first page when sorting changes
  }

  const exportCredits = async () => {
    try {
      const params: any = {}
      if (creditSearchTerm) params.search = creditSearchTerm
      if (creditDepartmentFilter && creditDepartmentFilter !== "all") params.departmentId = creditDepartmentFilter
      if (creditDateRange.from) params.startDate = format(creditDateRange.from, 'yyyy-MM-dd')
      if (creditDateRange.to) params.endDate = format(creditDateRange.to, 'yyyy-MM-dd')

      const response = await apiClient.exportCredits(params)

      // Create a blob with BOM for proper Chinese encoding
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
      const blob = new Blob([bom, response.data], { type: 'text/csv;charset=utf-8' })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `credits_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "成功",
        description: "Credit 資料已匯出",
      })
    } catch (error) {
      console.error("Failed to export credits:", error)
      toast({
        title: "錯誤",
        description: "無法匯出 Credit 資料",
        variant: "destructive",
      })
    }
  }

  // Check user promotion eligibility
  const checkUserPromotion = async (userId: string) => {
    try {
      setPromotionLoading(true)
      const response = await apiClient.checkUserPromotion(userId)
      if (response.data) {
        setPromotionData(response.data)
        setIsPromotionDialogOpen(true)
      }
    } catch (error) {
      toast({
        title: "錯誤",
        description: "無法檢查升職資格",
        variant: "destructive",
      })
    } finally {
      setPromotionLoading(false)
    }
  }

  // Promote user to next level
  const handlePromoteUser = async () => {
    if (!selectedUser) return

    try {
      setPromotionLoading(true)
      const response = await apiClient.promoteUser(selectedUser.id)
      if (response.data) {
        // Trigger confetti for admin who performed the promotion
        triggerPromotionConfetti()
        
        toast({
          title: "升職成功",
          description: `${response.data.user.name} 已從 ${response.data.user.previousJob} 升職至 ${response.data.user.newJob}`,
        })
        setIsPromotionDialogOpen(false)
        setIsEditDialogOpen(false)
        // Refresh user list
        fetchUsers()
      }
    } catch (error: any) {
      toast({
        title: "升職失敗",
        description: error.message || "升職過程中發生錯誤",
        variant: "destructive",
      })
    } finally {
      setPromotionLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div suppressHydrationWarning>
      <div className="max-w-7xl mx-auto">
            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                {activeSection === 'users' && '使用者管理'}
                {activeSection === 'credits' && 'Credit 管理'}
                {activeSection === 'evaluations' && '技能評估管理'}
                {activeSection === 'departments' && '部門管理'}
                {activeSection === 'skills' && '技能管理'}
                {activeSection === 'categories' && '類別管理'}
                {activeSection === 'jobs' && '職位管理'}
                {activeSection === 'configs' && '系統設定'}
              </h1>
            </div>
            {activeSection === 'users' && (
              <Card className="mb-4">
                <CardHeader className="px-4 sm:px-6 py-3">
                  <CardDescription className="text-sm">管理系統中的所有使用者</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="space-y-4">
                    {/* 搜尋和篩選 */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="搜尋使用者..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                          />
                        </div>
                        <Select value={userDepartmentFilter} onValueChange={setUserDepartmentFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="選擇部門" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">所有部門</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="選擇角色" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">所有角色</SelectItem>
                            <SelectItem value="user">一般使用者</SelectItem>
                            <SelectItem value="admin">管理員</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          新增使用者
                        </Button>
                        <CSVImportDialog 
                          type="users" 
                          title="使用者"
                          onImportComplete={fetchUsers}
                        />
                      </div>
                    </div>

                    {/* 使用者列表 */}
                    <div className="md:block hidden">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <SortableTableHead
                                  sortField="name"
                                  currentSortField={userSortField}
                                  currentSortOrder={userSortOrder}
                                  onSort={handleUserSort}
                                >
                                  使用者
                                </SortableTableHead>
                                <SortableTableHead
                                  sortField="employeeId"
                                  currentSortField={userSortField}
                                  currentSortOrder={userSortOrder}
                                  onSort={handleUserSort}
                                >
                                  員工編號
                                </SortableTableHead>
                                <SortableTableHead
                                  sortField="department"
                                  currentSortField={userSortField}
                                  currentSortOrder={userSortOrder}
                                  onSort={handleUserSort}
                                >
                                  部門
                                </SortableTableHead>
                                <SortableTableHead
                                  sortField="role"
                                  currentSortField={userSortField}
                                  currentSortOrder={userSortOrder}
                                  onSort={handleUserSort}
                                >
                                  角色
                                </SortableTableHead>
                                <SortableTableHead
                                  sortField="creditsSent"
                                  currentSortField={userSortField}
                                  currentSortOrder={userSortOrder}
                                  onSort={handleUserSort}
                                >
                                  Credits
                                </SortableTableHead>
                                <SortableTableHead
                                  sortField="jobTitle"
                                  currentSortField={userSortField}
                                  currentSortOrder={userSortOrder}
                                  onSort={handleUserSort}
                                >
                                  職位
                                </SortableTableHead>
                                <TableHead>操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loading ? (
                                Array(5).fill(0).map((_, index) => (
                                  <TableRow key={index}>
                                    <TableCell colSpan={7}>
                                      <Skeleton className="h-12 w-full" />
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : users.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                                    沒有找到使用者
                                  </TableCell>
                                </TableRow>
                              ) : (
                                users.map((user) => (
                                  <TableRow key={user.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                          <AvatarImage src={user.profilePicture || ''} alt={user.name} />
                                          <AvatarFallback className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                                            <User className="h-4 w-4" />
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium">{user.name}</div>
                                          <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{user.employeeId}</TableCell>
                                    <TableCell>{user.department.name}</TableCell>
                                    <TableCell>
                                      <span className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                        user.role === 'admin'
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800"
                                      )}>
                                        {user.role === 'admin' ? '管理員' : '一般使用者'}
                                      </span>
                                    </TableCell>
                                    <TableCell>{user.totalCreditsSent} / {user.totalCreditsReceived}</TableCell>
                                    <TableCell>{user.job?.name || '未指派'}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedUser(user)
                                            setIsEditDialogOpen(true)
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedUser(user)
                                            setIsDeleteDialogOpen(true)
                                          }}
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
                      </div>
                    </div>

                    {/* Mobile user list - Card based */}
                    <div className="md:hidden space-y-3">
                      {loading ? (
                        Array(5).fill(0).map((_, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <Skeleton className="h-20 w-full" />
                            </CardContent>
                          </Card>
                        ))
                      ) : users.length === 0 ? (
                        <Card>
                          <CardContent className="p-4 text-center text-muted-foreground">
                            沒有找到使用者
                          </CardContent>
                        </Card>
                      ) : (
                        users.map((user) => (
                          <Card key={user.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.profilePicture || ''} alt={user.name} />
                                    <AvatarFallback className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                                      <User className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {user.employeeId} · {user.department.name} · {user.job?.name || '未指派'}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className={cn(
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                                        user.role === 'admin'
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800"
                                      )}>
                                        {user.role === 'admin' ? '管理員' : '使用者'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {user.totalCreditsSent}/{user.totalCreditsReceived} credits
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setIsEditDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* 分頁 */}
                    {userTotalPages > 1 && (
                      <div className="flex justify-center mt-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUserPage(userPage - 1)}
                            disabled={userPage === 1}
                          >
                            上一頁
                          </Button>
                          <span className="flex items-center px-4 text-sm">
                            第 {userPage} 頁，共 {userTotalPages} 頁
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUserPage(userPage + 1)}
                            disabled={userPage === userTotalPages}
                          >
                            下一頁
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'evaluations' && (
              <AdminEvaluationList />
            )}

            {activeSection === 'credits' && (
              <Card>
                <CardHeader className="px-4 sm:px-6 py-3">
                  <CardDescription className="text-sm">查看和管理所有 Credit 表彰記錄</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="space-y-4">
                    {/* 搜尋和篩選 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                      <div className="sm:col-span-2 lg:col-span-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="搜尋記錄..."
                            value={creditSearchTerm}
                            onChange={(e) => setCreditSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                          />
                        </div>
                      </div>
                      <Select value={creditDepartmentFilter} onValueChange={setCreditDepartmentFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇部門" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">所有部門</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal w-full",
                              !creditDateRange && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span className="truncate">
                              {creditDateRange?.from ? (
                                creditDateRange.to ? (
                                  `${format(creditDateRange.from, "PP")} - ${format(creditDateRange.to, "PP")}`
                                ) : (
                                  format(creditDateRange.from, "PP")
                                )
                              ) : (
                                "選擇日期範圍"
                              )}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={creditDateRange?.from}
                            selected={creditDateRange}
                            onSelect={(range) => setCreditDateRange(range || { from: undefined, to: undefined })}
                            numberOfMonths={1}
                          />
                        </PopoverContent>
                      </Popover>
                      <Button onClick={exportCredits} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        匯出 CSV
                      </Button>
                    </div>

                    {/* Credit 列表 - Desktop */}
                    <div className="md:block hidden">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <SortableTableHead
                                  sortField="createdAt"
                                  currentSortField={creditSortField}
                                  currentSortOrder={creditSortOrder}
                                  onSort={handleCreditSort}
                                >
                                  時間
                                </SortableTableHead>
                                <SortableTableHead
                                  sortField="sender"
                                  currentSortField={creditSortField}
                                  currentSortOrder={creditSortOrder}
                                  onSort={handleCreditSort}
                                >
                                  發送者
                                </SortableTableHead>
                                <SortableTableHead
                                  sortField="receiver"
                                  currentSortField={creditSortField}
                                  currentSortOrder={creditSortOrder}
                                  onSort={handleCreditSort}
                                >
                                  接收者
                                </SortableTableHead>
                                <TableHead>原因</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loading ? (
                                Array(5).fill(0).map((_, index) => (
                                  <TableRow key={index}>
                                    <TableCell colSpan={4}>
                                      <Skeleton className="h-12 w-full" />
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : credits.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    沒有找到記錄
                                  </TableCell>
                                </TableRow>
                              ) : (
                                credits.map((credit) => (
                                  <TableRow key={credit.id}>
                                    <TableCell>{format(new Date(credit.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                                    <TableCell>
                                      <div className="font-medium">{credit.sender?.name || '已刪除使用者'}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {credit.sender?.department?.name || '未知部門'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">{credit.receiver?.name || '已刪除使用者'}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {credit.receiver?.department?.name || '未知部門'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs">{credit.reason}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>

                    {/* Credit 列表 - Mobile */}
                    <div className="md:hidden space-y-3">
                      {loading ? (
                        Array(5).fill(0).map((_, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <Skeleton className="h-20 w-full" />
                            </CardContent>
                          </Card>
                        ))
                      ) : credits.length === 0 ? (
                        <Card>
                          <CardContent className="p-4 text-center text-muted-foreground">
                            沒有找到記錄
                          </CardContent>
                        </Card>
                      ) : (
                        credits.map((credit) => (
                          <Card key={credit.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(credit.createdAt), 'MM/dd HH:mm')}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">發送者</div>
                                  <div className="font-medium text-sm">{credit.sender?.name || '已刪除'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {credit.sender?.department?.name || '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">接收者</div>
                                  <div className="font-medium text-sm">{credit.receiver?.name || '已刪除'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {credit.receiver?.department?.name || '-'}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">原因</div>
                                <div className="text-sm">{credit.reason}</div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* 分頁 */}
                    {creditTotalPages > 1 && (
                      <div className="flex justify-center">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreditPage(creditPage - 1)}
                            disabled={creditPage === 1}
                          >
                            上一頁
                          </Button>
                          <span className="flex items-center px-4">
                            第 {creditPage} 頁，共 {creditTotalPages} 頁
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreditPage(creditPage + 1)}
                            disabled={creditPage === creditTotalPages}
                          >
                            下一頁
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'departments' && (
              <AdminDepartmentList />
            )}

            {activeSection === 'skills' && (
              <AdminSkillList />
            )}

            {activeSection === 'categories' && (
              <AdminCategoryList />
            )}

            {activeSection === 'jobs' && (
              <AdminJobList />
            )}

            {activeSection === 'configs' && (
              <AdminConfigList />
            )}

      {/* 新增使用者對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle>新增使用者</DialogTitle>
            <DialogDescription>
              建立新的使用者帳號
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            // Reset errors
            setCreateUserErrors({})

            // Validate form
            const errors: Partial<UserFormData> = {}
            if (!createUserForm.name) errors.name = "請輸入姓名"
            if (!createUserForm.email) errors.email = "請輸入 Email"
            if (!createUserForm.employeeId) errors.employeeId = "請輸入員工編號"
            if (!createUserForm.departmentId) errors.departmentId = "請選擇部門"

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (createUserForm.email && !emailRegex.test(createUserForm.email)) {
              errors.email = "請輸入有效的 Email 格式"
            }

            if (Object.keys(errors).length > 0) {
              setCreateUserErrors(errors)
              return
            }

            const formData = {
              ...createUserForm,
              jobId: createUserForm.jobId === 'none' ? null : createUserForm.jobId
            }
            handleCreateUser(formData)
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-name">姓名 *</Label>
                <Input
                  id="create-name"
                  name="name"
                  value={createUserForm.name}
                  onChange={(e) => {
                    setCreateUserForm({ ...createUserForm, name: e.target.value })
                    if (createUserErrors.name) {
                      setCreateUserErrors({ ...createUserErrors, name: '' })
                    }
                  }}
                  className={createUserErrors.name ? "border-red-500" : ""}
                />
                {createUserErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{createUserErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  name="email"
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => {
                    setCreateUserForm({ ...createUserForm, email: e.target.value })
                    if (createUserErrors.email) {
                      setCreateUserErrors({ ...createUserErrors, email: '' })
                    }
                  }}
                  className={createUserErrors.email ? "border-red-500" : ""}
                />
                {createUserErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{createUserErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="create-employeeId">員工編號 *</Label>
                <Input
                  id="create-employeeId"
                  name="employeeId"
                  value={createUserForm.employeeId}
                  onChange={(e) => {
                    setCreateUserForm({ ...createUserForm, employeeId: e.target.value })
                    if (createUserErrors.employeeId) {
                      setCreateUserErrors({ ...createUserErrors, employeeId: '' })
                    }
                  }}
                  className={createUserErrors.employeeId ? "border-red-500" : ""}
                />
                {createUserErrors.employeeId && (
                  <p className="text-sm text-red-500 mt-1">{createUserErrors.employeeId}</p>
                )}
              </div>
              <div>
                <Label htmlFor="create-role">角色 *</Label>
                <Select
                  value={createUserForm.role}
                  onValueChange={(value) => setCreateUserForm({ ...createUserForm, role: value as 'user' | 'admin' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="user">一般使用者</SelectItem>
                    <SelectItem value="admin">管理員</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-department">部門 *</Label>
                <Select
                  value={createUserForm.departmentId}
                  onValueChange={(value) => {
                    setCreateUserForm({ ...createUserForm, departmentId: value, jobId: 'none' })
                    if (createUserErrors.departmentId) {
                      setCreateUserErrors({ ...createUserErrors, departmentId: '' })
                    }
                    fetchJobsForDepartment(value)
                  }}
                >
                  <SelectTrigger id="create-department" className={createUserErrors.departmentId ? "border-red-500" : ""}>
                    <SelectValue placeholder="選擇部門" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createUserErrors.departmentId && (
                  <p className="text-sm text-red-500 mt-1">{createUserErrors.departmentId}</p>
                )}
              </div>
              <div>
                <Label htmlFor="create-job">職位</Label>
                <Select
                  value={createUserForm.jobId}
                  onValueChange={(value) => {
                    setCreateUserForm({ ...createUserForm, jobId: value })
                    if (createUserErrors.jobId) {
                      setCreateUserErrors({ ...createUserErrors, jobId: '' })
                    }
                  }}
                >
                  <SelectTrigger id="create-job">
                    <SelectValue placeholder="選擇職位 (可選)" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="none">無職位</SelectItem>
                    {availableJobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.name} (Level {job.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false)
                // Reset form and errors
                setCreateUserForm({
                  name: '',
                  email: '',
                  employeeId: '',
                  role: 'user',
                  departmentId: '',
                  jobId: 'none'
                })
                setCreateUserErrors({})
              }}>
                取消
              </Button>
              <Button type="submit">建立</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 編輯使用者對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle>編輯使用者</DialogTitle>
            <DialogDescription>
              更新使用者資訊
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const jobId = formData.get('jobId') as string
              handleUpdateUser({
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                employeeId: formData.get('employeeId') as string,
                role: formData.get('role') as 'user' | 'admin',
                departmentId: formData.get('departmentId') as string,
                jobId: jobId === 'none' ? null : jobId,
              })
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">姓名</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedUser.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedUser.email} required />
                </div>
                <div>
                  <Label htmlFor="edit-employeeId">員工編號</Label>
                  <Input id="edit-employeeId" name="employeeId" defaultValue={selectedUser.employeeId} required />
                </div>
                <div>
                  <Label htmlFor="edit-role">角色</Label>
                  <Select name="role" defaultValue={selectedUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="user">一般使用者</SelectItem>
                      <SelectItem value="admin">管理員</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-department">部門</Label>
                  <Select 
                    name="departmentId" 
                    defaultValue={selectedUser.department.id}
                    onValueChange={(value) => {
                      fetchJobsForDepartment(value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-job">職位</Label>
                  <Select name="jobId" defaultValue={selectedUser.job?.id || 'none'}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇職位 (可選)" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="none">無職位</SelectItem>
                      {availableJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.name} (Level {job.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Promotion Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">職位升級</Label>
                    <Award className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      目前職位: <span className="font-medium">{selectedUser.job?.name || '未指派'}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => checkUserPromotion(selectedUser.id)}
                      disabled={promotionLoading || !selectedUser.job}
                      className="w-full"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {promotionLoading ? '檢查中...' : '檢查升職資格'}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">更新</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[425px] z-[9999]">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除使用者 {selectedUser?.name} 嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 升職確認對話框 */}
      <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              職位升級檢查
            </DialogTitle>
            <DialogDescription>
              檢查 {selectedUser?.name} 的升職資格與技能完成情況
            </DialogDescription>
          </DialogHeader>
          
          {promotionData && (
            <div className="space-y-4">
              {/* Current and Next Job */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">目前職位</Label>
                  <div className="p-2 bg-gray-50 rounded-md text-sm">
                    {promotionData.currentJob?.name || '未指派'}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">下一級職位</Label>
                  <div className="p-2 bg-blue-50 rounded-md text-sm">
                    {promotionData.nextJob?.name || '已達最高級'}
                  </div>
                </div>
              </div>

              {/* Promotion Status */}
              <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50">
                {promotionData.canPromote ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 font-medium">符合升職資格</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 font-medium">
                      {promotionData.isMaxLevel ? '已達最高職位' : '尚未符合升職資格'}
                    </span>
                  </>
                )}
              </div>

              {/* Required Skills Progress */}
              {promotionData.requiredSkills && promotionData.requiredSkills.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">必修技能完成情況</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {promotionData.requiredSkills.map((skill: any) => (
                      <div key={skill.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{skill.name}</div>
                          <div className="text-xs text-muted-foreground">{skill.category}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {skill.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs font-medium">
                            {skill.completed ? '已完成' : '未完成'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Skills Summary */}
              {promotionData.completedSkills && promotionData.completedSkills.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">已完成技能摘要</Label>
                  <div className="text-sm text-muted-foreground">
                    已完成 {promotionData.completedSkills.length} / {promotionData.requiredSkills?.length || 0} 項必修技能
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromotionDialogOpen(false)}>
              關閉
            </Button>
            {promotionData?.canPromote && !promotionData?.isMaxLevel && (
              <Button 
                onClick={handlePromoteUser} 
                disabled={promotionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {promotionLoading ? '升職中...' : '確認升職'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
