import type React from "react";
import { Navbar } from "@/components/navbar";
import { MaintenanceNotice } from "@/components/maintenance-notice";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen saiens-background"
      style={{
        backgroundImage: 'url("/saiensbkg.avif")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
      }}
    >
      <Navbar />
      <MaintenanceNotice />
      <main className="container mx-auto">{children}</main>
    </div>
  );
}
