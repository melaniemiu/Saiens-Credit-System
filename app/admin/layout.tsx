export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div suppressHydrationWarning>{children}</div>
}