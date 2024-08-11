// pages/index.tsx
import ProtectedRoute from "../components/ProtectedRoute";
import HomePage from "../components/HomePage";
import { Permission } from "../types/Permission";

const IndexPage = () => {
  return (
    <ProtectedRoute requiredPermission={Permission.ACCESS_APP}>
      <HomePage />
    </ProtectedRoute>
  );
};

export default IndexPage;
