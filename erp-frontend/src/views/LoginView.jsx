import { useState } from "react";

export default function LoginView({ state }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      throw new Error("Invalid credentials");
    }

    const data = await res.json();

    state.setUser({
      email: data.email,
      name: data.name,
      role: data.role,
      access_token: data.access_token
    });

    } catch (err) {
      alert("Login failed: " + err.message);
      console.error(err);
    }
  };

  return (
    <div className="auth-fallback-viewport">
        <div className="login-brand">
        <img
          src="https://tempoinstruments.com/wp-content/uploads/2024/08/tempo-instruments-logo.png"
          alt="Tempo Instruments"
          className="login-logo"
        />
        <div className="login-brand-text">
          <h1>Tempo ERP</h1>
          <p>Precision Manufacturing Control System</p>
        </div>
        
      <div className="login-card-wrapper">  
        <form onSubmit={handleLogin} className="login-form">
          <h2>Tempo ERP</h2>
          <div className="form-group">
            <label className="input-label">Enter Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="form-input"/>
          </div>

          <div className="form-group">
            <label className="input-label">Enter Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" className="form-input"/>
          </div>

          <button type="submit" className="btn btn-primary">Login</button>
          <div className="login-footnote">
            Secure ERP Access • Authorized Personnel Only
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}