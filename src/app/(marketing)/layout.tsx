import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 mt-12 sm:mt-16">
        {children}
      </main>
      <Footer />
    </div>
  )
} 