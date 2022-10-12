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
import { BackButton } from "../general/general";
import { decode } from "html-entities";

/**
 *renders direct messages between main user and target user
 */
const DM = () => {
  // username string after /dm/....
  const { usernameRoute } = useParams();
  // for flash messages
  const { setAlert } = useContext(AlertContext);
  // socket io client object
  const { socket } = useContext(SocketContext);
  // notification utilities
  const { updateNotif } = useContext(DMListContext);
  // for message input field
  const inputBox = useRef(null);
  // for scroll to bottom feature
  const messagesEndRef = useRef(null);
  // for old msgs
  const [msgs, setMsgs] = useState([]);
  // for incoming mesages from socket io
  const [newMsgs, setNewMsgs] = useState([]);
  // target user object
  const [targetLocal, setTargetLocal] = useState([]);
  // latest date target user viewed main user's dm
  const [targetDMLastSeen, setTargetDMLastSeen] = useState(0);
  // update date target user viewed main user's dm
  const [targetDMLastSeenNew, setTargetDMLastSeenNew] = useState(0);
  // if third party/target user is online
  const [isOnline, setIsOnline] = useState("");
  // loading state for send message button
  const [loading, setLoading] = useState(false);
  // whether still fetching room object data
  const [fetching, setFetching] = useState(true);
  // message input state
  const [newMsgInput, setNewMsgInput] = useState("");
  // to store interval id used to check online status and "read" status
  const intervalRef = useRef(null);

  // local user object
  let userLocal = JSON.parse(sessionStorage.getItem("user"));

  /**
   * scrolls to bottom of page where messagesEndRef was placed
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * check if target username is still in the online in server via socket.io
   * check if target username is currently viewing main user's screen in server via socket.io
   */
  const getOnlineStatus = () => {
    // check if target user is online or currently viewing main users dm every 2 seconds
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
  /**
   * update last seen on main user's activity via socket.io
   */
  const lastSeen = () => {
    socket.emit("lastSeen", {
      isRoom: false,
      targetUsernameOrId: usernameRoute,
      mainUsername: userLocal.username,
    });
  };
  useEffect(() => {
    getOnlineStatus();
    lastSeen();
    // update dm notification
    updateNotif(usernameRoute);
    socket.emit("currentScreen", {
      username: userLocal.username,
      target: usernameRoute,
    });
    //on unmount-->update lastseen, clear interval,
    return () => {
      lastSeen();
      clearInterval(intervalRef.current);
      // remove target username from current screen object in server
      socket.emit("currentScreen", {
        username: userLocal.username,
        target: "",
      });
    };
  }, []);

  // scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  });

  useEffect(() => {
    socket.on("error", function (err) {
      if (err.description) console.log(err.description);
      else console.log(err);
    });
    socket.on("isOnlineResult", function (data) {
      if (data) {
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    });

    socket.on("targetIsReading", function (data) {
      // if targetIsReading data===true, update last seen i.e "read"
      if (data) {
        setTargetDMLastSeenNew(Date.now());
      }
    });
    socket.on("receive_message", (data) => {
      setNewMsgs((newMsgs) => [...newMsgs, data]);
    });
  }, [socket]);

  // send msg to both main user and target user via socket .io
  const sendMsgIO = (msg) => {
    socket.emit("send_message", {
      message: msg,
      target: usernameRoute,
    });
  };

  // get all dms btween main user and target user on mo  unt
  useEffect(() => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    // api to get all dms btween main user and target user
    axios
      .get(`/api/dm?target=${usernameRoute}`, config)
      .then((res) => {
        setFetching(false);
        setMsgs(res.data.DmMsgs);
        setTargetLocal(res.data.targetUserObj);
        let lastseenIndex = res.data.targetUserObj.dms.findIndex(
          (e) => e[0] === userLocal.username
        );
        if (lastseenIndex > -1) {
          setTargetDMLastSeen(res.data.targetUserObj.dms[lastseenIndex][1]);
        }
      })
      .catch((e) => {
        // turn off fetching state
        setFetching(false);
        console.log(e.response.data);
        // if target user is not found redirect to page 404
        if (e.response.status === 404) {
          window.location.pathname = "/404";
        }
      });
  }, []);

  /**
   * send message (database)
   */
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
    // api to post message
    axios
      .post(`/api/dm`, body, config)
      .then((res) => {
        let dmMsgs = newMsgs;
        dmMsgs.push(res.data.DmMsg);
        // reset message input state
        setNewMsgInput("");
        // reset message input field
        inputBox.current.value = "";
        sendMsgIO(res.data.DmMsg);
        setLoading(false);
      })
      .catch((e) => {
        console.log(e.response.data);
        // error flash message
        setAlert({ text: e.response.data, type: "error", active: true });
        // turn off loading spinner
        setLoading(false);
        // reset message input field
        inputBox.current.value = "";
        inputBox.current.value = "";
      });
  }
  return (
    <div className="dm-container">
      <Link to={`/profile/${usernameRoute}`} className="general-top">
        <BackButton />
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
          !msgs[0] && !newMsgs[0] && <NoResult text="No Direct Messages Yet" />
        )}
        {msgs.map((msg) => {
          // if message is from main user
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
          // else if message from target user
          return <ChatBubbleDM msg={msg} key={msg._id} />;
        })}
        {/* for new/incoming messages from socket.io */}
        {newMsgs.map((msg) => {
          // if message is from main user
          if (msg.from === userLocal.username) {
            return (
              <ChatBubbleMe
                msg={msg}
                key={msg.date}
                state={targetDMLastSeenNew > msg.date ? "read" : ""}
              />
            );
          }
          // else if message from target user
          return <ChatBubbleDM msg={msg} key={msg._id} />;
        })}
        {/* intentionally placed down here for scroll to bottom functionality */}
        <span ref={messagesEndRef} />
      </div>
      <div className="dm-bottom">
        <div className="message-box-container">
          <textarea
            className="message-box"
            placeholder="Enter message"
            ref={inputBox}
            // update message input state
            onInput={(e) => setNewMsgInput(e.target.value)}
          ></textarea>
          {
            // send message button - only shows when input field is not empty
            newMsgInput && (
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
            )
          }
        </div>
      </div>
    </div>
  );
};

export default DM;
