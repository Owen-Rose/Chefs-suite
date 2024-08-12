import { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  IconButton,
  InputAdornment,
  Alert,
} from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { Login, Visibility, VisibilityOff } from "@mui/icons-material";

const LoginPage = () => {
  const [email, setEmail] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("email") || "" : ""
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => typeof window !== "undefined" && !!localStorage.getItem("email")
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem("email", email);
      } else {
        localStorage.removeItem("email");
      }
      router.push("/");
    } catch (error) {
      console.error("Failed to login", error);
      setError("Invalid email or password. Please try again.");
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <Typography variant="h4" className="text-center mb-6">
          Sign In
        </Typography>
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}
        <form onSubmit={handleLogin}>
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
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <div className="flex justify-between items-center mb-4">
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                />
              }
              label="Remember Me"
            />
            <Link href="/forgot-password" className="text-blue-600">
              Forgot Password?
            </Link>
          </div>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<Login />}
            className="mb-4"
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;