"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

// Mock credit data for admin - in a real implementation, this would come from a database
const allCredits = [
  {
    id: 1,
    from: "李大華",
    fromId: "EMP002",
    fromDept: "行銷部",
    to: "王小明",
    toId: "EMP001",
    toDept: "工程部",
    reason: "協助解決系統問題，快速且有效率",
    timestamp: "2023-06-15T09:30:00",
  },
  {
    id: 2,
    from: "王小明",
    fromId: "EMP001",
    fromDept: "工程部",
    to: "張美玲",
    toId: "EMP003",
    toDept: "人資部",
    reason: "主動協助新進同仁適應工作環境",
    timestamp: "2023-06-14T14:45:00",
  },
  {
    id: 3,
    from: "陳志明",
    fromId: "EMP004",
    fromDept: "財務部",
    to: "王小明",
    toId: "EMP001",
    toDept: "工程部",
    reason: "在專案中提供創新解決方案",
    timestamp: "2023-06-12T11:20:00",
  },
  {
    id: 4,
    from: "王小明",
    fromId: "EMP001",
    fromDept: "工程部",
    to: "林小芳",
    toId: "EMP005",
    toDept: "客服部",
    reason: "處理客戶投訴的專業態度令人印象深刻",
    timestamp: "2023-06-10T16:20:00",
  },
  {
    id: 5,
    from: "黃建國",
    fromId: "EMP006",
    fromDept: "工程部",
    to: "王小明",
    toId: "EMP001",
    toDept: "工程部",
    reason: "主動協助團隊解決技術難題",
    timestamp: "2023-06-08T15:45:00",
  },
  {
    id: 6,
    from: "王小明",
    fromId: "EMP001",
    fromDept: "工程部",
    to: "吳雅婷",
    toId: "EMP007",
    toDept: "設計部",
    reason: "設計出優秀的使用者介面，提升產品體驗",
    timestamp: "2023-06-07T13:10:00",
  },
]

export function AdminCreditList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  // Filter credits based on search term and department filter
  const filteredCredits = allCredits.filter((credit) => {
    const matchesSearch =
      credit.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment =
      departmentFilter === "all" || credit.fromDept === departmentFilter || credit.toDept === departmentFilter

    return matchesSearch && matchesDepartment
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="搜尋姓名或原因..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
            <span className="sr-only">搜尋</span>
          </Button>
        </div>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="選擇部門" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有部門</SelectItem>
            <SelectItem value="工程部">工程部</SelectItem>
            <SelectItem value="行銷部">行銷部</SelectItem>
            <SelectItem value="人資部">人資部</SelectItem>
            <SelectItem value="財務部">財務部</SelectItem>
            <SelectItem value="客服部">客服部</SelectItem>
            <SelectItem value="設計部">設計部</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>時間</TableHead>
              <TableHead>發送人</TableHead>
              <TableHead>接收人</TableHead>
              <TableHead className="hidden md:table-cell">原因</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCredits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  沒有找到符合條件的記錄
                </TableCell>
              </TableRow>
            ) : (
              filteredCredits.map((credit) => (
                <TableRow key={credit.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(credit.timestamp).toLocaleString("zh-TW")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{credit.from}</div>
                    <div className="text-xs text-gray-500">{credit.fromDept}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{credit.to}</div>
                    <div className="text-xs text-gray-500">{credit.toDept}</div>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate md:table-cell">{credit.reason}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
