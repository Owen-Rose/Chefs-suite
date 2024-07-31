import React, { useState, useEffect } from "react";
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
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add, Edit, Delete, Search, Person } from "@mui/icons-material";
import { styled } from "@mui/system";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
}));

type User = {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [sortBy, setSortBy] = useState("email");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "User",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data: User[] = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await fetch(`/api/users/${userId}`, { method: "DELETE" });
        fetchUsers(); // Refresh the list after deletion
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleOpenModal = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "User",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setFormData({ ...formData, role: e.target.value as string });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to add user");
      fetchUsers(); // Refresh the list after adding a user
      handleCloseModal();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "", // Don't populate password for security reasons
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update user");
      fetchUsers(); // Refresh the list after updating a user
      handleCloseEditModal();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const filteredAndSortedUsers = users
    .filter(
      (user) =>
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase())
    )
    .filter((user) => (role ? user.role === role : true))
    .sort((a, b) => {
      if (sortBy === "email") return a.email.localeCompare(b.email);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      return 0;
    });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortBy(event.target.value as string);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Container maxWidth="lg" className="px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Typography
            variant="h4"
            component="h1"
            className="font-bold text-gray-800"
          >
            User Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleOpenModal}
          >
            Add User
          </Button>
        </div>

        <Paper elevation={3} className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Search Users"
              variant="outlined"
              value={search}
              onChange={handleSearch}
              fullWidth
              InputProps={{
                startAdornment: <Search className="text-gray-400 mr-2" />,
              }}
            />
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as string)}
                label="Filter by Role"
              >
                <MenuItem value="">
                  <em>All Roles</em>
                </MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="User">User</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                onChange={handleSortChange}
                label="Sort by"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="role">Role</MenuItem>
              </Select>
            </FormControl>
          </div>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-200">
                  <TableCell>
                    <strong>First Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Last Name</strong>
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
                {filteredAndSortedUsers.map((user) => (
                  <TableRow key={user.uid} className="hover:bg-gray-50">
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === "Admin" ? "secondary" : "primary"}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Tooltip title="Edit User">
                          <IconButton onClick={() => handleOpenEditModal(user)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDelete(user.uid)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={isModalOpen} onClose={handleCloseModal}>
          <DialogTitle>{"Add New User"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  required
                  fullWidth
                  startAdornment={<Person color="action" />}
                >
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <DialogActions>
                <Button onClick={handleCloseModal} color="secondary">
                  Cancel
                </Button>
                <Button type="submit" color="primary">
                  Add User
                </Button>
              </DialogActions>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onClose={handleCloseEditModal}>
          <DialogTitle>{"Edit User"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleEditSubmit}>
              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                label="New Password (leave blank to keep current)"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  required
                  fullWidth
                  startAdornment={<Person color="action" />}
                >
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <DialogActions>
                <Button onClick={handleCloseEditModal} color="secondary">
                  Cancel
                </Button>
                <Button type="submit" color="primary">
                  Update User
                </Button>
              </DialogActions>
            </form>
          </DialogContent>
        </Dialog>
      </Container>
    </div>
  );
};

export default UserList;
