import React from "react";
import { Routes, Route } from "react-router-dom";
import Room from "./room";

const RoomRouter = () => {
  return (
    <Routes>
      <Route path=":roomIdRoute" element={<Room />} />
      <Route path=":roomIdRoute/update" element={<Room />} />
    </Routes>
  );
};

export default RoomRouter;
