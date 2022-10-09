import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { BackButton } from "../general/general";
import { Spinner } from "../../loading-spinner/spinner";
import "./profile.css";

/**
 * component to render user profile page
 */
const Profile = () => {
  // username string after /profile/<username>
  const { usernameRoute } = useParams();
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  let [loading, setLoading] = useState(true);
  // for user not found error
  let [invalidUser, setInvalidUser] = useState(false);
  // for user object
  let [user, setUser] = useState({});

  // on mount, fetch user data
  useEffect(() => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        auth: userLocal.token,
      },
    };
    // api to fetch user data
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
