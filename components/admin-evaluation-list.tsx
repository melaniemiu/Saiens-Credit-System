"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Search, ClipboardCheck, User, ArrowUpDown, ArrowUp, ArrowDown, Calendar, BookOpen } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { EvaluationModal } from "@/components/evaluation-modal"

// Helper function to safely format dates
const formatDate = (dateString: string | null | undefined, formatStr: string = 'MM/dd HH:mm'): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    return format(date, formatStr)
  } catch {
    return '-'
  }
}

interface PendingEvaluation {
  id: string
  userSkillId: string
  userId: string
  userName: string
  userEmployeeId: string
  userDepartment: string
  skillId: string
  skillName: string
  skillCategory: string
  learningMethod: string
  assessmentMethod: string
  syllabus?: string
  status: string
  score?: number
  attempts: number
  startedAt?: string
  completedAt?: string
  evaluationRequestedAt: string
  notes?: string
}

interface Department {
  id: string
  name: string
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

export function AdminEvaluationList() {
  // State management
  const [evaluations, setEvaluations] = useState<PendingEvaluation[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Sorting state
  const [sortField, setSortField] = useState<string>('evaluationRequestedAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  // Evaluation modal state
  const [selectedEvaluation, setSelectedEvaluation] = useState<{ userSkillId: string; skillName: string; userName: string } | null>(null)
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false)

  // Ensure client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  // Fetch evaluations when filters change
  useEffect(() => {
    if (mounted) {
      fetchEvaluations()
    }
  }, [mounted, page, searchTerm, departmentFilter, sortField, sortOrder])

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.getDepartments()
      if (response.data?.departments) {
        setDepartments(response.data.departments)
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error)
    }
  }

  const fetchEvaluations = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        limit: 10,
        sortField,
        sortOrder,
      }
      if (searchTerm) params.search = searchTerm
      if (departmentFilter && departmentFilter !== "all") params.departmentId = departmentFilter

      const response = await apiClient.getPendingEvaluations(params)
      if (response.data) {
        setEvaluations(response.data.evaluations)
        setTotalPages(response.data.pagination.totalPages)
        setTotalItems(response.data.pagination.totalItems)
      }
    } catch (error) {
      console.error("Failed to fetch pending evaluations:", error)
      toast({
        title: "錯誤",
        description: "無法載入待評估列表",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortField(field)
      setSortOrder('ASC')
    }
    setPage(1) // Reset to first page when sorting changes
  }

  const handleEvaluate = (evaluation: PendingEvaluation) => {
    setSelectedEvaluation({
      userSkillId: evaluation.userSkillId,
      skillName: evaluation.skillName,
      userName: evaluation.userName
    })
    setIsEvaluationModalOpen(true)
  }

  const handleEvaluationComplete = () => {
    setIsEvaluationModalOpen(false)
    setSelectedEvaluation(null)
    // Refresh the list to remove completed evaluation
    fetchEvaluations()
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            技能評估管理
          </CardTitle>
          <CardDescription className="text-sm">
            管理所有待評估的技能申請，共 {totalItems} 個待評估項目
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="搜尋使用者或技能..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
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
            </div>

            {/* Desktop Table */}
            <div className="md:block hidden">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          sortField="evaluationRequestedAt"
                          currentSortField={sortField}
                          currentSortOrder={sortOrder}
                          onSort={handleSort}
                        >
                          申請時間
                        </SortableTableHead>
                        <SortableTableHead
                          sortField="userName"
                          currentSortField={sortField}
                          currentSortOrder={sortOrder}
                          onSort={handleSort}
                        >
                          申請人
                        </SortableTableHead>
                        <SortableTableHead
                          sortField="skillName"
                          currentSortField={sortField}
                          currentSortOrder={sortOrder}
                          onSort={handleSort}
                        >
                          技能
                        </SortableTableHead>
                        <SortableTableHead
                          sortField="category"
                          currentSortField={sortField}
                          currentSortOrder={sortOrder}
                          onSort={handleSort}
                        >
                          分類
                        </SortableTableHead>
                        <TableHead>學習方式</TableHead>
                        <TableHead>評估方式</TableHead>
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
                      ) : evaluations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            目前沒有待評估的技能申請
                          </TableCell>
                        </TableRow>
                      ) : (
                        evaluations.map((evaluation) => (
                          <TableRow key={evaluation.id}>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(evaluation.evaluationRequestedAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium">{evaluation.userName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {evaluation.userEmployeeId} · {evaluation.userDepartment}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{evaluation.skillName}</div>
                              <div className="text-sm text-muted-foreground">
                                嘗試次數: {evaluation.attempts}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {evaluation.skillCategory}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {evaluation.learningMethod}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {evaluation.assessmentMethod}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleEvaluate(evaluation)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <ClipboardCheck className="h-4 w-4 mr-1" />
                                評估
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {loading ? (
                Array(5).fill(0).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : evaluations.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center text-muted-foreground">
                    目前沒有待評估的技能申請
                  </CardContent>
                </Card>
              ) : (
                evaluations.map((evaluation) => (
                  <Card key={evaluation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDate(evaluation.evaluationRequestedAt)}
                            </span>
                          </div>
                          <div className="font-medium text-lg mb-1">{evaluation.skillName}</div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {evaluation.userName} ({evaluation.userEmployeeId})
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            {evaluation.userDepartment} · 嘗試 {evaluation.attempts} 次
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {evaluation.skillCategory}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {evaluation.learningMethod}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {evaluation.assessmentMethod}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleEvaluate(evaluation)}
                          className="bg-blue-600 hover:bg-blue-700 ml-3"
                        >
                          <ClipboardCheck className="h-4 w-4 mr-1" />
                          評估
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
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
      </Card>

      {/* Evaluation Modal */}
      {selectedEvaluation && (
        <EvaluationModal
          isOpen={isEvaluationModalOpen}
          onClose={handleEvaluationComplete}
          evaluationRequest={selectedEvaluation}
        />
      )}
    </>
  )
}