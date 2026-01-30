import "./Signup.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import signupImage from "./signup.webp";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("All fields required");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Signup successful. Please login.");
        navigate("/"); // Redirect to login
      } else {
        alert(data.message || "Signup failed");
      }
    } catch {
      alert("Server error. Try again later.");
    }
  };

  return (
    <div className="signup-container">
      {/* Left Side - Form */}
      <div className="signup-left">
        <h4 className="brand">ExpenseTracker</h4>
        <h2>Create your account</h2>
        <p className="subtitle">
          Start tracking your expenses today. Join thousands of users managing their finances smarter.
        </p>

        <button className="google-btn">
          <img
            src="https://png.pngtree.com/png-vector/20230817/ourmid/pngtree-google-internet-icon-vector-png-image_9183287.png"
            alt="Google"
          />
          Sign up with Google
        </button>

        <p className="divider-text">Or continue with email</p>

        <form className="signup-form" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button className="signup-btn" type="submit">
            Create Account
          </button>
        </form>

        <p className="login-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/")}>Log In</span>
        </p>
      </div>

      {/* Right Side - Image */}
      <div className="signup-right">
       <img
  src={signupImage}
  alt="Finance Growth"
   />

      </div>
    </div>
  );
};

export default Signup;
