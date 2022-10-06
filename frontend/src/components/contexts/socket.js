import React, { createContext } from "react";
import io from "socket.io-client";
// const { SOCKET_URL } = process.env;

export const socket = io.connect("http://localhost:4001", {
  transports: ["websocket"],
  upgrade: false,
});

const userLocal = JSON.parse(sessionStorage.getItem("user"));
export const SocketContext = createContext();
export const SocketContextProvider = ({ children }) => {
  let socketId;
  // let socketRef = useRef(null);
  // client-side
  socket.on("connect", () => {
    console.log("socketId", socket.id);
    socketId = socket.id;
    socket.emit("online", { username: userLocal.username });
  });
  socket.on("error", function (err) {
    if (err.description) console.log(err.description);
    else console.log(err); // Or whatever you want to do
  });
  socket.on("disconnect", (reason) => {
    console.log("disconnecting ftd", reason);
    socket.emit("offline", { username: userLocal.username });
  });
  const value = { socket, socketId };
  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
