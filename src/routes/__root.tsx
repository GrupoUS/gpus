import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useAuth, UserButton } from '@clerk/clerk-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Toaster } from "@/components/ui/sonner"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()

  // Simple effective auth guard logic could live here or in specific routes.
  // For now we just render the structure.

  return (
    <>
      {isSignedIn ? (
        <MainLayout>
           <Outlet />
        </MainLayout>
      ) : (
        // Public / Auth layout (no sidebar)
        <main className="min-h-screen bg-background">
           <Outlet />
        </main>
      )}
      <Toaster />
      {/* Devtools only in dev */}
      <TanStackRouterDevtools />
    </>
  )
}
