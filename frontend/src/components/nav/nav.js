import "./nav.css";
import React, { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Alert from "../alert/alert";
import axios from "axios";
import { NavProfilePopUp, NavProfilePopUpSM } from "../popup/popup";
import { SocketContext } from "../contexts/socket";
import { DMListContext } from "../contexts/msgs";

const NotificationDot = ({ notif }) => {
  return <div id="notification-dot">{notif.length}</div>;
};
const NavSmBottom = () => {
  // for main user obj
  const [user, setUser] = useState(false);
  const [active, setActive] = useState("1");
  // socket io object
  const { socket } = useContext(SocketContext);
  // room and dm notification utitlities
  const { notif, updateNotif, roomNotif, updateRoomNotif } =
    useContext(DMListContext);
  const location = useLocation();
  /**
   * updates the active tab
   */
  function updateActive() {
    switch (location.pathname) {
      case "/":
        setActive(1);
        break;
      case "/my_rooms":
        setActive(1);
        break;
      case "/my_dms":
        setActive(2);
        break;
      case "/create_room":
        setActive(3);
        break;
      case "/search":
        setActive(4);
        break;

      default:
        setActive(6);
        break;
    }
  }
  const [showPopUp, setShowPopUp] = useState(false);
  useEffect(() => {
    let userLocal = JSON.parse(sessionStorage.getItem("user"));
    userLocal && setUser(userLocal);
    updateActive();
  }, [location.pathname]);
  useEffect(() => {
    socket.on("receive_message", (data) => {
      // update dm notifications
      updateNotif(data.from);
    });

    //rooms
    socket.on("receive_room_message", (data) => {
      // update room notifications
      updateRoomNotif(data._id);
    });
  }, [socket]);

  return (
    <>
      <div className="nav-sm-bottom-container">
        <Link
          to="/my_rooms"
          className={`nav-sm-item ${active === 1 && "active"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
            viewBox="0 0 48 48"
          >
            <path d="M0 36v-2.65q0-1.95 2.075-3.15T7.5 29q.6 0 1.175.025.575.025 1.125.125-.4.85-.6 1.75-.2.9-.2 1.9V36Zm12 0v-3.2q0-3.25 3.325-5.275Q18.65 25.5 24 25.5q5.4 0 8.7 2.025Q36 29.55 36 32.8V36Zm27 0v-3.2q0-1-.2-1.9-.2-.9-.6-1.75.55-.1 1.125-.125Q39.9 29 40.5 29q3.35 0 5.425 1.2Q48 31.4 48 33.35V36ZM7.5 27.5q-1.45 0-2.475-1.025Q4 25.45 4 24q0-1.45 1.025-2.475Q6.05 20.5 7.5 20.5q1.45 0 2.475 1.025Q11 22.55 11 24q0 1.45-1.025 2.475Q8.95 27.5 7.5 27.5Zm33 0q-1.45 0-2.475-1.025Q37 25.45 37 24q0-1.45 1.025-2.475Q39.05 20.5 40.5 20.5q1.45 0 2.475 1.025Q44 22.55 44 24q0 1.45-1.025 2.475Q41.95 27.5 40.5 27.5ZM24 24q-2.5 0-4.25-1.75T18 18q0-2.5 1.75-4.25T24 12q2.5 0 4.25 1.75T30 18q0 2.5-1.75 4.25T24 24Z" />
          </svg>
          {roomNotif.length ? <NotificationDot notif={roomNotif} /> : ""}
        </Link>
        <Link
          to="/my_dms"
          className={`nav-sm-item ${active === 2 && "active"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
            viewBox="0 0 48 48"
          >
            <path d="M16 28h16v-.95q0-2.1-2.125-3.25T24 22.65q-3.75 0-5.875 1.15T16 27.05Zm8-8.65q1.55 0 2.625-1.075T27.7 15.65q0-1.55-1.075-2.625T24 11.95q-1.55 0-2.625 1.075T20.3 15.65q0 1.55 1.075 2.625T24 19.35ZM4 44V7q0-1.15.9-2.075Q5.8 4 7 4h34q1.15 0 2.075.925Q44 5.85 44 7v26q0 1.15-.925 2.075Q42.15 36 41 36H12Z" />
          </svg>
          {notif.length ? <NotificationDot notif={notif} /> : ""}
        </Link>
        <Link
          to="/create_room"
          className={`nav-sm-item ${active === 3 && "active"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
            viewBox="0 0 48 48"
          >
            <path d="M0 40v-4.7q0-1.75.925-3.175Q1.85 30.7 3.4 30q3.6-1.6 6.425-2.3 2.825-.7 5.925-.7 3.1 0 5.9.7 2.8.7 6.4 2.3 1.55.7 2.5 2.125t.95 3.175V40Zm15.75-16.05q-3.3 0-5.4-2.1-2.1-2.1-2.1-5.4 0-3.3 2.1-5.4 2.1-2.1 5.4-2.1 3.3 0 5.4 2.1 2.1 2.1 2.1 5.4 0 3.3-2.1 5.4-2.1 2.1-5.4 2.1Zm7.95-.25q1.3-1.6 1.925-3.3.625-1.7.625-3.95t-.625-3.95Q25 10.8 23.7 9.2q3.8-.85 6.675 1.15t2.875 6.1q0 4.1-2.875 6.1T23.7 23.7ZM34.5 40v-4.7q0-2.55-1.3-4.75t-4.5-3.7q8.65 1.1 11.825 3.2 3.175 2.1 3.175 5.25V40ZM40 25.55v-5h-5v-3h5v-5h3v5h5v3h-5v5Z" />
          </svg>
        </Link>
        <Link
          to="/search"
          className={`nav-sm-item ${active === 4 && "active"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
            viewBox="0 0 48 48"
          >
            <path d="M39.8 41.95 26.65 28.8Q25.15 30.1 23.15 30.825Q21.15 31.55 18.9 31.55Q13.5 31.55 9.75 27.8Q6 24.05 6 18.75Q6 13.45 9.75 9.7Q13.5 5.95 18.85 5.95Q24.15 5.95 27.875 9.7Q31.6 13.45 31.6 18.75Q31.6 20.9 30.9 22.9Q30.2 24.9 28.8 26.65L42 39.75ZM18.85 28.55Q22.9 28.55 25.75 25.675Q28.6 22.8 28.6 18.75Q28.6 14.7 25.75 11.825Q22.9 8.95 18.85 8.95Q14.75 8.95 11.875 11.825Q9 14.7 9 18.75Q9 22.8 11.875 25.675Q14.75 28.55 18.85 28.55Z" />
          </svg>
        </Link>
        <div
          className={`nav-sm-item pos-relative ${active === 5 && "active"}`}
          onClick={() => setShowPopUp(!showPopUp)}
        >
          <img
            src={`${user.picture}`}
            crossOrigin="anonymous"
            className="bg-gray"
          />
          {showPopUp && <NavProfilePopUpSM />}
        </div>
      </div>
    </>
  );
};
const Nav = () => {
  const [user, setUser] = useState(false);
  const [showPopUp, setShowPopUp] = useState(false);
  const [active, setActive] = useState("");
  // room and dm notification utitlities
  const { notif, updateNotif, roomNotif, updateRoomNotif } =
    useContext(DMListContext);
  const location = useLocation();
  // socket io object
  const { socket } = useContext(SocketContext);
  let userLocal = JSON.parse(sessionStorage.getItem("user"));

  function updateActive() {
    switch (location.pathname) {
      case "/":
        setActive(1);
        break;
      case "/my_rooms":
        setActive(1);
        break;
      case "/my_dms":
        setActive(2);
        break;
      case "/create_room":
        setActive(3);
        break;
      case "/search":
        setActive(4);
        break;
      default:
        setActive(6);
        break;
    }
  }
  useEffect(() => {
    userLocal && setUser(userLocal);
    updateActive();
  }, [location.pathname]);
  useEffect(() => {
    socket.on("receive_message", (data) => {
      // update dm notifications
      updateNotif(data.from);
    });

    //rooms
    socket.on("receive_room_message", (data) => {
      // update room messsage notifications
      updateRoomNotif(data.room_id);
    });
  }, [socket]);
  return (
    <div className="app-wrapper">
      <Alert />
      <NavSmBottom />
      <div className="nav-container">
        <div className="nav-top">
          <Link to="" className="nav-logo-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="48"
              width="48"
              viewBox="0 0 48 48"
            >
              <path d="M17.05 44.65q-2.4 0-4.25-1.425t-2.6-3.675q-.8 1.3-1.95 2.025-1.15.725-2.75.725-2.35 0-3.9-1.65Q.05 39 .05 36.75q0-2.45 1.525-3.875Q3.1 31.45 5.45 31.4q-.9-1-1.4-2.325-.5-1.325-.5-2.675 0-1.9.975-3.55T7.3 20.2q.25.65.625 1.4.375.75.775 1.3-1 .65-1.575 1.6-.575.95-.575 2 0 3 2.425 3.775 2.425.775 4.675 1.225l.55.95q-.6 1.75-.975 2.875T12.85 37.4q0 1.7 1.275 2.975Q15.4 41.65 17.1 41.65q2.05 0 3.375-1.725 1.325-1.725 2.15-4.1.825-2.375 1.275-4.8.45-2.425.75-3.775l2.9.8q-.45 2.15-1.05 5-.6 2.85-1.725 5.425-1.125 2.575-2.95 4.375-1.825 1.8-4.775 1.8Zm3.5-14.85q-2.25-2-4.1-3.725-1.85-1.725-3.175-3.375-1.325-1.65-2.05-3.25-.725-1.6-.725-3.4 0-3 2.1-5.1 2.1-2.1 5.1-2.1.45 0 .85.025.4.025.8.125-.45-.85-.65-1.45t-.2-1.2q0-2.3 1.6-3.9T24 .85q2.3 0 3.9 1.6t1.6 3.9q0 .55-.175 1.175T28.65 9q.4-.1.8-.125.4-.025.85-.025 2.85 0 4.825 1.825T37.4 15.2q-.7-.05-1.5-.025t-1.5.125q-.25-1.5-1.35-2.475-1.1-.975-2.75-.975-1.85 0-2.925 1.025Q26.3 13.9 24.5 16h-1.05q-1.85-2.2-2.925-3.175-1.075-.975-2.825-.975-1.8 0-3 1.2t-1.2 3q0 1.2.65 2.45.65 1.25 1.85 2.675 1.2 1.425 2.9 3t3.8 3.475ZM30.9 44.7q-1.1 0-2.175-.35Q27.65 44 26.65 43.3q.4-.6.8-1.35.4-.75.65-1.4.7.55 1.425.825.725.275 1.475.275 1.75 0 2.975-1.275T35.2 37.4q0-1-.4-2.125t-.95-2.825l.55-.95q2.3-.4 4.7-1.175 2.4-.775 2.4-3.775 0-2.2-1.6-3.275-1.6-1.075-3.55-1.075-2.1 0-4.975.8-2.875.8-6.675 2.05l-.75-2.9q3.8-1.25 6.85-2.1 3.05-.85 5.55-.85 3.2 0 5.675 1.925Q44.5 23.05 44.5 26.5q0 1.35-.5 2.65-.5 1.3-1.4 2.3 2.3.05 3.85 1.5Q48 34.4 48 36.8q0 2.25-1.55 3.9t-3.9 1.65q-1.55 0-2.75-.725T37.85 39.6q-.8 2.25-2.65 3.675-1.85 1.425-4.3 1.425Z" />
            </svg>
            <span className="nav-logo-brand">CHATBOXX</span>
          </Link>
        </div>
        <div className="nav-middle">
          <Link
            to="/my_rooms"
            className={`nav-middle-item ${active === 1 && "active"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="48"
              width="48"
              viewBox="0 0 48 48"
            >
              <path d="M0 36v-2.65q0-1.95 2.075-3.15T7.5 29q.6 0 1.175.025.575.025 1.125.125-.4.85-.6 1.75-.2.9-.2 1.9V36Zm12 0v-3.2q0-3.25 3.325-5.275Q18.65 25.5 24 25.5q5.4 0 8.7 2.025Q36 29.55 36 32.8V36Zm27 0v-3.2q0-1-.2-1.9-.2-.9-.6-1.75.55-.1 1.125-.125Q39.9 29 40.5 29q3.35 0 5.425 1.2Q48 31.4 48 33.35V36ZM7.5 27.5q-1.45 0-2.475-1.025Q4 25.45 4 24q0-1.45 1.025-2.475Q6.05 20.5 7.5 20.5q1.45 0 2.475 1.025Q11 22.55 11 24q0 1.45-1.025 2.475Q8.95 27.5 7.5 27.5Zm33 0q-1.45 0-2.475-1.025Q37 25.45 37 24q0-1.45 1.025-2.475Q39.05 20.5 40.5 20.5q1.45 0 2.475 1.025Q44 22.55 44 24q0 1.45-1.025 2.475Q41.95 27.5 40.5 27.5ZM24 24q-2.5 0-4.25-1.75T18 18q0-2.5 1.75-4.25T24 12q2.5 0 4.25 1.75T30 18q0 2.5-1.75 4.25T24 24Z" />
            </svg>
            <span>Rooms</span>
            {roomNotif.length ? <NotificationDot notif={roomNotif} /> : ""}
          </Link>
          <Link
            to="/my_dms"
            className={`nav-middle-item ${active === 2 && "active"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="48"
              width="48"
              viewBox="0 0 48 48"
            >
              <path d="M16 28h16v-.95q0-2.1-2.125-3.25T24 22.65q-3.75 0-5.875 1.15T16 27.05Zm8-8.65q1.55 0 2.625-1.075T27.7 15.65q0-1.55-1.075-2.625T24 11.95q-1.55 0-2.625 1.075T20.3 15.65q0 1.55 1.075 2.625T24 19.35ZM4 44V7q0-1.15.9-2.075Q5.8 4 7 4h34q1.15 0 2.075.925Q44 5.85 44 7v26q0 1.15-.925 2.075Q42.15 36 41 36H12Z" />
            </svg>
            <span> Direct Messages</span>
            {notif.length ? <NotificationDot notif={notif} /> : ""}
          </Link>
          <Link
            to="/create_room"
            className={`nav-middle-item ${active === 3 && "active"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="48"
              width="48"
              viewBox="0 0 48 48"
            >
              <path d="M0 40v-4.7q0-1.75.925-3.175Q1.85 30.7 3.4 30q3.6-1.6 6.425-2.3 2.825-.7 5.925-.7 3.1 0 5.9.7 2.8.7 6.4 2.3 1.55.7 2.5 2.125t.95 3.175V40Zm15.75-16.05q-3.3 0-5.4-2.1-2.1-2.1-2.1-5.4 0-3.3 2.1-5.4 2.1-2.1 5.4-2.1 3.3 0 5.4 2.1 2.1 2.1 2.1 5.4 0 3.3-2.1 5.4-2.1 2.1-5.4 2.1Zm7.95-.25q1.3-1.6 1.925-3.3.625-1.7.625-3.95t-.625-3.95Q25 10.8 23.7 9.2q3.8-.85 6.675 1.15t2.875 6.1q0 4.1-2.875 6.1T23.7 23.7ZM34.5 40v-4.7q0-2.55-1.3-4.75t-4.5-3.7q8.65 1.1 11.825 3.2 3.175 2.1 3.175 5.25V40ZM40 25.55v-5h-5v-3h5v-5h3v5h5v3h-5v5Z" />
            </svg>
            <span> Create Room</span>
          </Link>
          <Link
            to="/search"
            className={`nav-middle-item ${active === 4 && "active"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="48"
              width="48"
              viewBox="0 0 48 48"
            >
              <path d="M39.8 41.95 26.65 28.8Q25.15 30.1 23.15 30.825Q21.15 31.55 18.9 31.55Q13.5 31.55 9.75 27.8Q6 24.05 6 18.75Q6 13.45 9.75 9.7Q13.5 5.95 18.85 5.95Q24.15 5.95 27.875 9.7Q31.6 13.45 31.6 18.75Q31.6 20.9 30.9 22.9Q30.2 24.9 28.8 26.65L42 39.75ZM18.85 28.55Q22.9 28.55 25.75 25.675Q28.6 22.8 28.6 18.75Q28.6 14.7 25.75 11.825Q22.9 8.95 18.85 8.95Q14.75 8.95 11.875 11.825Q9 14.7 9 18.75Q9 22.8 11.875 25.675Q14.75 28.55 18.85 28.55Z" />
            </svg>
            <span>Search</span>
          </Link>
        </div>
        <div className="nav-end pos-relative">
          <Link to={`/profile/${user.username}`}>
            <img
              src={`${user.picture}`}
              crossOrigin="anonymous"
              className="bg-gray"
            />
            <span>{user.username}</span>
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
            className="nav-end-profile-expander pointer"
            viewBox="0 0 30 48"
            onClick={() => setShowPopUp(!showPopUp)}
          >
            <path d="M20 44 0 24 20 4l2.8 2.85L5.65 24 22.8 41.15Z" />
          </svg>
          {showPopUp && <NavProfilePopUp />}
        </div>
      </div>
      <div className="main-container">
        <Outlet />
      </div>
    </div>
  );
};

export default Nav;
