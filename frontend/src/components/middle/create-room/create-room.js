import React, { useRef, useState, useContext } from "react";
import "./create-room.css";
import { getFilePath, imageUpload } from "../../utils";
import { Spinner } from "../../loading-spinner/spinner";
import { AlertContext } from "../../contexts/alert";
import axios from "axios";

export const UpdateRoom = () => {
  return (
    <div className="create-room-container">
      <div className="create-room-form">
        <div className="create-room-field">
          <span className="create-room-label">TITLE</span>
          <input type="text" />
        </div>
        <div className="create-room-field">
          <span className="create-room-label">TOPIC</span>
          <input type="text" />
          <span className="create-room-extra f12 pointer w300">
            Choose from exisiting topics
          </span>
        </div>
        <div className="create-room-field">
          <span className="create-room-label">DESCRIPTION</span>
          <textarea></textarea>
        </div>
        <div className="create-room-field">
          <span className="create-room-label">ROOM PICTURE</span>
          <input type="file" id="image-input" className="hide" />
          <div className="pos-relative">
            <input type="text" />
            <label
              htmlFor="image-input"
              className="create-room-button pos-absolute pointer"
            >
              Change Picture
            </label>
          </div>
        </div>
        <div className="create-room-submit pointer">Update</div>
      </div>
    </div>
  );
};
const CreateRoom = () => {
  const titleRef = useRef(null);
  const topicRef = useRef(null);
  const descRef = useRef(null);
  const { alert, setAlert } = useContext(AlertContext);
  const [loading, setLoading] = useState(false);
  const [topicError, setTopicError] = useState("");
  function checkTopic(string) {
    if (/([^a-zA-Z-,]+)/g.test(string)) {
      console.log("invalid topic");
      setTopicError("only alphabets(a-z) and underscores(_) allowed");
      return false;
    } else {
      console.log("valid topic");
      setTopicError("");
      return true;
    }
  }
  function arrayfy(string) {
    return string.split(",");
  }
  function createRoom() {
    if (!checkTopic(topicRef.current.value)) {
      return;
    }
    setLoading(true);
    let userLocal = JSON.parse(sessionStorage.getItem("user"));
    let topicArray = arrayfy(topicRef.current.value);
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    const body = {};
    if (titleRef.current.value) {
      body.name = titleRef.current.value;
    }
    if (topicRef.current.value) {
      body.topics = topicArray;
    }
    if (descRef.current.value) {
      body.description = descRef.current.value;
    }
    console.log(body);
    axios
      .post("/api/create_room/", body, config)
      .then((res) => {
        console.log(res.data);
        setLoading(false);
        setAlert({
          ...alert,
          type: "success",
          active: true,
          text: "Room successfully created, redirecting to room",
        });
        window.location.pathname = `/room/${res.data.newRoom._id}`;
      })
      .catch((e) => {
        console.log(e);
        setLoading(false);
      });
  }
  return (
    <div className="create-room-container">
      <div className="create-room-form">
        <div className="create-room-field">
          <span className="create-room-label">TITLE</span>
          <input type="text" ref={titleRef} required />
        </div>
        <div className="create-room-field">
          <span className="create-room-label">TOPICS(comma separated)</span>
          <span className="create-room-extra f12 w300 red">{topicError}</span>
          <input
            type="text"
            ref={topicRef}
            onInput={(e) => checkTopic(e.target.value)}
            required
          />
          <span className="create-room-extra underline f12 pointer w300">
            Choose from exisiting topics
          </span>
        </div>
        <div className="create-room-field">
          <span className="create-room-label">DESCRIPTION</span>
          <textarea ref={descRef}></textarea>
        </div>

        <div
          className="create-room-submit pointer pos-relative"
          onClick={createRoom}
        >
          Create Room
          {loading && <Spinner />}
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
