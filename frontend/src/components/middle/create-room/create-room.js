import React, { useRef, useState, useContext } from "react";
import "./create-room.css";
import { getFilePath, imageUpload } from "../../utils";
import { Spinner } from "../../loading-spinner/spinner";
import { AlertContext } from "../../contexts/alert";
import axios from "axios";

/**
 * Dform for creating room
 * @return creates room and redirects to the new room if successful
 */
const CreateRoom = () => {
  // room title/name
  const titleRef = useRef(null);
  // comma seperated string for room topics
  const topicRef = useRef(null);
  // room description
  const descRef = useRef(null);
  // flash messages
  const { alert, setAlert } = useContext(AlertContext);
  const [loading, setLoading] = useState(false);
  // for invalid topic formats
  const [topicError, setTopicError] = useState("");

  /**
   * validates topics input to ensure it containes only a-z, A-Z ,hyphen(-) and comma(,)
   * @param string string to validate
   * @return true or false
   */
  function checkTopic(string) {
    // test against regex, only a-z, A-Z ,hyphen(-) and comma(,) is allowed
    if (/([^a-zA-Z-,]+)/g.test(string)) {
      setTopicError(
        "only alphabets(a-z), hyphens(-) and commas(,) are allowed"
      );
      return false;
    } else {
      setTopicError("");
      return true;
    }
  }

  /**
   * converts comma-seperated strings to array
   * @param string string
   * @return array
   */
  function arrayfy(string) {
    return string.split(",");
  }

  /**
   *creates room and redirects to the new room if successful
   */
  function createRoom() {
    // validate "topics" input
    if (!checkTopic(topicRef.current.value)) {
      return;
    }
    // trigger loading state
    setLoading(true);
    let userLocal = JSON.parse(sessionStorage.getItem("user"));
    let topicArray = arrayfy(topicRef.current.value);
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    // body object for api
    const body = {};
    // if "title" input is not empty
    if (titleRef.current.value) {
      body.name = titleRef.current.value;
    }
    if (topicRef.current.value) {
      body.topics = topicArray;
    }
    if (descRef.current.value) {
      body.description = descRef.current.value;
    }

    // create room api call
    axios
      .post("/api/create_room/", body, config)
      .then((res) => {
        // turn off loading state
        setLoading(false);
        // trigger flash message
        setAlert({
          ...alert,
          type: "success",
          active: true,
          text: "Room successfully created, redirecting to room",
        });
        //redirect to new room
        window.location.pathname = `/room/${res.data.newRoom._id}`;
      })
      .catch((e) => {
        console.log(e.response);
        // turn off loading state
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
