import { createRoot } from "react-dom/client";
import React from "react";
import App from "./components/app";
import { BrowserRouter } from "react-router-dom";
import { AlertContextProvider } from "./components/contexts/alert";
import { SocketContextProvider } from "./components/contexts/socket";
import { DMListContextProvider } from "./components/contexts/msgs";

const container = document.querySelector("#app");

const root = createRoot(container);

root.render(
  <BrowserRouter>
    {/* <SocketContextProvider>
      <DMListContextProvider> */}
    <AlertContextProvider>
      <App />
    </AlertContextProvider>
    {/* </DMListContextProvider>
    </SocketContextProvider> */}
  </BrowserRouter>
);
