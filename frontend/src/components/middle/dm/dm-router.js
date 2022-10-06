import React from "react";
import { Routes, Route } from "react-router-dom";
import DM from "./dm";

const DMRouter = () => {
  return (
    <Routes>
      <Route path=":usernameRoute" element={<DM />} />
    </Routes>
  );
};

export default DMRouter;
