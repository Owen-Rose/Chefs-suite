import { Button } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";

const LogoutButton = () => {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');  // Changed from '\login' to '/login'
        } catch (error) {
            console.error("Logout failed:", error);
            // Handle logout error (e.g., show an error message to the user)
        }
    };

    return (
        <Button variant="contained" color="secondary" onClick={handleLogout}>
            Logout
        </Button>
    )
}

export default LogoutButton;