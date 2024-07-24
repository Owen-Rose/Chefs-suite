import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { styled } from "@mui/system";

const ContainerStyled = styled(Container)(({ theme }) => ({
  padding: "2rem",
  backgroundColor: "#f4f6f8",
  minHeight: "100vh",
}));

const HeaderStyled = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1rem",
});

const TableStyled = styled(Table)(({ theme }) => ({
  minWidth: 650,
  backgroundColor: "#ffffff",
  borderRadius: "8px",
}));

const ActionsStyled = styled("div")({
  display: "flex",
  gap: "0.5rem",
});

const Title = styled(Typography)(({ theme }) => ({
  color: "#333",
  fontWeight: "bold",
  marginBottom: "1rem",
}));

const AddButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1976d2",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#115293",
  },
}));

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setError("Error fetching users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      setUsers(users.filter((user) => user.uid !== id));
      setSuccess("User deleted successfully.");
    } catch (error) {
      setError("Error deleting user.");
    }
  };

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  return (
    <ContainerStyled>
      <HeaderStyled>
        <Title variant="h4">User Management</Title>
        <Link href="/users/add" passHref>
          <AddButton variant="contained" startIcon={<Add />}>
            Add User
          </AddButton>
        </Link>
      </HeaderStyled>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <TableStyled aria-label="user table">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <ActionsStyled>
                      <Link href={`/users/${user.uid}`} passHref>
                        <IconButton color="primary">
                          <Edit />
                        </IconButton>
                      </Link>
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <Delete />
                      </IconButton>
                    </ActionsStyled>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableStyled>
        </TableContainer>
      )}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      <Dialog
        open={open}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the user {selectedUser?.email}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleDelete(selectedUser.uid);
              handleCloseDialog();
            }}
            color="secondary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ContainerStyled>
  );
};

export default UserList;
