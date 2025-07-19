"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Home, LogOut, Menu, Users, CreditCard, Building2, Brain, Briefcase, ClipboardCheck, Tag } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface AdminNavbarProps {
  activeSection: 'users' | 'credits' | 'departments' | 'skills' | 'categories' | 'jobs' | 'evaluations'
  onSectionChange: (section: 'users' | 'credits' | 'departments' | 'skills' | 'categories' | 'jobs' | 'evaluations') => void
}

export function AdminNavbar({ activeSection, onSectionChange }: AdminNavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { logout } = useAuth()

  const adminMenuItems = [
    {
      id: 'users',
      label: '使用者管理',
      icon: Users,
    },
    {
      id: 'credits',
      label: 'Credit 管理',
      icon: CreditCard,
    },
    {
      id: 'evaluations',
      label: '技能評估',
      icon: ClipboardCheck,
    },
    {
      id: 'departments',
      label: '部門管理',
      icon: Building2,
    },
    {
      id: 'skills',
      label: '技能管理',
      icon: Brain,
    },
    {
      id: 'categories',
      label: '類別管理',
      icon: Tag,
    },
    {
      id: 'jobs',
      label: '職位管理',
      icon: Briefcase,
    },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-soft-xl rounded-2xl mx-4 mt-4">
      <div className="container mx-auto flex h-16 items-center px-6">
        <div className="flex-1 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <h1 className="text-xl font-bold gradient-text">山恩互動表彰系統</h1>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4 absolute left-1/2 transform -translate-x-1/2">
            {adminMenuItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => onSectionChange(item.id as 'users' | 'credits' | 'departments' | 'skills' | 'categories' | 'jobs' | 'evaluations')}
                variant={activeSection === item.id ? "default" : "ghost"}
                className={`flex items-center gap-2 transition-all duration-300 ${
                  activeSection === item.id
                    ? 'bg-gradient-primary text-white shadow-soft-xl hover:shadow-soft-2xl'
                    : 'hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">切換選單</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                <SheetHeader>
                  <SheetTitle>選單</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-3">
                  {adminMenuItems.map((item) => (
                    <Button
                      key={item.id}
                      onClick={() => {
                        onSectionChange(item.id as 'users' | 'credits' | 'departments' | 'skills' | 'categories' | 'jobs' | 'evaluations')
                        setIsOpen(false)
                      }}
                      variant={activeSection === item.id ? "default" : "ghost"}
                      className={`w-full justify-start gap-2 transition-all duration-300 ${
                        activeSection === item.id
                          ? 'bg-gradient-primary text-white shadow-soft-xl'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}

                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <Home className="h-4 w-4" />
                      返回儀表板
                    </Button>
                  </Link>

                  <div className="my-2 border-t" />

                  <Button
                    onClick={() => {
                      logout()
                      setIsOpen(false)
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    登出
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  返回儀表板
                </Button>
              </Link>
              <Button onClick={logout} variant="outline" size="sm" className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                登出
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
