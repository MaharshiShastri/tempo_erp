import { useState } from "react";
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginView({ state }) {
  const {loading, showPassword, setShowPassword, modalAlert, setModalAlert, handleLogin, loginEmail, setLoginEmail, 
    loginPassword, setLoginPassword, 
  } = state;
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
      </div>

      <div className="login-card-wrapper">  
        <form onSubmit={handleLogin} className="login-form">
          <h2>Tempo ERP</h2>
          <div className="form-group">
            <label className="input-label">Enter Email</label>
            <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="email" className="form-input"/>
          </div>

          <div className="form-group">
            <label className="input-label">Enter Password:</label>
            <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
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

          <div style={{ display: "flex", justifyContent: "center", marginTop: "25px" }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ padding: "10px 40px", minWidth: "160px", fontSize: "16px", borderRadius: "var(--radius-sm)" }}
            >
            {loading ? "Authenticating..." : "Login"}
            </button>
          </div>
            
          <div className="login-footnote">
            Secure ERP Access • Authorized Personnel Only
          </div>
          </form>
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