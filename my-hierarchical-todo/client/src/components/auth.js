/**
 * Auth.js
 * -------
 * Simple authentication component to register or log in a user.
 * On success, we store userId in localStorage and notify parent via onAuthSuccess.
 */
import React, { useState } from "react";
import { registerUser, loginUser } from "../utils/api";
import "../styles/Auth.css";

function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    const response = await registerUser(email, password);
    if (response.error) {
      alert(response.error);
    } else {
      alert("Registered successfully! Please log in.");
    }
  }

  async function handleLogin() {
    const response = await loginUser(email, password);
    if (response.error) {
      alert(response.error);
    } else {
      // store userId
      localStorage.setItem("userId", response.userId);
      onAuthSuccess();
    }
  }

  return (
    <div className="auth-container">
      <h2>Welcome to The ToDo App</h2>
      <p>Please log in or register.</p>
      <div className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          className="auth-input"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          className="auth-input"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="auth-buttons">
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
