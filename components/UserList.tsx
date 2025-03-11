import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Snackbar,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Search } from "@mui/icons-material";
import { User } from "../types/User";
import { UserRole } from "../types/Roles";
import { useAuth } from "../hooks/useAuth";
import { Permission } from "../types/Permission";
import { ObjectId } from "mongodb";
import { Email } from "@mui/icons-material";
import Link from "next/link";
type FormUser = Omit<User, "_id" | "createdAt" | "updatedAt">;

const UserList: React.FC = () => {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormUser>({
    FirstName: "",
    LastName: "",
    email: "",
    password: "",
    role: UserRole.STAFF,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const { user: currentUser, hasPermission } = useAuth();
  const canEditUser = (userRole: UserRole) => {
    if (currentUser?.role === UserRole.ADMIN) return true;
    if (currentUser?.role === UserRole.CHEF) return userRole !== UserRole.ADMIN;
    if (currentUser?.role === UserRole.PASTRY_CHEF)
      return userRole !== UserRole.ADMIN && userRole !== UserRole.CHEF;
    if (currentUser?.role === UserRole.MANAGER)
      return userRole === UserRole.STAFF;
    return false;
  };

  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session]);

  useEffect(() => {
    setFilteredUsers(
      users.filter(
        (user) =>
          user.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setSnackbar({ open: true, message: "Failed to fetch users" });
    }
    const sessionUser = session?.user as { role: UserRole };
    console.log("Session status:", status);
    console.log("User role:", sessionUser?.role);
  };

  const getAvailableRoles = () => {
    if (currentUser?.role === UserRole.ADMIN) {
      return Object.values(UserRole);
    } else if (currentUser?.role === UserRole.CHEF) {
      return [UserRole.CHEF, UserRole.MANAGER, UserRole.STAFF];
    } else if (currentUser?.role === UserRole.MANAGER) {
      return [UserRole.STAFF];
    }
    return [];
  };

  const handleOpenModal = (user?: User) => {
    if (user && !canEditUser(user.role)) {
      setSnackbar({
        open: true,
        message: `You don't have permission to edit ${user.role} users.`,
      });
      return;
    }

    if (user) {
      setSelectedUser(user);
      setFormData({
        FirstName: user.FirstName,
        LastName: user.LastName,
        email: user.email,
        password: "",
        role: user.role,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        FirstName: "",
        LastName: "",
        email: "",
        password: "",
        role: UserRole.STAFF,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<UserRole>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name as string]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (selectedUser && !canEditUser(selectedUser.role)) {
        throw new Error(
          `You don't have permission to edit ${selectedUser.role} users`
        );
      }

      const availableRoles = getAvailableRoles();
      if (!availableRoles.includes(formData.role)) {
        throw new Error("You don't have permission to assign this role");
      }

      const url = selectedUser
        ? `/api/users/${selectedUser._id}`
        : "/api/users";
      const method = selectedUser ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to save user");
      fetchUsers();
      handleCloseModal();
      setSnackbar({
        open: true,
        message: `User ${selectedUser ? "updated" : "created"} successfully`,
      });
    } catch (error) {
      console.error("Error saving user:", error);
      setSnackbar({ open: true, message: (error as Error).message });
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete user");
        fetchUsers();
        setSnackbar({ open: true, message: "User deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        setSnackbar({ open: true, message: "Failed to delete user" });
      }
    }
  };

  if (status === "loading") {
    return <CircularProgress />;
  }

  if (!session) {
    return <Typography>Please log in to access this page.</Typography>;
  }

  if (!hasPermission(Permission.VIEW_USERS)) {
    return (
      <Typography>You don&apos;t have permission to view this page.</Typography>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Container maxWidth="lg" className="py-8">
        <div className="flex justify-between items-center mb-8">
          <Typography
            variant="h4"
            component="h1"
            className="font-bold text-gray-800"
          >
            User Management
          </Typography>
          <div className="flex space-x-4">
            {hasPermission(Permission.CREATE_USERS) && (
              <Link href="/invitations" passHref>
                <Button
                  variant="outlined"
                  startIcon={<Email />}
                  className="border-primary text-primary hover:bg-primary hover:bg-opacity-10"
                >
                  Manage Invitations
                </Button>
              </Link>
            )}
            {hasPermission(Permission.CREATE_USERS) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => handleOpenModal()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add User
              </Button>
            )}
          </div>
        </div>

        <Paper elevation={3} className="p-6 mb-8">
          <TextField
            label="Search Users"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <Search className="text-gray-400 mr-2" />,
            }}
          />
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow className="bg-gray-200">
                <TableCell>
                  <strong>Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
                <TableCell>
                  <strong>Role</strong>
                </TableCell>
                <TableCell>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user._id!.toString()}
                  className="hover:bg-gray-50"
                >
                  <TableCell>{`${user.FirstName} ${user.LastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      className="bg-blue-100 text-blue-800"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {hasPermission(Permission.EDIT_USERS) && (
                        <Tooltip
                          title={
                            canEditUser(user.role)
                              ? "Edit User"
                              : `Cannot edit ${user.role} user`
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => handleOpenModal(user)}
                              disabled={!canEditUser(user.role)}
                            >
                              <Edit />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {hasPermission(Permission.DELETE_USERS) &&
                        canEditUser(user.role) && (
                          <Tooltip title="Delete User">
                            <IconButton
                              onClick={() => handleDelete(user._id!.toString())}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={isModalOpen} onClose={handleCloseModal}>
          <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                name="FirstName"
                label="First Name"
                value={formData.FirstName}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                name="LastName"
                label="Last Name"
                value={formData.LastName}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              {!selectedUser && (
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                />
              )}
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  fullWidth
                  required
                >
                  {getAvailableRoles().map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" color="primary">
                {selectedUser ? "Update" : "Add"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Container>
    </div>
  );
};

export default UserList;
