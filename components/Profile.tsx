import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { User } from "../types/User";

const Profile: React.FC = () => {
  const { data: session, status } = useSession();
  const { user } = useAuth();
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setSnackbar({ open: true, message: "New passwords do not match" });
      return;
    }

    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const responseText = await response.text();

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        throw new Error("Invalid response from server");
      }

      if (response.ok) {
        setSnackbar({ open: true, message: "Password changed successfully" });
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        throw new Error(responseData.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error:", error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  if (status === "loading") {
    return <CircularProgress />;
  }

  if (!session) {
    return <Typography>Please log in to view your profile.</Typography>;
  }

  return (
    <Container maxWidth="md" className="mt-8">
      <Paper elevation={3} className="p-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Name: {user?.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Email: {user?.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Role: {user?.role}</Typography>
          </Grid>
        </Grid>
        <Typography variant="h6" className="mt-6 mb-4">
          Change Password
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            name="currentPassword"
            label="Current Password"
            type="password"
            value={passwords.currentPassword}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            name="newPassword"
            label="New Password"
            type="password"
            value={passwords.newPassword}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            name="confirmNewPassword"
            label="Confirm New Password"
            type="password"
            value={passwords.confirmNewPassword}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            className="mt-4"
          >
            Change Password
          </Button>
        </form>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default Profile;
