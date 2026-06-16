import { useState } from "react";
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginView({ state }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalAlert, setModalAlert] = useState({ isOpen: false, title: "", message: "" });

  const handleLogin = async (e) => {
  e.preventDefault();
  if(!email.trim() || !password.trim()){
    setModalAlert({
      isOpen: true,
      title: "Incomplete Credentials",
      message: "Please Enter both your credentials to login."
    });
    return;
  }
  
  setLoading(true);

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
      setModalAlert({ isOpen: true, title: "Authentication Failed", message: err.message });
      console.error(err);
    } finally{
      setLoading(false);
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
            <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="password" 
                  className="form-input"
                  style={{ width: "100%", paddingRight: "60px" }}
                />
                
                {/* 3. Password Toggle Button */}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                      position: "absolute", right: "10px", background: "none", border: "none", 
                      fontSize: "12px", color: "var(--brand-accent)", cursor: "pointer"
                  }}
                >
                    {showPassword ? <FiEyeOff size={20}/> : <FiEye size={20}/>}
                </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Authenticating..." : "Login"}
          </button>
          <div className="login-footnote">
            Secure ERP Access • Authorized Personnel Only
          </div>
        </form>
      </div>
    </div>
    {modalAlert.isOpen && (
        <div className="modal-overlay">
            <div className="modal-box" style={{ borderTop: "4px solid var(--brand-danger)" }}>
                <h3 style={{ color: "var(--brand-danger)" }}>{modalAlert.title}</h3>
                <p style={{ margin: "15px 0" }}>{modalAlert.message}</p>
                <button className="btn btn-secondary" onClick={() => setModalAlert({ isOpen: false, title: "", message: "" })}>
                    Acknowledge
                </button>
            </div>
        </div>
    )}
    </div>
  );
}