import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await API.post("login/", {
                username,
                password
            });

            const data = response.data;

            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh", data.refresh);
            localStorage.setItem("username", data.username);
            localStorage.setItem("organization", data.organization);

            navigate("/", { replace: true });

        } catch (err) {
            setError(
                err.response?.data?.error ||
                "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                <h1>DealerOS</h1>
                <p>Sign in to your account</p>

                <form onSubmit={handleLogin}>

                    <label>Username</label>

                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Login"}
                    </button>

                </form>

            </div>
        </div>
    );
}

export default Login;