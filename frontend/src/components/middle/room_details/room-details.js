import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Spinner } from "../../loading-spinner/spinner";
import { AlertContext } from "../../contexts/alert";
import axios from "axios";
import "./room-details.css";
import { getFilePath, imageUpload } from "../../utils";
import { BackButton } from "../general/general";
import { decode } from "html-entities";

const UpdateRoomInfo = ({ room }) => {
  // room name ref
  let name = useRef(null);
  // room topics ref
  let topics = useRef(null);
  // room description ref
  let description = useRef(null);
  const [loading, setLoading] = useState(false);
  // temporary image file object for room picture
  const [tempPicture, setTempPicture] = useState("");
  // temporary room picture image file path(src) for display
  const [displayImg, setDisplayImg] = useState("");
  // for errors in validating topics input
  const [topicError, setTopicError] = useState("");
  // flash messages
  const { setAlert } = useContext(AlertContext);
  // main user object
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };
  /**
   * validates topics input to ensure it containes only a-z, A-Z ,hyphen(-) and comma(,)
   * @param string string to validate
   * @return true or false
   */
  function checkTopic(string) {
    if (/([^a-zA-Z-,]+)/g.test(string)) {
      setTopicError("only alphabets(a-z) and underscores(_) allowed");
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
  // triggers room update depending on whether room picture needs uploading too
  const updateRoomFxn = () => {
    // turn on loading spinner
    setLoading(true);
    if (!checkTopic(topics.current.value)) {
      setLoading(false);
      return;
    }
    if (tempPicture.name) {
      // image upload to cloudinary, returns url string
      imageUpload(tempPicture, "room", room._id)
        .then((newRoomPicture) => {
          updateRoom(newRoomPicture);
        })
        .catch((e) => {
          // turn off loading spinner
          setLoading(false);
          console.log(e.response);
          setAlert({
            text: "Could not upload image",
            active: true,
            type: "error",
          });
          return;
        });
    } else {
      updateRoom();
    }
    /**
     * updates room info via api
     * @param string newRoomPicture new room pictur url.
     */
    function updateRoom(newRoomPicture = "") {
      axios
        .post(
          "/api/update_room",
          {
            room_id: room._id,
            payload: {
              name: name.current.value || decode(room.name),
              topics: topics.current.value
                ? arrayfy(topics.current.value)
                : room.topics,
              description: description.current.value || room.description,
              picture: newRoomPicture || room.picture,
            },
          },
          config
        )
        .then((res) => {
          // turn off loading state
          setLoading(false); // trigger flash message
          setAlert({
            text: "room updated successfully",
            active: true,
            type: "success",
          });
          window.location.reload();
        })
        .catch((e) => {
          console.log(e.response.data);
          // turn off loading state
          setLoading(false);
          // trigger flash message
          setAlert({
            text: "Something went wrong",
            active: true,
            type: "error",
          });
        });
    }
  };
  return (
    <div className="settings-container">
      <div className="settings-form">
        <div className="settings-field-picture-container pos-relative">
          <input
            type="file"
            id="image-input"
            className="hide"
            onChange={(e) => {
              setTempPicture(e.target.files[0]);
              setDisplayImg(getFilePath(e.target.files[0]));
            }}
          />

          <label
            htmlFor="image-input"
            className="settings-field-picture pos-absolute pointer"
          >
            <img src={displayImg || room.picture} crossOrigin="anonymous" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="48"
              width="48"
              viewBox="0 0 48 48"
              className="settings-field-picture-edit"
            >
              <path d="M39.7 14.7 33.3 8.3 35.4 6.2Q36.25 5.35 37.525 5.375Q38.8 5.4 39.65 6.25L41.8 8.4Q42.65 9.25 42.65 10.5Q42.65 11.75 41.8 12.6ZM37.6 16.8 12.4 42H6V35.6L31.2 10.4Z" />
            </svg>
          </label>
        </div>
        <div className="settings-field">
          <span className="settings-label">Room Name</span>
          <input defaultValue={decode(room.name)} ref={name}></input>
        </div>
        <div className="settings-field">
          <span className="red f12 w300">{topicError}</span>
          <span className="settings-label">Topics</span>
          <input
            defaultValue={room.topics && room.topics.toString()}
            ref={topics}
            onInput={(e) => checkTopic(e.target.value)}
          ></input>
        </div>
        <div className="settings-field">
          <span className="settings-label">Description</span>
          <textarea
            defaultValue={decode(room.description)}
            ref={description}
          ></textarea>
        </div>
        <div
          className="settings-submit pointer pos-relative"
          onClick={updateRoomFxn}
        >
          {loading && <Spinner />}
          Update
        </div>
      </div>
    </div>
  );
};
const RoomInfo = ({ room, currentUser }) => {
  // for copying room link
  const [copyText, setCopyText] = useState("Copy Room Link");
  useEffect(() => {
    // reset copy link text after click/copy
    setTimeout(() => {
      setCopyText("Copy Room Link");
    }, 5000);
  }, [copyText]);

  return (
    <>
      {
        // if main user is the host render room update form
        room.host && room.host.username === currentUser ? (
          <UpdateRoomInfo room={room} />
        ) : (
          // else render bare room info
          <div className="room-info-container">
            <div className="room-details-one">
              <img src={room.picture} crossOrigin="anonymous" />
            </div>
            <p className="room-info-item w300">
              <span>Room Name:</span>
              {decode(room.name)}
            </p>
            <p className="room-info-item w300">
              <span>Topics:</span>
              {room.topics && room.topics.toString()}
            </p>
            <p className="room-info-item w300">
              <span>Description:</span>
              {room.description}
            </p>
            <span
              className="secondary-button pointer room-detail-bouncy-cta"
              onClick={() => {
                // copy room link to clipboard
                navigator.clipboard.writeText(
                  `${window.location.host}/room/${room._id}`
                );
                setCopyText("Copied");
              }}
            >
              {copyText}
            </span>
          </div>
        )
      }
    </>
  );
};
// for participants tab
const Participants = ({ room, currentUser, setRoom }) => {
  // for flash messages
  const { setAlert } = useContext(AlertContext);
  const [loading, setLoading] = useState(false);
  // for adding/removing users to room via username
  const [username, setUsername] = useState("");
  let userLocal = JSON.parse(sessionStorage.getItem("user"));

  /**
   * adds user to room (for hosts only)
   */
  const addUser = () => {
    setLoading(true);
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    // if username is not empty
    username &&
      axios
        .get(`/api/add_member?room_id=${room._id}&username=${username}`, config)
        .then((res) => {
          // triggger flash message
          setAlert({
            text: "user added successfully",
            active: true,
            type: "success",
          });
          // reload to reflect newly added user
          window.location.reload();
          // turn off loading spinner
          setLoading(false);
        })
        .catch((e) => {
          // triggger flash message
          setAlert({
            text: `${e.response.data.status}` || "Something went wrong",
            active: true,
            type: "error",
          });
          // turn off loading spinner
          setLoading(false);
          console.log(e.response.data.status);
        });
  };
  /**
   * removes user to room (for hosts only)
   */
  const removeUser = (username) => {
    // trigger loading spinner
    setLoading(true);
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    username &&
      axios
        .get(
          `/api/remove_member?room_id=${room._id}&username=${username}`,
          config
        )
        .then((res) => {
          // trigger flash message
          setAlert({
            text: "removed " + username,
            active: true,
            type: "success",
          });
          // get new memebrs array excluding removed user
          let newMembers = room.members.filter(
            (user) => user.username !== username
          );
          room.members = newMembers;
          // update room object state
          setRoom(room);
          setLoading(false);
        })
        .catch((e) => {
          // trigger flash message
          setAlert({
            text: `${e.response.data.status}` || "Something went wrong",
            active: true,
            type: "error",
          });
          // turn off loading spinner
          setLoading(false);
          console.log(e.response.data.status);
        });
  };
  return (
    <div className="room-participants-container">
      {
        //only hosts can add users
        room.host.username === currentUser && (
          <div className="room-participants-item">
            <input
              className=" room-participant-add bg-gray-blue pad-10 m-left-auto light-gray"
              placeholder="add participant by username"
              onInput={(e) => setUsername(e.target.value)}
            ></input>
            <span
              className="primary-button m-left-auto pos-relative pointer"
              onClick={addUser}
            >
              Add {loading == true && <Spinner />}
            </span>
          </div>
        )
      }
      {room.members.map((user) => (
        <div className="room-participants-item" key={user._id}>
          <Link to={`/profile/${user.username}`}>
            <img src={user.picture} crossOrigin="anonymous" />
          </Link>
          <Link to={`/profile/${user.username}`}>
            <span>{user.username}</span>
          </Link>
          {
            //signify your account
            currentUser === user.username && (
              <span className="m-bottom-auto w300 f12 pad-10 green">you</span>
            )
          }
          {
            //omly hosts can remove users
            room.host.username === currentUser && currentUser !== user.username && (
              <span
                className="room-participants-item-cta pointer bg-red dark pos-relative"
                onClick={() => removeUser(user.username)}
              >
                Remove {loading === user.username && <Spinner />}
              </span>
            )
          }
          {
            //signify room host
            room.host.username === user.username && (
              <span className="no-margin secondary-button w300 f12 m-left-auto">
                Host
              </span>
            )
          }
        </div>
      ))}
    </div>
  );
};

const RoomDetails = () => {
  // room info & participants tab state
  const [tab, setTab] = useState(true);
  // room_id from params
  const { roomIdRoute } = useParams();
  // room object state
  const [room, setRoom] = useState([]);
  let userLocal = JSON.parse(sessionStorage.getItem("user"));

  // fetch room details on mount
  useEffect(() => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    // fetch room api
    axios
      .get(`/api/room?id=${roomIdRoute}`, config)
      .then((res) => {
        setRoom(res.data.room);
      })
      .catch((e) => {
        console.log(e.response.data);
        if (e.response.status === 404 || e.response.status === 401) {
          window.location.pathname = "/404";
        }
      });
  }, []);

  return (
    <div className="general-container">
      <div className="general-top uppercase">
        <BackButton />
        ROOM DETAILS
      </div>
      <div className="general-body scrollbar">
        <div className="room-details-container">
          <div className="room-details-two gray">
            <div className="room-details-two-tabs">
              <p
                onClick={() => setTab(true)}
                className={`pointer ${tab && "active"}`}
              >
                INFO
              </p>
              <p
                className={`pointer ${!tab && "active"}`}
                onClick={() => setTab(false)}
              >
                PARTICIPANTS{" "}
                <span>({room.members && room.members.length})</span>
              </p>
            </div>
            <div className="room-details-two-body">
              {tab ? (
                <RoomInfo room={room} currentUser={userLocal.username} />
              ) : (
                <Participants
                  room={room}
                  currentUser={userLocal.username}
                  setRoom={setRoom}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
