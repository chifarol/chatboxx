import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MsgState } from "../chat-bubble/chat-bubble";
import axios from "axios";
import "./listings.css";
import { Spinner } from "../loading-spinner/spinner";
import { SocketContext } from "../contexts/socket";

const RoomListingItem = ({ room, userLocal, newMsg }) => {
  const [lastMsg, setLastMsg] = useState(room.msgs[room.msgs.length - 1]);
  const [unreadLenR, setUnreadLen] = useState(
    room.msgs.filter((m) => m.date > room.lastseen && m.type !== "info").length
  );
  useEffect(() => {
    if (newMsg.room_id === room._id) {
      setLastMsg(newMsg.message);
      setUnreadLen((unreadLenR) => unreadLenR + 1);
    }
  }, [newMsg]);
  return (
    <Link
      to={`/room/${room._id}`}
      className="list-item-group gray pointer"
      key={room._id}
    >
      <p className="list-item-group-one">
        <img src={room.picture} crossOrigin="anonymous" />
      </p>
      <div className="list-item-group-two">
        <p className="list-item-group-two-heading">#{room.name}</p>
        {room.msgs.length > 0 && (
          <p className="list-item-group-two-chat w300 f12">
            {lastMsg.type !== "info" ? (
              <span>
                {lastMsg.author.username !== userLocal.username
                  ? lastMsg.author.username
                  : "You"}
              </span>
            ) : (
              ""
            )}
            <span className="list-item-group-two-msg">{lastMsg.body}</span>
          </p>
        )}
      </div>
      <div className="list-item-group-three green">
        {unreadLenR > 0 ? unreadLenR : ""}
      </div>
    </Link>
  );
};
export const GroupListings = () => {
  let userRoomsClone = [];
  const { socket, socketId } = useContext(SocketContext);
  const [loading, setLoading] = useState(true);
  // fro search etc
  const [userMiscRooms, setMiscUserRooms] = useState([]);
  // main room array holder- unaltered
  const [userRooms, setUserRooms] = useState([]);
  const [newMsg, setNewMsg] = useState([]);
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };
  // search box functionality
  function search(keyword) {
    let searchRes = userRooms.filter((room) =>
      room["name"].toLowerCase().includes(keyword.toLowerCase())
    );
    setMiscUserRooms(searchRes);
    if (keyword === "") {
      setMiscUserRooms(userRooms);
    }
  }
  function sortArray(roomArr) {
    let roomArray = roomArr;
    console.log("roomArray result", roomArray);
    // sort in desc order by date
    roomArray.sort((a, b) => {
      if (a.msgs.length > 0 && b.msgs.length > 0) {
        console.log("non-empty room msgs obj");
        return (
          (a.msgs[a.msgs.length - 1].date - b.msgs[b.msgs.length - 1].date) * -1
        );
      } else {
        return -1;
      }
    });
    setUserRooms(roomArray);
    setMiscUserRooms(roomArray);
    userRoomsClone = roomArray;
  }
  function getRoomsArray(rooms) {
    let roomArray = [];
    rooms.forEach((room) => {
      axios
        .get(`/api/room?id=${room[0]}`, config)
        .then((res) => {
          console.log(`room with ${room[0]} =>`, res.data.room);
          res.data.room.lastseen = room[1];
          roomArray.push(res.data.room);
        })
        .catch((e) => {
          console.log(e.response.data);
        });
    });
    setTimeout(() => {
      setLoading(false);
      console.log("roomArray result", roomArray);
      // sort in desc order by date
      roomArray.sort((a, b) => {
        if (a.msgs.length > 0 && b.msgs.length > 0) {
          console.log("non-empty room msgs obj");
          return (
            (a.msgs[a.msgs.length - 1].date - b.msgs[b.msgs.length - 1].date) *
            -1
          );
        } else {
          return -1;
        }
      });
      setUserRooms(roomArray);
      setMiscUserRooms(roomArray);
      userRoomsClone = roomArray;
    }, 2000);
  }
  function getRooms() {
    if (!userMiscRooms) {
      setLoading(true);
    }
    axios
      .get(`/api/user?username=${userLocal.username}`, config)
      .then((res) => {
        console.log("roomids", res.data.user.rooms);
        getRoomsArray(res.data.user.rooms);
      })
      .catch((e) => {
        console.log(e.response.data);
        setLoading(false);
        return new Error("couldn't fetch user & rooms =>", e);
      });
  }

  useEffect(() => {
    //get rooms
    getRooms();
  }, []);
  useEffect(() => {
    socket.on("receive_room_message", (data) => {
      let index = userRoomsClone.findIndex((room) => room._id === data.room_id);

      setNewMsg(data);
      userRoomsClone[index].msgs.push(data.message);
      sortArray(userRoomsClone);
      setMiscUserRooms(userRoomsClone);
      console.log("userRoomsClone", userRoomsClone, "index", index);
      console.log("received message in listings", data);
    });
  }, [socket]);
  return (
    <div className="listings-container">
      <div className="listings-search pos-relative">
        <span className="listings-search-button">Search</span>
        <input
          placeholder="Search my rooms"
          onInput={(e) => search(e.target.value)}
        />
      </div>
      {loading && (
        <div className="pos-relative">
          <Spinner />
        </div>
      )}
      {userMiscRooms.map((room) => {
        console.log("trying to render room in list item", room);
        return (
          <RoomListingItem
            room={room}
            key={room._id}
            userLocal={userLocal}
            newMsg={newMsg}
          />
        );
      })}
    </div>
  );
};
const DMListingItem = ({ dm, newDm }) => {
  console.log("msgs from dm[4]", dm[4]);
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const [lastMsg, setLastMsg] = useState(dm[4][dm[4].length - 1]);
  const [unreadLen, setUnreadLen] = useState(0);
  let unreadMsgs = dm[4].filter((e) => e.date > dm[1]);
  console.log(
    "unreadMsgs from " + dm[0],
    unreadMsgs.length,
    "unread kumkum",
    dm[4][dm[4].length - 1].date - dm[1],
    dm[4][dm[4].length - 1].date,
    dm[1],
    dm[4][dm[4].length - 1]
  );
  useEffect(() => {
    if (newDm.from === dm[0]) {
      setLastMsg(newDm);
      let unreadLenR = unreadLen + 1;
      setUnreadLen(unreadLenR);
    }
    console.log("newDm", newDm);
  }, [newDm]);
  useEffect(() => {
    setUnreadLen(unreadMsgs.length);
    if (!unreadMsgs[unreadMsgs.length - 1]) {
      setLastMsg(dm[4][dm[4].length - 1]);
    } else {
      setLastMsg(unreadMsgs[unreadMsgs.length - 1]);
    }
    console.log("lastMsg dm", lastMsg);
  }, []);
  return (
    <Link
      to={`/dm/${dm[0]}`}
      className="list-item-group gray pointer"
      key={dm[0]}
    >
      <p className="list-item-group-one">
        <img src={dm[2]} crossOrigin="anonymous" />
      </p>
      <div className="list-item-group-two">
        <span>{dm[0]}</span>
        <p className="list-item-group-two-chat f12 w300">
          <span className={lastMsg.date > dm[1] ? "green" : ""}>
            {lastMsg.from === userLocal.username && "You: "}
            <span className="list-item-group-two-msg">{lastMsg.body}</span>
          </span>
        </p>
      </div>
      <div className="list-item-group-three green">
        {unreadLen ? unreadLen : ""}
      </div>
    </Link>
  );
};
export const DMListings = () => {
  const { socket } = useContext(SocketContext);
  const [loading, setLoading] = useState(true);
  // changes acc to search
  const [userMiscDMs, setMiscUserDMs] = useState([]);
  // permanent - doesnt change
  const [userDMs, setUserDMs] = useState([]);
  const [newDm, setNewDM] = useState({});
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  let userDMsClone = [];
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };

  function sortArray(array) {
    array.sort((a, b) => {
      let aMsgs = a[4];
      let bMsgs = b[4];
      if (aMsgs.length > 0 && bMsgs.length > 0) {
        console.log("non-empty dm msgs obj");
        return (
          (aMsgs[aMsgs.length - 1].date - bMsgs[bMsgs.length - 1].date) * -1
        );
      } else {
        return -1;
      }
    });
  }
  useEffect(() => {
    socket.on("error", function (err) {
      if (err.description) console.log(err.description);
      else console.log(err); // Or whatever you want to do
    });
    socket.on("receive_message", (data) => {
      let index = userDMsClone.findIndex((item) => item[0] === data.from);
      console.log("userDMsClone", userDMsClone, "index", index);
      if (index > -1) {
        userDMsClone[index][4].push(data);
        sortArray(userDMsClone);
        setMiscUserDMs(userDMsClone);
        setNewDM(data);
      } else {
        console.log("incoming msg listing not for you");
      }
      console.log("received message in listings", data);
    });
  }, [socket]);

  // search box functionality
  function search(keyword) {
    let searchRes = userDMs.filter((e) =>
      e[0].toLowerCase().includes(keyword.toLowerCase())
    );
    setMiscUserDMs(searchRes);
    if (keyword === "") {
      setMiscUserDMs(userDMs);
    }
  }
  function getDMsArray(arr) {
    let dmArray = [];
    arr.forEach((e) => {
      axios
        .get(`/api/dm?target=${e[0]}`, config)
        .then((res) => {
          console.log("res.data.DmMsgs", res.data.DmMsgs);
          dmArray.push([...e, res.data.DmMsgs]);
        })
        .catch((e) => {
          console.log(e.response.data);
          setLoading(false);
          return new Error("couldn't fetch user & dms =>", e);
        });
    });
    setTimeout(() => {
      console.log("dmArray result", dmArray);
      setLoading(false);
      sortArray(dmArray);
      setUserDMs(dmArray);
      setMiscUserDMs(dmArray);
      userDMsClone = dmArray;
    }, 1000);
  }

  function getDMs() {
    setLoading(true);
    axios
      .get(`/api/user?username=${userLocal.username}`, config)
      .then((res) => {
        console.log("DMids", res.data.user.dms);
        let dmArray = res.data.user.dms;
        getDMsArray(dmArray);
      })
      .catch((e) => {
        console.log(e);
        setLoading(false);
        return new Error("couldn't fetch user & dms =>", e);
      });
  }
  useEffect(() => {
    //get rooms
    getDMs();
  }, []);

  return (
    <div className="listings-container">
      <div className="listings-search pos-relative">
        <span className="listings-search-button">Search</span>
        <input
          placeholder="Search direct messages"
          onInput={(e) => search(e.target.value)}
        />
      </div>
      {loading && (
        <div className="pos-relative">
          <Spinner />
        </div>
      )}
      {userMiscDMs.map((dm) => (
        <DMListingItem dm={dm} key={dm[0]} newDm={newDm} />
      ))}
    </div>
  );
};
