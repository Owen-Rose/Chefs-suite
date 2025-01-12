import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ProtectedRoute from "../../components/ProtectedRoute";
import ArchiveManagementDesktop from "../../components/ArchiveManagementDesktop";
import ArchiveManagementMobile from "../../components/ArchiveManagementMobile";
import { Permission } from "../../types/Permission";

const ArchivesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ProtectedRoute requiredPermission={Permission.EDIT_RECIPES}>
      {isMobile ? <ArchiveManagementMobile /> : <ArchiveManagementDesktop />}
    </ProtectedRoute>
  );
};

export default ArchivesPage;