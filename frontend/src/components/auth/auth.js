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
        <div className="auth-logo-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
            viewBox="0 0 48 48"
          >
            <path d="M17.05 44.65q-2.4 0-4.25-1.425t-2.6-3.675q-.8 1.3-1.95 2.025-1.15.725-2.75.725-2.35 0-3.9-1.65Q.05 39 .05 36.75q0-2.45 1.525-3.875Q3.1 31.45 5.45 31.4q-.9-1-1.4-2.325-.5-1.325-.5-2.675 0-1.9.975-3.55T7.3 20.2q.25.65.625 1.4.375.75.775 1.3-1 .65-1.575 1.6-.575.95-.575 2 0 3 2.425 3.775 2.425.775 4.675 1.225l.55.95q-.6 1.75-.975 2.875T12.85 37.4q0 1.7 1.275 2.975Q15.4 41.65 17.1 41.65q2.05 0 3.375-1.725 1.325-1.725 2.15-4.1.825-2.375 1.275-4.8.45-2.425.75-3.775l2.9.8q-.45 2.15-1.05 5-.6 2.85-1.725 5.425-1.125 2.575-2.95 4.375-1.825 1.8-4.775 1.8Zm3.5-14.85q-2.25-2-4.1-3.725-1.85-1.725-3.175-3.375-1.325-1.65-2.05-3.25-.725-1.6-.725-3.4 0-3 2.1-5.1 2.1-2.1 5.1-2.1.45 0 .85.025.4.025.8.125-.45-.85-.65-1.45t-.2-1.2q0-2.3 1.6-3.9T24 .85q2.3 0 3.9 1.6t1.6 3.9q0 .55-.175 1.175T28.65 9q.4-.1.8-.125.4-.025.85-.025 2.85 0 4.825 1.825T37.4 15.2q-.7-.05-1.5-.025t-1.5.125q-.25-1.5-1.35-2.475-1.1-.975-2.75-.975-1.85 0-2.925 1.025Q26.3 13.9 24.5 16h-1.05q-1.85-2.2-2.925-3.175-1.075-.975-2.825-.975-1.8 0-3 1.2t-1.2 3q0 1.2.65 2.45.65 1.25 1.85 2.675 1.2 1.425 2.9 3t3.8 3.475ZM30.9 44.7q-1.1 0-2.175-.35Q27.65 44 26.65 43.3q.4-.6.8-1.35.4-.75.65-1.4.7.55 1.425.825.725.275 1.475.275 1.75 0 2.975-1.275T35.2 37.4q0-1-.4-2.125t-.95-2.825l.55-.95q2.3-.4 4.7-1.175 2.4-.775 2.4-3.775 0-2.2-1.6-3.275-1.6-1.075-3.55-1.075-2.1 0-4.975.8-2.875.8-6.675 2.05l-.75-2.9q3.8-1.25 6.85-2.1 3.05-.85 5.55-.85 3.2 0 5.675 1.925Q44.5 23.05 44.5 26.5q0 1.35-.5 2.65-.5 1.3-1.4 2.3 2.3.05 3.85 1.5Q48 34.4 48 36.8q0 2.25-1.55 3.9t-3.9 1.65q-1.55 0-2.75-.725T37.85 39.6q-.8 2.25-2.65 3.675-1.85 1.425-4.3 1.425Z" />
          </svg>
          <span className="auth-logo-brand f14">CHATBOXX</span>
        </div>
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
        <span className="auth-author center f12 gray w300">
          Built by ilodigwechinaza@gmail.com
        </span>
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
            }, 2000);
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
        <div className="auth-logo-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
            viewBox="0 0 48 48"
          >
            <path d="M17.05 44.65q-2.4 0-4.25-1.425t-2.6-3.675q-.8 1.3-1.95 2.025-1.15.725-2.75.725-2.35 0-3.9-1.65Q.05 39 .05 36.75q0-2.45 1.525-3.875Q3.1 31.45 5.45 31.4q-.9-1-1.4-2.325-.5-1.325-.5-2.675 0-1.9.975-3.55T7.3 20.2q.25.65.625 1.4.375.75.775 1.3-1 .65-1.575 1.6-.575.95-.575 2 0 3 2.425 3.775 2.425.775 4.675 1.225l.55.95q-.6 1.75-.975 2.875T12.85 37.4q0 1.7 1.275 2.975Q15.4 41.65 17.1 41.65q2.05 0 3.375-1.725 1.325-1.725 2.15-4.1.825-2.375 1.275-4.8.45-2.425.75-3.775l2.9.8q-.45 2.15-1.05 5-.6 2.85-1.725 5.425-1.125 2.575-2.95 4.375-1.825 1.8-4.775 1.8Zm3.5-14.85q-2.25-2-4.1-3.725-1.85-1.725-3.175-3.375-1.325-1.65-2.05-3.25-.725-1.6-.725-3.4 0-3 2.1-5.1 2.1-2.1 5.1-2.1.45 0 .85.025.4.025.8.125-.45-.85-.65-1.45t-.2-1.2q0-2.3 1.6-3.9T24 .85q2.3 0 3.9 1.6t1.6 3.9q0 .55-.175 1.175T28.65 9q.4-.1.8-.125.4-.025.85-.025 2.85 0 4.825 1.825T37.4 15.2q-.7-.05-1.5-.025t-1.5.125q-.25-1.5-1.35-2.475-1.1-.975-2.75-.975-1.85 0-2.925 1.025Q26.3 13.9 24.5 16h-1.05q-1.85-2.2-2.925-3.175-1.075-.975-2.825-.975-1.8 0-3 1.2t-1.2 3q0 1.2.65 2.45.65 1.25 1.85 2.675 1.2 1.425 2.9 3t3.8 3.475ZM30.9 44.7q-1.1 0-2.175-.35Q27.65 44 26.65 43.3q.4-.6.8-1.35.4-.75.65-1.4.7.55 1.425.825.725.275 1.475.275 1.75 0 2.975-1.275T35.2 37.4q0-1-.4-2.125t-.95-2.825l.55-.95q2.3-.4 4.7-1.175 2.4-.775 2.4-3.775 0-2.2-1.6-3.275-1.6-1.075-3.55-1.075-2.1 0-4.975.8-2.875.8-6.675 2.05l-.75-2.9q3.8-1.25 6.85-2.1 3.05-.85 5.55-.85 3.2 0 5.675 1.925Q44.5 23.05 44.5 26.5q0 1.35-.5 2.65-.5 1.3-1.4 2.3 2.3.05 3.85 1.5Q48 34.4 48 36.8q0 2.25-1.55 3.9t-3.9 1.65q-1.55 0-2.75-.725T37.85 39.6q-.8 2.25-2.65 3.675-1.85 1.425-4.3 1.425Z" />
          </svg>
          <span className="auth-logo-brand f14">CHATBOXX</span>
        </div>
        <h3 className="auth-heading">Register</h3>
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
        <span className="auth-author center f12 gray w300">
          Built by - ilodigwechinaza@gmail.com
        </span>
      </div>
    </div>
  );
};
