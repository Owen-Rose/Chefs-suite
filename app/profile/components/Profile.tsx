import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Snackbar,
  Box,
  InputAdornment,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  Person,
  Email,
  VpnKey,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { AuthUser } from "../types/User"; // Adjust the import path as necessary

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { user }: { user: AuthUser | null } = useAuth();

  // State for first name, last name, and email based on user schema
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ")[1] || "");
  const [email, setEmail] = useState(user?.email || "");

  // State for passwords
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          FirstName: firstName,
          LastName: lastName,
          email: email,
          role: user?.role,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({ open: true, message: "Profile updated successfully" });
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to update profile",
        });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to update profile" });
    } finally {
      setEditing(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: "Passwords do not match" });
      return;
    }

    try {
      const response = await fetch(`/api/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        setSnackbar({ open: true, message: "Password changed successfully" });
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to change password",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to change password",
      });
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

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar position="static" className="bg-white shadow-md">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            component={Link}
            href="/"
            className="text-primary mr-4"
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h6"
            className="text-primary font-semibold flex-grow"
          >
            Profile
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" className="mt-12">
        <Paper elevation={1} className="p-6 bg-white rounded-lg shadow-lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item>
              <Avatar
                src={user?.image || "/default-avatar.png"}
                className="w-24 h-24 border-4 border-primary"
                alt={user?.name || "User"}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h5" className="font-bold text-gray-800">
                {user?.name || "User Name"}
              </Typography>
              <Typography variant="subtitle1" className="text-gray-500">
                {user?.role || "ROLE"}
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color={editing ? "secondary" : "primary"}
                className="normal-case"
                startIcon={editing ? <Save /> : <Person />}
                onClick={() => {
                  if (editing) {
                    handleSubmit();
                  } else {
                    setEditing(true);
                  }
                }}
              >
                {editing ? "Save Profile" : "Edit Profile"}
              </Button>
            </Grid>
          </Grid>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Box className="mt-6">
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-800 mb-4"
                >
                  Profile Information
                </Typography>
                <Grid container spacing={3}>
                  {editing ? (
                    <>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <Person className="text-gray-400 mr-2" />
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <Person className="text-gray-400 mr-2" />
                            ),
                          }}
                        />
                      </Grid>
                    </>
                  ) : (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={`${firstName} ${lastName}`}
                        disabled={!editing}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Person className="text-gray-400 mr-2" />
                          ),
                        }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!editing}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Email className="text-gray-400 mr-2" />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={user?.role || ""}
                      disabled
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <VpnKey className="text-gray-400 mr-2" />
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider className="my-6" />

              <Box>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-800 mb-4"
                >
                  Change Password
                </Typography>
                <form className="space-y-4">
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onFocus={() => handleFocus("currentPassword")}
                    onBlur={handleBlur}
                    InputProps={{
                      endAdornment: focusedField === "currentPassword" && (
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
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => handleFocus("newPassword")}
                    onBlur={handleBlur}
                    InputProps={{
                      endAdornment: focusedField === "newPassword" && (
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
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => handleFocus("confirmPassword")}
                    onBlur={handleBlur}
                    InputProps={{
                      endAdornment: focusedField === "confirmPassword" && (
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
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    className="mt-4 bg-primary hover:bg-primary-dark"
                    onClick={handleChangePassword}
                  >
                    Change Password
                  </Button>
                </form>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </div>
  );
};

export default Profile;
