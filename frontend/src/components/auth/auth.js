import React, { useContext, useRef, useState } from "react";
import axios from "axios";
import "./auth.css";
import { Link } from "react-router-dom";
import { Spinner } from "../loading-spinner/spinner";
import AlertContext from "../contexts/alert";
import Alert from "../alert/alert";

export const logOut = () => {
  sessionStorage.setItem("user", JSON.stringify({}));
  window.location.pathname = "/login";
};
export const CheckAuth = () => {
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  if (!userLocal) {
    sessionStorage.setItem("user", JSON.stringify({}));
  } else if (!userLocal.token) {
    if (
      window.location.pathname !== "/register" &&
      window.location.pathname !== "/login"
    ) {
      sessionStorage.setItem("user", JSON.stringify({}));
      window.location.pathname = "/login";
    }
  } else if (userLocal.token) {
    console.log("userLocal", userLocal);
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    axios
      .get("/api/check-auth", config)
      .then((res) => {
        console.log("user token valid");
      })
      .catch((e) => {
        console.log("user token invalid");
        if (
          window.location.pathname !== "/register" &&
          window.location.pathname !== "/login"
        ) {
          sessionStorage.setItem("user", JSON.stringify({}));
          window.location.pathname = "/login";
        }
      });
  } else {
    return false;
  }
};
export const LogIn = () => {
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const { alert, setAlert } = useContext(AlertContext);
  const usernameOrEmail = useRef(null);
  const password = useRef(null);
  const loginHandler = () => {
    setAuthError("");
    setLoading(true);
    let userLocal = JSON.parse(sessionStorage.getItem("user"));
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    if (!usernameOrEmail.current.value || !password.current.value) {
      setLoading(false);
      setAuthError("All fields are required");
    } else {
      axios
        .post("/api/login/", {
          usernameOrEmail: usernameOrEmail.current.value,
          password: password.current.value,
        })
        .then((res) => {
          setLoading(false);
          userLocal = res.data.user;
          userLocal.token = res.data.token;
          sessionStorage.setItem("user", JSON.stringify(userLocal));
          setAlert({
            ...alert,
            text: "Log In successful",
            type: "success",
            active: true,
          });
          setTimeout(() => {
            window.location.pathname = "/";
          }, 2000);
        })
        .catch((e) => {
          console.log(e);
          setLoading(false);
          setAuthError("Invalid credentials");
        });
    }
  };
  return (
    <div className="auth-container">
      <Alert />
      <div className="auth-form">
        <h3 className="auth-heading">Log In</h3>
        <div className="auth-error f12 red w300">{authError}</div>
        <div className="auth-field">
          <span className="auth-label">Username or Email</span>
          <input type="text" ref={usernameOrEmail} required />
        </div>
        <div className="auth-field">
          <span className="auth-label">Password</span>
          <input type="password" ref={password} required />
        </div>
        <div className="auth-cta">
          <Link to="/register" className="auth-option f12 w300 pointer">
            Register
          </Link>
          <div className="auth-button pointer" onClick={loginHandler}>
            {loading && <Spinner />}
            <span>Log In</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export const Register = () => {
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [topicError, setTopicError] = useState("");
  const { alert, setAlert } = useContext(AlertContext);
  const username = useRef(null);
  const email = useRef(null);
  const password = useRef(null);
  function checkUsername(string) {
    if (/([^a-zA-Z_]+)/g.test(string)) {
      console.log("invalid topic");
      setTopicError("only alphabets(a-z) and underscores(_) allowed");
      return false;
    } else {
      console.log("valid topic");
      setTopicError("");
      return true;
    }
  }
  const registerHandler = () => {
    setAuthError("");
    setLoading(true);
    if (checkUsername(username.current.value)) {
      setLoading(false);
      return;
    }
    if (
      !username.current.value ||
      !email.current.value ||
      !password.current.value
    ) {
      setLoading(false);
      setAuthError("All fields are required");
    } else {
      axios
        .post("/api/register/", {
          username: username.current.value,
          email: email.current.value,
          password: password.current.value,
        })
        .then((res) => {
          setLoading(false);
          if (res.data.status) {
            setAlert({
              ...alert,
              text: "account created successfully, redirecting to login",
              type: "success",
              active: true,
            });
            setTimeout(() => {
              window.location.pathname = "/login";
            }, 5000);
          } else if (res.data.error.includes("email_1 dup key")) {
            setLoading(false);
            setAuthError("email address already exists");
          } else if (res.data.error.includes("username_1 dup key")) {
            setLoading(false);
            setAuthError("username already exists");
          } else {
            setLoading(false);
            setAuthError(res.data.error);
            console.log(res);
          }
        })
        .catch((e) => {});
    }
  };
  return (
    <div className="auth-container">
      <Alert />
      <div className="auth-form">
        <h3 className="auth-heading">Log In</h3>
        <div className="auth-error f12 red w300">{authError}</div>
        <div className="auth-field">
          <span className="auth-label">Username</span>
          <span className="red f12 w300">{topicError}</span>
          <input
            type="text"
            ref={username}
            required
            onInput={(e) => checkUsername(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <span className="auth-label">Email</span>
          <input type="text" ref={email} required />
        </div>
        <div className="auth-field">
          <span className="auth-label">Password</span>
          <input type="password" ref={password} required />
        </div>
        <div className="auth-cta">
          <Link to="/login" className="auth-option f12 w300 pointer">
            Log In
          </Link>
          <div className="auth-button pointer" onClick={registerHandler}>
            {loading && <Spinner />}
            <span>Register</span>
          </div>
        </div>
      </div>
    </div>
  );
};
