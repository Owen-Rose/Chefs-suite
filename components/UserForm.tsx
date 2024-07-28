import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  MenuItem,
  Box,
} from "@mui/material";
import { styled } from "@mui/system";
import { Person, Email, Lock } from "@mui/icons-material";

const FormPaper = styled(Paper)(({ theme }) => ({
  padding: "2rem",
  maxWidth: "500px",
  width: "100%",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
}));

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  marginBottom: "1.5rem",
  textAlign: "center",
}));

const MessageBox = styled(Box)<{ severity: "success" | "error" }>(
  ({ theme, severity }) => ({
    padding: "1rem",
    marginBottom: "1rem",
    borderRadius: "4px",
    backgroundColor: severity === "success" ? "#e8f5e9" : "#ffebee",
    color: severity === "success" ? "#1b5e20" : "#b71c1c",
  })
);

const roles = ["User", "Admin", "Manager"];

type UserFormProps = {
  userId?: string | null;
};

type FormData = {
  email: string;
  password: string;
  role: string;
};

type Message = {
  type: "success" | "error";
  content: string;
};

const UserForm: React.FC<UserFormProps> = ({ userId = null }) => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    role: "User",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (userId) {
      setLoading(true);
      fetch(`/api/users/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setFormData({ ...data, password: "" });
          setLoading(false);
        })
        .catch(() => {
          setMessage({ type: "error", content: "Error fetching user data." });
          setLoading(false);
        });
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = userId ? `/api/users/${userId}` : "/api/users";
      const method = userId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save user");
      setMessage({
        type: "success",
        content: `User ${userId ? "updated" : "created"} successfully.`,
      });
      setTimeout(() => router.push("/users"), 2000);
    } catch (error: any) {
      setMessage({ type: "error", content: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <FormPaper elevation={3}>
        <Title variant="h4">{userId ? "Edit User" : "Create User"}</Title>
        {message && (
          <MessageBox severity={message.type}>{message.content}</MessageBox>
        )}
        {loading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              InputProps={{ startAdornment: <Email color="action" /> }}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required={!userId}
              fullWidth
              margin="normal"
              InputProps={{ startAdornment: <Lock color="action" /> }}
            />
            <TextField
              select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              InputProps={{ startAdornment: <Person color="action" /> }}
            >
              {roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {userId ? "Update User" : "Create User"}
            </Button>
          </form>
        )}
      </FormPaper>
    </Container>
  );
};

export default UserForm;
