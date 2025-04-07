import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth"; // Use useAuth from hooks
import { Recipe } from "@/types/Recipe";
import { Permission } from "@/types/Permission";
import { useNotify } from "@/utils/toast";
import Layout from "@/components/layout/Layout"; // Make sure this path exists
import RecipeCard from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    Plus,
    Filter,
    SortAsc,
    ChefHat,
    Utensils, // Using Utensils instead of Recipe
    Archive,
    BookOpen, // Using BookOpen instead of MenuBook
} from "lucide-react";
import ProtectedComponent from "@/components/ProtectedComponent";

const Dashboard: React.FC = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [search, setSearch] = useState("");
    const [station, setStation] = useState("");
    const [stations, setStations] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState("name");
    const [isLoading, setIsLoading] = useState(true);
    const { user, hasPermission } = useAuth(); // Use useAuth from hooks/useAuth.ts
    const notify = useNotify();

    useEffect(() => {
        if (user) {
            fetchRecipes();
        }
    }, [user]);

    useEffect(() => {
        // Filter and sort recipes whenever dependencies change
        const filtered = recipes
            .filter((recipe) =>
                recipe.name.toLowerCase().includes(search.toLowerCase())
            )
            .filter((recipe) => (station ? recipe.station === station : true));

        // Sort recipes
        const sorted = [...filtered].sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "station") return a.station.localeCompare(b.station);
            if (sortBy === "date") return a.createdDate.localeCompare(b.createdDate);
            return 0;
        });

        setFilteredRecipes(sorted);
    }, [recipes, search, station, sortBy]);

    const fetchRecipes = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/recipes");
            if (!response.ok) throw new Error("Failed to fetch recipes");
            const data = await response.json();
            setRecipes(data);

            // Extract unique stations with proper type casting
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

    // Count recipes by station for dashboard stats
    const getRecipesByStation = () => {
        const stationCounts: Record<string, number> = {};
        stations.forEach(station => {
            stationCounts[station] = recipes.filter(r => r.station === station).length;
        });
        return stationCounts;
    };

    const recipesByStation = getRecipesByStation();

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Welcome back, {user?.name?.split(' ')[0]}!
                        </p>
                    </div>
                    <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
                        <Button asChild>
                            <Link href="/add">
                                <Plus className="h-4 w-4 mr-2" />
                                New Recipe
                            </Link>
                        </Button>
                    </ProtectedComponent>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Recipes
                            </CardTitle>
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{recipes.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {recipes.length > 0 ? '+1 from last week' : 'No recipes yet'}
                            </p>
                        </CardContent>
                    </Card>

                    {Object.entries(recipesByStation).slice(0, 3).map(([station, count]) => (
                        <Card key={station}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {station}
                                </CardTitle>
                                <ChefHat className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{count}</div>
                                <p className="text-xs text-muted-foreground">
                                    {recipes.length > 0
                                        ? `${Math.round((count / recipes.length) * 100)}% of total`
                                        : "0% of total"
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filter and Search */}
                <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search recipes..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={() => setStation("")}
                                    className={station === "" ? "font-medium bg-accent" : ""}
                                >
                                    All Stations
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {stations.map((stationName) => (
                                    <DropdownMenuItem
                                        key={stationName}
                                        onClick={() => setStation(stationName)}
                                        className={station === stationName ? "font-medium bg-accent" : ""}
                                    >
                                        {stationName}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <SortAsc className="h-4 w-4 mr-2" />
                                    Sort
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={() => setSortBy("name")}
                                    className={sortBy === "name" ? "font-medium bg-accent" : ""}
                                >
                                    Recipe Name
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy("station")}
                                    className={sortBy === "station" ? "font-medium bg-accent" : ""}
                                >
                                    Station
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy("date")}
                                    className={sortBy === "date" ? "font-medium bg-accent" : ""}
                                >
                                    Date Created
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Recipes Tabs and Grid */}
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="all">All Recipes</TabsTrigger>
                        <TabsTrigger value="recent">Recent</TabsTrigger>
                        <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                            <TabsTrigger value="archived">Archived</TabsTrigger>
                        </ProtectedComponent>
                    </TabsList>

                    <TabsContent value="all">
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
                            </div>
                        ) : filteredRecipes.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredRecipes.map((recipe) => (
                                    <RecipeCard key={recipe._id} recipe={recipe} />
                                ))}
                            </div>
                        ) : (
                            <Card className="py-20 text-center">
                                <CardContent>
                                    <div className="flex justify-center mb-4">
                                        <Utensils className="h-12 w-12 text-muted-foreground opacity-30" />
                                    </div>
                                    <CardTitle className="text-xl mb-2">No recipes found</CardTitle>
                                    <CardDescription>
                                        {search || station
                                            ? "Try adjusting your search or filters"
                                            : "Get started by adding your first recipe"}
                                    </CardDescription>
                                    {!search && !station && (
                                        <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
                                            <Button asChild className="mt-6">
                                                <Link href="/add">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add New Recipe
                                                </Link>
                                            </Button>
                                        </ProtectedComponent>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="recent">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredRecipes.slice(0, 8).map((recipe) => (
                                <RecipeCard key={recipe._id} recipe={recipe} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="archived">
                        <Card className="py-10 text-center">
                            <CardContent>
                                <div className="flex justify-center mb-4">
                                    <Archive className="h-12 w-12 text-muted-foreground opacity-30" />
                                </div>
                                <CardTitle className="text-xl mb-2">Archived Recipes</CardTitle>
                                <CardDescription>
                                    Visit the Archives page to manage your archived recipes
                                </CardDescription>
                                <Button asChild variant="outline" className="mt-6">
                                    <Link href="/archives">View Archives</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};

export default Dashboard;