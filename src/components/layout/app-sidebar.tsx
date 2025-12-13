import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "@tanstack/react-router"
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GraduationCap,
  Settings,
  Kanban,
  BarChart3,
  User
} from "lucide-react"
import { UserButton, useUser } from "@clerk/clerk-react"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "CRM", icon: Kanban, href: "/crm" },
  { title: "Chat", icon: MessageSquare, href: "/chat" },
  { title: "Alunos", icon: GraduationCap, href: "/students" },
  { title: "Relatórios", icon: BarChart3, href: "/reports" },
  { title: "Configurações", icon: Settings, href: "/settings" },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useUser()
  
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">US</span>
          </div>
          <div>
            <p className="font-semibold text-sm">Grupo US</p>
            <p className="text-xs text-muted-foreground">Portal de Gestão</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href || location.pathname.startsWith(item.href + '/')}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="flex-1 min-w-0">
             {/* Show fallback if user not loaded yet */}
            <p className="text-sm font-medium truncate">{user?.fullName || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
