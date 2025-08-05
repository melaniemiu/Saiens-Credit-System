"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Home, Gift, Clock, LogOut, Menu, Shield, Map } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSystemName } from "@/hooks/use-system-config"

export function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { logout, user } = useAuth()
  const isMobile = useIsMobile()
  const { systemName, loading } = useSystemName()

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    {
      href: "/dashboard",
      label: "總覽",
      icon: Home,
    },
    {
      href: "/dashboard/give-credit",
      label: "發送 Credit",
      icon: Gift,
    },
    {
      href: "/dashboard/history",
      label: "Credit 歷程",
      icon: Clock,
    },
    {
      href: "/dashboard/skills",
      label: "技能路線圖",
      icon: Map,
    },
  ]

  // Add admin link only for admin users
  const adminItem = {
    href: "/admin",
    label: "管理面板",
    icon: Shield,
  }

  return (
    <div className="sticky top-0 z-50 mt-4">
      <div className="container mx-auto px-6">
        <nav className="bg-white shadow-soft-xl rounded-2xl">
          <div className="flex h-16 items-center px-6">
        <div className="flex-1 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <h1 className="text-xl font-bold gradient-text">
              {loading ? "山恩互動表彰系統" : systemName}
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                className={`flex items-center gap-2 transition-all duration-300 ${
                  isActive(item.href)
                    ? 'bg-gradient-primary text-white shadow-soft-xl hover:shadow-soft-2xl'
                    : 'hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link href={adminItem.href}>
              <Button
                variant={isActive(adminItem.href) ? "default" : "ghost"}
                className={`flex items-center gap-2 ${isActive(adminItem.href) ? 'bg-black text-white hover:bg-gray-800' : ''}`}
              >
                <adminItem.icon className="h-4 w-4" />
                {adminItem.label}
              </Button>
            </Link>
          )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">選單</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  <SheetHeader>
                    <SheetTitle>選單</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col space-y-3">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant={isActive(item.href) ? "default" : "ghost"}
                          className={`w-full justify-start gap-2 transition-all duration-300 ${
                            isActive(item.href)
                              ? 'bg-gradient-primary text-white shadow-soft-xl'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    {user?.role === 'admin' && (
                      <Link href={adminItem.href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant={isActive(adminItem.href) ? "default" : "ghost"}
                          className={`w-full justify-start gap-2 transition-all duration-300 ${
                            isActive(adminItem.href)
                              ? 'bg-gradient-primary text-white shadow-soft-xl'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <adminItem.icon className="h-4 w-4" />
                          {adminItem.label}
                        </Button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {!isMobile && (
              <div className="hidden md:block">
                <Button onClick={logout} variant="outline" size="sm" className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4 mr-2" />
                  登出
                </Button>
              </div>
            )}
          </div>
        </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
