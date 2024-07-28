// pages/index.tsx
import ProtectedRoute from "../components/ProtectedRoute";
import HomePage from "../components/HomePage";

const IndexPage = () => {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  );
};

export default IndexPage;
