import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Spinner } from "../../loading-spinner/spinner";
import { AlertContext } from "../../contexts/alert";
import axios from "axios";
import "./room-details.css";
import { getFilePath, imageUpload } from "../../utils";

const UpdateRoomInfo = ({ room }) => {
  let name = useRef(null);
  let topics = useRef(null);
  let description = useRef(null);
  const [loading, setLoading] = useState(false);
  const [tempPicture, setTempPicture] = useState("");
  const [displayImg, setDisplayImg] = useState("");
  const [topicError, setTopicError] = useState("");
  const { setAlert } = useContext(AlertContext);
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };
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
  const updateRoom = () => {
    setLoading(true);
    if (!checkTopic(topics.current.value)) {
      setLoading(false);
      return;
    }
    if (tempPicture.name) {
      imageUpload(tempPicture, "room", room._id)
        .then((newRoomPicture) => {
          updateRoom(newRoomPicture);
        })
        .catch((e) => {
          console.log(e);
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
    function updateRoom(newRoomPicture = "") {
      console.log("newRoomPicture", newRoomPicture);
      axios
        .post(
          "/api/update_room",
          {
            room_id: room._id,
            payload: {
              name: name.current.value || room.name,
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
          setLoading(false);
          setAlert({
            text: "room updated successfully",
            active: true,
            type: "success",
          });
          window.location.reload();
        })
        .catch((e) => {
          console.log(e.response.data, room._id);
          setLoading(false);
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
          <input defaultValue={room.name} ref={name}></input>
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
            defaultValue={room.description}
            ref={description}
          ></textarea>
        </div>
        <div
          className="settings-submit pointer pos-relative"
          onClick={updateRoom}
        >
          {loading && <Spinner />}
          Update
        </div>
      </div>
    </div>
  );
};
const RoomInfo = ({ room, currentUser }) => {
  const [copyText, setCopyText] = useState("Copy Room Link");
  useEffect(() => {
    setTimeout(() => {
      setCopyText("Copy Room Link");
    }, 5000);
  }, [copyText]);

  return (
    <>
      {room.host && room.host.username === currentUser ? (
        <UpdateRoomInfo room={room} />
      ) : (
        <div className="room-info-container">
          <div className="room-details-one">
            <img src={room.picture} crossOrigin="anonymous" />
          </div>
          <p className="room-info-item w300">
            <span>Room Name:</span>
            {room.name}
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
              navigator.clipboard.writeText(
                `${window.location.host}/room/${room._id}`
              );
              setCopyText("Copied");
            }}
          >
            {copyText}
          </span>
        </div>
      )}
    </>
  );
};
const Participants = ({ room, currentUser, setRoom }) => {
  const { setAlert } = useContext(AlertContext);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState([]);
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const addUser = () => {
    setLoading(true);
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    username &&
      axios
        .get(`/api/add_member?room_id=${room._id}&username=${username}`, config)
        .then((res) => {
          setAlert({
            text: "user added successfully",
            active: true,
            type: "success",
          });
          window.location.reload();
          setLoading(false);
        })
        .catch((e) => {
          setAlert({
            text: `${e.response.data.status}` || "Something went wrong",
            active: true,
            type: "error",
          });
          setLoading(false);
          console.log(e.response.data.status);
        });
  };
  const removeUser = (username) => {
    setLoading(username);
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
          setAlert({
            text: "removed " + username,
            active: true,
            type: "success",
          });
          let newMembers = room.members.filter(
            (user) => user.username !== username
          );
          room.members = newMembers;
          setRoom(room);
          setLoading(false);
        })
        .catch((e) => {
          setAlert({
            text: `${e.response.data.status}` || "Something went wrong",
            active: true,
            type: "error",
          });
          setLoading(false);
          console.log(e.response.data.status);
        });
  };
  return (
    <div className="room-participants-container">
      {room.host.username === currentUser && currentUser !== user.username && (
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
      )}
      {room.members.map((user) => (
        <div className="room-participants-item" key={user._id}>
          <Link to={`/profile/${user.username}`}>
            <img src={user.picture} crossOrigin="anonymous" />
          </Link>
          <Link to={`/profile/${user.username}`}>
            <span>{user.username}</span>
          </Link>
          {room.host.username === currentUser && currentUser !== user.username && (
            <span
              className="room-participants-item-cta pointer bg-red dark pos-relative"
              onClick={() => removeUser(user.username)}
            >
              Remove {loading === user.username && <Spinner />}
            </span>
          )}
          {room.host.username === user.username && (
            <span className="no-margin secondary-button w300 f12 m-left-auto">
              Host
            </span>
          )}
          {currentUser === user.username && (
            <span className="no-margin secondary-button w300 f12 m-left-auto">
              you
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const RoomDetails = () => {
  const [tab, setTab] = useState(true);
  const { roomIdRoute } = useParams();
  const [room, setRoom] = useState([]);
  const [error, setError] = useState([]);
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
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
      <div className="general-top uppercase">ROOM DETAILS</div>
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
