import React from "react";
import Link from "next/link";
import { Recipe } from "@/types/Recipe";
import { useAuth } from "@/hooks/useAuth";
import { Permission } from "@/types/Permission";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Printer, Eye } from "lucide-react";
import ProtectedComponent from "./ProtectedComponent";

interface RecipeCardProps {
    recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
    const { hasPermission } = useAuth();

    // Function to determine the badge color based on station
    const getStationColor = (station: string): string => {
        switch (station) {
            case "Garde Manger":
                return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
            case "Entremetier":
                return "bg-blue-100 text-blue-800 hover:bg-blue-200";
            case "Pastry":
                return "bg-purple-100 text-purple-800 hover:bg-purple-200";
            case "Functions":
                return "bg-amber-100 text-amber-800 hover:bg-amber-200";
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-200";
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold truncate">
                    {recipe.name}
                </CardTitle>
                <Badge
                    variant="outline"
                    className={`${getStationColor(recipe.station)} font-medium`}
                >
                    {recipe.station}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
                <div className="grid grid-cols-2 text-sm">
                    <div className="text-muted-foreground">Version:</div>
                    <div className="font-medium">{recipe.version || "N/A"}</div>

                    <div className="text-muted-foreground">Created:</div>
                    <div className="font-medium">{recipe.createdDate || "N/A"}</div>

                    <div className="text-muted-foreground">Batch Size:</div>
                    <div className="font-medium">{recipe.batchNumber || "N/A"}</div>
                </div>
                <div className="border-t pt-2 text-sm text-muted-foreground">
                    {recipe.ingredients?.length} ingredients · {recipe.procedure?.length} steps
                </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/recipe/${recipe._id}`}>
                        <Eye className="h-4 w-4 mr-1" /> View
                    </Link>
                </Button>

                <div className="flex space-x-2">
                    <ProtectedComponent requiredPermission={Permission.PRINT_RECIPES}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                        >
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Print</span>
                        </Button>
                    </ProtectedComponent>

                    <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                        >
                            <Link href={`/edit/${recipe._id}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Link>
                        </Button>
                    </ProtectedComponent>
                </div>
            </CardFooter>
        </Card>
    );
};

export default RecipeCard;