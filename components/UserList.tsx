import { useEffect, useState } from "react";
import Link from "next/link";

const UserList = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("/api/users");
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        }
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/users/${id}`, {
                method: "DELETE",
            });
            setUsers(users.filter((user: any) => user.id !== id));
        } catch (error) {
            console.error("Error deleting user: ", error);
        }
    }

    return (
        <div>
            <h1>User Management</h1>
            <Link href="/users/add">
                <a>Add User</a>
            </Link>
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user: any) => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>
                                <Link href={`/users/${user.id}`}>
                                    <button>Edit</button>
                                </Link>
                                <button onClick={() => handleDelete(user.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserList;