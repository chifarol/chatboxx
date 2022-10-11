import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { SocketContext } from "./socket";

export const DMListContext = createContext();

// notification provider/updater for dm/room listings
export const DMListContextProvider = ({ children }) => {
  const userLocal = JSON.parse(sessionStorage.getItem("user"));
  const [notif, setNotif] = useState([]);
  const [roomNotif, setRoomNotif] = useState([]);
  // api header config
  if (!userLocal) {
    return;
  }
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };
  // temporary array for unread dms
  let unreadUsernameArr = [];

  /**
   *gets the direct messages between main user and each array nested in the parameter provided and update dm notification state
   * @param array arr nested array of main user's dm activity
   */
  function getDMsArray(arr) {
    arr.forEach((e, index) => {
      /**
       *e[0]-->username of a third party
       * e[1]-->timestamp of last seen date
       * e[2]-->profile pic url of the third party
       * e[3]-->last message between main user and the third party
       */
      axios
        .get(`/api/dm?target=${e[0]}`, config)
        .then((res) => {
          // if msg.date is later than main user last seen
          if (res.data.DmMsgs.some((msg) => msg.date > e[1])) {
            // add username to unreadUsernameArr
            unreadUsernameArr.push(e[0]);
          }
          // when loop reaches last element, update the notif state with new unique value set
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
  /**
   *fetch dm activity array of main user
   */
  function getDMs() {
    // api to fetch dm activity array of main user
    axios
      .get(`/api/user?username=${userLocal.username}`, config)
      .then((res) => {
        getDMsArray(res.data.user.dms);
      })
      .catch((e) => {
        console.log(e);
        return new Error("couldn't fetch user & dms =>", e);
      });
  }

  /**
   *Updates notification array state for direct messages (dm)
   *
   * @param string username username of third party to add/remove to notif array/set.
   */
  function updateNotif(username) {
    // if user is not currently in the third party dm screen
    if (window.location.pathname !== `/dm/${username}`) {
      setNotif([...new Set([...notif, username])]);
    } else {
      setNotif(notif.filter((e) => e !== username));
    }
  }

  /**
   * fetch room object and update room notifications/unread messages between main user and each array nested in the parameter provided
   * @param array arr nested array of main user's room activity
   */
  function getRoomsArray(rooms) {
    // array to temporarily store room objects
    let roomArray = [];
    // array to temporarily store room with unread messages
    let unreadRoomArr = [];
    rooms.forEach((room, index) => {
      /**
       *room[0]-->room id
       * room[1]-->timestamp of last seen date
       */

      // api to fetch room object
      axios
        .get(`/api/room?id=${room[0]}`, config)
        .then((res) => {
          // add lastseen to room object
          res.data.room.lastseen = room[1];
          roomArray.push(res.data.room);
          // if msg.date is later than main user last seen and msg.type is not "info"
          if (
            res.data.room.msgs.some(
              (msg) => msg.type !== "info" && msg.date > room[1]
            )
          ) {
            // add room id to unreadRoomArr
            unreadRoomArr.push(room[0]);
          }
          // when it reaches the last room in array
          if (index === rooms.length - 1) {
            setRoomNotif([...new Set(unreadRoomArr)]);
          }
        })
        .catch((e) => {
          console.log(e.response.data);
        });
    });
  }
  /**
   *fetch room activity array of main user
   */
  function getRooms() {
    axios
      .get(`/api/user?username=${userLocal.username}`, config)
      .then((res) => {
        getRoomsArray(res.data.user.rooms);
      })
      .catch((e) => {
        console.log(e.response.data);
        return new Error("couldn't fetch user & rooms =>", e);
      });
  }

  /**
   *Updates notification state for room messages (dm)
   *
   * @param string id room id to add/remove to notif array/set.
   */
  function updateRoomNotif(id) {
    // if user is currently viewing the room
    if (window.location.pathname.includes(`/room/`)) {
      setRoomNotif(roomNotif.filter((room_id) => room_id != id));
    }
    // if user is not currently viewing the room
    else {
      setRoomNotif([...new Set([...roomNotif, id])]);
    }
  }
  // run once on mount
  useEffect(() => {
    // fetch dms and update dms notification
    getDMs();
    // fetch rooms and update rooms notification
    getRooms();
  }, []);
  const value = { notif, setNotif, updateNotif, updateRoomNotif, roomNotif };
  return (
    <DMListContext.Provider value={value}>{children}</DMListContext.Provider>
  );
};
