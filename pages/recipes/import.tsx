import { NextPage } from 'next';
import Head from 'next/head';
import RecipeImport from '../../components/RecipeImport';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Permission } from '../../types/Permission';

const ImportPage: NextPage = () => {
    return (
        <ProtectedRoute requiredPermission={Permission.IMPORT_RECIPES}>
            <Head>
                <title>Import Recipes</title>
                <meta name="description" content="Import recipes from CSV files" />
            </Head>
            <div className="container mx-auto py-10">
                <h1 className="text-2xl font-bold mb-6">Import Recipes</h1>
                <RecipeImport />
            </div>
        </ProtectedRoute>
    );
};

export default ImportPage;
