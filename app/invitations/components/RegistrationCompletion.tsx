import React, { useState, useEffect } from "react";
import {
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton,
    Stepper,
    Step,
    StepLabel,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";

interface RegistrationState {
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
}

const RegistrationCompletion: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams()!;
    const token = searchParams.get("token");

    const [formData, setFormData] = useState<RegistrationState>({
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [tokenVerified, setTokenVerified] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

    // Verify token when component mounts
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) return;

            try {
                const response = await fetch(`/api/invitations/verify/${token}`);
                const data = await response.json();

                if (response.ok && data.valid) {
                    setTokenVerified(true);
                    setInvitedEmail(data.invitation.email);
                } else {
                    setError(data.error || "Invalid or expired invitation link");
                }
            } catch (err) {
                setError("Failed to verify invitation. Please try again.");
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.firstName || !formData.lastName || !formData.password) {
            setError("All fields are required");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/invitations/complete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                setError(data.error || "Failed to complete registration");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while verifying token
    if (verifying) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                padding={3}
            >
                <CircularProgress />
                <Typography variant="h6" style={{ marginTop: 16 }}>
                    Verifying invitation...
                </Typography>
            </Box>
        );
    }

    // Show error if token is invalid
    if (!tokenVerified) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                padding={3}
            >
                <Paper
                    elevation={3}
                    style={{ padding: 24, maxWidth: 500, width: "100%" }}
                >
                    <Typography variant="h5" component="h1" gutterBottom align="center">
                        Invalid Invitation
                    </Typography>
                    <Alert severity="error" style={{ marginTop: 16 }}>
                        {error || "This invitation link is invalid or has expired."}
                    </Alert>
                    <Box textAlign="center" marginTop={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => router.push("/login")}
                        >
                            Go to Login
                        </Button>
                    </Box>
                </Paper>
            </Box>
        );
    }

    // Show success message
    if (success) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                padding={3}
            >
                <Paper
                    elevation={3}
                    style={{ padding: 24, maxWidth: 500, width: "100%" }}
                >
                    <Typography variant="h5" component="h1" gutterBottom align="center">
                        Registration Complete
                    </Typography>
                    <Alert severity="success" style={{ marginTop: 16 }}>
                        Your account has been created successfully! You&apos;ll be redirected to
                        the login page shortly.
                    </Alert>
                    <Box textAlign="center" marginTop={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => router.push("/login")}
                        >
                            Go to Login
                        </Button>
                    </Box>
                </Paper>
            </Box>
        );
    }

    // Show registration form
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            padding={3}
        >
            <Paper
                elevation={3}
                style={{ padding: 24, maxWidth: 500, width: "100%" }}
            >
                <Typography variant="h5" component="h1" gutterBottom align="center">
                    Complete Your Registration
                </Typography>

                {invitedEmail && (
                    <Alert severity="info" style={{ marginBottom: 16 }}>
                        You&apos;re creating an account for: <strong>{invitedEmail}</strong>
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" style={{ marginBottom: 16 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleTogglePassword}
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
                        label="Confirm Password"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        margin="normal"
                        required
                        error={
                            !!formData.confirmPassword &&
                            formData.password !== formData.confirmPassword
                        }
                        helperText={
                            formData.confirmPassword &&
                                formData.password !== formData.confirmPassword
                                ? "Passwords do not match"
                                : ""
                        }
                    />
                    <Box marginTop={3}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : "Complete Registration"}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default RegistrationCompletion;