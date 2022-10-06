import { createRoot } from "react-dom/client";
import React from "react";
import App from "./components/app";
import { BrowserRouter } from "react-router-dom";
import { AlertContextProvider } from "./components/contexts/alert";
import { SocketContextProvider } from "./components/contexts/socket";

const container = document.querySelector("#app");

const root = createRoot(container);

root.render(
  <BrowserRouter>
    <SocketContextProvider>
      <AlertContextProvider>
        <App />
      </AlertContextProvider>
    </SocketContextProvider>
  </BrowserRouter>
);
