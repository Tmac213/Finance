import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Calendar,
  Wallet,
  PiggyBank,
  Calculator,
  TrendingUp,
  Settings,
  LogOut,
  BarChart3,
  Users,
  UserPlus,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight },
  { title: 'Fixed Dues', url: '/fixed-dues', icon: Calendar },
  { title: 'Vibes Salary', url: '/vibes-salary', icon: Wallet },
  { title: 'Money Tracking', url: '/money-tracking', icon: PiggyBank },
  {
    title: 'Currency Calculator',
    url: '/currency-calculator',
    icon: Calculator,
  },
  { title: 'Bullion Tracking', url: '/bullion-tracking', icon: TrendingUp },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];


export function AppSidebar() {
  const { open } = useSidebar();
  const { user, signOut } = useAuth();

  const medProfiles = useLiveQuery(
    () => db.medication_profiles.where('user_id').equals(user?.uid || '').filter(p => p.deleted !== 1).toArray(),
    [user]
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground">
            Finance Manager
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : ''
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between px-2 mb-2 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="text-sidebar-foreground p-0">
              Users
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-blue-500"
              onClick={async () => {
                if (!user) return;
                const name = prompt("Enter profile name:");
                if (name) {
                  await db.medication_profiles.add({
                    id: crypto.randomUUID(),
                    user_id: user.uid,
                    name,
                    avatar: "Person",
                    dirty: 1,
                    last_modified: Date.now()
                  } as any);
                }
              }}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {medProfiles?.map((profile) => (
                <SidebarMenuItem key={profile.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/medications/${profile.id}`}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : ''
                      }
                    >
                      <Users className="h-4 w-4" />
                      <span>{profile.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-md transition-colors opacity-0 group-hover/menu-item:opacity-100">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.preventDefault();
                          const newName = prompt("Rename profile:", profile.name);
                          if (newName && newName !== profile.name) {
                            await db.medication_profiles.update(profile.id, {
                              name: newName,
                              dirty: 1,
                              last_modified: Date.now()
                            });
                          }
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (confirm(`Are you sure you want to delete profile "${profile.name}" and all its medications?`)) {
                            // Mark profile as deleted
                            await db.medication_profiles.update(profile.id, {
                              deleted: 1,
                              dirty: 1,
                              last_modified: Date.now()
                            });
                            // Mark all medications for this profile as deleted
                            const profileMeds = await db.medications
                              .where('profile_id')
                              .equals(profile.id)
                              .toArray();
                            for (const med of profileMeds) {
                              await db.medications.update(med.id, {
                                deleted: 1,
                                dirty: 1,
                                last_modified: Date.now()
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4">
          <div className="text-sm text-sidebar-foreground mb-2">
            {user?.email}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full text-blue-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-blue-500/20 hover:border-red-500/50 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
