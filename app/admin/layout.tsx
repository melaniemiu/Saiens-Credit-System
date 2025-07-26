"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Home, LogOut, Menu, Users, CreditCard, Building2, Brain, Briefcase, ClipboardCheck, Tag, Settings } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useSystemName } from "@/hooks/use-system-config"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('users')
  const { logout } = useAuth()
  const { systemName, loading } = useSystemName()

  useEffect(() => {
    // Listen for section changes to update active state
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail)
    }
    
    window.addEventListener('adminSectionChange', handleSectionChange as EventListener)
    
    return () => {
      window.removeEventListener('adminSectionChange', handleSectionChange as EventListener)
    }
  }, [])

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
    {
      id: 'configs',
      label: '系統設定',
      icon: Settings,
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50" suppressHydrationWarning>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:bg-white md:shadow-sm">
        {/* Sidebar Header */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center">
            <h1 className="text-lg font-bold gradient-text">
              {loading ? "山恩互動表彰系統" : systemName}
            </h1>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {adminMenuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={`w-full justify-start gap-3 h-11 px-3 ${
                activeSection === item.id
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
              onClick={() => {
                setActiveSection(item.id)
                const event = new CustomEvent('adminSectionChange', { detail: item.id })
                window.dispatchEvent(event)
              }}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 px-3 text-gray-700 hover:bg-gray-100">
              <Home className="h-5 w-5" />
              <span className="text-sm font-medium">返回儀表板</span>
            </Button>
          </Link>
          <Button 
            onClick={logout} 
            variant="ghost" 
            className="w-full justify-start gap-3 h-11 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">登出</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-lg font-bold gradient-text">
                {loading ? "山恩互動表彰系統" : systemName}
              </h1>
            </Link>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">切換選單</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>管理選單</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-3">
                  {adminMenuItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 h-11 px-3 ${
                        activeSection === item.id
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : ""
                      }`}
                      onClick={() => {
                        setActiveSection(item.id)
                        const event = new CustomEvent('adminSectionChange', { detail: item.id })
                        window.dispatchEvent(event)
                        setMobileMenuOpen(false)
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Button>
                  ))}

                  <div className="my-4 border-t" />

                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11 px-3"
                    >
                      <Home className="h-5 w-5" />
                      <span className="text-sm font-medium">返回儀表板</span>
                    </Button>
                  </Link>

                  <Button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-medium">登出</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}