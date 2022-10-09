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

const Room = () => {
  let roomMsgs = [];
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const { roomIdRoute } = useParams();
  const [showPopUp, setShowPopUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const newMsgInputRef = useRef(null);
  const [newMsgInput, setNewMsgInput] = useState("");
  const [room, setRoom] = useState({});
  const [msgs, setMsgs] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [joinLeaveLoading, setJoinLeaveLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { socket } = useContext(SocketContext);
  const { updateRoomNotif } = useContext(DMListContext);
  const [newMsgArray, setNewMsgArray] = useState([]);
  const [newMsgState, setNewMsgState] = useState("pending");
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const lastSeen = () => {
    console.log("you now in room screen");
    socket.emit("lastSeen", {
      isRoom: true,
      targetUsernameOrId: roomIdRoute,
      mainUsername: userLocal.username,
    });
  };
  const sendRoomMsgIO = (msg) => {
    socket.emit("msg_room", {
      room_id: roomIdRoute,
      message: msg,
    });
  };
  useEffect(() => {
    scrollToBottom();
  });
  useEffect(() => {
    lastSeen();
    updateRoomNotif(roomIdRoute);
    return () => {
      lastSeen();
    };
  }, []);
  useEffect(() => {
    socket.on("receive_room_message", (data) => {
      setMsgs((msgs) => [...msgs, data.message]);
    });
  }, [socket]);
  function fetchRoom() {
    axios
      .get(`/api/room?id=${roomIdRoute}`, config)
      .then((res) => {
        setFetching(false);
        console.log("roomIdRoute", roomIdRoute);
        console.log("room object", res.data);
        setRoom(res.data.room);
        setMsgs(res.data.room.msgs);
        if (
          res.data.room.members.some((e) => e.username === userLocal.username)
        ) {
          setIsMember(true);
        } else if (
          res.data.room.removed.some((e) => e === userLocal.username)
        ) {
          console.log("blacklisted user", res.data.room.removed);
          setIsMember("blacklisted");
        }
      })
      .catch((e) => {
        setFetching(false);
        console.log(e.response.data);
        if (e.response.status === 404 || e.response.status === 401) {
          window.location.pathname = "/404";
        }
      });
  }
  useEffect(() => {
    fetchRoom();
  }, []);
  function joinOrLeaveRoom() {
    setJoinLeaveLoading(true);
    axios
      .get(`/api/join_room?id=${roomIdRoute}`, config)
      .then((res) => {
        console.log(
          "join room request",
          roomIdRoute,
          "status",
          res.data.status
        );
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
  function sendRoomMsg() {
    setLoading(true);

    let body = {
      room_id: roomIdRoute,
      body: newMsgInput,
    };
    axios
      .post(`/api/room`, body, config)
      .then((res) => {
        console.log("roomIdRoute", roomIdRoute);
        let roomMsgs = msgs;
        roomMsgs.push(res.data.newRoomMSG);
        console.log("updated msg array", roomMsgs);
        setMsgs(roomMsgs);
        sendRoomMsgIO(res.data.newRoomMSG);
        newMsgInputRef.current.value = "";
        setLoading(false);
      })
      .catch((e) => {
        console.log(e);
        setLoading(false);
      });
  }
  return (
    <div className="room-container">
      <div className="general-top">
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
