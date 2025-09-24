
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ShieldCheck,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  Layers,
  Menu,
  Megaphone,
  BarChart,
  Wand,
  Hospital
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";

interface AppHeaderProps {
  setAdminView?: (view: string) => void;
}

export function AppHeader({ setAdminView }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (typeof window !== 'undefined') {
        const email = localStorage.getItem('userEmail');
        setUserEmail(email);
        if (email) {
          try {
            const adminDocRef = doc(db, "admins", email);
            const adminDoc = await getDoc(adminDocRef);
            setIsAdmin(adminDoc.exists());
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }
        }
      }
      setIsLoading(false);
    }
    checkUser();
  }, [pathname]);

  const getAvatarFallback = () => {
    if (isAdmin) return 'A';
    if (userEmail) return userEmail.charAt(0).toUpperCase();
    return 'U';
  }
  
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userEmail');
    }
    router.push('/login');
  }

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
          prefetch={false}
        >
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold font-headline text-primary">
            suraksha
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {isAdmin && pathname.includes("/admin") && setAdminView && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Admin Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAdminView('dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAdminView('broadcasts')}>
                <Megaphone className="mr-2 h-4 w-4" />
                <span>Broadcasts</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAdminView('reports')}>
                <BarChart className="mr-2 h-4 w-4" />
                <span>User Reports</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAdminView('predict')}>
                <Wand className="mr-2 h-4 w-4" />
                <span>Predict Today</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/register-helpline">
                  <Hospital className="mr-2 h-4 w-4" />
                  <span>Register Help Center</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Link
          href={isAdmin ? "/admin/dashboard" : "/dashboard"}
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
          prefetch={false}
        >
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold font-headline text-primary">
            suraksha
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {isAdmin && pathname.includes("/admin") ? (
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-foreground">
            <Shield className="h-5 w-5 text-accent" />
            <span>Official Dashboard</span>
          </div>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={`https://picsum.photos/seed/${userEmail || 'user'}/32/32`} />
                <AvatarFallback>
                  {getAvatarFallback()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {isAdmin ? "Official Account" : "My Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" prefetch={false}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/ui-showcase" prefetch={false}>
                  <Layers className="mr-2 h-4 w-4" />
                  <span>UI Showcase</span>
                </Link>
              </DropdownMenuItem>
            )}
            
            {isAdmin ? (
               <DropdownMenuItem asChild>
                <Link href="/dashboard" prefetch={false}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Switch to User View</span>
                </Link>
              </DropdownMenuItem>
            ) : (
              userEmail && (
                <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" prefetch={false}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Switch to Admin View</span>
                </Link>
              </DropdownMenuItem>
              )
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
