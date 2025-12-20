import React from "react";
import "./Signup.css";

const Signup = () => {
  return (
    <div className="signup-container">
      {/* Left Section */}
      <div className="signup-left">
        <h4 className="brand">ExpenseTracker</h4>

        <h1>Create your account</h1>
        <p className="subtitle">
          Start tracking your expenses today. Join thousands of users managing
          their finances smarter.
        </p>

        <button className="google-btn">Sign up with Google</button>

        <div className="divider">
          <span>Or continue with email</span>
        </div>

        <form className="signup-form">
          <label>Full Name</label>
          <input type="text" placeholder="e.g. John Doe" />

          <label>Email Address</label>
          <input type="email" placeholder="e.g. john@example.com" />

          <label>Password</label>
          <input type="password" placeholder="Create a strong password" />

          <label>Confirm Password</label>
          <input type="password" placeholder="Repeat your password" />

          <button className="create-btn">Create Account</button>
        </form>

        <p className="terms">
          By signing up, you agree to our{" "}
          <span>Terms of Service</span> and <span>Privacy Policy</span>
        </p>

        <p className="login-link">
          Already have an account? <span>Log in</span>
        </p>
      </div>

      {/* Right Section */}
      <div className="signup-right">
        <img
          src="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e"
          alt="Money growth"
        />
      </div>
    </div>
  );
};

export default Signup;
