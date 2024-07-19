import { useState } from "react";
import { TextField, Button, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { Login } from "@mui/icons-material";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        try {
            await login(email, password);
            router.push('/');
        } catch (error) {
            console.error('Failed to login', error);
        }
    };

    return (
        <div>
            <Typography variant="h4">Login</Typography>
            <TextField
                label="Email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4"
            />
            <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-4"
            />
            <Button variant='contained' color="primary" onClick={handleLogin}>
                Login
            </Button>
        </div>
    );
}

export default LoginPage;