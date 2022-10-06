import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ChatBubbleDM, ChatBubbleMe } from "../../chat-bubble/chat-bubble";
import "./dm.css";
import { NoResult } from "../../search/search";
import { Spinner } from "../../loading-spinner/spinner";
import { io } from "socket.io-client";
import AlertContext from "../../contexts/alert";
import { SocketContext } from "../../contexts/socket";

const DM = () => {
  const { usernameRoute } = useParams();
  const { setAlert } = useContext(AlertContext);
  const { socket, socketId } = useContext(SocketContext);
  const inputBox = useRef(null);
  const messagesEndRef = useRef(null);
  const [msgs, setMsgs] = useState([]);
  const [targetLocal, setTargetLocal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMsgInput, setNewMsgInput] = useState("");

  let userLocal = JSON.parse(sessionStorage.getItem("user"));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const comeOnline = () => {
    console.log("you now in dm screen");
    socket.emit("online", { username: userLocal.username });
  };

  const goOffline = () => {
    socket.emit("offline", { username: userLocal.username });
    // socket.off("receive_message");
  };
  useEffect(() => {
    // comeOnline();
    return () => {
      // goOffline();
    };
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [msgs]);

  const sendMsgIO = (msg) => {
    socket.emit("send_message", {
      message: msg,
      target: targetLocal.username,
    });
  };

  socket.on("receive_message", (data) => {
    let dmMsgs = msgs;
    socket.on("error", function (err) {
      if (err.description) console.log(err.description);
      else console.log(err); // Or whatever you want to do
    });
    console.log("received message", JSON.parse(data), "older msgs", dmMsgs);
    // dmMsgs.push(data);
    // setMsgs(dmMsgs);
  });
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
        console.log("usernameRoute", usernameRoute);
        console.log("usernameRoute dm object", res.data);
        setMsgs(res.data.DmMsgs);
        setTargetLocal(res.data.targetUserObj);
      })
      .catch((e) => {
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
        let dmMsgs = msgs;
        dmMsgs.push(res.data.DmMsg);
        console.log("updated msg array", dmMsgs);
        setMsgs(dmMsgs);
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
      <div className="general-top">
        <div className="dm-top-one pointer">
          <img src={targetLocal.picture} crossOrigin="anonymous" />
        </div>
        <div className="dm-top-second pointer">
          <span className="dm-room-name">{targetLocal.username}</span>
          <span className="dm-room-metrics f12 w300 gray green">online</span>
        </div>
      </div>
      <div className="dm-middle scrollbar">
        {!msgs[0] && <NoResult text="No Direct Messages Yet" />}
        {msgs.map((msg) => {
          if (msg.from === userLocal.username) {
            return <ChatBubbleMe msg={msg} key={msg._id} />;
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
