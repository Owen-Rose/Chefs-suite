
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ProtectedRoute from "../../components/ProtectedRoute";
import UserList from "@/components/UserList";
import { Permission } from "../../types/Permission";

const UsersPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_USERS}>
      <UserList />
    </ProtectedRoute>
  );
};

export default UsersPage;