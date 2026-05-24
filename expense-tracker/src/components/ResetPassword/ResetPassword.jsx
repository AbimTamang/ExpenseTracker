import { apiUrl } from "../../config/api";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ResetPassword.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!password || !confirm) {
      alert("All fields required");
      return;
    }

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("Password must be at least 8 characters long, contain at least one uppercase letter, and at least one special character.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        apiUrl(`/auth/reset-password`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Password reset successful. Login now.");
        navigate("/");
      } else {
        alert(data.message || "Reset failed");
      }
    } catch (err) {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-container">
      <div className="rp-card">
        <div className="rp-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h2>Reset Password</h2>
        <p className="rp-sub">Enter your new password below</p>

        <form onSubmit={handleReset}>
          <label>New Password</label>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="rp-back" onClick={() => navigate("/")}>
          ← Back to login
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
