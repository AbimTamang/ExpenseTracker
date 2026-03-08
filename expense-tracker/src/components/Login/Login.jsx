import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 🔐 LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ✅ SAVE LOGIN INFO
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);

        // Slight delay for smooth animation before navigating
        setTimeout(() => navigate("/dashboard"), 600);
      } else {
        alert(data.message || "Invalid credentials. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      alert("Server error. Try again later.");
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);
        navigate("/dashboard");
      } else {
        alert(data.message || "Google authentication failed");
      }
    } catch (err) {
      alert("Server error during Google auth");
    }
  };

  return (
    <div className="login-container fade-in">
      {/* LEFT SECTION - IMAGE & BRANDING */}
      <div className="login-left">
        <div className="overlay-content">
          <div className="brand-logo">ET.</div>
          <div className="hero-text">
            <h1>Master your money,<br />master your life.</h1>
            <p>Join over 100,000 users taking control of their financial future with ExpenseTracker.</p>
          </div>

          <div className="testimonial">
            <div className="stars">★★★★★</div>
            <p>"The single best financial decision I've made this year was switching to ExpenseTracker."</p>
            <span>— Sarah J., Small Business Owner</span>
          </div>
        </div>
        <div className="glass-overlay"></div>
      </div>

      {/* RIGHT SECTION - LOGIN FORM */}
      <div className="login-right">
        <div className="form-wrapper">
          <div className="mobile-brand-logo">ET.</div>

          <div className="login-header">
            <h2>Welcome back</h2>
            <p className="subtitle">Enter your credentials to access your account.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="options">
              <label className="checkbox-container">
                <input type="checkbox" id="remember" />
                <span className="checkmark"></span>
                Remember me for 30 days
              </label>

              <span className="forgot-link" onClick={() => navigate("/forgot-password")}>
                Forgot password?
              </span>
            </div>

            <button className={`login-btn ${isLoading ? 'loading' : ''}`} type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in to account"}
            </button>

            <div className="divider">
              <span>Or continue with</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  alert('Google Login failed. Please try again.');
                }}
                shape="rectangular"
                size="large"
                text="signin_with"
                logo_alignment="left"
              />
            </div>

            <p className="signup-text">
              Don't have an account?{" "}
              <span onClick={() => navigate("/signup")} className="signup-link">
                Create an account
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
