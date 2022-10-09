import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ChatBubbleDM, ChatBubbleMe } from "../../chat-bubble/chat-bubble";
import "./dm.css";
import { NoResult } from "../../search/search";
import { Spinner } from "../../loading-spinner/spinner";
import { io } from "socket.io-client";
import AlertContext from "../../contexts/alert";
import { SocketContext } from "../../contexts/socket";
import { DMListContext } from "../../contexts/msgs";

const DM = () => {
  const { usernameRoute } = useParams();
  const { setAlert } = useContext(AlertContext);
  const { socket } = useContext(SocketContext);
  const { updateNotif } = useContext(DMListContext);
  const inputBox = useRef(null);
  const messagesEndRef = useRef(null);
  const [msgs, setMsgs] = useState([]);
  const [newMsgs, setNewMsgs] = useState([]);
  const [targetLocal, setTargetLocal] = useState([]);
  const [targetDMLastSeen, setTargetDMLastSeen] = useState(0);
  const [targetDMLastSeenNew, setTargetDMLastSeenNew] = useState(0);
  const [isOnline, setIsOnline] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newMsgInput, setNewMsgInput] = useState("");
  const intervalRef = useRef(null);

  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  let dmMsgsSocket = [];
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getOnlineStatus = () => {
    intervalRef.current = setInterval(() => {
      socket.emit("isOnline", {
        username: userLocal.username,
        target: usernameRoute,
      });
      socket.emit("isTargetReading", {
        username: userLocal.username,
        target: usernameRoute,
      });
    }, 2000);
  };
  const lastSeen = () => {
    console.log("you now in dm screen");
    socket.emit("lastSeen", {
      isRoom: false,
      targetUsernameOrId: usernameRoute,
      mainUsername: userLocal.username,
    });
  };
  useEffect(() => {
    getOnlineStatus();
    lastSeen();
    updateNotif(usernameRoute);
    socket.emit("currentScreen", {
      username: userLocal.username,
      target: usernameRoute,
    });
    return () => {
      lastSeen();
      clearInterval(intervalRef.current);
      socket.emit("currentScreen", {
        username: userLocal.username,
        target: "",
      });
    };
  }, []);
  useEffect(() => {
    scrollToBottom();
  });

  useEffect(() => {
    socket.on("error", function (err) {
      if (err.description) console.log(err.description);
      else console.log(err); // Or whatever you want to do
    });
    socket.on("isOnlineResult", function (data) {
      console.log(`${usernameRoute} online status ${data}`);
      if (data) {
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    });
    socket.on("targetIsReading", function (data) {
      console.log(`${usernameRoute} IsReading status ${data}`);
      if (data) {
        setTargetDMLastSeenNew(Date.now());
      }
    });
    socket.on("receive_message", (data) => {
      setNewMsgs((newMsgs) => [...newMsgs, data]);
      console.log(
        "received message",
        data,
        "older msgs",
        dmMsgsSocket,
        "main msgs",
        msgs
      );
    });
  }, [socket]);
  const sendMsgIO = (msg) => {
    socket.emit("send_message", {
      message: msg,
      target: usernameRoute,
    });
  };

  useEffect(() => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    axios
      .get(`/api/dm?target=${usernameRoute}`, config)
      .then((res) => {
        setFetching(false);
        console.log("usernameRoute dm object", res.data);
        setMsgs(res.data.DmMsgs);
        setTargetLocal(res.data.targetUserObj);
        let lastseenIndex = res.data.targetUserObj.dms.findIndex(
          (e) => e[0] === userLocal.username
        );
        console.log("lastseenIndex", lastseenIndex);
        console.log("lastseen", res.data.targetUserObj.dms[lastseenIndex][1]);
        if (lastseenIndex > -1) {
          setTargetDMLastSeen(res.data.targetUserObj.dms[lastseenIndex][1]);
        }
      })
      .catch((e) => {
        setFetching(false);
        console.log(e.response.data);
        if (e.response.status === 404) {
          window.location.pathname = "/404";
        }
      });
  }, []);
  function sendDMMsg() {
    setLoading(true);
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    let body = {
      target: usernameRoute,
      body: newMsgInput,
    };
    axios
      .post(`/api/dm`, body, config)
      .then((res) => {
        console.log("usernameRoute", usernameRoute);
        let dmMsgs = newMsgs;
        dmMsgs.push(res.data.DmMsg);
        console.log("updated msg array", dmMsgs);
        setNewMsgInput("");
        inputBox.current.value = "";
        sendMsgIO(res.data.DmMsg);
        setLoading(false);
      })
      .catch((e) => {
        console.log(e.response.data);
        setAlert({ text: e.response.data, type: "error", active: true });
        setLoading(false);
        inputBox.current.value = "";
      });
  }
  return (
    <div className="dm-container">
      <Link to={`/profile/${usernameRoute}`} className="general-top">
        <div className="dm-top-one pointer">
          <img src={targetLocal.picture} crossOrigin="anonymous" />
        </div>
        <div className="dm-top-second pointer">
          <span className="dm-room-name">{usernameRoute}</span>
          {isOnline === true ? (
            <span className="dm-room-metrics f12 w300 gray green">online</span>
          ) : isOnline === false ? (
            <span className="dm-room-metrics f12 w300 gray">offline</span>
          ) : (
            "..."
          )}
        </div>
      </Link>
      <div className="dm-middle scrollbar">
        {fetching ? (
          <span className="pos-relative center">
            <Spinner />
          </span>
        ) : (
          !msgs[0] && <NoResult text="No Direct Messages Yet" />
        )}
        {msgs.map((msg) => {
          if (msg.from === userLocal.username) {
            return (
              <ChatBubbleMe
                msg={msg}
                key={msg._id}
                state={
                  targetDMLastSeen > msg.date || targetDMLastSeenNew
                    ? "read"
                    : ""
                }
              />
            );
          }
          return <ChatBubbleDM msg={msg} key={msg._id} />;
        })}
        {newMsgs.map((msg) => {
          if (msg.from === userLocal.username) {
            return (
              <ChatBubbleMe
                msg={msg}
                key={msg.date}
                state={targetDMLastSeenNew > msg.date ? "read" : ""}
              />
            );
          }
          return <ChatBubbleDM msg={msg} key={msg._id} />;
        })}
        <span ref={messagesEndRef} />
      </div>
      <div className="dm-bottom">
        <div className="message-box-container">
          <textarea
            className="message-box"
            placeholder="Enter message"
            ref={inputBox}
            onInput={(e) => setNewMsgInput(e.target.value)}
          ></textarea>
          {newMsgInput && (
            <div
              className="message-box-send pos-relative pointer"
              onClick={sendDMMsg}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="48"
                width="48"
                viewBox="0 0 48 48"
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

export default DM;
