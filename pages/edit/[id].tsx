import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Recipe } from "@/types/Recipe";
import { useNotify } from "@/utils/toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Icons
import {
  Save,
  Plus,
  Trash,
  Undo,
  ArrowLeft,
  Clock,
  Tag,
  CheckCircle,
  Utensils,
  ChefHat,
  CookingPot,
  Hash,
  BookOpen,
  AlignLeft,
  Wrench,
  PanelLeft,
  Loader2,
  FileQuestion,
  Calculator,
  Info,
} from "lucide-react";

const EditRecipePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const notify = useNotify ? useNotify() : { success: () => { }, error: () => { } };

  // Recipe state management
  const [recipe, setRecipe] = useState<Recipe>({
    name: "",
    createdDate: new Date().toISOString().split("T")[0],
    version: "1.0",
    station: "",
    batchNumber: 1,
    equipment: [],
    ingredients: [],
    procedure: [],
    yield: "",
    portionSize: "",
    portionsPerRecipe: "",
  });

  // Station options (typically these would come from an API)
  const stationOptions = [
    "Garde Manger",
    "Entremetier",
    "Pastry",
    "Functions"
  ];

  // UI state
  const [error, setError] = useState("");
  const [formChanged, setFormChanged] = useState(false);

  // Load recipe data when component mounts
  useEffect(() => {
    if (id) {
      fetchRecipe();
    }
  }, [id]);

  // Track form changes
  useEffect(() => {
    // Only set formChanged to true after initial load
    if (id && recipe.name) {
      setFormChanged(true);
    }
  }, [recipe]);

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

  // Fetch recipe data from API
  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch recipe");
      }

      const data: Recipe = await response.json();

      // Ensure all properties have default values
      setRecipe({
        _id: data._id,
        name: data.name || "",
        createdDate: data.createdDate || new Date().toISOString().split("T")[0],
        version: data.version || "1.0",
        station: data.station || "",
        batchNumber: data.batchNumber || 1,
        equipment: Array.isArray(data.equipment) ? data.equipment : [],
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        procedure: Array.isArray(data.procedure) ? data.procedure : [],
        yield: data.yield || "",
        portionSize: data.portionSize || "",
        portionsPerRecipe: data.portionsPerRecipe || "",
      });

      setFormChanged(false);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      setError("Failed to fetch recipe. Please try again.");
    }
  };

  // Update recipe state when form fields change
  const handleChange = (field: keyof Recipe, value: any) => {
    setRecipe((prev) => ({ ...prev, [field]: value }));
  };

  // Add a new equipment item
  const handleAddEquipment = () => {
    setRecipe((prev) => ({
      ...prev,
      equipment: [...(prev.equipment || []), ""]
    }));
  };

  // Remove an equipment item
  const handleRemoveEquipment = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  // Update an equipment item
  const handleUpdateEquipment = (index: number, value: string) => {
    const newEquipment = [...recipe.equipment];
    newEquipment[index] = value;
    handleChange("equipment", newEquipment);
  };

  // Add a new ingredient
  const handleAddIngredient = () => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { id: Date.now(), productName: "", quantity: 0, unit: "" }
      ]
    }));
  };

  // Remove an ingredient
  const handleRemoveIngredient = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Update an ingredient field
  const handleUpdateIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: field === "quantity" ? Number(value) : value
    };
    handleChange("ingredients", newIngredients);
  };

  // Add a new procedure step
  const handleAddProcedureStep = () => {
    setRecipe((prev) => ({
      ...prev,
      procedure: [...prev.procedure, ""]
    }));
  };

  // Remove a procedure step
  const handleRemoveProcedureStep = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      procedure: prev.procedure.filter((_, i) => i !== index)
    }));
  };

  // Update a procedure step
  const handleUpdateProcedureStep = (index: number, value: string) => {
    const newProcedure = [...recipe.procedure];
    newProcedure[index] = value;
    handleChange("procedure", newProcedure);
  };

  // Save recipe data to API
  const handleSave = async () => {
    // Basic validation
    if (!recipe.name.trim()) {
      setError("Recipe name is required");
      setActiveTab("basic");
      return;
    }

    if (!recipe.station) {
      setError("Station is required");
      setActiveTab("basic");
      return;
    }

    // Validate ingredients
    if (recipe.ingredients.length === 0) {
      setError("At least one ingredient is required");
      setActiveTab("ingredients");
      return;
    }

    const invalidIngredients = recipe.ingredients.some(
      ing => !ing.productName.trim() || ing.quantity <= 0 || !ing.unit.trim()
    );

    if (invalidIngredients) {
      setError("All ingredients must have a name, quantity, and unit");
      setActiveTab("ingredients");
      return;
    }

    // Validate procedure
    if (recipe.procedure.length === 0) {
      setError("At least one procedure step is required");
      setActiveTab("procedure");
      return;
    }

    const invalidProcedure = recipe.procedure.some(step => !step.trim());

    if (invalidProcedure) {
      setError("All procedure steps must have content");
      setActiveTab("procedure");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save recipe");
      }

      setFormChanged(false);
      notify.success("Recipe saved successfully");

      // Use setTimeout to show success state briefly before redirecting
      setTimeout(() => {
        router.push(`/recipe/${id}`);
      }, 1000);
    } catch (error) {
      console.error("Error updating recipe:", error);
      notify.error("Failed to save recipe. Please try again.");
      setError("An error occurred while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing and show confirmation dialog if form has changed
  const handleCancel = () => {
    if (formChanged) {
      setDialogOpen(true);
    } else {
      router.back();
    }
  };

  // Go back without saving
  const handleConfirmCancel = () => {
    setDialogOpen(false);
    router.back();
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="container mx-auto px-4 py-8">
        {/* Header with navigation and actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              Edit Recipe
            </h1>
            {recipe.name && (
              <Badge className="ml-2">
                {recipe.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              <Undo className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Recipe
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main content - Tabbed interface */}
        <Tabs
          defaultValue="basic"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-4 md:w-[600px]">
            <TabsTrigger value="basic" className="flex items-center">
              <Info className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Basic Info</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="flex items-center">
              <Utensils className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ingredients</span>
              <span className="sm:hidden">Ingr</span>
            </TabsTrigger>
            <TabsTrigger value="procedure" className="flex items-center">
              <AlignLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Procedure</span>
              <span className="sm:hidden">Proc</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center">
              <Wrench className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Equipment & Details</span>
              <span className="sm:hidden">More</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recipe Information</CardTitle>
                <CardDescription>
                  Basic information about the recipe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Recipe Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      placeholder="Enter recipe name"
                      value={recipe.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="station">Station <span className="text-destructive">*</span></Label>
                    <Select
                      value={recipe.station}
                      onValueChange={(value) => handleChange("station", value)}
                    >
                      <SelectTrigger id="station">
                        <SelectValue placeholder="Select a station" />
                      </SelectTrigger>
                      <SelectContent>
                        {stationOptions.map((station) => (
                          <SelectItem key={station} value={station}>
                            <div className="flex items-center">
                              <Badge className={`mr-2 ${getStationColor(station)}`}>
                                {station.charAt(0)}
                              </Badge>
                              <span>{station}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      placeholder="1.0"
                      value={recipe.version}
                      onChange={(e) => handleChange("version", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number</Label>
                    <Input
                      id="batchNumber"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={recipe.batchNumber}
                      onChange={(e) => handleChange("batchNumber", Number(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yield">Yield</Label>
                    <Input
                      id="yield"
                      placeholder="e.g. 2L, 4 portions"
                      value={recipe.yield}
                      onChange={(e) => handleChange("yield", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portionSize">Portion Size</Label>
                    <Input
                      id="portionSize"
                      placeholder="e.g. 250ml, 120g"
                      value={recipe.portionSize}
                      onChange={(e) => handleChange("portionSize", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portionsPerRecipe">Portions Per Recipe</Label>
                    <Input
                      id="portionsPerRecipe"
                      placeholder="e.g. 8, 12"
                      value={recipe.portionsPerRecipe}
                      onChange={(e) => handleChange("portionsPerRecipe", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="createdDate">Creation Date</Label>
                    <Input
                      id="createdDate"
                      type="date"
                      value={recipe.createdDate}
                      onChange={(e) => handleChange("createdDate", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ingredients Tab */}
          <TabsContent value="ingredients" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Ingredients</CardTitle>
                  <CardDescription>
                    Add all ingredients with quantities and units
                  </CardDescription>
                </div>
                <Button onClick={handleAddIngredient} className="ml-2 shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {recipe.ingredients.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                      <FileQuestion className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No ingredients added yet</p>
                      <p className="text-sm">Click 'Add Ingredient' to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recipe.ingredients.map((ingredient, index) => (
                        <Card key={ingredient.id || index} className="border border-input">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-start">
                              <div className="md:col-span-4">
                                <Label htmlFor={`ingredient-name-${index}`} className="text-xs mb-1 block">
                                  Ingredient Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`ingredient-name-${index}`}
                                  placeholder="e.g. Onion, Butter"
                                  value={ingredient.productName}
                                  onChange={(e) => handleUpdateIngredient(index, "productName", e.target.value)}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor={`ingredient-quantity-${index}`} className="text-xs mb-1 block">
                                  Quantity <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`ingredient-quantity-${index}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Amount"
                                  value={ingredient.quantity || ""}
                                  onChange={(e) => handleUpdateIngredient(index, "quantity", e.target.value)}
                                />
                              </div>
                              <div className="md:col-span-1">
                                <Label htmlFor={`ingredient-unit-${index}`} className="text-xs mb-1 block">
                                  Unit <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`ingredient-unit-${index}`}
                                  placeholder="g, ml, tbsp"
                                  value={ingredient.unit}
                                  onChange={(e) => handleUpdateIngredient(index, "unit", e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end items-end md:col-span-1">
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleRemoveIngredient(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
                <div className="text-sm text-muted-foreground">
                  {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                </div>
                <Button onClick={handleAddIngredient} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another
                </Button>
              </CardFooter>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setActiveTab("basic")}>
                Previous: Basic Info
              </Button>
              <Button onClick={() => setActiveTab("procedure")}>
                Next: Procedure
              </Button>
            </div>
          </TabsContent>

          {/* Procedure Tab */}
          <TabsContent value="procedure" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Preparation Procedure</CardTitle>
                  <CardDescription>
                    Add all preparation steps in sequential order
                  </CardDescription>
                </div>
                <Button onClick={handleAddProcedureStep} className="ml-2 shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {recipe.procedure.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No procedure steps added yet</p>
                      <p className="text-sm">Click 'Add Step' to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recipe.procedure.map((step, index) => (
                        <Card key={index} className="border border-input">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 gap-4 items-start">
                              <div className="flex items-start space-x-3">
                                <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <Label htmlFor={`step-${index}`} className="text-xs mb-1 block">
                                    Step {index + 1} <span className="text-destructive">*</span>
                                  </Label>
                                  <Textarea
                                    id={`step-${index}`}
                                    placeholder="Describe this preparation step..."
                                    value={step}
                                    onChange={(e) => handleUpdateProcedureStep(index, e.target.value)}
                                    className="min-h-[120px]"
                                  />
                                </div>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleRemoveProcedureStep(index)}
                                  className="flex-shrink-0"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
                <div className="text-sm text-muted-foreground">
                  {recipe.procedure.length} step{recipe.procedure.length !== 1 ? 's' : ''}
                </div>
                <Button onClick={handleAddProcedureStep} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another
                </Button>
              </CardFooter>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setActiveTab("ingredients")}>
                Previous: Ingredients
              </Button>
              <Button onClick={() => setActiveTab("details")}>
                Next: Equipment & Details
              </Button>
            </div>
          </TabsContent>

          {/* Equipment & Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Required</CardTitle>
                <CardDescription>
                  List all equipment needed for this recipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recipe.equipment.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <CookingPot className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm">No equipment added yet</p>
                    </div>
                  ) : (
                    recipe.equipment.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="e.g. Stand Mixer, Oven, Food Processor"
                          value={item}
                          onChange={(e) => handleUpdateEquipment(index, e.target.value)}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveEquipment(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={handleAddEquipment}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setActiveTab("procedure")}>
                Previous: Procedure
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Recipe
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Unsaved Changes Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes that will be lost if you leave this page. Are you sure you want to discard your changes?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Continue Editing
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditRecipePage;