import React from "react";
import { Typography, Container, Paper } from "@mui/material";
import ArchiveManagement from "../../components/ArchiveManagement";
import ProtectedRoute from "../../components/ProtectedRoute";
import { Permission } from "../../types/Permission";

const ArchivesPage: React.FC = () => {
  return (
    <ProtectedRoute requiredPermission={Permission.EDIT_RECIPES}>
      <Container maxWidth="lg" className="py-8">
        <Paper elevation={3} className="p-6 mb-8">
          <ArchiveManagement />
        </Paper>
      </Container>
    </ProtectedRoute>
  );
};

export default ArchivesPage;
