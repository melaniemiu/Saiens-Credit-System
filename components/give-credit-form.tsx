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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployeeId) {
      toast({
        title: "請選擇同事",
        description: "您需要選擇一位同事來給予 Credit",
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

    setIsSubmitting(true)

    try {
      const response = await creditApi.giveCredit(selectedEmployeeId, reason)

      if (response.error) {
        throw new Error(response.error)
      }

      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId)

      toast({
        title: "Credit 已送出",
        description: `您已成功給予 ${selectedEmployee?.name} Credit`,
      })

      // Update remaining credits
      if (response.data?.remainingCredits !== undefined) {
        setRemainingCredits(response.data.remainingCredits)
      }

      // Reset form
      setSelectedEmployeeId("")
      setReason("")

      // Refresh user data
      refreshUser()
    } catch (error) {
      console.error("Failed to give credit:", error)
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
          <p className="mt-2">Selected Employee ID: {selectedEmployeeId || '(none)'}</p>
          <p>Total Employees: {employees.length}</p>

          {selectedEmployeeId && (
            <div className="mt-2">
              <p>Selected Employee Details:</p>
              <pre>{JSON.stringify(employees.find(e => e.id === selectedEmployeeId), null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="employee">選擇同事</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isLoading}
            >
              {selectedEmployeeId ?
                employees.find(emp => emp.id === selectedEmployeeId)?.name || "選擇同事..."
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
                        // Always select the employee when clicked
                        setSelectedEmployeeId(employee.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0",
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

        {selectedEmployeeId && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(() => {
              const employee = employees.find(emp => emp.id === selectedEmployeeId);
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
                    onClick={() => setSelectedEmployeeId("")}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {employee.name}</span>
                  </button>
                </Badge>
              );
            })()}
          </div>
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
        {isSubmitting ? "處理中..." : "送出 Credit"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        您今日還可以給予 {remainingCredits} 次 Credit
      </p>
    </form>
  )
}
