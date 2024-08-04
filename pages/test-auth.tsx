import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "../context/AuthContext";

export default function TestAuth() {
  const { data: session } = useSession();
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationData, setRegistrationData] = useState({
    email: "",
    password: "",
    FirstName: "",
    LastName: "",
    role: "STAFF",
  });
  const [registrationResult, setRegistrationResult] = useState<string | null>(
    null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      const result = await response.json();
      setRegistrationResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Registration failed:", error);
      setRegistrationResult("Registration failed");
    }
  };

  return (
    <div>
      <h1>Test Authentication</h1>

      <h2>Session Data:</h2>
      <pre>{JSON.stringify(session, null, 2)}</pre>

      <h2>User Data from Context:</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h2>Login Test</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">Login</button>
      </form>

      <h2>Registration Test</h2>
      <form onSubmit={handleRegistration}>
        <input
          type="email"
          value={registrationData.email}
          onChange={(e) =>
            setRegistrationData({ ...registrationData, email: e.target.value })
          }
          placeholder="Email"
        />
        <input
          type="password"
          value={registrationData.password}
          onChange={(e) =>
            setRegistrationData({
              ...registrationData,
              password: e.target.value,
            })
          }
          placeholder="Password"
        />
        <input
          type="text"
          value={registrationData.FirstName}
          onChange={(e) =>
            setRegistrationData({
              ...registrationData,
              FirstName: e.target.value,
            })
          }
          placeholder="First Name"
        />
        <input
          type="text"
          value={registrationData.LastName}
          onChange={(e) =>
            setRegistrationData({
              ...registrationData,
              LastName: e.target.value,
            })
          }
          placeholder="Last Name"
        />
        <select
          value={registrationData.role}
          onChange={(e) =>
            setRegistrationData({ ...registrationData, role: e.target.value })
          }
        >
          <option value="STAFF">Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="CHEF">Chef</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button type="submit">Register</button>
      </form>
      {registrationResult && (
        <div>
          <h3>Registration Result:</h3>
          <pre>{registrationResult}</pre>
        </div>
      )}
    </div>
  );
}
