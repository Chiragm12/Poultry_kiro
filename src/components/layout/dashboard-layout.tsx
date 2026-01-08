"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/toaster"
import { 
  Menu, 
  Home, 
  Building2, 
  Egg, 
  Users, 
  Calendar, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  User
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["OWNER", "MANAGER", "WORKER"] },
  { name: "Farms", href: "/farms", icon: Building2, roles: ["OWNER", "MANAGER"] },
  { name: "Production", href: "/production", icon: Egg, roles: ["OWNER", "MANAGER", "WORKER"] },
  { name: "Production Cycles", href: "/production-cycles", icon: BarChart3, roles: ["OWNER", "MANAGER"] },
  { name: "Attendance", href: "/attendance", icon: Calendar, roles: ["OWNER", "MANAGER", "WORKER"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["OWNER", "MANAGER"] },
  { name: "Reports", href: "/reports", icon: FileText, roles: ["OWNER", "MANAGER"] },
  { name: "Users", href: "/users", icon: Users, roles: ["OWNER"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["OWNER", "MANAGER"] },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) {
    return null
  }

  const userRole = session.user.role
  const filteredNavigation = navigation.filter(item => item.roles.includes(userRole))

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div className="dashboard-layout min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-6 border-b">
            <h1 className="text-xl font-semibold text-gray-900">Poultry Farm</h1>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-6 border-b">
              <h1 className="text-xl font-semibold">Poultry Farm</h1>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </SheetContent>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top navigation */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1 items-center">
                <div className="text-sm text-gray-500">
                  {session.user.organizationName}
                </div>
              </div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                        <Badge variant="secondary" className="w-fit mt-1">
                          {session.user.role}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </Sheet>
    </div>
  )
}