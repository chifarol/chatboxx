import React from "react";
import { Routes, Route } from "react-router-dom";
import Profile from "./profile";

const ProfileRouter = () => {
  return (
    <Routes>
      <Route index element={<Profile />} />
      <Route path=":usernameRoute" element={<Profile />} />
    </Routes>
  );
};

export default ProfileRouter;
