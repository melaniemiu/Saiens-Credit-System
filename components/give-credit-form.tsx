"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Check, ChevronsUpDown, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { userApi, creditApi } from "@/lib/api"
import { useAuth } from "@/context/auth-context"

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
    // We use a ref to track if the component is mounted
    let isMounted = true;

    const fetchEmployees = async () => {
      // Don't set loading state if we already have employees data
      // This prevents the blinking when switching to this page
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

    // Fetch user data including remaining credits
    const fetchUserData = async () => {
      try {
        // Don't refresh user data, just use what we have
        // This prevents API call loop

        // Set remaining credits from user data
        if (user && isMounted) {
          setRemainingCredits(user.remainingDailyCredits || 0);
        }
      } catch (error) {
      }
    };

    // Only fetch employees if we don't have them yet
    if (employees.length === 0) {
      fetchEmployees();
    }

    fetchUserData();

    // Cleanup function to prevent memory leaks
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

    // Check if user has remaining credits
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
        // Single credit
        await creditApi.giveCredit(selectedEmployeeIds[0], reason)
        toast({
          title: "Credit 送出成功",
          description: "您已成功給予同事 Credit",
        })
      } else {
        // Bulk credits
        await creditApi.giveBulkCredits(selectedEmployeeIds, reason)
        toast({
          title: "Credit 送出成功",
          description: `您已成功給予 ${selectedEmployeeIds.length} 位同事 Credit`,
        })
      }

      const response = await userApi.getCurrentUser();

      // Update remaining credits from the response
      if (response.data?.remainingCredits !== undefined) {
        setRemainingCredits(response.data.remainingCredits);
      }

      // Reset form
      setSelectedEmployeeIds([])
      setReason("")
      setSearchQuery("")

      // Refresh user data
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

  // Filter employees based on search query
  const filteredEmployees = employees.filter(emp => {
    if (emp.id === user?.id) return false; // Filter out current user
    const query = searchQuery.toLowerCase();
    return emp.name.toLowerCase().includes(query) || 
           emp.department.toLowerCase().includes(query);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <div className="space-y-2">
        <Label htmlFor="employee">選擇同事（可多選）</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isLoading}
            >
              {selectedEmployeeIds.length > 0 ?
                `已選擇 ${selectedEmployeeIds.length} 位同事`
                : "選擇同事..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋同事..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
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
                        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        selectedEmployeeIds.includes(employee.id) && "bg-accent"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedEmployeeIds.includes(employee.id) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span>{employee.name}</span>
                      {employee.department && (
                        <span className="ml-2 text-xs text-gray-500">({employee.department})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {selectedEmployeeIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedEmployeeIds.map(employeeId => {
              const employee = employees.find(emp => emp.id === employeeId);
              if (!employee) return null;

              return (
                <Badge key={employee.id} variant="secondary" className="flex items-center gap-1">
                  {employee.name}
                  {employee.department && (
                    <span className="text-xs text-gray-500 ml-1">({employee.department})</span>
                  )}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
        <Label htmlFor="reason">給予理由</Label>
        <Textarea
          id="reason"
          placeholder="請描述給予 Credit 的理由（至少 10 個字）"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={10}
          className="min-h-[100px]"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          剩餘 Credit: {remainingCredits}
        </div>
        <Button type="submit" disabled={isSubmitting || selectedEmployeeIds.length === 0}>
          {isSubmitting ? "送出中..." : "送出 Credit"}
        </Button>
      </div>
    </form>
  )
}