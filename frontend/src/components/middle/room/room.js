import React, { useRef, useState, useEffect, useContext } from "react";
import ChatBubble, {
  ChatBubbleDM,
  ChatBubbleGroupInfo,
  ChatBubbleMe,
} from "../../chat-bubble/chat-bubble";
import { RoomPopUp } from "../../popup/popup";
import "./room.css";
import { getFilePath, imageUpload } from "../../utils";
import { Spinner } from "../../loading-spinner/spinner";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { SocketContext } from "../../contexts/socket";
import { DMListContext } from "../../contexts/msgs";
import { BackButton } from "../general/general";

/**
 * component to render room and room messgaes
 */
const Room = () => {
  // array to temporarily store room messages
  let roomMsgs = [];
  // main user object
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  // room_id string after /room/<room_id>
  const { roomIdRoute } = useParams();
  // for room option popup
  const [showPopUp, setShowPopUp] = useState(false);
  // for send messsage loading state
  const [loading, setLoading] = useState(false);
  // for scroll to bottom feature
  const messagesEndRef = useRef(null);
  // message input field ref
  const newMsgInputRef = useRef(null);
  // message input state
  const [newMsgInput, setNewMsgInput] = useState("");
  // for fetched room object
  const [room, setRoom] = useState({});
  // for fetched room messages
  const [msgs, setMsgs] = useState([]);
  // if user is a room member
  const [isMember, setIsMember] = useState(false);
  // joining or leaving loading state
  const [joinLeaveLoading, setJoinLeaveLoading] = useState(false);
  // fetching room object - loading state
  const [fetching, setFetching] = useState(true);
  // socket io object
  const { socket } = useContext(SocketContext);
  // room notification utilities
  const { updateRoomNotif } = useContext(DMListContext);

  // config object for api
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };
  /**
   * scrolls to bottom of page where messagesEndRef was placed
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  /**
   * update last seen on main user's activity via socket.io
   */
  const lastSeen = () => {
    console.log("you now in room screen");
    socket.emit("lastSeen", {
      isRoom: true,
      targetUsernameOrId: roomIdRoute,
      mainUsername: userLocal.username,
    });
  };
  // send msg to all room members including main user via socket .io
  const sendRoomMsgIO = (msg) => {
    socket.emit("msg_room", {
      room_id: roomIdRoute,
      message: msg,
    });
  };
  // scroll to bottom on any re-render (more reliable as it runs only "after" and not "during" state update)
  useEffect(() => {
    scrollToBottom();
  });

  useEffect(() => {
    // update last seen and room notification on mount
    lastSeen();
    updateRoomNotif(roomIdRoute);
    // update last seen on unmount
    return () => {
      lastSeen();
    };
  }, []);
  useEffect(() => {
    socket.on("receive_room_message", (data) => {
      // if message is for room
      if (data.room_id === roomIdRoute) {
        setMsgs((msgs) => [...msgs, data.message]);
      }
    });
  }, [socket]);
  /**
   * fetches room data from backend
   */
  function fetchRoom() {
    axios
      .get(`/api/room?id=${roomIdRoute}`, config)
      .then((res) => {
        setFetching(false);
        // update room object state
        setRoom(res.data.room);
        // update room messages state
        setMsgs(res.data.room.msgs);
        if (
          res.data.room.members.some((e) => e.username === userLocal.username)
        ) {
          //if member is a member of the room
          setIsMember(true);
        } else if (
          res.data.room.removed.some((e) => e === userLocal.username)
        ) {
          //if member is blacklisted i.e was removed by host
          setIsMember("blacklisted");
        }
      })
      .catch((e) => {
        // turn off fetching state
        setFetching(false);
        console.log(e.response.data);
        // if room doesn't exist
        if (e.response.status === 404 || e.response.status === 401) {
          window.location.pathname = "/404";
        }
      });
  }
  //on mount fetch and update room data & messages
  useEffect(() => {
    fetchRoom();
  }, []);
  /**
   * join or leave room
   */
  function joinOrLeaveRoom() {
    setJoinLeaveLoading(true);
    axios
      .get(`/api/join_room?id=${roomIdRoute}`, config)
      .then((res) => {
        setJoinLeaveLoading(false);
        if (res.data.status === "joined") {
          fetchRoom();
          setIsMember(true);
        } else {
          setIsMember(false);
          fetchRoom();
        }
      })
      .catch((e) => {
        console.log(e);
        setJoinLeaveLoading(false);
      });
  }
  /**
   * send message (save to database)
   */
  function sendRoomMsg() {
    setLoading(true);

    let body = {
      room_id: roomIdRoute,
      body: newMsgInput,
    };
    axios
      .post(`/api/room`, body, config)
      .then((res) => {
        let roomMsgs = msgs;
        roomMsgs.push(res.data.newRoomMSG);
        // update room messages array state
        setMsgs(roomMsgs);
        // send message for broadcst to memebers (Socket io)
        sendRoomMsgIO(res.data.newRoomMSG);
        // reset messsgae input field
        newMsgInputRef.current.value = "";
        // turn off laoding state
        setLoading(false);
      })
      .catch((e) => {
        console.log(e);
        // turn off laoding state
        setLoading(false);
      });
  }
  return (
    <div className="room-container">
      <div className="general-top">
        <BackButton />
        <Link to={`/room_details/${room._id}`} className="room-top-one pointer">
          <img src={room.picture} crossOrigin="anonymous" />
        </Link>
        <Link
          to={`/room_details/${room._id}`}
          className="room-top-second pointer"
        >
          <span className="room-room-name">{room.name}</span>
          {room.members && (
            <span className="room-room-metrics f12 w300 gray">
              {`${room.members.length}`} member
              {room.members.length === 1 ? "" : "s"}
            </span>
          )}
        </Link>
        <span
          className="room-room-options pointer"
          onClick={() => setShowPopUp(!showPopUp)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
            viewBox="0 0 48 48"
          >
            <path d="M24 40q-1 0-1.7-.7t-.7-1.7q0-1 .7-1.7t1.7-.7q1 0 1.7.7t.7 1.7q0 1-.7 1.7T24 40Zm0-13.6q-1 0-1.7-.7t-.7-1.7q0-1 .7-1.7t1.7-.7q1 0 1.7.7t.7 1.7q0 1-.7 1.7t-1.7.7Zm0-13.6q-1 0-1.7-.7t-.7-1.7q0-1 .7-1.7T24 8q1 0 1.7.7t.7 1.7q0 1-.7 1.7t-1.7.7Z" />
          </svg>
          {showPopUp && (
            <div className="pop-up-room-container bg-gray-blue w400">
              <Link
                className="pop-up-item pointer"
                to={`/room_details/${room._id}`}
              >
                Details
              </Link>
              {isMember && (
                <span
                  className="pop-up-item red pointer pos-relative"
                  onClick={joinOrLeaveRoom}
                >
                  Leave room
                  {joinLeaveLoading && <Spinner />}
                </span>
              )}
            </div>
          )}
        </span>
      </div>
      <div className="room-middle scrollbar">
        {fetching && (
          <div className="pad-10 w300 italic center gray">fetching...</div>
        )}
        {msgs.map((msg) =>
          msg.type === "info" ? (
            <ChatBubbleGroupInfo key={msg._id} msg={msg} />
          ) : msg.author.username === userLocal.username ? (
            <ChatBubbleMe key={msg._id} msg={msg} isRoom="true" id={room._id} />
          ) : (
            <ChatBubble key={msg._id} msg={msg} />
          )
        )}
        <span ref={messagesEndRef}></span>
      </div>
      <div className="room-bottom">
        <div className="message-box-container pos-relative">
          {!fetching &&
            (isMember !== true ? (
              isMember !== "blacklisted" ? (
                <div
                  className="bg-green dark center pad-10 br-4 pointer pos-relative"
                  onClick={joinOrLeaveRoom}
                >
                  Join
                  {joinLeaveLoading && <Spinner />}
                </div>
              ) : (
                <div className="bg-red dark center pad-10 br-4 pos-relative">
                  You were blacklisted on removal, contact the host
                </div>
              )
            ) : (
              <div className=" pos-relative">
                <textarea
                  className="message-box pos-relative"
                  placeholder="Enter message"
                  ref={newMsgInputRef}
                  onInput={(e) => setNewMsgInput(e.target.value)}
                ></textarea>
                {newMsgInputRef.current && newMsgInputRef.current.value && (
                  <div className="message-box-send">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="48"
                      width="48"
                      viewBox="0 0 48 48"
                      className="pointer pos-relative"
                      onClick={sendRoomMsg}
                    >
                      <path d="M6 40V27.75L21.1 24 6 20.15V8l38 16Z" />
                    </svg>
                    {loading && <Spinner />}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Room;
