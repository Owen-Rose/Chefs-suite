import { useRouter } from "next/router";
import { useState, useEffect, FormEvent } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { styled } from "@mui/system";

const ContainerStyled = styled(Container)(({ theme }) => ({
  padding: "2rem",
  backgroundColor: "#f4f6f8",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const FormPaper = styled(Paper)(({ theme }) => ({
  padding: "2rem",
  maxWidth: "500px",
  width: "100%",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
}));

const Title = styled(Typography)(({ theme }) => ({
  color: "#333",
  fontWeight: "bold",
  marginBottom: "1rem",
  textAlign: "center",
}));

interface UserFormProps {
  userId?: string | null;
}

const UserForm = ({ userId = null }: UserFormProps) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        try {
          const response = await fetch(`/api/users/${userId}`);
          const data = await response.json();
          const { email } = data;
          setEmail(email);
        } catch (error) {
          setError("Error fetching user.");
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (userId) {
        await fetch(`/api/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
      } else {
        await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
      }
      setSuccess(`User ${userId ? "updated" : "created"} successfully.`);
      setTimeout(() => {
        router.push("/users");
      }, 2000);
    } catch (error) {
      setError("Error submitting form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContainerStyled>
      <FormPaper elevation={3}>
        <Title variant="h5">{userId ? "Edit User" : "Create User"}</Title>
        {loading ? (
          <CircularProgress />
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!userId}
              fullWidth
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              {userId ? "Update User" : "Create User"}
            </Button>
          </form>
        )}
      </FormPaper>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess("")}
      >
        <Alert onClose={() => setSuccess("")} severity="success">
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert onClose={() => setError("")} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </ContainerStyled>
  );
};

export default UserForm;
