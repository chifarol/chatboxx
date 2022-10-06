import React from "react";
import { Routes, Route } from "react-router-dom";
import General from "../general/general";
import RoomDetails from "./room-details";

const RoomDetailRouter = () => {
  return (
    <Routes>
      <Route
        path="/edit/:roomIdRoute"
        element={<General type="update_room" title="Edit Room" />}
      />
      <Route path=":roomIdRoute" element={<RoomDetails />} />
    </Routes>
  );
};

export default RoomDetailRouter;
