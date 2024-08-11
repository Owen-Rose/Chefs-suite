import React from "react";
import Profile from "../components/Profile";
import ProtectedRoute from "../components/ProtectedRoute";
import { Permission } from "../types/Permission";

const ProfilePage: React.FC = () => {
  return (
    <ProtectedRoute requiredPermission={Permission.ACCESS_APP}>
      <Profile />
    </ProtectedRoute>
  );
};

export default ProfilePage;
