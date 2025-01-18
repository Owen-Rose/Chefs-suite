import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ProtectedRoute from "../../components/ProtectedRoute";
import ArchiveManagement from "@/components/ArchiveManagement";
import { Permission } from "../../types/Permission";

const ArchivesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ProtectedRoute requiredPermission={Permission.EDIT_RECIPES}>
      <ArchiveManagement />
    </ProtectedRoute>
  );
};

export default ArchivesPage;