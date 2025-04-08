import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Permission } from "@/types/Permission";
import { Recipe } from "@/types/Recipe";
import { useNotify } from "@/utils/toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import ProtectedComponent from "@/components/ProtectedComponent";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

// Icons
import {
    Search,
    Plus,
    ChevronDown,
    ChefHat,
    Printer,
    Utensils,
    Clock,
    Edit,
    FileText,
    Calendar,
    Users,
    LayoutGrid,
    Settings,
    Bell,
    HelpCircle,
    BarChart,
    Coffee,
    Soup,
    Sandwich,
    Beef,
    Filter,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    MoreHorizontal,
    Eye,
    ArrowUpDown,
    ChevronsDown,
    SlidersHorizontal,
    Star,
    StarHalf,
} from "lucide-react";

/**
 * Commercial Kitchen Dashboard - Desktop Optimized
 * 
 * A comprehensive dashboard for kitchen management with:
 * - Multi-panel layout optimized for desktop
 * - Kitchen-specific widgets and visualizations
 * - Interactive elements for production planning
 * - Professional styling with proper visual hierarchy
 */
const CommercialKitchenDashboard: React.FC = () => {
    // State management
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [search, setSearch] = useState("");
    const [station, setStation] = useState("");
    const [stations, setStations] = useState<string[]>([]);
    const [activeStation, setActiveStation] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [viewMode, setViewMode] = useState<"production" | "recipes" | "stations">("production");
    const [todaysPrepList, setTodaysPrepList] = useState<{ id: string; name: string; completed: boolean }[]>([]);

    // Mock data for visualization
    const [recipeActivity] = useState([
        { name: "Crab Bisque", action: "Modified", time: "2 hours ago", user: "Chef Michael" },
        { name: "Jalapeno Marinade", action: "Created", time: "Yesterday", user: "Sous Chef Anna" },
        { name: "Veg Stock", action: "Archived", time: "3 days ago", user: "Chef Michael" },
        { name: "Caper Remoulade", action: "Modified", time: "5 days ago", user: "Pastry Chef David" },
    ]);

    // Stats for batch tracking
    const [productionStats] = useState({
        completedPrep: 65,
        pendingPrep: 35,
        todayRecipes: 8,
        totalProduction: 12,
    });

    // Hooks
    const { user, hasPermission } = useAuth();
    const notify = useNotify();
    const router = useRouter();

    // Fetch recipes on component mount
    useEffect(() => {
        if (user) {
            fetchRecipes();
            // Generate mock prep list
            generateMockPrepList();
        }
    }, [user]);

    // Generate mock prep list for demonstration
    const generateMockPrepList = () => {
        const mockPrep = [
            { id: "1", name: "Prep Crab Bisque (5L)", completed: true },
            { id: "2", name: "Make Veg Stock (20L)", completed: true },
            { id: "3", name: "Prep Jalapeno Marinade (2L)", completed: false },
            { id: "4", name: "Make Caper Remoulade (3kg)", completed: false },
            { id: "5", name: "Prep Brunch Hashbrowns (36 portions)", completed: false },
        ];
        setTodaysPrepList(mockPrep);
    };

    // Filter and sort recipes when dependencies change
    useEffect(() => {
        // Apply filters and sorting
        let filtered = recipes;

        // Filter by search term
        if (search) {
            filtered = filtered.filter(recipe =>
                recipe.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filter by station (if not viewing "all")
        if (activeStation !== "all") {
            filtered = filtered.filter(recipe => recipe.station === activeStation);
        }

        setFilteredRecipes(filtered);
    }, [recipes, search, activeStation]);

    // Fetch recipes from API
    const fetchRecipes = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/recipes");
            if (!response.ok) throw new Error("Failed to fetch recipes");

            const data = await response.json();
            setRecipes(data);

            // Extract unique stations
            const uniqueStations = Array.from(
                new Set(data.map((recipe: Recipe) => recipe.station))
            ).filter(Boolean) as string[];

            setStations(uniqueStations);
        } catch (error) {
            console.error("Error fetching recipes:", error);
            notify.error("Failed to fetch recipes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Get station icon based on station name
    const getStationIcon = (station: string) => {
        switch (station) {
            case "Garde Manger":
                return <Sandwich className="h-5 w-5" />;
            case "Entremetier":
                return <Soup className="h-5 w-5" />;
            case "Pastry":
                return <Coffee className="h-5 w-5" />;
            case "Functions":
                return <Users className="h-5 w-5" />;
            default:
                return <Utensils className="h-5 w-5" />;
        }
    };

    // Get station color based on station name
    const getStationColor = (station: string): string => {
        switch (station) {
            case "Garde Manger":
                return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "Entremetier":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "Pastry":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "Functions":
                return "bg-amber-100 text-amber-800 border-amber-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    // Toggle prep item completed state
    const togglePrepItem = (id: string) => {
        setTodaysPrepList(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, completed: !item.completed }
                    : item
            )
        );
    };

    // Calculate prep completion percentage
    const completedPrepPercentage = Math.round(
        (todaysPrepList.filter(item => item.completed).length / todaysPrepList.length) * 100
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Left Sidebar - Navigation */}
            <aside className="hidden md:flex flex-col w-64 border-r bg-white">
                <div className="p-4 border-b flex items-center space-x-2">
                    <ChefHat className="h-6 w-6 text-primary" />
                    <h1 className="font-bold text-lg">Recipe Manager</h1>
                </div>

                <nav className="flex-1 overflow-y-auto p-2">
                    <div className="mb-2 px-2 py-1.5 text-sm font-semibold text-gray-500">MAIN</div>
                    <Button
                        variant={viewMode === "production" ? "secondary" : "ghost"}
                        className="w-full justify-start mb-1 font-normal"
                        onClick={() => setViewMode("production")}
                    >
                        <BarChart className="h-4 w-4 mr-2" />
                        Production Dashboard
                    </Button>

                    <Button
                        variant={viewMode === "recipes" ? "secondary" : "ghost"}
                        className="w-full justify-start mb-1 font-normal"
                        onClick={() => setViewMode("recipes")}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Recipe Library
                    </Button>

                    <Button
                        variant={viewMode === "stations" ? "secondary" : "ghost"}
                        className="w-full justify-start mb-1 font-normal"
                        onClick={() => setViewMode("stations")}
                    >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Station Management
                    </Button>

                    <div className="mb-2 mt-6 px-2 py-1.5 text-sm font-semibold text-gray-500">KITCHEN STATIONS</div>

                    <Button
                        variant="ghost"
                        className={`w-full justify-start mb-1 font-normal ${activeStation === "all" ? "bg-gray-100" : ""}`}
                        onClick={() => setActiveStation("all")}
                    >
                        <Utensils className="h-4 w-4 mr-2" />
                        All Stations
                    </Button>

                    {stations.map(stationName => (
                        <Button
                            key={stationName}
                            variant="ghost"
                            className={`w-full justify-start mb-1 font-normal ${activeStation === stationName ? "bg-gray-100" : ""}`}
                            onClick={() => setActiveStation(stationName)}
                        >
                            {getStationIcon(stationName)}
                            <span className="ml-2">{stationName}</span>
                        </Button>
                    ))}

                    <div className="mb-2 mt-6 px-2 py-1.5 text-sm font-semibold text-gray-500">TOOLS</div>

                    <Button variant="ghost" className="w-full justify-start mb-1 font-normal">
                        <Calendar className="h-4 w-4 mr-2" />
                        Production Calendar
                    </Button>

                    <Button variant="ghost" className="w-full justify-start mb-1 font-normal">
                        <Printer className="h-4 w-4 mr-2" />
                        Print Queue
                    </Button>

                    <Button variant="ghost" className="w-full justify-start mb-1 font-normal">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </nav>

                <div className="p-4 border-t">
                    <div className="flex items-center space-x-3">
                        <Avatar>
                            <AvatarFallback>{user?.name ? user.name[0] : "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header Bar */}
                <header className="bg-white border-b px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search recipes, ingredients, stations..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 pr-10 w-full"
                                />
                                {search && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                                        onClick={() => setSearch("")}
                                    >
                                        <ChevronsDown className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="hidden md:flex">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filters
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem>
                                        <LayoutGrid className="h-4 w-4 mr-2" />
                                        Filter by Station
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Filter by Date
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Reset Filters
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="hidden md:flex">
                                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                                        View Options
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuCheckboxItem checked={true}>
                                        Show Descriptions
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={true}>
                                        Show Ingredients
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={false}>
                                        Show Archived Recipes
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center ml-4 space-x-2">
                            <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
                                <Button asChild>
                                    <Link href="/add">
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Recipe
                                    </Link>
                                </Button>
                            </ProtectedComponent>

                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5 text-gray-700" />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                            </Button>

                            <Button variant="ghost" size="icon">
                                <HelpCircle className="h-5 w-5 text-gray-700" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    {viewMode === "production" && (
                        <ProductionDashboard
                            productionStats={productionStats}
                            recipeActivity={recipeActivity}
                            todaysPrepList={todaysPrepList}
                            togglePrepItem={togglePrepItem}
                            completedPrepPercentage={completedPrepPercentage}
                            recipes={recipes}
                            stations={stations}
                            getStationColor={getStationColor}
                            getStationIcon={getStationIcon}
                        />
                    )}

                    {viewMode === "recipes" && (
                        <RecipeLibrary
                            recipes={filteredRecipes}
                            isLoading={isLoading}
                            stations={stations}
                            search={search}
                            hasPermission={hasPermission}
                            getStationColor={getStationColor}
                        />
                    )}

                    {viewMode === "stations" && (
                        <StationManagement
                            stations={stations}
                            recipes={recipes}
                            getStationColor={getStationColor}
                            getStationIcon={getStationIcon}
                            hasPermission={hasPermission}
                        />
                    )}
                </div>
            </main>

            {/* Right Context Panel - Recipe Details */}
            {selectedRecipe && (
                <aside className="hidden lg:block w-80 border-l bg-white overflow-y-auto">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold">Recipe Details</h3>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedRecipe(null)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </Button>
                    </div>
                    <div className="p-4">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">{selectedRecipe.name}</h2>
                            <Badge className={`mt-1 ${getStationColor(selectedRecipe.station)}`}>
                                {selectedRecipe.station}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-sm mb-6">
                            <div className="text-gray-500">Version:</div>
                            <div>{selectedRecipe.version || "N/A"}</div>

                            <div className="text-gray-500">Created:</div>
                            <div>{selectedRecipe.createdDate || "N/A"}</div>

                            <div className="text-gray-500">Batch Size:</div>
                            <div>{selectedRecipe.batchNumber || "N/A"}</div>

                            <div className="text-gray-500">Yield:</div>
                            <div>{selectedRecipe.yield || "N/A"}</div>

                            <div className="text-gray-500">Portion Size:</div>
                            <div>{selectedRecipe.portionSize || "N/A"}</div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold mb-2">Ingredients</h3>
                            <ul className="text-sm space-y-1">
                                {selectedRecipe.ingredients.map((ingredient, idx) => (
                                    <li key={idx} className="flex justify-between py-1 border-b border-gray-100">
                                        <span>{ingredient.productName}</span>
                                        <span className="text-gray-500">{ingredient.quantity} {ingredient.unit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold mb-2">Procedure</h3>
                            <ol className="text-sm space-y-2 list-decimal pl-5">
                                {selectedRecipe.procedure.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                ))}
                            </ol>
                        </div>

                        <div className="flex space-x-2 mt-8">
                            <Button asChild className="flex-1">
                                <Link href={`/recipe/${selectedRecipe._id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Full Details
                                </Link>
                            </Button>

                            <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                                <Button variant="outline" asChild className="flex-1">
                                    <Link href={`/edit/${selectedRecipe._id}`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Link>
                                </Button>
                            </ProtectedComponent>
                        </div>
                    </div>
                </aside>
            )}
        </div>
    );
};

// Production Dashboard Component
interface ProductionDashboardProps {
    productionStats: {
        completedPrep: number;
        pendingPrep: number;
        todayRecipes: number;
        totalProduction: number;
    };
    recipeActivity: {
        name: string;
        action: string;
        time: string;
        user: string;
    }[];
    todaysPrepList: {
        id: string;
        name: string;
        completed: boolean;
    }[];
    togglePrepItem: (id: string) => void;
    completedPrepPercentage: number;
    recipes: Recipe[];
    stations: string[];
    getStationColor: (station: string) => string;
    getStationIcon: (station: string) => React.ReactNode;
}

const ProductionDashboard: React.FC<ProductionDashboardProps> = ({
    productionStats,
    recipeActivity,
    todaysPrepList,
    togglePrepItem,
    completedPrepPercentage,
    recipes,
    stations,
    getStationColor,
    getStationIcon
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Production Dashboard</h1>
                    <p className="text-muted-foreground">Today's kitchen production overview</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        April 7, 2025
                    </Button>
                    <Button variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Production Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-1">
                            <div className="text-2xl font-bold">{productionStats.completedPrep}%</div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                On Track
                            </Badge>
                        </div>
                        <Progress value={productionStats.completedPrep} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {productionStats.completedPrep}% of today's prep is complete
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today's Production</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productionStats.todayRecipes}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Recipes in today's production schedule
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Stations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stations.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Kitchen stations with active production
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Production</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productionStats.totalProduction}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total production items this week
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Prep Column */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Today's Prep List</CardTitle>
                            <Badge variant="outline" className="h-5 flex items-center">
                                {completedPrepPercentage}% Complete
                            </Badge>
                        </div>
                        <CardDescription>
                            Production tasks for today
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {todaysPrepList.map((item) => (
                                <div key={item.id} className="flex items-center space-x-2 py-2 border-b">
                                    <Checkbox
                                        id={item.id}
                                        checked={item.completed}
                                        onCheckedChange={() => togglePrepItem(item.id)}
                                    />
                                    <label
                                        htmlFor={item.id}
                                        className={`text-sm flex-1 cursor-pointer ${item.completed ? 'line-through text-gray-400' : ''}`}
                                    >
                                        {item.name}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" className="w-full mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Prep Item
                        </Button>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20 px-6 py-3">
                        <div className="flex items-center justify-between w-full">
                            <Button variant="ghost" size="sm">
                                <Printer className="h-4 w-4 mr-2" />
                                Print List
                            </Button>
                            <Button variant="ghost" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

                {/* Recipe Activity Column */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Recipe Activity</CardTitle>
                        <CardDescription>
                            Recent changes to recipes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recipeActivity.map((activity, idx) => (
                                <div key={idx} className="border-b pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{activity.name}</p>
                                            <p className="text-sm text-muted-foreground">{activity.action} by {activity.user}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {activity.time}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20 px-6 py-3">
                        <Button variant="ghost" className="ml-auto" size="sm">
                            View All Activity
                        </Button>
                    </CardFooter>
                </Card>

                {/* Station Overview Column */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Station Overview</CardTitle>
                        <CardDescription>
                            Recipe distribution by station
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stations.map((station) => {
                                const stationRecipes = recipes.filter(r => r.station === station);
                                const percentage = Math.round((stationRecipes.length / recipes.length) * 100) || 0;

                                return (
                                    <div key={station} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center">
                                                {getStationIcon(station)}
                                                <span className="ml-2 font-medium">{station}</span>
                                            </div>
                                            <span className="text-sm">{stationRecipes.length} recipes</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Progress value={percentage} className="h-2" />
                                            <span className="text-xs">{percentage}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20 px-6 py-3">
                        <Button variant="ghost" className="ml-auto" size="sm">
                            View All Stations
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

// Recipe Library Component
interface RecipeLibraryProps {
    recipes: Recipe[];
    isLoading: boolean;
    stations: string[];
    search: string;
    hasPermission: (permission: Permission) => boolean;
    getStationColor: (station: string) => string;
}

const RecipeLibrary: React.FC<RecipeLibraryProps> = ({
    recipes,
    isLoading,
    stations,
    search,
    hasPermission,
    getStationColor
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Recipe Library</h1>
                    <p className="text-muted-foreground">Browse and manage all recipes</p>
                </div>
                <div className="flex space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                Sort By
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                            <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                            <DropdownMenuItem>Newest First</DropdownMenuItem>
                            <DropdownMenuItem>Oldest First</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
                        <Button asChild>
                            <Link href="/add">
                                <Plus className="h-4 w-4 mr-2" />
                                New Recipe
                            </Link>
                        </Button>
                    </ProtectedComponent>
                </div>
            </div>

            {/* Recipe Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : recipes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {recipes.map((recipe) => (
                        <RecipeCard
                            key={recipe._id}
                            recipe={recipe}
                            hasPermission={hasPermission}
                            getStationColor={getStationColor}
                        />
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center bg-white border border-dashed">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-muted/30 rounded-full">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                    </div>

                    <CardTitle className="text-xl font-semibold mb-2">No recipes found</CardTitle>

                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {search
                            ? "Try adjusting your search filters or create a new recipe."
                            : "Get started by adding your first recipe to the collection."}
                    </p>

                    <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
                        <Button asChild>
                            <Link href="/add">
                                <Plus className="h-4 w-4 mr-2" />
                                Create New Recipe
                            </Link>
                        </Button>
                    </ProtectedComponent>
                </Card>
            )}
        </div>
    );
};

// Station Management Component
interface StationManagementProps {
    stations: string[];
    recipes: Recipe[];
    getStationColor: (station: string) => string;
    getStationIcon: (station: string) => React.ReactNode;
    hasPermission: (permission: Permission) => boolean;
}

const StationManagement: React.FC<StationManagementProps> = ({
    stations,
    recipes,
    getStationColor,
    getStationIcon,
    hasPermission
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Station Management</h1>
                    <p className="text-muted-foreground">Manage kitchen stations and workflow</p>
                </div>
                <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    New Station
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {stations.map((stationName) => {
                    const stationRecipes = recipes.filter(r => r.station === stationName);
                    return (
                        <Card key={stationName} className="overflow-hidden">
                            <CardHeader className={`${getStationColor(stationName)} border-b`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        {getStationIcon(stationName)}
                                        <CardTitle className="ml-2">{stationName}</CardTitle>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Edit Station</DropdownMenuItem>
                                            <DropdownMenuItem>View Prep List</DropdownMenuItem>
                                            <DropdownMenuItem>Print Recipes</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600">Delete Station</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-sm font-medium">{stationRecipes.length} Recipes</div>
                                        <Badge variant="outline">Active</Badge>
                                    </div>
                                </div>
                                <div className="border-t">
                                    {stationRecipes.slice(0, 4).map((recipe) => (
                                        <div key={recipe._id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                                            <div>
                                                <div className="font-medium">{recipe.name}</div>
                                                <div className="text-xs text-muted-foreground">Version: {recipe.version}</div>
                                            </div>
                                            <div className="flex items-center">
                                                <Link href={`/recipe/${recipe._id}`} className="text-blue-600 hover:text-blue-800 text-sm mr-2">
                                                    View
                                                </Link>
                                                {hasPermission(Permission.EDIT_RECIPES) && (
                                                    <Link href={`/edit/${recipe._id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                                                        Edit
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/20 p-3">
                                <Button variant="ghost" size="sm" className="ml-auto">
                                    View All ({stationRecipes.length})
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

// Recipe Card Component
interface RecipeCardProps {
    recipe: Recipe;
    hasPermission: (permission: Permission) => boolean;
    getStationColor: (station: string) => string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, hasPermission, getStationColor }) => {
    // Generate stars based on recipe complexity (mock data)
    const getRecipeRating = () => {
        // Mock rating based on ingredient count
        const count = recipe.ingredients.length;
        if (count > 8) return 5;
        if (count > 6) return 4.5;
        if (count > 4) return 4;
        if (count > 2) return 3.5;
        return 3;
    };

    const rating = getRecipeRating();
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
        <Card className="overflow-hidden bg-white hover:shadow-md transition-all border border-gray-100">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-semibold line-clamp-1">{recipe.name}</CardTitle>
                        <Badge className={`mt-1 ${getStationColor(recipe.station)} px-2 py-0 text-xs`}>
                            {recipe.station}
                        </Badge>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/recipe/${recipe._id}`} className="cursor-pointer">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Recipe
                                </Link>
                            </DropdownMenuItem>
                            {hasPermission(Permission.EDIT_RECIPES) && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/edit/${recipe._id}`} className="cursor-pointer">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Recipe
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {hasPermission(Permission.PRINT_RECIPES) && (
                                <DropdownMenuItem>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Recipe
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Plus className="h-4 w-4 mr-2" />
                                Add to Prep List
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-y-1 text-sm mt-3">
                    <div className="text-muted-foreground">Version:</div>
                    <div className="font-medium">{recipe.version || "N/A"}</div>

                    <div className="text-muted-foreground">Yield:</div>
                    <div className="font-medium">{recipe.yield || "N/A"}</div>

                    <div className="text-muted-foreground">Batch Size:</div>
                    <div className="font-medium">{recipe.batchNumber || "N/A"}</div>
                </div>

                <div className="flex items-center mt-3 text-sm">
                    <div className="flex text-amber-500">
                        {[...Array(fullStars)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                        {hasHalfStar && <StarHalf className="h-4 w-4 fill-current" />}
                    </div>
                    <span className="text-xs ml-1 text-muted-foreground">
                        Complexity: {rating}/5
                    </span>
                </div>
            </CardContent>

            <CardFooter className="p-3 border-t bg-gray-50/50 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                    {recipe.ingredients.length} ingredients
                </div>

                <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-800">
                    <Link href={`/recipe/${recipe._id}`}>
                        View Details
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default CommercialKitchenDashboard;