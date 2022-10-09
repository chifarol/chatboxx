import React from "react";
import { Link, useParams } from "react-router-dom";
import "./general.css";
import Profile from "../profile/profile";
import CreateRoom, { UpdateRoom } from "../create-room/create-room";
import Settings from "../settings/settings";
import { DMListings, GroupListings } from "../../listings/listings";
import { Search } from "../../search/search";

export const BackButton = () => {
  return (
    <span onClick={() => window.history.back()} className="pointer">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="48"
        width="48"
        className="back-button"
        viewBox="0 0 30 48"
      >
        <path d="M20 44 0 24 20 4l2.8 2.85L5.65 24 22.8 41.15Z" />
      </svg>
    </span>
  );
};
/**
 * renders the following screen based on parameters:
 *Create Rroom
 *Settings
 *My DMs List
 *My Rooms List
 *Search page
 * @param string type type of component to render.
 * @param string title Components title.
 */
const General = ({ type, title }) => {
  return (
    <div className="general-container">
      <div className="general-top uppercase">
        {type === "profile" && <BackButton />} {title}
      </div>
      <div className="general-body scrollbar">
        {type === "create_room" ? (
          <CreateRoom />
        ) : type === "update_room" ? (
          <UpdateRoom />
        ) : type === "my_settings" ? (
          <Settings />
        ) : type === "my_rooms" ? (
          <GroupListings />
        ) : type === "my_dms" ? (
          <DMListings />
        ) : type === "search" ? (
          <Search />
        ) : (
          <Search />
        )}
      </div>
    </div>
  );
};

export default General;
