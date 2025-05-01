import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth as useAuthHook } from "@/hooks/useAuth"; // For hasPermission
import { useAuth as useAuthContext } from "@/context/AuthContext"; // For logout
import { Permission } from "@/domain/auth/permission";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Menu,
    Home,
    ChefHat,
    Archive,
    Users,
    User,
    Settings,
    Bell,
    LogOut,
    Plus,
    BookOpen
} from "lucide-react";
import ProtectedComponent from "@/components/ui/ProtectedComponent";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    // Use both auth hooks for different purposes
    const { user, hasPermission } = useAuthHook(); // From hooks/useAuth.ts
    const { logout } = useAuthContext(); // From context/AuthContext.tsx

    const router = useRouter();
    const [open, setOpen] = useState(false);

    // Extract user's initials for avatar
    const getInitials = () => {
        if (!user?.name) return "U";
        const parts = user.name.split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`;
        }
        return parts[0][0];
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Navigation items
    const navItems = [
        {
            title: "Dashboard",
            href: "/",
            icon: <Home className="h-5 w-5 mr-2" />,
            permission: Permission.ACCESS_APP
        },
        {
            title: "Recipes",
            href: "/recipes",
            icon: <BookOpen className="h-5 w-5 mr-2" />,
            permission: Permission.VIEW_RECIPES
        },
        {
            title: "Archive",
            href: "/archives",
            icon: <Archive className="h-5 w-5 mr-2" />,
            permission: Permission.EDIT_RECIPES
        },
        {
            title: "Users",
            href: "/users",
            icon: <Users className="h-5 w-5 mr-2" />,
            permission: Permission.VIEW_USERS
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b sticky top-0 z-40 bg-background">
                <div className="container flex h-16 items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64">
                                <div className="flex items-center mb-6 mt-4">
                                    <ChefHat className="h-6 w-6 mr-2 text-primary" />
                                    <h2 className="text-lg font-semibold">Recipe Manager</h2>
                                </div>
                                <nav className="flex flex-col gap-4">
                                    {navItems.map((item) => (
                                        <ProtectedComponent key={item.href} requiredPermission={item.permission}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center px-3 py-2 rounded-md text-sm ${router.pathname === item.href
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                                    }`}
                                                onClick={() => setOpen(false)}
                                            >
                                                {item.icon}
                                                {item.title}
                                            </Link>
                                        </ProtectedComponent>
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>
                        <Link href="/" className="flex items-center gap-2">
                            <ChefHat className="h-6 w-6 text-primary" />
                            <span className="font-semibold hidden md:inline-block">Recipe Management System</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                                3
                            </Badge>
                        </Button>

                        <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
                            <Button asChild size="sm" className="hidden md:flex">
                                <Link href="/add">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Recipe
                                </Link>
                            </Button>
                        </ProtectedComponent>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/images/placeholder.jpg" alt={user?.name || "User"} />
                                        <AvatarFallback>{getInitials()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile" className="flex items-center">
                                        <User className="h-4 w-4 mr-2" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="flex items-center">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="flex items-center text-destructive focus:text-destructive">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="container py-6">
                {children}
            </div>
        </div>
    );
}