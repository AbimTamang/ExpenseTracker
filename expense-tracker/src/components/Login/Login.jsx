// import "./Login.css";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// const Login = () => {
  
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();

//   //  LOGIN HANDLER
//   const handleLogin = async (e) => {
//     e.preventDefault();

//     if (!email || !password) {
//       alert("Please fill all fields");
//       return;
//     }

//     try {
//       const res = await fetch("http://localhost:5000/api/auth/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();

//       if (data.success) {
//         localStorage.setItem("token", data.token);
//         navigate("/dashboard");
//       } else {
//         alert(data.message || "Login failed");
//       }
//     } catch (error) {
//       alert("Server error. Try again later.");
//     }
//   };

//   return (
//     <div className="login-container">
//       {/* Left Section */}
//       <div className="login-left">
//         <h4 className="brand">ExpenseTracker</h4>

//         <h2>Welcome back</h2>
//         <p className="subtitle">Please enter your details to sign in.</p>

//         {/* ATTACH HANDLER HERE */}
//         <form className="login-form" onSubmit={handleLogin}>
//           <label>Email address</label>
//           <input
//             type="email"
//             placeholder="name@example.com"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />

//           <label>Password</label>
//           <input
//             type="password"
//             placeholder="Enter your password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />

//           <div className="options">
//             <div>
//               <input type="checkbox" id="remember" />
//               <label htmlFor="remember"> Remember me</label>
//             </div>
//             <span className="forgot">Forgot password?</span>
//           </div>

//           <button className="login-btn" type="submit">
//             Login
//           </button>

//           <div className="divider">Or continue with</div>

//           <button className="google-btn" type="button">
//             <img
//               className="logo"
//               src="https://png.pngtree.com/png-vector/20230817/ourmid/pngtree-google-internet-icon-vector-png-image_9183287.png"
//               alt="Google"
//             />
//             Google
//           </button>

//           <p className="signup-text">
//             Not a member?{" "}
//             <span
//               style={{ cursor: "pointer" }}
//               onClick={() => navigate("/signup")}
//             >
//               Signup
              
//             </span>
//           </p>
//         </form>
//       </div>

//       {/* Right Section */}
//       <div className="login-right">
//         <div className="overlay">
//           <p className="tag">FINANCE MANAGEMENT</p>
//           <h1>Take control of your financial future today.</h1>
//           <p className="desc">
//             Track every expense, analyze your spending habits, and save smarter
//             with our intuitive dashboard.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 🔐 LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

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

        navigate("/dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      alert("Server error. Try again later.");
    }
  };

  return (
    <div className="login-container">
      {/* Left Section */}
      <div className="login-left">
        <h4 className="brand">ExpenseTracker</h4>

        <h2>Welcome back</h2>
        <p className="subtitle">Please enter your details to sign in.</p>

        <form className="login-form" onSubmit={handleLogin}>
          <label>Email address</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="options">
            <div>
              <input type="checkbox" id="remember" />
              <label htmlFor="remember"> Remember me</label>
            </div>
            <span className="forgot">Forgot password?</span>
          </div>

          <button className="login-btn" type="submit">
            Login
          </button>

          <div className="divider">Or continue with</div>

          <button className="google-btn" type="button">
            <img
              className="logo"
              src="https://png.pngtree.com/png-vector/20230817/ourmid/pngtree-google-internet-icon-vector-png-image_9183287.png"
              alt="Google"
            />
            Google
          </button>

          <p className="signup-text">
            Not a member?{" "}
            <span
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/signup")}
            >
              Signup
            </span>
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
