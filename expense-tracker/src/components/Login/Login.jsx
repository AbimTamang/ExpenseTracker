import "./Login.css";

const Login = () => {
  return (
    <div className="login-container">
      {/* Left Section */}
      <div className="login-left">
        <h4 className="brand">ExpenseTracker</h4>

        <h2>Welcome back</h2>
        <p className="subtitle">Please enter your details to sign in.</p>

        <form className="login-form">
          <label>Email address</label>
          <input type="email" placeholder="name@example.com" />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" />

          <div className="options">
            <div>
              <input type="checkbox" id="remember" />
              <label htmlFor="remember"> Remember me</label>
            </div>
            <span className="forgot">Forgot password?</span>
          </div>

          <button className="login-btn">Sign in</button>

          <div className="divider">Or continue with</div>

          <button className="google-btn">
            <img className="logo"
            src="https://png.pngtree.com/png-vector/20230817/ourmid/pngtree-google-internet-icon-vector-png-image_9183287.png" 
            alt="" /> Google
          </button>

          <p className="signup-text">
            Not a member? <span>Login</span>
          </p>
        </form>
      </div>

      {/* Right Section */}
      <div className="login-right">
        <div className="overlay">
          <p className="tag">FINANCE MANAGEMENT</p>
          <h1>Take control of your financial future today.</h1>
          <p className="desc">
            Track every expense, analyze your spending habits, and save smarter
            with our intuitive dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
