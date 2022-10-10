const { model, DirectMSG, RoomMSG, Room, User } = require("./models.js");
const mongoose = require("mongoose");

/**
 * updates user's dm activity i.e {user.dms} property (last seen)
 * @param object userObj Main User object to be updated.
 * @param object userObj Target User object to be updated (message recipient).
 * @param boolean isMessage whether to the activity is actually a dm
 */
async function updateDMActivity(userObj, targetUserObj, isMessage = true) {
  let target_username = targetUserObj.username;
  let sender_username = userObj.username;
  // find direct messages between the two parties
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
  // if user just visted the target user's dm page but didn't send a message (usually trigger by socket .io)
  if (!isMessage) {
    userObj.dms.forEach((e, index) => {
      if (e[0] === target_username) {
        let newArray = [];
        // [target_username, last_seen, targetUserProfilePicture, lastMessageBetweenTheTwoParties]
        newArray = [e[0], Date.now(), targetUserObj.picture, e[3]];
        userObj.dms[index] = newArray;
        // save object to db
        userObj.save();
      }
    });
  }
  // if user actually sent a message to target user/recipient
  else {
    let lastMsgText = DmMsgs[DmMsgs.length - 1].body;
    // register with sender user object
    if (userObj.dms.some((e) => e[0] === target_username)) {
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
      let index = targetUserObj.dms.findIndex((e) => e[0] === sender_username);
      let lastseen = targetUserObj.dms[index][1];
      newArray = [sender_username, lastseen, userObj.picture, lastMsgText];
      targetUserObj.dms[index] = newArray;
      targetUserObj.save();
    } else {
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
/**
 * updates user's room activity i.e {user.rooms} property (last seen)
 * @param object userObj User object to be updated.
 * @param string room_id id of room in question.
 * @param boolean remove whether to remove or add room in user activity.
 */
function updateRoomActivity(userObj, room_id, remove = false) {
  if (remove === false) {
    // if room is already in {userobj.rooms} array
    if (userObj.rooms.some((e) => e[0] === room_id)) {
      let index = userObj.rooms.findIndex((e) => e[0] === room_id);
      if (index > -1) {
        userObj.rooms[index] = [room_id, Date.now()];
      }
    }
    // if room is not in array already
    else {
      userObj.rooms.push([room_id, Date.now()]);
    }
    /**
     * makes sure rooms array unique (level 1)
     * @param array  roomsArr nested array to be made unique.
     * @return array of unique elements
     */
    function makeArrayUnique(roomsArr) {
      let roomsObj = {};
      let roomsUniqueArr = [];
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
  } else if (remove === true) {
    userObj.rooms = userObj.rooms.filter((e) => e[0] !== room_id);
    userObj.save();
  }
}

module.exports = { updateDMActivity, updateRoomActivity };
