"use client"

import { useEffect, useState } from "react"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarSeparator } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { adminApi, departmentApi } from "@/lib/api"
import { DateRange } from "react-day-picker"
import { Users, CreditCard, CalendarIcon, Download, Search, UserPlus, Edit, Trash2, User, ArrowUpDown, ArrowUp, ArrowDown, Home, Menu } from "lucide-react"
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
  const [activeSection, setActiveSection] = useState<'users' | 'credits'>('users')

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

  // Sorting state for users
  const [userSortField, setUserSortField] = useState<string>('createdAt')
  const [userSortOrder, setUserSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  // Form states for create user
  const [createUserForm, setCreateUserForm] = useState<UserFormData>({
    name: '',
    email: '',
    employeeId: '',
    role: 'user',
    departmentId: ''
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
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Ensure client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  // Fetch data based on active section
  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers()
    } else {
      fetchCredits()
    }
  }, [activeSection, userPage, userSearchTerm, userDepartmentFilter, userRoleFilter, userSortField, userSortOrder,
      creditPage, creditSearchTerm, creditDepartmentFilter, creditDateRange, creditSortField, creditSortOrder])

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getDepartments()
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

      const response = await adminApi.getUsers(params)
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

      const response = await adminApi.getCredits(params)
      if (response.data) {
        setCredits(response.data.credits)
        setCreditTotalPages(response.data.totalPages)
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
      await adminApi.createUser(data)
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
        departmentId: ''
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
      await adminApi.updateUser(selectedUser.id, data)
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
      await adminApi.deleteUser(selectedUser.id)
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

      const response = await adminApi.exportCredits(params)

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

  const sidebarMenuItems = [
    {
      id: 'users',
      title: '使用者管理',
      icon: Users,
    },
    {
      id: 'credits',
      title: 'Credit 管理',
      icon: CreditCard,
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div suppressHydrationWarning>
      <SidebarProvider>
        <Sidebar className="hidden md:flex border-r flex-col w-[240px]">
        <SidebarContent className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>管理面板</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarMenuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.id as 'users' | 'credits')}
                      isActive={activeSection === item.id}
                      className="w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <div className="border-t p-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/dashboard" passHref legacyBehavior>
                    <SidebarMenuButton asChild>
                      <a className="w-full">
                        <Home className="h-4 w-4" />
                        <span>返回儀表板</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </Sidebar>

      <SidebarInset>
        <div className="flex min-h-screen">
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Mobile header with menu button */}
            <div className="md:hidden mb-4 flex items-center justify-between">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[240px]">
                  <div className="flex flex-col h-full">
                    <div className="flex-1 p-4">
                      <h2 className="text-lg font-semibold mb-4">管理面板</h2>
                      <div className="space-y-1">
                        {sidebarMenuItems.map((item) => (
                          <Button
                            key={item.id}
                            variant={activeSection === item.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                              setActiveSection(item.id as 'users' | 'credits')
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t p-4">
                      <Link href="/dashboard" passHref>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Home className="h-4 w-4 mr-2" />
                          返回儀表板
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-bold">
                {activeSection === 'users' ? '使用者管理' : 'Credit 管理'}
              </h1>
            </div>
            
            {/* Desktop header */}
            <div className="hidden md:block mb-6">
              <h1 className="text-2xl font-bold">
                {activeSection === 'users' ? '使用者管理' : 'Credit 管理'}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                      <div className="sm:col-span-2 lg:col-span-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="搜尋使用者..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                          />
                        </div>
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
                      <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
                        <UserPlus className="mr-2 h-4 w-4" />
                        新增使用者
                      </Button>
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
                                  sortField="lastLogin" 
                                  currentSortField={userSortField} 
                                  currentSortOrder={userSortOrder} 
                                  onSort={handleUserSort}
                                >
                                  最後登入
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
                                    <TableCell>{user.lastLogin ? format(new Date(user.lastLogin), 'yyyy-MM-dd HH:mm') : '從未登入'}</TableCell>
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
                                      {user.employeeId} · {user.department.name}
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

            {activeSection === 'credits' && (
              <Card>
                <CardHeader className="px-4 sm:px-6 py-3">
                  <CardDescription className="text-sm">查看和管理所有 Credit 交易記錄</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="space-y-4">
                    {/* 搜尋和篩選 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                      <div className="sm:col-span-2 lg:col-span-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="搜尋交易..."
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
                                    沒有找到交易記錄
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
                            沒有找到交易記錄
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
            </div>
          </main>
        </div>
      </SidebarInset>

      {/* 新增使用者對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
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
            
            handleCreateUser(createUserForm)
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
                  <SelectContent style={{ zIndex: 10000 }}>
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
                    setCreateUserForm({ ...createUserForm, departmentId: value })
                    if (createUserErrors.departmentId) {
                      setCreateUserErrors({ ...createUserErrors, departmentId: '' })
                    }
                  }}
                >
                  <SelectTrigger id="create-department" className={createUserErrors.departmentId ? "border-red-500" : ""}>
                    <SelectValue placeholder="選擇部門" />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 10000 }}>
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
                  departmentId: ''
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
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
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
              handleUpdateUser({
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                employeeId: formData.get('employeeId') as string,
                role: formData.get('role') as 'user' | 'admin',
                departmentId: formData.get('departmentId') as string,
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
                    <SelectContent style={{ zIndex: 10000 }}>
                      <SelectItem value="user">一般使用者</SelectItem>
                      <SelectItem value="admin">管理員</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-department">部門</Label>
                  <Select name="departmentId" defaultValue={selectedUser.department.id}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ zIndex: 10000 }}>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        <DialogContent className="sm:max-w-[425px]" style={{ zIndex: 9999 }}>
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
    </SidebarProvider>
    </div>
  )
}
