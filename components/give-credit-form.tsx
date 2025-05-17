"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Check, ChevronsUpDown, X, Search, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { userApi, creditApi } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { SoftCard, SoftCardContent, SoftCardHeader, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card"

interface Employee {
  id: string
  name: string
  department: string
}

export function GiveCreditForm() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [reason, setReason] = useState("")
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [remainingCredits, setRemainingCredits] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()

  // Fetch employees only once when component mounts
  useEffect(() => {
    let isMounted = true;

    const fetchEmployees = async () => {
      if (employees.length === 0) {
        setIsLoading(true);
      }

      try {
        const response = await userApi.getUsers();

        if (response.data?.users && isMounted) {
          const mappedEmployees = response.data.users.map(emp => {
            let departmentName = "未分配部門";
            
            if (typeof emp.Department === 'object' && emp.Department && emp.Department.name) {
              departmentName = emp.Department.name;
            }

            return {
              id: emp.id,
              name: emp.name,
              department: departmentName,
            };
          });
          setEmployees(mappedEmployees);
        }
      } catch (error) {
        if (isMounted) {
          toast({
            title: "載入失敗",
            description: "無法載入同事列表，請稍後再試",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const fetchUserData = async () => {
      try {
        if (user && isMounted) {
          setRemainingCredits(user.remainingDailyCredits || 0);
        }
      } catch (error) {
      }
    };

    if (employees.length === 0) {
      fetchEmployees();
    }

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [toast, refreshUser, user, employees.length])

  const handleToggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedEmployeeIds.length === 0) {
      toast({
        title: "請選擇同事",
        description: "請至少選擇一位同事",
        variant: "destructive",
      })
      return
    }

    if (!reason || reason.length < 10) {
      toast({
        title: "請輸入理由",
        description: "理由至少需要 10 個字",
        variant: "destructive",
      })
      return
    }

    if (selectedEmployeeIds.length > remainingCredits) {
      toast({
        title: "Credit 不足",
        description: `您今日剩餘 ${remainingCredits} 個 Credit，但選擇了 ${selectedEmployeeIds.length} 位同事`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (selectedEmployeeIds.length === 1) {
        await creditApi.giveCredit(selectedEmployeeIds[0], reason)
        toast({
          title: "Credit 送出成功",
          description: "您已成功給予同事 Credit",
        })
      } else {
        await creditApi.giveBulkCredits(selectedEmployeeIds, reason)
        toast({
          title: "Credit 送出成功",
          description: `您已成功給予 ${selectedEmployeeIds.length} 位同事 Credit`,
        })
      }

      const response = await userApi.getCurrentUser();

      if (response.data?.remainingCredits !== undefined) {
        setRemainingCredits(response.data.remainingCredits);
      }

      // Reset form
      setSelectedEmployeeIds([])
      setReason("")
      setSearchQuery("")

      refreshUser()
    } catch (error) {
      toast({
        title: "送出失敗",
        description: error instanceof Error ? error.message : "發生錯誤，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredEmployees = employees.filter(emp => {
    if (emp.id === user?.id) return false;
    const query = searchQuery.toLowerCase();
    return emp.name.toLowerCase().includes(query) || 
           emp.department.toLowerCase().includes(query);
  });

  return (
    <form onSubmit={handleSubmit}>
      <SoftCard>
        <SoftCardHeader>
          <SoftCardTitle>給予 Credit</SoftCardTitle>
          <SoftCardDescription>選擇同事並說明給予 Credit 的理由</SoftCardDescription>
        </SoftCardHeader>
        <SoftCardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employee" className="text-slate-700 font-semibold">選擇同事（可多選）</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between border-gray-200 text-left font-normal shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {selectedEmployeeIds.length > 0 ?
                    `已選擇 ${selectedEmployeeIds.length} 位同事`
                    : "選擇同事..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 shadow-soft-xl">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜尋同事..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 border-gray-200"
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      找不到符合的同事
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredEmployees.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => handleToggleEmployee(employee.id)}
                          className={cn(
                            "flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-gray-100 transition-colors duration-200",
                            selectedEmployeeIds.includes(employee.id) && "bg-gray-100"
                          )}
                        >
                          <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border mr-3 transition-colors duration-200",
                            selectedEmployeeIds.includes(employee.id) 
                              ? "bg-fuchsia-500 border-fuchsia-500" 
                              : "border-gray-300"
                          )}>
                            {selectedEmployeeIds.includes(employee.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="text-slate-700">{employee.name}</span>
                          {employee.department && (
                            <span className="ml-2 text-xs text-slate-400">({employee.department})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {selectedEmployeeIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedEmployeeIds.map(employeeId => {
                  const employee = employees.find(emp => emp.id === employeeId);
                  if (!employee) return null;

                  return (
                    <Badge 
                      key={employee.id} 
                      variant="secondary" 
                      className="flex items-center gap-1 bg-gradient-fuchsia text-white border-0 pr-1 shadow-soft-xl"
                    >
                      {employee.name}
                      <button
                        type="button"
                        className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors duration-200"
                        onClick={() => setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId))}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {employee.name}</span>
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-slate-700 font-semibold">給予理由</Label>
            <Textarea
              id="reason"
              placeholder="請描述給予 Credit 的理由（至少 10 個字）"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={10}
              className="min-h-[120px] border-gray-200 shadow-soft-xl resize-none transition-all duration-300 focus:shadow-soft-2xl"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">剩餘 Credit:</span>
              <span className="text-lg font-bold text-fuchsia-500">{remainingCredits}</span>
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedEmployeeIds.length === 0}
              className="bg-gradient-fuchsia text-white border-0 shadow-soft-xl hover:shadow-soft-2xl hover:scale-[1.02] transition-all duration-300 flex items-center gap-2 px-6"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  送出中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  送出 Credit
                </>
              )}
            </Button>
          </div>
        </SoftCardContent>
      </SoftCard>
    </form>
  )
}