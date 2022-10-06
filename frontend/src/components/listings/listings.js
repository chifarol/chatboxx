import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MsgState } from "../chat-bubble/chat-bubble";
import axios from "axios";
import "./listings.css";
import { Spinner } from "../loading-spinner/spinner";

export const GroupListings = () => {
  const [loading, setLoading] = useState(true);
  // fro search etc
  const [userMiscRooms, setMiscUserRooms] = useState([]);
  // main room array holder- unaltered
  const [userRooms, setUserRooms] = useState([]);
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
      console.log("roomArray result", roomArray);
      setLoading(false);
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
    }, 1000);
  }
  function getRooms() {
    setLoading(true);
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
  return (
    <div className="listings-container">
      <div className="listings-search pos-relative">
        <span className="listings-search-button">Search</span>
        <input
          placeholder="Search my groups"
          onInput={(e) => search(e.target.value)}
        />
      </div>
      {loading && (
        <div className="pos-relative">
          <Spinner />
        </div>
      )}
      {userMiscRooms.map((room) => {
        let unreadMsgs = room.msgs.filter((m) => m.date > room.lastseen);
        let lastMsg = room.msgs[room.msgs.length - 1];
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
                  <span>
                    {lastMsg.author.username !== userLocal.username
                      ? lastMsg.author.username
                      : "You"}
                    :{" "}
                  </span>
                  <span className="list-item-group-two-msg">
                    {lastMsg.body}
                  </span>
                </p>
              )}
            </div>
            <div className="list-item-group-three green">
              {unreadMsgs.length > 0 ? unreadMsgs.length + "+" : ""}
            </div>
          </Link>
        );
      })}
    </div>
  );
};
export const DMListings = () => {
  const [loading, setLoading] = useState(true);
  // changes acc to search
  const [userMiscDMs, setMiscUserDMs] = useState([]);
  // permanent - doesnt change
  const [userDMs, setUserDMs] = useState([]);
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };

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
      dmArray.sort((a, b) => {
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
      setUserDMs(dmArray);
      setMiscUserDMs(dmArray);
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
      {userMiscDMs.map((dm) => {
        let unreadMsgs = dm[4].filter((e) => e.date > dm[1]);
        let lastMsg = unreadMsgs[unreadMsgs.length - 1];
        if (!lastMsg) {
          lastMsg = dm[4][dm[4].length - 1];
        }
        console.log("lastMsg dm", lastMsg);
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
                <span
                  className={lastMsg.to === userLocal.username ? "green" : ""}
                >
                  {lastMsg.from === userLocal.username && "You: "}
                  <span className="list-item-group-two-msg">
                    {lastMsg.body}
                  </span>
                </span>
              </p>
            </div>
            <div className="list-item-group-three green">
              {unreadMsgs.length ? unreadMsgs.length + "+" : ""}
            </div>
          </Link>
        );
      })}
    </div>
  );
};
