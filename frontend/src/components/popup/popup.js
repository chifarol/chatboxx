import React from "react";
import { Link } from "react-router-dom";
import { logOut } from "../auth/auth";
import "./popup.css";

/**
 * renders pop up for widescreen nav bar
 */
export const NavProfilePopUp = () => {
  return (
    <div className="pop-up-nav-container bg-gray-blue f16 w500">
      <Link to="/my_settings" className="pop-up-item pointer">
        Settings
      </Link>
      <span className="pop-up-item red pointer" onClick={logOut}>
        Logout
      </span>
    </div>
  );
};
/**
 * renders pop up for mobile nav bar
 */
export const NavProfilePopUpSM = () => {
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  return (
    <div className="pop-up-nav-sm-container bg-gray-blue f16 w500">
      <Link
        to={`/profile/${userLocal.username}`}
        className="pop-up-item pointer"
        onClick
      >
        Profile
      </Link>
      <Link to="/my_settings" className="pop-up-item pointer">
        Settings
      </Link>
      <span className="pop-up-item red pointer" onClick={logOut}>
        Logout
      </span>
    </div>
  );
};
