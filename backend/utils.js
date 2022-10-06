function updateDMActivity(userObj, targetUserObj, text) {
  let target_username = targetUserObj.username;
  let sender_username = userObj.username;
  // register with sender user object
  if (userObj.dms.some((e) => e[0] === target_username)) {
    console.log("target_username exists in activity");
    let index = userObj.dms.findIndex((e) => e[0] === target_username);
    let newArray = [];
    newArray = [target_username, Date.now(), targetUserObj.picture, text];
    userObj.dms[index] = newArray;
    userObj.save();
  } else {
    console.log("new target_username in activity");
    userObj.dms.push([
      target_username,
      Date.now(),
      targetUserObj.picture,
      text,
    ]);
    userObj.save();
  }
  // register with target user object
  if (targetUserObj.dms.some((e) => e[0] === sender_username)) {
    console.log("sender_username exists in activity");
    let index = targetUserObj.dms.findIndex((e) => e[0] === sender_username);
    let lastseen = targetUserObj.dms[index][1];
    newArray = [sender_username, lastseen, userObj.picture, text];
    targetUserObj.dms[index] = newArray;
    targetUserObj.save();
  } else {
    console.log("new sender_username in activity");
    targetUserObj.dms.push([
      sender_username,
      Date.now() - 10000,
      userObj.picture,
      text,
    ]);
    targetUserObj.save();
  }
}
function updateRoomActivity(userObj, room_id) {
  if (userObj.rooms.some((e) => e[0] === room_id)) {
    console.log("room_id exists in activity");
    let index = userObj.rooms.findIndex((e) => e[0] === room_id);
    userObj.rooms[index][1] = Date.now();
  } else {
    console.log("new room_id in activity");
    userObj.rooms.push([room_id, Date.now()]);
    userObj.save();
  }
}

module.exports = { updateDMActivity, updateRoomActivity };
