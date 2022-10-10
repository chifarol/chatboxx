import React, { useContext, useRef, useState } from "react";
import axios from "axios";
import "./auth.css";
import { Link } from "react-router-dom";
import { Spinner } from "../loading-spinner/spinner";
import AlertContext from "../contexts/alert";
import Alert from "../alert/alert";

/**
 * log out user by resetting cache user object
 */
export const logOut = () => {
  // clearing user object from cache
  sessionStorage.setItem("user", JSON.stringify({}));
  // redirect to log in page
  window.location.pathname = "/login";
};
/**
 * check validity/expiration of user's authentication
 */
export const CheckAuth = () => {
  // cached user object
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  // if user object doesn't exist create one
  if (!userLocal) {
    sessionStorage.setItem("user", JSON.stringify({}));
  }
  // if user object exists but there's no token property
  else if (!userLocal.token) {
    // if user is not currently in "login" or "register" page
    if (
      window.location.pathname !== "/register" &&
      window.location.pathname !== "/login"
    ) {
      // create empty user object in cache
      sessionStorage.setItem("user", JSON.stringify({}));
      //redirect them to login
      window.location.pathname = "/login";
    }
  }
  // else if there's a token property on user object, calal api to check validity/expiration of token
  else if (userLocal.token) {
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    // api to check expiration of authentication
    axios
      .get("/api/check-auth", config)
      .then((res) => {
        // it's valid, do nothing
      })
      // if it is invalid/expired
      .catch((e) => {
        // if user is not currently in login or register page
        if (
          window.location.pathname !== "/register" &&
          window.location.pathname !== "/login"
        ) {
          sessionStorage.setItem("user", JSON.stringify({}));
          // redirect to login page
          window.location.pathname = "/login";
        }
      });
  } else {
    return false;
  }
};

/**
 * renders user log-in form
 */
export const LogIn = () => {
  // for authentication error messages
  const [authError, setAuthError] = useState("");
  // log in processing loading state
  const [loading, setLoading] = useState(false);
  // for flash messages
  const { alert, setAlert } = useContext(AlertContext);
  // for "username or email" input field
  const usernameOrEmail = useRef(null);
  // for "password" input field
  const password = useRef(null);
  // fxn to process login
  const loginHandler = () => {
    // reset authentication error message
    setAuthError("");
    // turn on loading state
    setLoading(true);
    // get cached main user object
    let userLocal = JSON.parse(sessionStorage.getItem("user")) || {};
    // check whether either input fields are empty
    if (!usernameOrEmail.current.value || !password.current.value) {
      setLoading(false);
      // error flash message
      setAuthError("All fields are required");
    } else {
      // login api
      axios
        .post("/api/login/", {
          usernameOrEmail: usernameOrEmail.current.value,
          password: password.current.value,
        })
        .then((res) => {
          // turn off loading spinner
          setLoading(false);
          // update user cache object
          userLocal = res.data.user;
          userLocal.token = res.data.token;
          sessionStorage.setItem("user", JSON.stringify(userLocal));
          // trigger flash message
          setAlert({
            ...alert,
            text: "Log In successful",
            type: "success",
            active: true,
          });
          // on successful login redirect to home page after 2 seconds
          setTimeout(() => {
            window.location.pathname = "/";
          }, 2000);
        })
        .catch((e) => {
          console.log(e.response.data);
          // turn off loading spinner
          setLoading(false);
          // if error is due to invalid crendentials
          if (e.response.status === 401) {
            // set error message
            setAuthError("Invalid credentials");
          } else {
            // else if error is not a credentials problem set error message
            setAuthError("Sorry, something went wrong");
          }
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

/**
 * renders user register form
 */
export const Register = () => {
  // for main error messages
  const [authError, setAuthError] = useState("");
  // log in processing loading state
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState("");
  // for flash messages
  const { alert, setAlert } = useContext(AlertContext);
  // for "username or email" input field
  const username = useRef(null);
  // for "email" input field
  const email = useRef(null);
  // for "password" input field
  const password = useRef(null);

  /**
   * validates string to make sure it contains only alphabets(a-z) and underscores(_)
   * @param string string string to be validated
   */
  function checkUsername(string) {
    if (/([^a-zA-Z_]+)/g.test(string)) {
      setInputError("only alphabets(a-z) and underscores(_) allowed");
      return false;
    } else {
      setInputError("");
      return true;
    }
  }
  /**
   * register user function
   */
  const registerHandler = () => {
    // reset main error message
    setAuthError("");
    setLoading(true);
    // check if username input value is valid
    if (!checkUsername(username.current.value)) {
      setLoading(false);
      return;
    }
    // if any field is empty
    if (
      !username.current.value ||
      !email.current.value ||
      !password.current.value
    ) {
      // turn off loading spinner
      setLoading(false);
      // set new error message
      setAuthError("All fields are required");
    }
    // if no field is empty
    else {
      // register api
      axios
        .post("/api/register/", {
          username: username.current.value,
          email: email.current.value,
          password: password.current.value,
        })
        .then((res) => {
          // turn off loading spinner
          setLoading(false);
          // if everything went well
          if (res.data.status) {
            // trigger flash message
            setAlert({
              ...alert,
              text: "account created successfully, redirecting to login",
              type: "success",
              active: true,
            });
            // redirect to login on successful registration after 5 seconds
            setTimeout(() => {
              window.location.pathname = "/login";
            }, 5000);
          }
          // if api response is duplicate email
          else if (res.data.error.includes("email_1 dup key")) {
            // turn off loading spinner
            setLoading(false);
            // set new error message
            setAuthError("email address already exists");
          }
          // if api response is duplicate username
          else if (res.data.error.includes("username_1 dup key")) {
            // turn off loading spinner
            setLoading(false);
            // set new error message
            setAuthError("username already exists");
          }
          /// if it's any other error
          else {
            setLoading(false);
            setAuthError(res.data.error);
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
          <span className="red f12 w300">{inputError}</span>
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
