import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./search.css";
import { Spinner } from "../loading-spinner/spinner";

export const NoResult = ({ text }) => {
  return (
    <div className="full-illustration-container pos-relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        data-name="Layer 1"
        width="797.5"
        height="834.5"
        viewBox="0 0 797.5 834.5"
        className="full-illustration"
      >
        <title>void</title>
        <ellipse cx="308.5" cy="780" rx="308.5" ry="54.5" fill="#3f3d56" />
        <circle cx="496" cy="301.5" r="301.5" fill="#3f3d56" />
        <circle cx="496" cy="301.5" r="248.89787" opacity="0.05" />
        <circle cx="496" cy="301.5" r="203.99362" opacity="0.05" />
        <circle cx="496" cy="301.5" r="146.25957" opacity="0.05" />
        <path
          d="M398.42029,361.23224s-23.70394,66.72221-13.16886,90.42615,27.21564,46.52995,27.21564,46.52995S406.3216,365.62186,398.42029,361.23224Z"
          transform="translate(-201.25 -32.75)"
          fill="#d0cde1"
        />
        <path
          d="M398.42029,361.23224s-23.70394,66.72221-13.16886,90.42615,27.21564,46.52995,27.21564,46.52995S406.3216,365.62186,398.42029,361.23224Z"
          transform="translate(-201.25 -32.75)"
          opacity="0.1"
        />
        <path
          d="M415.10084,515.74682s-1.75585,16.68055-2.63377,17.55847.87792,2.63377,0,5.26754-1.75585,6.14547,0,7.02339-9.65716,78.13521-9.65716,78.13521-28.09356,36.8728-16.68055,94.81576l3.51169,58.82089s27.21564,1.75585,27.21564-7.90132c0,0-1.75585-11.413-1.75585-16.68055s4.38962-5.26754,1.75585-7.90131-2.63377-4.38962-2.63377-4.38962,4.38961-3.51169,3.51169-4.38962,7.90131-63.2105,7.90131-63.2105,9.65716-9.65716,9.65716-14.92471v-5.26754s4.38962-11.413,4.38962-12.29093,23.70394-54.43127,23.70394-54.43127l9.65716,38.62864,10.53509,55.3092s5.26754,50.04165,15.80262,69.356c0,0,18.4364,63.21051,18.4364,61.45466s30.72733-6.14547,29.84941-14.04678-18.4364-118.5197-18.4364-118.5197L533.62054,513.991Z"
          transform="translate(-201.25 -32.75)"
          fill="#2f2e41"
        />
        <path
          d="M391.3969,772.97846s-23.70394,46.53-7.90131,48.2858,21.94809,1.75585,28.97148-5.26754c3.83968-3.83968,11.61528-8.99134,17.87566-12.87285a23.117,23.117,0,0,0,10.96893-21.98175c-.463-4.29531-2.06792-7.83444-6.01858-8.16366-10.53508-.87792-22.826-10.53508-22.826-10.53508Z"
          transform="translate(-201.25 -32.75)"
          fill="#2f2e41"
        />
        <path
          d="M522.20753,807.21748s-23.70394,46.53-7.90131,48.28581,21.94809,1.75584,28.97148-5.26754c3.83968-3.83969,11.61528-8.99134,17.87566-12.87285a23.117,23.117,0,0,0,10.96893-21.98175c-.463-4.29531-2.06792-7.83444-6.01857-8.16367-10.53509-.87792-22.826-10.53508-22.826-10.53508Z"
          transform="translate(-201.25 -32.75)"
          fill="#2f2e41"
        />
        <circle cx="295.90488" cy="215.43252" r="36.90462" fill="#ffb8b8" />
        <path
          d="M473.43048,260.30832S447.07,308.81154,444.9612,308.81154,492.41,324.62781,492.41,324.62781s13.70743-46.39439,15.81626-50.61206Z"
          transform="translate(-201.25 -32.75)"
          fill="#ffb8b8"
        />
        <path
          d="M513.86726,313.3854s-52.67543-28.97148-57.943-28.09356-61.45466,50.04166-60.57673,70.2339,7.90131,53.55335,7.90131,53.55335,2.63377,93.05991,7.90131,93.93783-.87792,16.68055.87793,16.68055,122.90931,0,123.78724-2.63377S513.86726,313.3854,513.86726,313.3854Z"
          transform="translate(-201.25 -32.75)"
          fill="#d0cde1"
        />
        <path
          d="M543.2777,521.89228s16.68055,50.91958,2.63377,49.16373-20.19224-43.89619-20.19224-43.89619Z"
          transform="translate(-201.25 -32.75)"
          fill="#ffb8b8"
        />
        <path
          d="M498.50359,310.31267s-32.48318,7.02339-27.21563,50.91957,14.9247,87.79237,14.9247,87.79237l32.48318,71.11182,3.51169,13.16886,23.70394-6.14547L528.353,425.32067s-6.14547-108.86253-14.04678-112.37423A33.99966,33.99966,0,0,0,498.50359,310.31267Z"
          transform="translate(-201.25 -32.75)"
          fill="#d0cde1"
        />
        <polygon
          points="277.5 414.958 317.885 486.947 283.86 411.09 277.5 414.958"
          opacity="0.1"
        />
        <path
          d="M533.896,237.31585l.122-2.82012,5.6101,1.39632a6.26971,6.26971,0,0,0-2.5138-4.61513l5.97581-.33413a64.47667,64.47667,0,0,0-43.1245-26.65136c-12.92583-1.87346-27.31837.83756-36.182,10.43045-4.29926,4.653-7.00067,10.57018-8.92232,16.60685-3.53926,11.11821-4.26038,24.3719,3.11964,33.40938,7.5006,9.18513,20.602,10.98439,32.40592,12.12114,4.15328.4,8.50581.77216,12.35457-.83928a29.721,29.721,0,0,0-1.6539-13.03688,8.68665,8.68665,0,0,1-.87879-4.15246c.5247-3.51164,5.20884-4.39635,8.72762-3.9219s7.74984,1.20031,10.062-1.49432c1.59261-1.85609,1.49867-4.559,1.70967-6.99575C521.28248,239.785,533.83587,238.70653,533.896,237.31585Z"
          transform="translate(-201.25 -32.75)"
          fill="#2f2e41"
        />
        <circle cx="559" cy="744.5" r="43" fill="#5dd693" />
        <circle cx="54" cy="729.5" r="43" fill="#5dd693" />
        <circle cx="54" cy="672.5" r="31" fill="#5dd693" />
        <circle cx="54" cy="624.5" r="22" fill="#5dd693" />
      </svg>
      <span className="search-no-result f18">{text}</span>
    </div>
  );
};
export const NoSearchString = () => {
  return <span className="search-no-string">Please enter a search string</span>;
};
const RoomSearchResult = ({ rooms }) =>
  rooms.map((room) => {
    return (
      <Link
        to={`/room/${room._id}`}
        className="search-item-room gray"
        key={room._id}
      >
        <p className="search-item-room-top">
          <img src={room.picture} crossOrigin="anonymous" />
          <span className="search-item-room-top-host">
            Host <span>@{room.host.username}</span>
          </span>
        </p>
        <p className="search-item-room-middle f16">{room.name}</p>
        <div className="search-item-room-end">
          <div className="search-item-room-end-members">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20"
              width="48"
              viewBox="0 20 48 20"
            >
              <path d="M0 36v-2.65q0-1.95 2.075-3.15T7.5 29q.6 0 1.175.025.575.025 1.125.125-.4.85-.6 1.75-.2.9-.2 1.9V36Zm12 0v-3.2q0-3.25 3.325-5.275Q18.65 25.5 24 25.5q5.4 0 8.7 2.025Q36 29.55 36 32.8V36Zm27 0v-3.2q0-1-.2-1.9-.2-.9-.6-1.75.55-.1 1.125-.125Q39.9 29 40.5 29q3.35 0 5.425 1.2Q48 31.4 48 33.35V36ZM7.5 27.5q-1.45 0-2.475-1.025Q4 25.45 4 24q0-1.45 1.025-2.475Q6.05 20.5 7.5 20.5q1.45 0 2.475 1.025Q11 22.55 11 24q0 1.45-1.025 2.475Q8.95 27.5 7.5 27.5Zm33 0q-1.45 0-2.475-1.025Q37 25.45 37 24q0-1.45 1.025-2.475Q39.05 20.5 40.5 20.5q1.45 0 2.475 1.025Q44 22.55 44 24q0 1.45-1.025 2.475Q41.95 27.5 40.5 27.5ZM24 24q-2.5 0-4.25-1.75T18 18q0-2.5 1.75-4.25T24 12q2.5 0 4.25 1.75T30 18q0 2.5-1.75 4.25T24 24Z" />
            </svg>
            <span className="w300 f12">{room.members.length}</span>
          </div>
          <div className="search-item-room-end-topic-container margin-left-auto flex">
            {room.topics.map((e) => (
              <div key={e} className="search-item-room-end-topic">
                {e}
              </div>
            ))}
          </div>
        </div>
      </Link>
    );
  });
const PeopleSearchResult = ({ people }) =>
  people.map((user) => {
    return (
      <div className="search-people-container" key={user._id}>
        <Link to={`/profile/${user.username}`} className="search-people-item">
          <img src={user.picture} crossOrigin="anonymous" />
          <span>{user.username}</span>
        </Link>
      </div>
    );
  });
export const Search = () => {
  const [tab, setTab] = useState(true);
  const [displayString, setDisplayString] = useState("");
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [people, setPeople] = useState([]);
  const [searchString, setSearchString] = useState("");
  let userLocal = JSON.parse(sessionStorage.getItem("user"));
  const config = {
    headers: {
      "Content-Type": "application/json",
      auth: userLocal.token,
    },
  };

  const searchRooms = () => {
    console.log("searchTerm is ", searchString);
    axios
      .get(`/api/fetch_rooms?criteria=${searchString}`, config)
      .then((res) => {
        console.log(res.data.Rooms);
        setRooms(res.data.Rooms);
        setLoading(false);
      })
      .catch((e) => {
        console.log(e.response.data);
        setLoading(false);
      });
  };
  const searchPeople = () => {
    axios
      .get(`/api/users?username=${searchString}`, config)
      .then((res) => {
        console.log(res.data.users);
        setPeople(res.data.users);
        setLoading(false);
      })
      .catch((e) => {
        console.log(e.response.data);
        setLoading(false);
      });
  };
  const search = () => {
    if (searchString.trim() === "") {
      return;
    }
    setLoading(true);
    setDisplayString(`Search results for "${searchString}"`);
    searchPeople();
    searchRooms();
  };
  const searchTop = () => {
    setLoading(true);
    axios
      .get(`/api/fetch_rooms?criteria=<top>`, config)
      .then((res) => {
        console.log("top rooms", res);
        setRooms(res.data.Rooms);
        setDisplayString(
          `Automatically showing top rooms, Please Enter a Search Term`
        );
        setLoading(false);
      })
      .catch((e) => {
        console.log(e.response.data);
        setLoading(false);
      });
  };
  useEffect(() => {
    searchTop();
  }, []);

  return (
    <div className="search-container gray">
      <div className="search-search pos-relative">
        <span className="search-button pointer" onClick={() => search()}>
          Search
        </span>
        <input
          placeholder="Enter search term"
          onInput={(e) => setSearchString(e.target.value)}
        />
      </div>
      <div className="search-phrase w300 f12">{displayString}</div>
      <div className="search-tabs">
        <p
          onClick={() => setTab(true)}
          className={`pointer ${tab && "active"}`}
        >
          ROOMS <span>({rooms.length})</span>
        </p>
        <p
          className={`pointer ${!tab && "active"}`}
          onClick={() => setTab(false)}
        >
          PEOPLE <span>({people.length})</span>
        </p>
      </div>
      <div className="pos-relative">{loading && <Spinner />}</div>
      {tab ? (
        !rooms.length && !loading ? (
          <NoResult text="NO RESULTS" />
        ) : (
          <RoomSearchResult rooms={rooms} />
        )
      ) : !people.length && !loading ? (
        <NoResult text="NO RESULTS" />
      ) : (
        <PeopleSearchResult people={people} />
      )}
    </div>
  );
};
