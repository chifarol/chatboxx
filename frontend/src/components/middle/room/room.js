import React, { useRef, useState, useEffect } from "react";
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

const Room = () => {
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const { roomIdRoute } = useParams();
  const [showPopUp, setShowPopUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [newMsgInput, setNewMsgInput] = useState("");
  const [room, setRoom] = useState({});
  const [msgs, setMsgs] = useState([]);
  const [newMsgArray, setNewMsgArray] = useState([]);
  const [newMsgState, setNewMsgState] = useState("pending");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgs]);
  useEffect(() => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    axios
      .get(`/api/room?id=${roomIdRoute}`, config)
      .then((res) => {
        console.log("roomIdRoute", roomIdRoute);
        console.log("room object", res.data);
        setRoom(res.data.room);
        setMsgs(res.data.room.msgs);
      })
      .catch((e) => {
        console.log(e.response.data);
        if (e.response.status === 404 || e.response.status === 401) {
          window.location.pathname = "/404";
        }
      });
  }, []);
  function sendRoomMsg() {
    setLoading(true);
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
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
        setNewMsgInput("");
        setLoading(false);
      })
      .catch((e) => {
        console.log(e);
        setLoading(false);
      });
  }
  return (
    <div className="room-container">
      <Link to={`/room_details/${room._id}`} className="general-top">
        <div className="room-top-one pointer">
          <img src={room.picture} crossOrigin="anonymous" />
        </div>
        <div className="room-top-second pointer">
          <span className="room-room-name">{room.name}</span>
          {room.members && (
            <span className="room-room-metrics f12 w300 gray">
              {`${room.members.length}`} member
              {room.members.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
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
          {showPopUp && <RoomPopUp room_id={roomIdRoute} />}
        </span>
      </Link>
      <div className="room-middle scrollbar">
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
          <textarea
            className="message-box"
            placeholder="Enter message"
            onInput={(e) => setNewMsgInput(e.target.value)}
          ></textarea>
          {newMsgInput && (
            <div className="message-box-send pos-relative">
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
      </div>
    </div>
  );
};

export default Room;
