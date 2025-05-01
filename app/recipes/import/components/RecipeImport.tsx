import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileUtils } from '@/utils/fileUtils';
import { Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
    success: boolean;
    total: number;
    imported: number;
    errors: { row: number; error: string }[];
}

const RecipeImport: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFileError(null);
        setUploadResult(null);

        if (selectedFile) {
            const validation = FileUtils.validateFile(selectedFile);
            if (!validation.valid && validation.error) {
                setFileError(validation.error);
                setFile(null);
                return;
            }
            setFile(selectedFile);
        } else {
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/recipes/import', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setUploadResult(result);
                if (result.errors.length === 0) {
                    toast({
                        title: "Success",
                        description: `Successfully imported ${result.imported} recipes`,
                    });
                } else {
                    toast({
                        title: "Warning",
                        description: `Imported ${result.imported} of ${result.total} recipes with ${result.errors.length} errors`,
                        variant: "destructive",
                    });
                }
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            setFileError(error instanceof Error ? error.message : 'Upload failed');
            toast({
                title: "Error",
                description: "Recipe import failed",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Import Recipes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <input
                            type="file"
                            id="recipe-import"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="recipe-import"
                            className="flex flex-col items-center justify-center cursor-pointer"
                        >
                            <Upload className="w-12 h-12 mb-2 text-gray-400" />
                            <span className="text-sm font-medium">
                                {file ? file.name : 'Click to upload or drag and drop'}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                                CSV file (max 5MB)
                            </span>
                        </label>
                    </div>

                    {fileError && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{fileError}</AlertDescription>
                        </Alert>
                    )}

                    {uploadResult && (
                        <Alert variant={uploadResult.errors.length > 0 ? "destructive" : "default"}>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Import Complete</AlertTitle>
                            <AlertDescription>
                                Successfully imported {uploadResult.imported} of {uploadResult.total} recipes.
                                {uploadResult.errors.length > 0 && (
                                    <div className="mt-2">
                                        <p>Errors encountered ({uploadResult.errors.length}):</p>
                                        <ul className="list-disc pl-5 mt-1 text-sm">
                                            {uploadResult.errors.slice(0, 3).map((error, index) => (
                                                <li key={index}>Row {error.row}: {error.error}</li>
                                            ))}
                                            {uploadResult.errors.length > 3 && (
                                                <li>...and {uploadResult.errors.length - 3} more errors</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="w-full"
                >
                    {isUploading ? 'Uploading...' : 'Import Recipes'}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default RecipeImport;
