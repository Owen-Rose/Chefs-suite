import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/components/Dashboard";
import { Permission } from "@/types/Permission";

// Note: This still uses Material UI's useMediaQuery for responsive design
// You can replace it with a custom hook using CSS media queries if you want to fully remove Material UI
const IndexPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ProtectedRoute requiredPermission={Permission.ACCESS_APP}>
      <Dashboard />
    </ProtectedRoute>
  );
};

export default IndexPage;