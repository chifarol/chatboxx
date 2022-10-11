import React, { createContext } from "react";
import io from "socket.io-client";
import axios from "axios";
// const { SOCKET_URL } = process.env;

export const socket = io.connect(`${window.location.hostname}:4001`);
export const SocketContext = createContext();
export const SocketContextProvider = ({ children }) => {
  let socketId;
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  // there is no user in session yet
  if (!userLocal) {
    const value = { socket, socketId: socket.id };
    return (
      <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
    );
  } else {
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    socket.on("connect", () => {
      axios
        .get(`/api/user?username=${userLocal.username}`, config)
        .then((res) => {
          // join all room ids in main users room activity array i.e userObject.rooms
          socket.emit("join_rooms", { rooms: res.data.user.rooms });
        })
        .catch((e) => {
          console.log(e);
          return new Error("couldn't fetch user & rooms =>", e);
        });
      console.log("socketId", socket.id);
      socketId = socket.id;
      // add username to list tracking online users on disconnect
      socket.emit("online", { username: userLocal.username });
    });

    socket.on("error", function (err) {
      if (err.description) console.log(err.description);
      else console.log(err);
    });

    socket.on("disconnect", (reason) => {
      console.log("socket connection disconnecting...", reason);
      // remove username from list tracking online users on disconnect
      socket.emit("offline", { username: userLocal.username });
    });
    const value = { socket, socketId };
    return (
      <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
    );
  }
};
