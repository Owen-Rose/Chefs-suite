import { Button } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";

const LogoutButton = () => {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('\login');
    };

    return (
        <Button variant="contained" color="secondary" onClick={handleLogout}>
            Logout
        </Button>
    )
}

export default LogoutButton;