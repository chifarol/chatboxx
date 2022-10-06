import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { BackButton } from "../general/general";
import { Spinner } from "../../loading-spinner/spinner";
import "./profile.css";

const Profile = () => {
  const { usernameRoute } = useParams();
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  let [loading, setLoading] = useState(true);
  let [invalidUser, setInvalidUser] = useState(false);
  let [user, setUser] = useState({});
  useEffect(() => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    axios
      .get(`/api/user?username=${usernameRoute}`, config)
      .then((res) => {
        setLoading(false);
        setUser(res.data.user);
      })
      .catch((e) => {
        setLoading(false);
        setInvalidUser(true);
      });
  }, []);

  return (
    <div className="general-container">
      <div className="general-top uppercase">
        <BackButton /> PROFILE
      </div>
      {loading && (
        <div className="pos-relative">
          <Spinner />
        </div>
      )}
      {invalidUser ? (
        <p className="gray center">Username:{usernameRoute} doesnt exist</p>
      ) : (
        <div className="general-body scrollbar">
          <div className="profile-container">
            <div className="profile-one">
              <img
                src={user.picture}
                crossOrigin="anonymous"
                className="bg-gray"
              />
            </div>
            <div className="profile-two gray">
              <p className="profile-two-info w300">
                <span>Username:</span>
                {user.username}
              </p>
              <p className="profile-two-info w300">
                <span>Email:</span>
                {user.email}
              </p>
              <p className="profile-two-info w300">
                <span>Bio:</span>
                {user.bio ? user.bio : "-"}
              </p>
              {user.username !== userLocal.username && (
                <Link
                  to={`/dm/${user.username}`}
                  className="secondary-button pointer"
                >
                  Message
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
