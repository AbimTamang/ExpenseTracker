import { apiUrl } from "../../config/api";
import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  //  LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(apiUrl(`/auth/login`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // SAVE LOGIN INFO
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);

        // Slight delay for smooth animation before navigating
        setTimeout(() => {
          setIsLoading(false);
          navigate("/dashboard");
        }, 600);
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
      const res = await fetch(apiUrl(`/auth/google`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.requiresOtp) {
          setOtpRequired(true);
          setEmailForOtp(data.email);
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("name", data.name);
          navigate("/dashboard");
        }
      } else {
        alert(data.message || "Google authentication failed");
      }
    } catch (err) {
      alert("Server error during Google auth");
    }
  };

  const handleVerifyGoogleOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      alert("Please enter the OTP.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/auth/verify-google-otp`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForOtp, otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);
        setTimeout(() => navigate("/dashboard"), 600);
      } else {
        alert(data.message || "Invalid OTP");
      }
    } catch (error) {
      alert("Server error. Try again later.");
    } finally {
      setIsLoading(false);
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

          {otpRequired ? (
            <form className="login-form" onSubmit={handleVerifyGoogleOtp}>
              <div className="input-group">
                <label>Enter Verification Code</label>
                <div className="input-with-icon">
                  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <button className={`login-btn ${isLoading ? 'loading' : ''}`} type="submit" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>

              <p className="signup-text" style={{marginTop: "1.5rem"}}>
                <span onClick={() => { setOtpRequired(false); setOtp(""); }} className="signup-link">
                  Cancel
                </span>
              </p>
            </form>
          ) : (
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
                    type={showPassword ? "text" : "password"}
                    className="password-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
