import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { SocketContext } from "./socket";

export const DMListContext = createContext();

export const DMListContextProvider = ({ children }) => {
  const userLocal = JSON.parse(sessionStorage.getItem("user"));
  const [notif, setNotif] = useState([]);
  const [roomNotif, setRoomNotif] = useState([]);
  const { socket } = useContext(SocketContext);
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };
  let unreadUsernameArr = [];
  function getDMsArray(arr) {
    arr.forEach((e, index) => {
      axios
        .get(`/api/dm?target=${e[0]}`, config)
        .then((res) => {
          if (res.data.DmMsgs.some((msg) => msg.date > e[1])) {
            unreadUsernameArr.push(e[0]);
            console.log("unread msg from ", e[0], new Set(unreadUsernameArr));
          }
          if (index === arr.length - 1) {
            setNotif([...new Set(unreadUsernameArr)]);
          }
        })
        .catch((e) => {
          console.log(e);
          return new Error("couldn't fetch user & dms =>", e);
        });
    });
  }
  function getDMs() {
    axios
      .get(`/api/user?username=${userLocal.username}`, config)
      .then((res) => {
        console.log("DMids", res.data.user.dms);
        let dmArray = res.data.user.dms;
        getDMsArray(dmArray);
      })
      .catch((e) => {
        console.log(e);
        return new Error("couldn't fetch user & dms =>", e);
      });
  }

  function updateNotif(username) {
    console.log(
      "updateNotif fxn will now update notif context",
      "username",
      username
    );

    if (window.location.pathname !== `/dm/${username}`) {
      getDMs();
    } else {
      let unreadUsernameArr = notif;
      notif.forEach((usernameR, index) => {
        if (usernameR === username) {
          console.log(
            "updateNotif fxn will now update notif context",
            "removing user",
            usernameR
          );
          unreadUsernameArr.splice(index, 1);
          setNotif(unreadUsernameArr);
        }
      });
    }
  }

  //rooms
  function getRoomsArray(rooms) {
    let roomArray = [];
    let unreadRoomArr = [];
    rooms.forEach((room, index) => {
      axios
        .get(`/api/room?id=${room[0]}`, config)
        .then((res) => {
          console.log(`room with ${room[0]} =>`, res.data.room);
          res.data.room.lastseen = room[1];
          roomArray.push(res.data.room);
          if (
            res.data.room.msgs.some(
              (msg) => msg.type !== "info" && msg.date > room[1]
            )
          ) {
            unreadRoomArr.push(room[0]);
            console.log("unread msg from ", room[0], new Set(unreadRoomArr));
          }
          if (index === rooms.length - 1) {
            setRoomNotif([...new Set(unreadRoomArr)]);
          }
        })
        .catch((e) => {
          console.log(e.response.data);
        });
    });
  }
  function getRooms() {
    axios
      .get(`/api/user?username=${userLocal.username}`, config)
      .then((res) => {
        console.log("roomids", res.data.user.rooms);
        getRoomsArray(res.data.user.rooms);
      })
      .catch((e) => {
        console.log(e.response.data);
        return new Error("couldn't fetch user & rooms =>", e);
      });
  }
  function updateRoomNotif(id) {
    if (window.location.pathname.includes(`/room/`)) {
      setRoomNotif(roomNotif.filter((room_id) => room_id != id));
    } else {
      console.log(
        "updateNotif fxn room notif context not in room screen with id ",
        `/room/${id}`
      );
      getRooms();
    }
  }
  useEffect(() => {
    getDMs();
    getRooms();
  }, []);
  const value = { notif, setNotif, updateNotif, updateRoomNotif, roomNotif };
  return (
    <DMListContext.Provider value={value}>{children}</DMListContext.Provider>
  );
};
