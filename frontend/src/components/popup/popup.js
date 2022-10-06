import React from "react";
import { Link } from "react-router-dom";
import { logOut } from "../auth/auth";
import "./popup.css";

export const RoomPopUp = ({ room_id }) => {
  return (
    <div className="pop-up-room-container bg-gray-blue w400">
      <Link className="pop-up-item pointer" to={`/room_details/${room_id}`}>
        Details
      </Link>
      <span className="pop-up-item red pointer">Leave room</span>
    </div>
  );
};
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
