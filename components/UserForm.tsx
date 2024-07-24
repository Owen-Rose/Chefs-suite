import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { isFloat64Array } from "util/types";

const UserForm = ({ userId = null }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
                    console.error("Error fetching user: ", error);
                }

            };

            fetchUser();
        }
    }, [userId]);

    const handleSubmit = async (event: any) => {
        event.preventDefault();
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
            router.push("/users");
        } catch (error) {
            console.error("Error submitting form: ", error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!userId}
                />
            </div>
            <button type="submit">{userId ? "Update User" : "Create User"}</button>
        </form>
    );
};

export default UserForm;