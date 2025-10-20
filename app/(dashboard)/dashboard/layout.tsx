"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Building2,
  Calendar,
  Users,
  ClipboardList,
  DollarSign,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Bot,
  Home,
  LogOut,
  User,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  FileText,
  UserPlus,
  CalendarPlus,
  ListPlus,
  Calculator,
  Cog,
  ShieldCheck,
  BarChart3,
  Clock,
  FileBarChart
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Suspense } from "react"
import { useDashboard } from "@/hooks/dashboard/use-dashboard"

// Import permissions system
import { canViewMenuItem, hasPermission, getCurrentPermissions, isAdmin, isSuperAdmin, getCurrentRole } from "@/lib/permissions"
import { formatIndustryLabel } from "@/utils/format-functions"

// Navigation structure with permissions and submenus
const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    show: () => true, // Dashboard always visible (will redirect based on role)
  },
  // ==============================================
  // ADMIN-ONLY: Admin Dashboard Link
  // ==============================================
  // {
  //   name: "Admin Overview",
  //   href: "/dashboard/admin",
  //   icon: BarChart3,
  //   show: () => isAdmin() || isSuperAdmin(), // Only admins see this
  // },
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: Building2,
    show: () => hasPermission('projects', 'view') || hasPermission('projects', 'viewAll'),
    subItems: [
      {
        name: "New Project",
        href: "/dashboard/projects/new",
        icon: Plus,
        show: () => hasPermission('projects', 'create'),
      },
      {
        name: "All Projects",
        href: "/dashboard/projects",
        icon: FileText,
        show: () => hasPermission('projects', 'view') || hasPermission('projects', 'viewAll'),
      },
    ]
  },
  {
    name: "Schedule",
    href: "/dashboard/schedule",
    icon: Calendar,
    show: () => hasPermission('schedule', 'view'),
    subItems: [
      {
        name: "Add Event",
        href: "/dashboard/schedule/new",
        icon: CalendarPlus,
        show: () => hasPermission('schedule', 'create'),
      },
      {
        name: "View Schedule",
        href: "/dashboard/schedule",
        icon: Calendar,
        show: () => hasPermission('schedule', 'view'),
      },
    ]
  },
  {
    name: "Punchlist",
    href: "/dashboard/punchlist",
    icon: ClipboardList,
    show: () => hasPermission('punchlist', 'view'),
    subItems: [
      {
        name: "Create Task",
        href: "/dashboard/punchlist/new",
        icon: ListPlus,
        show: () => hasPermission('punchlist', 'create'),
      },
      {
        name: "View Tasks",
        href: "/dashboard/punchlist",
        icon: ClipboardList,
        show: () => hasPermission('punchlist', 'view'),
      },
    ]
  },
  {
    name: "Team",
    href: "/dashboard/team",
    icon: Users,
    show: () => hasPermission('team', 'view'),
    subItems: [
      {
        name: "Add Member",
        href: "/dashboard/team/new",
        icon: UserPlus,
        show: () => hasPermission('team', 'add'),
      },
      {
        name: "Team Members",
        href: "/dashboard/team",
        icon: Users,
        show: () => hasPermission('team', 'view'),
      },
    ]
  },
  // ==============================================
  // ROLE-BASED: Time Tracking vs Payroll
  // ==============================================
  {
    name: "Time Tracking",
    href: "/dashboard/time-tracking",
    icon: Clock,
    // Show to non-admins (member, supervisor)
    show: () => {
      const role = getCurrentRole()
      return role === 'member' || role === 'supervisor'
    },
  },
  {
    name: "Payroll",
    href: "/dashboard/payroll",
    icon: DollarSign,
    show: () => isAdmin() || isSuperAdmin(), // Only admins see this
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: FileBarChart,
    show: () => isAdmin() || isSuperAdmin(), // Only admins see this
  },
  {
    name: "AI Assistant",
    href: "/dashboard/ai",
    icon: Bot,
    show: () => true, // AI Assistant available to all
  },
]

// Sidebar navigation component
function SidebarNavigation({ isMobile = false, onItemClick }: { isMobile?: boolean, onItemClick?: () => void }) {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  // Filter navigation items based on permissions
  const visibleNavItems = navigation.filter(item => {
    const canShow = item.show()
    // Debug logging
    return canShow
  })

  // Filter settings items based on permissions
  // const visibleSettingsItems = settingsNavigation.filter(item => item.show())

  const handleSubmenuToggle = (itemName: string) => {
    setOpenSubmenu(openSubmenu === itemName ? null : itemName)
  }

  const isItemActive = (href: string) => {
    // Special case for dashboard - active on /dashboard, /dashboard/admin, /dashboard/member
    if (href === "/dashboard") {
      return pathname === href || pathname === "/dashboard/admin" || pathname === "/dashboard/member"
    }

    // For other routes, check exact match or if it's a parent route
    return pathname === href || (pathname.startsWith(href + '/') && href !== "/dashboard")
  }

  const hasVisibleSubItems = (item: any) => {
    return item.subItems?.some((subItem: any) => subItem.show()) || false
  }

  return (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {visibleNavItems.map((item) => {
        const hasSubItems = hasVisibleSubItems(item)
        const isActive = isItemActive(item.href)
        const isSubmenuOpen = openSubmenu === item.name

        if (hasSubItems) {
          // Render collapsible menu item with subitems
          return (
            <Collapsible key={item.name} open={isSubmenuOpen} onOpenChange={() => handleSubmenuToggle(item.name)}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full px-2 justify-between text-left font-medium transition-all duration-200",
                    isActive
                      ? "bg-orange-100 text-orange-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 ease-in-out",
                      isSubmenuOpen && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-6 mt-1 space-y-1">
                {item.subItems?.filter((subItem: any) => subItem.show()).map((subItem: any) => (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200",
                      pathname === subItem.href
                        ? "bg-orange-100 text-orange-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    onClick={onItemClick}
                  >
                    <subItem.icon className="mr-3 h-4 w-4" />
                    {subItem.name}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )
        } else {
          // Render regular menu item
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive
                  ? "bg-orange-100 text-orange-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              onClick={onItemClick}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        }
      })}

      {/* Settings section - only show if user has any settings permissions */}
      {/* {visibleSettingsItems.length > 0 && (
        <>
          <div className="mt-8 mb-2">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Settings
            </h3>
          </div>
          {visibleSettingsItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                isItemActive(item.href)
                  ? "bg-orange-100 text-orange-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              onClick={onItemClick}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </>
      )} */}
    </nav>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pathname = usePathname()

  // Add this useEffect
  useEffect(() => {
    if (sidebarOpen) {
      // Small delay to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    }
  }, [sidebarOpen]);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsAnimating(false);
    setTimeout(() => setSidebarOpen(false), 300); // Match animation duration
  };

  const {
    user,
    company,
    isLoading,
    isSigningOut,
    isAuthenticated,
    userInitials,
    userFullName,
    userRoleDisplay,
    signOut,
    goToSettings,
    goToProfile,
  } = useDashboard()

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
  }




  // Show loading state while user data is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not loading, this shouldn't happen due to middleware
  // but good to have as fallback
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Authentication required</p>
          <Link
            href="/auth/login"
            className="text-orange-600 hover:text-orange-500 underline"
          >
            Please log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className={`fixed inset-0 bg-gray-600 transition-opacity duration-300 ease-out ${isAnimating ? 'opacity-75' : 'opacity-0'}`}
            onClick={closeSidebar}
          />
          <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl transform transition-transform duration-700 ease-out ${isAnimating ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-orange-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">CrewBudAI</span>
              </div>
              <Button variant="ghost" size="icon" onClick={closeSidebar}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Company info in mobile sidebar */}
            {company && (
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{company.name}</p>
                {company.industry && (
                  <p className="text-xs text-gray-500">{formatIndustryLabel(company.industry)}</p>
                )}
              </div>
            )}

            {/* Mobile Navigation */}
            <SidebarNavigation isMobile={true} onItemClick={closeSidebar} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <Building2 className="h-8 w-8 text-orange-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">CrewBudAI</span>
          </div>

          {/* Company info in desktop sidebar */}

          {company && (
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm font-medium text-gray-900">{company.name}</p>
              {company.industry && (
                <p className="text-xs text-gray-500">{formatIndustryLabel(company.industry)}</p>
              )}
              {company.size && (
                <p className="text-xs text-gray-500">Team size: {company.size}</p>
              )}
            </div>
          )}
          {/* Desktop Navigation */}
          <SidebarNavigation />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-7 text-gray-400 pl-3" />
              <input
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Search projects, tasks, team members..."
                type="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* <Button variant="ghost" size="icon">
                <Bell className="h-6 w-6" />
              </Button> */}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative !h-8 !w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={userFullName} />
                      <AvatarFallback className="bg-orange-100 text-orange-700 hover:rounded-full">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userFullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userRoleDisplay}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={goToProfile} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    {isSigningOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <Suspense>{children}</Suspense>
          </div>
        </main>
      </div>
    </div >
  )
}