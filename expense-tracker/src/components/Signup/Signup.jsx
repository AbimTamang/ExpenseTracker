import "./Signup.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("Password must be at least 8 characters long, contain at least one uppercase letter, and at least one special character.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsLoading(false);
        // Quick visual delay before routing
        setTimeout(() => navigate("/"), 600);
      } else {
        alert(data.message || "Signup failed. Email might already exist.");
        setIsLoading(false);
      }
    } catch {
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
      const res = await fetch("http://localhost:5000/api/auth/verify-google-otp", {
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
    <div className="signup-container fade-in">

      {/* LEFT SECTION - FORM */}
      <div className="signup-left">
        <div className="form-wrapper">
          <div className="mobile-brand-logo">ET.</div>

          <div className="signup-header">
            <h2>Create your account</h2>
            <p className="subtitle">Start tracking your expenses and manage your finances smarter.</p>
          </div>

          {otpRequired ? (
            <form className="signup-form" onSubmit={handleVerifyGoogleOtp}>
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
              
              <button className={`signup-btn ${isLoading ? 'loading' : ''}`} type="submit" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>

              <p className="login-text" style={{marginTop: "1.5rem"}}>
                <span onClick={() => { setOtpRequired(false); setOtp(""); }} className="login-link">
                  Cancel
                </span>
              </p>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    alert('Google Sign In failed. Please try again.');
                  }}
                  shape="rectangular"
                  size="large"
                  text="signup_with"
                  logo_alignment="left"
                />
              </div>

              <div className="divider">
                <span>Or continue with email</span>
              </div>

              <form className="signup-form" onSubmit={handleSignup}>
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Confirm Password</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <input
                      type="password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button className={`signup-btn ${isLoading ? 'loading' : ''}`} type="submit" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <p className="login-text">
                Already have an account?{" "}
                <span className="login-link" onClick={() => navigate("/")}>Sign in</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* RIGHT SECTION - IMAGE HERO */}
      <div className="signup-right">
        <div className="overlay-content">
          <div className="brand-logo">ET.</div>
          <div className="hero-text">
            <h1>Your journey to financial freedom starts here.</h1>
            <p>Set goals, track portfolio performance, and manage your wealth beautifully.</p>
          </div>

          <div className="feature-badges">
            <div className="badge">✓ Secure AES-256 Encryption</div>
            <div className="badge">✓ Real-time Analytics Hub</div>
            <div className="badge">✓ Smart Saving Goals</div>
          </div>
        </div>
        <div className="glass-overlay"></div>
      </div>

    </div>
  );
};

export default Signup;
