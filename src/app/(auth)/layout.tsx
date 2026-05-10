import { Header } from "@/components/layout/Header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#EFE9D5] w-full max-w-[100vw] overflow-x-hidden">
      <Header />
      {children}
    </div>
  )
} 