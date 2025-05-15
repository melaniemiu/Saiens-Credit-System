"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { userApi, creditApi } from "@/lib/api"
import { useAuth } from "@/context/auth-context"

interface Employee {
  id: string
  name: string
  department: string
  originalDepartment?: any // For debugging
}

export function GiveCreditForm() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  // For logging only - to help debug the department structure
  const [apiResponseExample, setApiResponseExample] = useState<any>(null)
  const [reason, setReason] = useState("")
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [remainingCredits, setRemainingCredits] = useState(0)
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
          // Store the first user to inspect the structure
          if (response.data.users.length > 0) {
            console.log("Example user data:", JSON.stringify(response.data.users[0], null, 2));
            setApiResponseExample(response.data.users[0]);
          }

          const mappedEmployees = response.data.users.map(emp => {
            // Log everything to help diagnose
            console.log("Employee data:", JSON.stringify(emp, null, 2));

            // Check which field the department is in
            let departmentName = "未分配部門";

            if (typeof emp.Department === 'object' && emp.Department && emp.Department.name) {
              console.log("Using Department.name path for:", emp.name);
              departmentName = emp.Department.name;
            } else {
              console.log("No department found for employee:", emp.name);

              // Log all properties to check what fields are available
              console.log("Available properties:", Object.keys(emp));
              if (emp.departmentId) {
                console.log("Has departmentId but no Department object");
              }
            }

            return {
              id: emp.id,
              name: emp.name,
              department: departmentName,
              // Keep original data for debug purposes
              originalDepartment: emp.Department
            };
          });
          setEmployees(mappedEmployees);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
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
          console.log("User remaining daily credits:", user.remainingDailyCredits);
          setRemainingCredits(user.remainingDailyCredits || 0);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
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
      const isSelected = prev.includes(employeeId);
      if (isSelected) {
        return prev.filter(id => id !== employeeId);
      } else {
        // No need to check against remaining credits since bulk operation only uses 1 credit
        return [...prev, employeeId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedEmployeeIds.length === 0) {
      toast({
        title: "請選擇同事",
        description: "您需要選擇至少一位同事來給予 Credit",
        variant: "destructive",
      })
      return
    }

    if (!reason.trim()) {
      toast({
        title: "請填寫表彰原因",
        description: "您需要填寫給予 Credit 的原因",
        variant: "destructive",
      })
      return
    }

    if (remainingCredits <= 0) {
      toast({
        title: "超過每日限制",
        description: `您今日已無剩餘的 Credit 額度`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Use the new bulk API to send credits to all selected employees
      const response = await creditApi.giveBulkCredit(selectedEmployeeIds, reason);

      if (response.error) {
        throw new Error(response.error);
      }

      const selectedEmployeeNames = selectedEmployeeIds
        .map(id => employees.find(emp => emp.id === id)?.name)
        .filter(Boolean)
        .join("、");

      toast({
        title: "Credit 已送出",
        description: `您已成功給予 ${selectedEmployeeNames} Credit`,
      })

      // Update remaining credits from the response
      if (response.data?.remainingCredits !== undefined) {
        setRemainingCredits(response.data.remainingCredits);
      }

      // Reset form
      setSelectedEmployeeIds([])
      setReason("")

      // Refresh user data
      refreshUser()
    } catch (error) {
      console.error("Failed to give credits:", error)
      toast({
        title: "送出失敗",
        description: error instanceof Error ? error.message : "發生錯誤，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Debug info - only shown in development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-gray-100 p-2 mb-4 rounded text-xs overflow-auto max-h-32">
          {apiResponseExample && (
            <>
              <p>API Response Structure (Debug):</p>
              <pre>{JSON.stringify(apiResponseExample, null, 2)}</pre>
            </>
          )}
          <p className="mt-2">Selected Employee IDs: {selectedEmployeeIds.join(', ') || '(none)'}</p>
          <p>Total Employees: {employees.length}</p>

          {selectedEmployeeIds.length > 0 && (
            <div className="mt-2">
              <p>Selected Employees Details:</p>
              <pre>{JSON.stringify(employees.filter(e => selectedEmployeeIds.includes(e.id)), null, 2)}</pre>
            </div>
          )}
        </div>
      )}

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
            <Command>
              <CommandInput placeholder="搜尋同事..." />
              <CommandList>
                <CommandEmpty>找不到符合的同事</CommandEmpty>
                <CommandGroup>
                  {employees
                    .filter(emp => emp.id !== user?.id) // Filter out current user
                    .map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={`${employee.name} ${employee.department}`}
                      onSelect={() => {
                        handleToggleEmployee(employee.id);
                      }}
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
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
        
        {/* 顯示剩餘積分提示 */}
        {selectedEmployeeIds.length > 0 && remainingCredits > 0 && (
          <p className="text-sm text-blue-500 mt-2">
            提示：選擇了 {selectedEmployeeIds.length} 位同事，將使用 1 次積分額度
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">表彰原因</Label>
        <Textarea
          id="reason"
          placeholder="請描述您想表彰的原因..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-gray-500">請具體描述同事的貢獻或幫助，這將有助於建立正向的工作文化</p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || remainingCredits <= 0}
      >
        {isSubmitting ? "處理中..." : `送出 Credit 給 ${selectedEmployeeIds.length > 0 ? selectedEmployeeIds.length + ' 位同事' : ''}`}
      </Button>

      <p className="text-center text-sm text-gray-500">
        您今日還可以給予 {remainingCredits} 次 Credit
        {selectedEmployeeIds.length > 0 && (
          <span className="block">
            目前已選擇 {selectedEmployeeIds.length} 位同事（只計算 1 次額度）
          </span>
        )}
      </p>
    </form>
  )
}