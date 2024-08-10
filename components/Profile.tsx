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

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSnackbar({ open: true, message: "Profile updated successfully" });
    setEditing(false);
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
                onClick={() => setEditing(!editing)}
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
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={user?.name || ""}
                      disabled={!editing}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Person className="text-gray-400 mr-2" />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={user?.email || ""}
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    required
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
                    type="submit"
                    variant="contained"
                    color="primary"
                    className="mt-4 bg-primary hover:bg-primary-dark"
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
