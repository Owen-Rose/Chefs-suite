import React, { useState, useEffect } from "react";
import { Archive } from "@/types/Archive";
import { Recipe } from "@/types/Recipe";
import { useAuth } from "@/hooks/useAuth";
import { Permission } from "@/types/Permission";
import { useNotify } from "@/utils/toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  Archive as ArchiveIcon,
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  RefreshCw,
  MoreHorizontal,
  Loader2,
  ArrowUpDown,
  Info,
  RotateCcw,
  Clock,
} from "lucide-react";

const ArchiveManagement: React.FC = () => {
  // State management (preserving all original state)
  const [archives, setArchives] = useState<Archive[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const [archivedRecipes, setArchivedRecipes] = useState<Recipe[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [archiveName, setArchiveName] = useState("");
  const [archiveDescription, setArchiveDescription] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("archives");

  // Hooks
  const { hasPermission } = useAuth();
  const notify = useNotify();

  // Fetch archives when component mounts
  useEffect(() => {
    fetchArchives();
  }, []);

  // Filter archived recipes based on search term
  const filteredArchivedRecipes = archivedRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch archives function
  const fetchArchives = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/archives");
      if (response.ok) {
        const data = await response.json();
        setArchives(data);
      } else {
        throw new Error("Failed to fetch archives");
      }
    } catch (error) {
      console.error("Failed to fetch archives:", error);
      notify.error("Failed to fetch archives. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch archived recipes
  const fetchArchivedRecipes = async (archiveId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/archives/${archiveId}`);
      if (response.ok) {
        const data = await response.json();
        const recipes = (data.recipes || []).map((recipe: Recipe) => ({
          ...recipe,
          originalId: recipe.originalId || recipe.name,
        }));
        setArchivedRecipes(recipes);
      } else {
        throw new Error("Failed to fetch archived recipes");
      }
    } catch (error) {
      console.error("Failed to fetch archived recipes:", error);
      notify.error("Failed to fetch archived recipes. Please try again.");
      setArchivedRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle archive click
  const handleArchiveClick = (archive: Archive) => {
    setSelectedArchive(archive);
    fetchArchivedRecipes(archive._id!.toString());
    setCurrentTab("recipes");
  };

  // Handle create archive
  const handleCreateArchive = () => {
    setDialogMode("create");
    setArchiveName("");
    setArchiveDescription("");
    setIsDialogOpen(true);
  };

  // Handle edit archive
  const handleEditArchive = (archive: Archive) => {
    setDialogMode("edit");
    setArchiveName(archive.name.toString());
    setArchiveDescription(archive.description?.toString() || "");
    setSelectedArchive(archive);
    setIsDialogOpen(true);
  };

  // Handle delete archive
  const handleDeleteArchive = async (archiveId: string) => {
    if (confirm("Are you sure you want to delete this archive?")) {
      try {
        const response = await fetch(`/api/archives/${archiveId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchArchives();
          setSelectedArchive(null);
          setArchivedRecipes([]);
          notify.success("Archive deleted successfully");
        } else {
          throw new Error("Failed to delete archive");
        }
      } catch (error) {
        console.error("Failed to delete archive:", error);
        notify.error("Failed to delete archive. Please try again.");
      }
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  // Handle dialog submit
  const handleDialogSubmit = async () => {
    const archiveData = {
      name: archiveName,
      description: archiveDescription,
    };

    try {
      let response;
      if (dialogMode === "create") {
        response = await fetch("/api/archives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(archiveData),
        });
      } else {
        response = await fetch(`/api/archives/${selectedArchive?._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(archiveData),
        });
      }

      if (response.ok) {
        fetchArchives();
        setIsDialogOpen(false);
        notify.success(
          dialogMode === "create"
            ? "Archive created successfully"
            : "Archive updated successfully"
        );
      } else {
        throw new Error("Failed to save archive");
      }
    } catch (error) {
      console.error("Failed to save archive:", error);
      notify.error("Failed to save archive. Please try again.");
    }
  };

  // Handle recipe selection
  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  // Handle select all recipes
  const handleSelectAllRecipes = (e: React.ChangeEvent<HTMLInputElement> | boolean) => {
    // This function handles both checkbox changes and direct boolean value
    const isChecked = typeof e === 'boolean' ? e : e.target.checked;

    if (isChecked) {
      setSelectedRecipes(filteredArchivedRecipes.map((recipe) => recipe.originalId!.toString()));
    } else {
      setSelectedRecipes([]);
    }
  };

  // Handle restore recipes
  const handleRestoreRecipes = async () => {
    if (!selectedArchive) {
      notify.error("No archive selected. Please select an archive first.");
      return;
    }

    try {
      const recipesToRestore = selectedRecipes
        .map((recipeId) => {
          const recipe = archivedRecipes.find(
            (r) => r.originalId?.toString() === recipeId
          );
          return recipe ? recipe.originalId : null;
        })
        .filter((id) => id !== null);

      if (recipesToRestore.length === 0) {
        notify.error("No valid recipes selected for restoration.");
        return;
      }

      const response = await fetch("/api/recipes/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeIds: recipesToRestore,
          archiveId: selectedArchive._id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        notify.success(result.message || "Recipes restored successfully");
        fetchArchivedRecipes(selectedArchive._id!.toString());
        setSelectedRecipes([]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to restore recipes");
      }
    } catch (error) {
      console.error("Failed to restore recipes:", error);
      notify.error(
        error instanceof Error
          ? error.message
          : "Failed to restore recipes. Please try again."
      );
    }
  };

  // Handle recipe click for details
  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Archive Management</h1>
          <p className="text-muted-foreground mt-1">Manage recipe archives and restore archived recipes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchArchives}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {hasPermission(Permission.EDIT_RECIPES) && (
            <Button onClick={handleCreateArchive}>
              <Plus className="h-4 w-4 mr-2" />
              Create Archive
            </Button>
          )}
        </div>
      </div>

      {selectedArchive ? (
        <Tabs defaultValue="archives" value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="archives">Archives</TabsTrigger>
              <TabsTrigger value="recipes">
                Archived Recipes
                {archivedRecipes.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{archivedRecipes.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {currentTab === "recipes" && (
              <div className="flex items-center space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {selectedRecipes.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleRestoreRecipes}
                    className="whitespace-nowrap"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore Selected ({selectedRecipes.length})
                  </Button>
                )}
              </div>
            )}
          </div>

          <TabsContent value="archives" className="mt-0 space-y-4">
            {isLoading && archives.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : archives.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archives.map((archive) => (
                  <Card
                    key={archive._id?.toString()}
                    className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
                    onClick={() => handleArchiveClick(archive)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{archive.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {archive.recipes?.length || 0} archived recipes
                          </CardDescription>
                        </div>

                        {hasPermission(Permission.EDIT_RECIPES) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEditArchive(archive);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteArchive(archive._id!.toString());
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {archive.description || "No description provided"}
                      </div>

                      <div className="flex items-center mt-4 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Created: {new Date(archive.createdDate).toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/20 pt-2 pb-2 px-6 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveClick(archive);
                        }}
                      >
                        View Recipes
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/10 border-dashed">
                <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
                  <ArchiveIcon className="h-12 w-12 text-muted-foreground/60 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Archives Found</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    You haven&apos;t created any archives yet. Archives help you organize and store recipes that are no longer in active use.
                  </p>
                  {hasPermission(Permission.EDIT_RECIPES) && (
                    <Button onClick={handleCreateArchive}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Archive
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recipes" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      <span className="flex items-center">
                        {selectedArchive?.name}
                        <Badge variant="outline" className="ml-2 font-normal">
                          {archivedRecipes.length} recipes
                        </Badge>
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {selectedArchive?.description || "No description available"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentTab("archives");
                      setSelectedRecipes([]);
                    }}
                  >
                    Back to Archives
                  </Button>0
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredArchivedRecipes.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                filteredArchivedRecipes.length > 0 &&
                                selectedRecipes.length === filteredArchivedRecipes.length
                              }
                              onCheckedChange={checked => handleSelectAllRecipes(checked === true)}
                              aria-label="Select all recipes"
                            />
                          </TableHead>
                          <TableHead className="min-w-[150px]">
                            <div className="flex items-center space-x-1">
                              <span>Recipe Name</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ArrowUpDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableHead>
                          <TableHead>Station</TableHead>
                          <TableHead>Archived Date</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArchivedRecipes.map((recipe) => (
                          <TableRow key={recipe.originalId?.toString() || recipe._id}>
                            <TableCell className="w-12">
                              <Checkbox
                                checked={selectedRecipes.includes(
                                  recipe.originalId?.toString() || ""
                                )}
                                onCheckedChange={() =>
                                  handleRecipeSelect(
                                    recipe.originalId?.toString() || ""
                                  )
                                }
                                aria-label={`Select ${recipe.name}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{recipe.name}</TableCell>
                            <TableCell>{recipe.station}</TableCell>
                            <TableCell>
                              {recipe.archiveDate
                                ? new Date(recipe.archiveDate).toLocaleDateString()
                                : "Unknown"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRecipeClick(recipe)}
                                  title="View Details"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    handleRecipeSelect(recipe.originalId?.toString() || "");
                                    handleRestoreRecipes();
                                  }}
                                  title="Restore Recipe"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/60 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Recipes Found</h3>
                    <p className="text-muted-foreground max-w-md">
                      {searchTerm
                        ? `No recipes matching "${searchTerm}" were found in this archive.`
                        : "This archive doesn't contain any recipes yet."}
                    </p>
                  </div>
                )}
              </CardContent>
              {filteredArchivedRecipes.length > 0 && (
                <CardFooter className="border-t bg-muted/20 py-3">
                  <div className="flex justify-between items-center w-full">
                    <div className="text-sm text-muted-foreground">
                      {selectedRecipes.length} of {filteredArchivedRecipes.length} items selected
                    </div>
                    {selectedRecipes.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleRestoreRecipes}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore Selected
                      </Button>
                    )}
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Archives</CardTitle>
            <CardDescription>
              Manage your recipe archives
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : archives.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Recipes</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archives.map((archive) => (
                      <TableRow key={archive._id?.toString()}>
                        <TableCell className="font-medium">{archive.name}</TableCell>
                        <TableCell>{archive.description || "—"}</TableCell>
                        <TableCell>
                          {new Date(archive.createdDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{archive.recipes?.length || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchiveClick(archive)}
                              title="View Archive"
                            >
                              <Info className="h-4 w-4" />
                            </Button>

                            {hasPermission(Permission.EDIT_RECIPES) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditArchive(archive)}
                                  title="Edit Archive"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteArchive(archive._id!.toString())}
                                  title="Delete Archive"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ArchiveIcon className="h-12 w-12 text-muted-foreground/60 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Archives Found</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  You haven&apos;t created any archives yet. Archives help you organize and store recipes that are no longer in active use.
                </p>
                {hasPermission(Permission.EDIT_RECIPES) && (
                  <Button onClick={handleCreateArchive}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Archive
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Archive Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Create New Archive" : "Edit Archive"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Add a new archive to store inactive recipes."
                : "Update the details of this archive."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="archiveName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Archive Name
              </label>
              <Input
                id="archiveName"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                className="mt-1"
                placeholder="Enter archive name"
              />
            </div>
            <div>
              <label htmlFor="archiveDescription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Description
              </label>
              <Input
                id="archiveDescription"
                value={archiveDescription}
                onChange={(e) => setArchiveDescription(e.target.value)}
                className="mt-1"
                placeholder="Enter description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleDialogSubmit}>
              {dialogMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipe Details Dialog */}
      <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRecipe?.name}</DialogTitle>
            <DialogDescription>
              Recipe details from the archive
            </DialogDescription>
          </DialogHeader>

          {selectedRecipe && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Recipe Information</h4>
                  <div className="bg-muted/50 rounded-md p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{selectedRecipe.createdDate || "N/A"}</span>

                      <span className="text-muted-foreground">Version:</span>
                      <span>{selectedRecipe.version || "N/A"}</span>

                      <span className="text-muted-foreground">Station:</span>
                      <span>{selectedRecipe.station || "N/A"}</span>

                      <span className="text-muted-foreground">Batch Number:</span>
                      <span>{selectedRecipe.batchNumber || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Equipment</h4>
                  <div className="bg-muted/50 rounded-md p-3 h-[calc(100%-30px)] overflow-y-auto">
                    {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {selectedRecipe.equipment.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No equipment specified</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Ingredients</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <TableRow key={index}>
                          <TableCell>{ingredient.productName}</TableCell>
                          <TableCell>{ingredient.quantity}</TableCell>
                          <TableCell>{ingredient.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Procedure</h4>
                <ol className="list-decimal list-inside space-y-2 bg-muted/50 rounded-md p-3">
                  {selectedRecipe.procedure.map((step, index) => (
                    <li key={index} className="text-sm">
                      <span className="ml-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRecipes([selectedRecipe?.originalId?.toString() || ""]);
                handleRestoreRecipes();
                setIsRecipeDialogOpen(false);
              }}
              disabled={!selectedRecipe?.originalId}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Recipe
            </Button>
            <Button onClick={() => setIsRecipeDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArchiveManagement;