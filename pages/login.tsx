import { useState } from "react";
import { TextField, Button, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { Login } from "@mui/icons-material";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.push("/");
    } catch (error) {
      console.error("Failed to login", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <Typography variant="h4" className="text-center mb-6">
          Login
        </Typography>
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
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleLogin}
          startIcon={<Login />}
          className="mb-4"
        >
          Login
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
