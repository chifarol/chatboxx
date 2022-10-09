import React, { useEffect } from "react";
import "./responsive.css";
import "./app.css";
import Nav from "./nav/nav";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import General from "./middle/general/general";
import ProfileRouter from "./middle/profile/profile-router";
import RoomDetailRouter from "./middle/room_details/room-detail-router";
import RoomRouter from "./middle/room/room-router";
import { CheckAuth, LogIn, Register } from "./auth/auth";
import DMRouter from "./middle/dm/dm-router";
import P404 from "./P404/P404";

function App() {
  // on mount , check validity of user credentials
  useEffect(() => {
    CheckAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LogIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Nav />}>
        <Route path="/room/*" element={<RoomRouter />} />
        <Route path="/dm/*" element={<DMRouter />} />
        <Route path="/profile/*" element={<ProfileRouter />} />
        <Route path="/room_details/*" element={<RoomDetailRouter />} />
        <Route
          path="/my_dms"
          element={<General type="my_dms" title="Direct Messages" />}
        />
        <Route
          index
          path="/"
          element={<General type="my_rooms" title="Rooms" />}
        />
        <Route
          path="/my_rooms"
          element={<General type="my_rooms" title="Rooms" />}
        />
        <Route
          path="/search"
          element={<General type="search" title="Search" />}
        />
        <Route
          path="/create_room"
          element={<General type="create_room" title="Create Room" />}
        />
        <Route
          path="/my_settings"
          element={<General type="my_settings" title="My Settings" />}
        />

        <Route path="/404" element={<P404 />} />
        <Route path="/*" element={<P404 />} />
      </Route>
    </Routes>
  );
}

export default App;
