import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getDateTimeString } from "../utils";
import "./chat-bubble.css";
import AlertContext from "../contexts/alert";
import { Spinner } from "../loading-spinner/spinner";

export const MsgState = ({ state }) =>
  state === "pending" ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="48"
      width="48"
      viewBox="0 0 48 48"
    >
      <path d="M13.3 26.5q1.05 0 1.775-.725.725-.725.725-1.775 0-1.05-.725-1.775-.725-.725-1.775-.725-1.05 0-1.775.725Q10.8 22.95 10.8 24q0 1.05.725 1.775.725.725 1.775.725Zm10.7 0q1.05 0 1.775-.725.725-.725.725-1.775 0-1.05-.725-1.775Q25.05 21.5 24 21.5q-1.05 0-1.775.725Q21.5 22.95 21.5 24q0 1.05.725 1.775.725.725 1.775.725Zm10.65 0q1.05 0 1.775-.725.725-.725.725-1.775 0-1.05-.725-1.775-.725-.725-1.775-.725-1.05 0-1.775.725-.725.725-.725 1.775 0 1.05.725 1.775.725.725 1.775.725ZM24 44q-4.1 0-7.75-1.575-3.65-1.575-6.375-4.3-2.725-2.725-4.3-6.375Q4 28.1 4 23.95q0-4.1 1.575-7.75 1.575-3.65 4.3-6.35 2.725-2.7 6.375-4.275Q19.9 4 24.05 4q4.1 0 7.75 1.575 3.65 1.575 6.35 4.275 2.7 2.7 4.275 6.35Q44 19.85 44 24q0 4.1-1.575 7.75-1.575 3.65-4.275 6.375t-6.35 4.3Q28.15 44 24 44Z" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="48"
      width="48"
      viewBox="0 0 48 48"
      className={state === "read" ? "received" : ""}
    >
      <path d="M21.05 33.1 35.2 18.95l-2.3-2.25-11.85 11.85-6-6-2.25 2.25ZM24 44q-4.1 0-7.75-1.575-3.65-1.575-6.375-4.3-2.725-2.725-4.3-6.375Q4 28.1 4 24q0-4.15 1.575-7.8 1.575-3.65 4.3-6.35 2.725-2.7 6.375-4.275Q19.9 4 24 4q4.15 0 7.8 1.575 3.65 1.575 6.35 4.275 2.7 2.7 4.275 6.35Q44 19.85 44 24q0 4.1-1.575 7.75-1.575 3.65-4.275 6.375t-6.35 4.3Q28.15 44 24 44Z" />
    </svg>
  );
export const ChatBubbleGroupInfo = ({ msg }) => {
  return (
    <div className="chat-bubble-info-container center">
      <hr className="chat-bubble-info-divider" />
      <span className="chat-bubble-info bg-gray f12 w300 center">
        {msg.body}
      </span>
      <hr className="chat-bubble-info-divider" />
    </div>
  );
};
const ChatBubble = ({ msg }) => {
  return (
    <>
      {!msg.active ? (
        <ChatDeleted />
      ) : (
        <div className="chat-bubble-container">
          <Link
            className="chat-bubble-image"
            to={`/profile/${msg.author.username}`}
          >
            <img src={msg.author.picture} crossOrigin="anonymous" />
          </Link>
          <div className="chat-bubble-message">
            <div className="chat-bubble-message-text w300">{msg.body}</div>
            <div className="chat-bubble-message-info">
              <span className="chat-bubble-message-info-time f12">
                {getDateTimeString(msg.date, "HrMin")}
              </span>
            </div>

            <div className="chat-bubble-polygon"></div>
          </div>
        </div>
      )}
    </>
  );
};
export const ChatBubbleDM = ({ msg }) => {
  return (
    <>
      {!msg.active ? (
        <ChatDeleted />
      ) : (
        <div className="chat-bubble-group-container">
          <div className="chat-bubble-message">
            <div className="chat-bubble-message-text w300">{msg.body}</div>
            <div className="chat-bubble-message-info">
              <span className="chat-bubble-message-info-time f12">
                {getDateTimeString(msg.date, "HrMin")}
              </span>
            </div>

            <div className="chat-bubble-polygon"></div>
          </div>
        </div>
      )}
    </>
  );
};
export const ChatDeleted = ({ msg }) => (
  <div className="chat-bubble-deleted-container bg-purple gray f12 italic w300 pos-relative">
    <span>deleted by author</span>
    <div className="chat-bubble-polygon"></div>
  </div>
);
export const ChatDeletedMe = ({ msg }) => (
  <div className="chat-bubble-me-deleted-container bg-dark gray f12 italic w300 pos-relative">
    <span>You deleted this message</span>
    <div className="chat-bubble-me-polygon"></div>
  </div>
);

export const ChatBubbleMe = ({ isRoom = false, id, msg }) => {
  const [showPopUp, setShowPopUp] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { alert, setAlert } = useContext(AlertContext);
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };
  function deleteMsg() {
    console.log("chatBubbleMe props", isRoom, msg._id, id);
    setLoading(true);
    if (isRoom === "true") {
      console.log("deleting room message");
      axios
        .post(`/api/room_message`, { msg_id: msg._id, room_id: id }, config)
        .then((res) => {
          console.log(res);
          if (!res.data.status) {
            console.log("res.data.status", res.data.status);
            setAlert({
              text: "sorry, couldn't delete message",
              type: "error",
              active: true,
            });
            setLoading(false);
          } else {
            console.log("res.data.status", res.data.status);
            setAlert({
              text: "message deleted",
              type: "success",
              active: true,
            });
            setLoading(false);
            setDeleted(true);
          }
        })
        .catch((e) => {
          console.log(e.response.data);
          setAlert({
            text: "sorry, couldn't delete message",
            type: "error",
            active: true,
          });
          setLoading(false);
        });
    } else {
      axios
        .post("/api/delete_dm", { msg_id: msg._id }, config)
        .then((res) => {
          console.log(res);
          setAlert({
            text: "message deleted",
            type: "success",
            active: true,
          });
          setLoading(false);
          setDeleted(true);
        })
        .catch((e) => {
          console.log(e.response.data);
          setAlert({
            text: "sorry, couldn't delete message",
            type: "error",
            active: true,
          });
          setLoading(false);
        });
    }
  }
  return (
    <>
      {deleted || !msg.active ? (
        <ChatDeletedMe />
      ) : (
        <div className={`chat-bubble-me-container`}>
          <div className="chat-bubble-me-message">
            <div className="chat-bubble-message-text w300">
              {!deleted ? msg.body : "message deleted by the author"}
            </div>
            <div className="chat-bubble-message-info pos-relative">
              <span
                className="chat-bubble-message-info-options  pointer"
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
              </span>
              {showPopUp && (
                <span className="chat-bubble-message-option-container light-gray">
                  <span
                    className="chat-bubble-message-option pointer red pos-relative"
                    onClick={() => deleteMsg()}
                  >
                    Delete
                    {loading && <Spinner />}
                  </span>
                </span>
              )}
              <span className="chat-bubble-message-info-time f12">
                {getDateTimeString(msg.date, "HrMin")}
              </span>
              <span className="chat-bubble-message-info-status">
                <MsgState state="" />
              </span>
            </div>

            <div className="chat-bubble-me-polygon"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBubble;
