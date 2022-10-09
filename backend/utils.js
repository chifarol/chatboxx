const { model, DirectMSG, RoomMSG, Room, User } = require("./models.js");
const mongoose = require("mongoose");

async function updateDMActivity(userObj, targetUserObj, isMessage = true) {
  let target_username = targetUserObj.username;
  let sender_username = userObj.username;

  let DmMsgs = await DirectMSG.find(
    {
      $or: [
        { from: sender_username, to: target_username },
        { from: target_username, to: sender_username },
      ],
    },
    null,
    { sort: { date: "asc" } }
  );
  if (!isMessage) {
    userObj.dms.forEach((e, index) => {
      if (e[0] === target_username) {
        console.log("target_username exists in activity");
        let newArray = [];
        newArray = [e[0], Date.now(), targetUserObj.picture, e[3]];
        userObj.dms[index] = newArray;
        userObj.save();
      }
    });
  } else {
    let lastMsgText = DmMsgs[DmMsgs.length - 1].body;
    // register with sender user object
    if (userObj.dms.some((e) => e[0] === target_username)) {
      console.log("target_username exists in activity");
      let index = userObj.dms.findIndex((e) => e[0] === target_username);
      let newArray = [];
      newArray = [
        target_username,
        Date.now(),
        targetUserObj.picture,
        lastMsgText,
      ];
      userObj.dms[index] = newArray;
      userObj.save();
    } else {
      console.log("new target_username in activity");
      userObj.dms.push([
        target_username,
        Date.now(),
        targetUserObj.picture,
        lastMsgText,
      ]);
      userObj.save();
    }
    // register with target user object
    if (targetUserObj.dms.some((e) => e[0] === sender_username)) {
      console.log("sender_username exists in activity");
      let index = targetUserObj.dms.findIndex((e) => e[0] === sender_username);
      let lastseen = targetUserObj.dms[index][1];
      newArray = [sender_username, lastseen, userObj.picture, lastMsgText];
      targetUserObj.dms[index] = newArray;
      targetUserObj.save();
    } else {
      console.log("new sender_username in activity");
      targetUserObj.dms.push([
        sender_username,
        Date.now() - 1000,
        userObj.picture,
        lastMsgText,
      ]);
      targetUserObj.save();
    }
  }
}
function updateRoomActivity(userObj, room_id) {
  if (userObj.rooms.some((e) => e[0] === room_id)) {
    console.log("room_id exists in activity");
    let index = userObj.rooms.findIndex((e) => e[0] === room_id);
    if (index > -1) {
      userObj.rooms[index] = [room_id, Date.now()];
    }
  } else {
    console.log("new room_id in activity");
    userObj.rooms.push([room_id, Date.now()]);
  }
  function makeArrayUnique(roomsArr) {
    let roomsObj = {};
    let roomsUniqueArr = [];
    // userObj.rooms = [...new Set(userObj.rooms)];
    roomsArr.forEach((arr) => {
      if (roomsObj[arr[0]]) {
        if (roomsObj[arr[0]] < arr[1]) {
          roomsObj[arr[0]] = arr[1];
        }
      } else {
        roomsObj[arr[0]] = arr[1];
      }
    });
    Object.keys(roomsObj).forEach((id) =>
      roomsUniqueArr.push([id, roomsObj[id]])
    );
    return roomsUniqueArr;
  }
  userObj.rooms = makeArrayUnique(userObj.rooms);
  userObj.save();
}

module.exports = { updateDMActivity, updateRoomActivity };
