import type React from "react"
import { Navbar } from "@/components/navbar"
import { MaintenanceNotice } from "@/components/maintenance-notice"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <MaintenanceNotice />
      <main className="container mx-auto py-6">{children}</main>
    </div>
  )
}
