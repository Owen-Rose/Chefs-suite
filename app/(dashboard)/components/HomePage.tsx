"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Recipe } from "@/types/Recipe";
import { Archive as ArchiveType } from "@/types/Archive";
import ProtectedComponent from '@/components/ui/ProtectedComponent';
import LogoutButton from '@/components/ui/LogoutButton';
import { Permission } from '@/types/Permission';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Archive as ArchiveIcon, Loader2, Plus, Users, User, Settings, Bell, LogOut, Search, Filter, SortAsc, ChevronRight, Menu, BookOpen, FileText, Edit, Printer } from "lucide-react";

const HomePage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [station, setStation] = useState("");
  const [stations, setStations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("name");
  const { user, hasPermission } = useAuth();
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archives, setArchives] = useState<ArchiveType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecipes();
    }
  }, [user]);

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/recipes/");
      if (!response.ok) throw new Error("Failed to fetch recipes");
      const data: Recipe[] = await response.json();
      setRecipes(data);
      const uniqueStations = Array.from(
        new Set(data.map((recipe) => recipe.station))
      ).filter(Boolean);
      setStations(uniqueStations);
    } catch (error) {
      setSnackbarMessage("Failed to fetch recipes. Please try again.");
    }
    setIsLoading(false);
  };

  const filteredAndSortedRecipes = recipes
    .filter((recipe) =>
      recipe.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((recipe) => (station ? recipe.station === station : true))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "station") return a.station.localeCompare(b.station);
      if (sortBy === "date") return a.createdDate.localeCompare(b.createdDate);
      return 0;
    });

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleSelectAllRecipes = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRecipes(filteredAndSortedRecipes.map((recipe) => recipe._id!));
    } else {
      setSelectedRecipes([]);
    }
  };

  const handleOpenArchiveDialog = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/archives");
      if (!response.ok) throw new Error("Failed to fetch archives");
      const data = await response.json();
      setArchives(data);
      setIsArchiveDialogOpen(true);
    } catch (error) {
      setSnackbarMessage("Failed to fetch archives. Please try again.");
    }
    setIsLoading(false);
  };

  const handleCloseArchiveDialog = () => {
    setIsArchiveDialogOpen(false);
  };

  const handleBatchArchive = async (archiveId: string) => {
    try {
      const response = await fetch("/api/recipes/batch-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: selectedRecipes, archiveId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to archive recipes");
      }
      await fetchRecipes();
      setSelectedRecipes([]);
      setSnackbarMessage("Recipes archived successfully");
    } catch (error) {
      setSnackbarMessage(
        error instanceof Error
          ? error.message
          : "Failed to archive recipes. Please try again."
      );
    }
    handleCloseArchiveDialog();
  };

  const getStationColor = (station: string) => {
    const stationColors: Record<string, string> = {
      'Garde Manger': 'bg-emerald-100 text-emerald-800',
      'Entremetier': 'bg-blue-100 text-blue-800',
      'Pastry': 'bg-purple-100 text-purple-800',
      'Functions': 'bg-amber-100 text-amber-800',
    };
    return stationColors[station] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(!drawerOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">Recipe Management System</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">3</Badge>
          </Button>
          <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
            <Button asChild size="sm" className="hidden md:flex">
              <Link href="/add">
                <Plus className="h-4 w-4 mr-2" />
                New Recipe
              </Link>
            </Button>
          </ProtectedComponent>
          <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <User className="h-4 w-4" />
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
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
              <DropdownMenuItem onClick={() => {}} className="flex items-center text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {/* Main content */}
      <main className="container py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={() => setFilterMenuOpen(!filterMenuOpen)}>
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
          <Button variant="outline" onClick={() => setSortMenuOpen(!sortMenuOpen)}>
            <SortAsc className="h-4 w-4 mr-2" /> Sort
          </Button>
        </div>
        {/* Filter menu */}
        {filterMenuOpen && (
          <div className="mb-4 bg-white border rounded shadow p-4">
            <div className="mb-2 font-semibold">Filter by Station</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={station === "" ? "default" : "outline"} onClick={() => setStation("")}>All</Button>
              {stations.map(stationItem => (
                <Button key={stationItem} size="sm" variant={station === stationItem ? "default" : "outline"} onClick={() => setStation(stationItem)}>
                  {stationItem}
                </Button>
              ))}
            </div>
          </div>
        )}
        {/* Sort menu */}
        {sortMenuOpen && (
          <div className="mb-4 bg-white border rounded shadow p-4">
            <div className="mb-2 font-semibold">Sort by</div>
            <div className="flex gap-2">
              <Button size="sm" variant={sortBy === "name" ? "default" : "outline"} onClick={() => setSortBy("name")}>Name</Button>
              <Button size="sm" variant={sortBy === "station" ? "default" : "outline"} onClick={() => setSortBy("station")}>Station</Button>
              <Button size="sm" variant={sortBy === "date" ? "default" : "outline"} onClick={() => setSortBy("date")}>Date Created</Button>
            </div>
          </div>
        )}
        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAndSortedRecipes.length > 0 ? (
          <Card className="overflow-x-auto">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={selectedRecipes.length === filteredAndSortedRecipes.length && filteredAndSortedRecipes.length > 0}
                        onCheckedChange={checked => handleSelectAllRecipes({ target: { checked } } as any)}
                      />
                    </TableHead>
                    <TableHead>Recipe Name</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRecipes.map(recipe => (
                    <TableRow key={recipe._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecipes.includes(recipe._id!)}
                          onCheckedChange={() => handleRecipeSelect(recipe._id!)}
                        />
                      </TableCell>
                      <TableCell>{recipe.name}</TableCell>
                      <TableCell>
                        <Badge className={getStationColor(recipe.station)}>{recipe.station}</Badge>
                      </TableCell>
                      <TableCell>{recipe.createdDate || "N/A"}</TableCell>
                      <TableCell>{recipe.version || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/recipe/${recipe._id}`}><FileText className="h-4 w-4" /></Link>
                          </Button>
                          <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/edit/${recipe._id}`}><Edit className="h-4 w-4" /></Link>
                            </Button>
                          </ProtectedComponent>
                          <ProtectedComponent requiredPermission={Permission.PRINT_RECIPES}>
                            <Button variant="ghost" size="icon" onClick={() => window.print()}>
                              <Printer className="h-4 w-4" />
                            </Button>
                          </ProtectedComponent>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <CardContent>
              <div className="mb-2 text-gray-500 font-semibold">No recipes found</div>
              <div className="mb-6 text-gray-400">
                {search || station ? "Try adjusting your filters" : "Get started by adding your first recipe"}
              </div>
              {!search && !station && (
                <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
                  <Button asChild>
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
      </main>
      {/* Archive Dialog */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogHeader>
          <DialogTitle>Select Archive</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {archives.map((archive) => (
                <Button
                  key={archive._id!.toString()}
                  variant="outline"
                  className="w-full flex justify-between items-center"
                  onClick={() => handleBatchArchive(archive._id!.toString())}
                >
                  <span>{archive.name}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={handleCloseArchiveDialog}>Cancel</Button>
        </DialogFooter>
      </Dialog>
      {/* Snackbar/Toast */}
      {snackbarMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded shadow px-4 py-2 z-50">
          {snackbarMessage}
        </div>
      )}
    </div>
  );
};

export default HomePage;