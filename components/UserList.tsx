import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  CircularProgress,
  Box,
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, Search } from "@mui/icons-material";
import Link from "next/link";
import { styled } from "@mui/system";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
}));

type User = {
  uid: string;
  email: string;
  role: string;
};

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean }>({
    open: false,
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

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleSelectAllUsers = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedUsers(filteredUsers.map((user) => user.uid));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleCloseNotification = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={4}
        mb={2}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Link href="/users/add" passHref>
          <Button variant="contained" color="primary" startIcon={<Add />}>
            Add User
          </Button>
        </Link>
      </Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search users..."
        value={search}
        onChange={handleSearch}
        InputProps={{
          startAdornment: <Search color="action" />,
        }}
      />
      <StyledPaper>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {filteredUsers.map((user) => (
              <ListItem key={user.uid} divider>
                <ListItemText
                  primary={user.email}
                  secondary={
                    <Chip
                      label={user.role}
                      size="small"
                      color={user.role === "Admin" ? "secondary" : "primary"}
                    />
                  }
                />
                <ListItemSecondaryAction>
                  <Link href={`/users/${user.uid}`} passHref>
                    <IconButton edge="end" aria-label="edit" color="primary">
                      <Edit />
                    </IconButton>
                  </Link>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(user.uid)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </StyledPaper>
    </Container>
  );
};

export default UserList;
