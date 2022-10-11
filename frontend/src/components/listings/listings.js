import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MsgState } from "../chat-bubble/chat-bubble";
import axios from "axios";
import "./listings.css";
import { Spinner } from "../loading-spinner/spinner";
import { SocketContext } from "../contexts/socket";
import { NoResult, NoResultWithLink } from "../search/search";

/**
 * @param string room room object.
 * @param string userLocal main user object.
 * @param string newMsg new message from socket.io.
 * @return component for individual room object
 */
const RoomListingItem = ({ room, userLocal, newMsg }) => {
  // state for last message in object's msgs array
  const [lastMsg, setLastMsg] = useState(room.msgs[room.msgs.length - 1]);
  // state for number of unread messages
  const [unreadLenR, setUnreadLen] = useState(
    room.msgs.filter((m) => m.date > room.lastseen && m.type !== "info").length
  );
  // update last message if new message belongs to the room
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

/**
 * @return component for listing main user's rooms object
 */
export const GroupListings = () => {
  // for temporarily holding room object array
  let userRoomsClone = [];
  const { socket, socketId } = useContext(SocketContext);
  const [loading, setLoading] = useState(true);
  // for search etc
  const [userMiscRooms, setMiscUserRooms] = useState([]);
  // main room array holder- unaltered
  const [userRooms, setUserRooms] = useState([]);
  // for new incoming message from socket.io
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
  /**
   * sort rooms by most recent messages
   * @param array roomArr array of room objects
   * @return rooms array sorted by most recent messages
   */
  function sortArray(roomArr) {
    let roomArray = roomArr;
    // sort in desc order by date
    roomArray.sort((a, b) => {
      if (a.msgs.length > 0 && b.msgs.length > 0) {
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
  /**
   * fetch room object of each array nested in the parameter provided
   * @param array rooms nested array of main user's room activity
   */
  function getRoomsArray(rooms) {
    if (!rooms.length) {
      setLoading(false);
      setUserRooms([]);
      setMiscUserRooms([]);
      userRoomsClone = [];
    }
    // array to temporarily store array of room objects
    let roomArray = [];
    /**
     *room[0]-->room id
     * room[1]-->timestamp of last seen date
     */
    rooms.forEach((room, index) => {
      axios
        .get(`/api/room?id=${room[0]}`, config)
        .then((res) => {
          res.data.room.lastseen = room[1];
          roomArray.push(res.data.room);
          // update states when loop gets to the last element
          if (index === rooms.length - 1) {
            setLoading(false);
            // sort in desc order by date
            sortArray(roomArray);
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
    if (!userMiscRooms) {
      setLoading(true);
    }
    axios
      .get(`/api/user?username=${userLocal.username}`, config)
      .then((res) => {
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
      // update newMsg state for use in lastMsg prop for <RoomListingItem />
      setNewMsg(data);
      userRoomsClone[index].msgs.push(data.message);
      // sort modified room array by most recent messages
      sortArray(userRoomsClone);
      setMiscUserRooms(userRoomsClone);
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
      {userMiscRooms.length > 0
        ? userMiscRooms.map((room) => {
            return (
              <RoomListingItem
                room={room}
                key={room._id}
                userLocal={userLocal}
                newMsg={newMsg}
              />
            );
          })
        : !loading && (
            <NoResultWithLink
              linkText="Click here to find rooms"
              url="/search"
            />
          )}
    </div>
  );
};

/**
 * @return component to render individual dms object
 */
const DMListingItem = ({ dm, newDm }) => {
  /**
   *dm[0]-->username of a third party
   * dm[1]-->timestamp of last seen date
   * dm[2]-->profile pic url of the third party
   * dm[3]-->last message between main user and the third party
   * dm[4]-->array containing msg objects (dms) between third party and user
   */
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  // last message in dm
  const [lastMsg, setLastMsg] = useState(dm[4][dm[4].length - 1]);
  // number of unread messages
  const [unreadLen, setUnreadLen] = useState(0);
  let unreadMsgs = dm[4].filter((e) => e.date > dm[1]);

  useEffect(() => {
    if (newDm.from === dm[0]) {
      // update laste message with newMsg
      setLastMsg(newDm);
      // update number of unread messages
      setUnreadLen(unreadLen + 1);
    }
  }, [newDm]);

  // set last message on mount
  useEffect(() => {
    setUnreadLen(unreadMsgs.length);
    // if unreadMsgs array is empty, use value from user's dm activity
    if (!unreadMsgs.length) {
      setLastMsg(dm[4][dm[4].length - 1]);
    } else {
      setLastMsg(unreadMsgs[unreadMsgs.length - 1]);
    }
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
  /**
   *userDMs,userMiscDMs and userDMsClone are of the structure
   [dm,dm,..rest] where:
   *dm[0]-->username of a third party
   * dm[1]-->timestamp of last seen date
   * dm[2]-->profile pic url of the third party
   * dm[3]-->last message between main user and the third party
   * dm[4]-->array containing msg objects (dms) between third party and user
   */
  const { socket } = useContext(SocketContext);
  const [loading, setLoading] = useState(true);
  // array of dm objects (changes according to search)
  const [userMiscDMs, setMiscUserDMs] = useState([]);
  //  array of dm objects (main holder )
  const [userDMs, setUserDMs] = useState([]);
  // for incoming message from socket .io
  const [newDm, setNewDM] = useState({});
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  // array to temporarily store array of dm objects
  let userDMsClone = [];
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };
  /**
   * sort dm array by most recent messages
   * @param array array array of dm objects
   * @return rooms array sorted by most recent messages
   */
  function sortArray(array) {
    array.sort((a, b) => {
      let aMsgs = a[4];
      let bMsgs = b[4];
      if (aMsgs.length > 0 && bMsgs.length > 0) {
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
      // get index of third party sender from main user's dm actvity
      let index = userDMsClone.findIndex((item) => item[0] === data.from); //item[0]-->username of third partyfrom main user's dm actvity
      if (index > -1) {
        // update temp. dm objects array with new message
        userDMsClone[index][4].push(data);
        sortArray(userDMsClone);
        setMiscUserDMs(userDMsClone);
        setNewDM(data);
      } else {
      }
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

  /**
   *gets the direct messages between main user and each array nested in the parameter provided
   * @param array arr nested array of main user's dm activity
   */
  function getDMsArray(arr) {
    // array to temporarily store nested array of dm objects
    let dmArray = [];
    arr.forEach((e, index) => {
      axios
        .get(`/api/dm?target=${e[0]}`, config)
        .then((res) => {
          dmArray.push([...e, res.data.DmMsgs]);

          // update states when loop gets to the last element
          if (index === arr.length - 1) {
            setLoading(false);
            sortArray(dmArray);
            setUserDMs(dmArray);
            setMiscUserDMs(dmArray);
            userDMsClone = dmArray;
          }
        })
        .catch((e) => {
          console.log(e.response.data);
          setLoading(false);
          return new Error("couldn't fetch user & dms =>", e);
        });
    });
  }
  /**
   *fetch dm activity array of main user
   */
  function getDMs() {
    setLoading(true);
    axios
      .get(`/api/user?username=${userLocal.username}`, config)
      .then((res) => {
        let dmArray = res.data.user.dms;
        // if array is empty
        if (dmArray.length === 0) {
          setLoading(false);
          setUserDMs([]);
          setMiscUserDMs([]);
          userDMsClone = [];
          return;
        }
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
      {userMiscDMs.length > 0
        ? userMiscDMs.map((dm) => (
            <DMListingItem dm={dm} key={dm[0]} newDm={newDm} />
          ))
        : !loading && <NoResult text="No direct messages yet" />}
    </div>
  );
};
