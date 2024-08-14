import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ProtectedRoute from "../components/ProtectedRoute";
import HomePage from "../components/HomePage";
import HomePageMobile from "../components/HomePageMobile";
import { Permission } from "../types/Permission";

const IndexPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ProtectedRoute requiredPermission={Permission.ACCESS_APP}>
      {isMobile ? <HomePageMobile /> : <HomePage />}
    </ProtectedRoute>
  );
};

export default IndexPage;