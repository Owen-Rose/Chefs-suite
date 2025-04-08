import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Recipe } from "@/types/Recipe";
import { Archive } from "@/types/Archive";
import { useAuth } from "@/hooks/useAuth";
import { Permission } from "@/types/Permission";
import { useNotify } from "@/utils/toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import ProtectedComponent from "@/components/ProtectedComponent";

// Icons
import {
  Edit,
  Trash2,
  Printer,
  ArrowLeft,
  Archive as ArchiveIcon,
  MoreHorizontal,
  ChevronDown,
  Share2,
  BookmarkPlus,
  Star,
  Clock,
  Utensils,
  CheckCircle,
  List,
  Loader2
} from "lucide-react";

interface RecipeDetailsPageDesktopProps {
  recipe: Recipe;
}

const RecipeDetailsPageDesktop: React.FC<RecipeDetailsPageDesktopProps> = ({ recipe }) => {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const notify = useNotify ? useNotify() : null;

  // State management - preserve all original state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Display notification using either useNotify or fallback to snackbar
  const showNotification = (message: string, isError = false) => {
    if (notify) {
      isError ? notify.error(message) : notify.success(message);
    } else {
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        const response = await fetch(`/api/recipes/${recipe._id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          showNotification("Recipe deleted successfully");
          router.push("/");
        } else {
          throw new Error("Failed to delete recipe");
        }
      } catch (error) {
        console.error("Error deleting recipe:", error);
        showNotification("Failed to delete recipe. Please try again.", true);
      }
    }
  };

  const handleOpenArchiveDialog = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/archives");
      if (response.ok) {
        const data = await response.json();
        setArchives(data);
        setIsArchiveDialogOpen(true);
      } else {
        throw new Error("Failed to fetch archives");
      }
    } catch (error) {
      console.error("Failed to fetch archives:", error);
      showNotification("Failed to fetch archives. Please try again.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseArchiveDialog = () => {
    setIsArchiveDialogOpen(false);
  };

  const handleArchiveRecipe = async (archiveId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipe._id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      showNotification("Recipe archived successfully");
      router.push("/");
    } catch (error) {
      console.error("Failed to archive recipe:", error);
      showNotification("Failed to archive recipe. Please try again.", true);
    }
    handleCloseArchiveDialog();
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header with navigation and actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/")} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Recipe Details</h1>
          </div>

          <div className="flex items-center space-x-3">
            <ProtectedComponent requiredPermission={Permission.PRINT_RECIPES}>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </ProtectedComponent>

            <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/edit/${recipe._id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </ProtectedComponent>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Actions
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Recipe
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Add to Collection
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                  <DropdownMenuItem onClick={handleOpenArchiveDialog} className="cursor-pointer">
                    <ArchiveIcon className="h-4 w-4 mr-2" />
                    Archive Recipe
                  </DropdownMenuItem>
                </ProtectedComponent>

                <ProtectedComponent requiredPermission={Permission.DELETE_RECIPES}>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Recipe
                  </DropdownMenuItem>
                </ProtectedComponent>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Recipe Title Card */}
        <Card className="mb-6 border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{recipe.name || "Untitled Recipe"}</h2>
                <div className="flex items-center flex-wrap gap-2">
                  <Badge className={`font-medium ${getStationColor(recipe.station)}`}>
                    {recipe.station}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Created: {recipe.createdDate || "N/A"}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Version: {recipe.version || "1.0"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center mb-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                  <Star className="h-4 w-4 text-amber-200 fill-amber-200" />
                </div>
                <span className="text-xs text-muted-foreground">Complexity Rating: 4/5</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipe Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recipe Info */}
          <Card className="border border-gray-200 lg:col-span-1">
            <CardHeader>
              <CardTitle>Recipe Information</CardTitle>
              <CardDescription>Key details and specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-muted-foreground">Batch Number:</div>
                <div className="font-medium">{recipe.batchNumber || "N/A"}</div>

                <div className="text-muted-foreground">Yield:</div>
                <div className="font-medium">{recipe.yield || "N/A"}</div>

                <div className="text-muted-foreground">Portion Size:</div>
                <div className="font-medium">{recipe.portionSize || "N/A"}</div>

                <div className="text-muted-foreground">Portions per Recipe:</div>
                <div className="font-medium">{recipe.portionsPerRecipe || "N/A"}</div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Utensils className="h-4 w-4 mr-2" />
                  Equipment Required
                </h4>
                <ul className="space-y-1 text-sm ml-2">
                  {recipe.equipment && recipe.equipment.length > 0 ? (
                    recipe.equipment.map((item, index) => (
                      <li key={index} className="text-muted-foreground">{item}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">No equipment specified</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Middle Column - Ingredients */}
          <Card className="border border-gray-200 lg:col-span-1">
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>{recipe.ingredients.length} items required</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex justify-between items-start pb-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium">{ingredient.productName}</span>
                    <span className="text-muted-foreground text-sm">
                      {ingredient.quantity} {ingredient.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t">
              <div className="text-xs text-muted-foreground">
                Batch size can be adjusted in preparation view
              </div>
            </CardFooter>
          </Card>

          {/* Right Column - Procedure */}
          <Card className="border border-gray-200 lg:col-span-1">
            <CardHeader>
              <CardTitle>Procedure</CardTitle>
              <CardDescription>{recipe.procedure.length} preparation steps</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 relative">
                {recipe.procedure.map((step, index) => (
                  <li key={index} className="pl-7 pb-4 border-b border-gray-100 last:border-0 relative">
                    <span className="absolute left-0 top-0 flex items-center justify-center w-5 h-5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {index + 1}
                    </span>
                    <p className="text-sm">{step}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t">
              <Button variant="outline" size="sm" className="w-full">
                <List className="h-4 w-4 mr-2" />
                View as Checklist
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Archive Dialog */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Recipe</DialogTitle>
            <DialogDescription>
              Select an archive to store this recipe in
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="py-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {archives.map((archive) => (
                  <Button
                    key={archive._id?.toString()}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleArchiveRecipe(archive._id!.toString())}
                  >
                    <div>
                      <div className="font-medium">{archive.name}</div>
                      {archive.description && (
                        <div className="text-xs text-muted-foreground mt-1">{archive.description}</div>
                      )}
                    </div>
                  </Button>
                ))}

                {archives.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    No archives available. Create an archive first.
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseArchiveDialog}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipeDetailsPageDesktop;