
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ProtectedRoute from "../../components/ProtectedRoute";
import UserListDesktop from "../../components/UserListDesktop";
import UserListMobile from "../../components/UserListMobile";
import { Permission } from "../../types/Permission";

const UsersPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_USERS}>
      {isMobile ? <UserListMobile /> : <UserListDesktop />}
    </ProtectedRoute>
  );
};

export default UsersPage;