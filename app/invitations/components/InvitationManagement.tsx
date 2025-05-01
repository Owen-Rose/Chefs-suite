// components/InvitationManagement.tsx
import React, { useState, useEffect } from "react";
import {
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Snackbar,
    Alert,
    CircularProgress,
    Pagination,
} from "@mui/material";
import {
    Add,
    ContentCopy,
    Refresh,
    Email,
} from "@mui/icons-material";
import { UserRole } from "../types/Roles";
import { InvitationStatus } from "../types/Invitation";

interface Invitation {
    _id: string;
    email: string;
    role: UserRole;
    status: InvitationStatus;
    expiresAt: string;
    createdAt: string;
    completedAt?: string;
}

const InvitationManagement: React.FC = () => {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<UserRole>(UserRole.STAFF);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [magicLink, setMagicLink] = useState("");
    const [copySuccess, setCopySuccess] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch invitations when component mounts or filters change
    useEffect(() => {
        fetchInvitations();
    }, [page, statusFilter]);

    const fetchInvitations = async () => {
        setLoading(true);
        try {
            let url = `/api/invitations?page=${page}&limit=10`;
            if (statusFilter) {
                url += `&status=${statusFilter}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setInvitations(data.invitations);
                setTotalPages(data.totalPages || 1);
            } else {
                setError(data.error || "Failed to fetch invitations");
            }
        } catch (err) {
            setError("An error occurred while fetching invitations");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvitation = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError("Email is required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/invitations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, role }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Invitation sent to ${email}`);
                setEmail("");
                setMagicLink(data.magicLink);
                setDialogOpen(true);
                fetchInvitations();
            } else {
                setError(data.error || "Failed to create invitation");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(magicLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const getStatusColor = (status: InvitationStatus) => {
        switch (status) {
            case InvitationStatus.PENDING:
                return "primary";
            case InvitationStatus.COMPLETED:
                return "success";
            case InvitationStatus.EXPIRED:
                return "error";
            default:
                return "default";
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h4" component="h1" gutterBottom>
                Invitation Management
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Create New Invitation
                </Typography>
                <Box component="form" onSubmit={handleCreateInvitation}>
                    <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            required
                        />
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                label="Role"
                            >
                                {Object.values(UserRole).map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <Add />}
                            sx={{ minWidth: 150 }}
                        >
                            Send Invitation
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Invitations</Typography>
                    <Box display="flex" gap={2}>
                        <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                label="Status"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value={InvitationStatus.PENDING}>Pending</MenuItem>
                                <MenuItem value={InvitationStatus.COMPLETED}>Completed</MenuItem>
                                <MenuItem value={InvitationStatus.EXPIRED}>Expired</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            onClick={fetchInvitations}
                            startIcon={<Refresh />}
                            variant="outlined"
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>

                {loading && invitations.length === 0 ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Created</TableCell>
                                        <TableCell>Expires</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invitations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                No invitations found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invitations.map((invitation) => (
                                            <TableRow key={invitation._id}>
                                                <TableCell>{invitation.email}</TableCell>
                                                <TableCell>{invitation.role}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={invitation.status}
                                                        color={getStatusColor(invitation.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(invitation.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(invitation.expiresAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => {
                                                            // You could implement email resending here
                                                            alert("Email resend functionality would go here");
                                                        }}
                                                        disabled={invitation.status !== InvitationStatus.PENDING}
                                                    >
                                                        <Email />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box display="flex" justifyContent="center" mt={3}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handleChangePage}
                                color="primary"
                            />
                        </Box>
                    </>
                )}
            </Paper>

            {/* Magic Link Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md">
                <DialogTitle>Invitation Created</DialogTitle>
                <DialogContent>
                    <DialogContentText mb={2}>
                        Your invitation has been created. Share this link with the user:
                    </DialogContentText>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 2,
                            bgcolor: "grey.100",
                            borderRadius: 1,
                        }}
                    >
                        <Typography variant="body2" sx={{ flexGrow: 1, wordBreak: "break-all" }}>
                            {magicLink}
                        </Typography>
                        <IconButton color="primary" onClick={handleCopyLink}>
                            <ContentCopy />
                        </IconButton>
                    </Box>
                    {copySuccess && (
                        <Typography color="success.main" variant="body2" mt={1}>
                            Link copied to clipboard!
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for error & success messages */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setError(null)} severity="error">
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setSuccess(null)} severity="success">
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default InvitationManagement;