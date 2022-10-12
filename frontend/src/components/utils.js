import React, { useState, useContext } from "react";
import axios from "axios";

const user = JSON.parse(sessionStorage.getItem("user"));
const url = "https://api.cloudinary.com/v1_1/chifarol/image/upload";

/**
 * get Image file path
 *
 * @param {object} file image file object
 * @return {string} file path string
 */
export function getFilePath(file) {
  let path = (window.URL || window.webkitURL).createObjectURL(file);
  return path;
}

/**
 * Upload image to cloudinary and return image url
 *
 * @param {object} file image file object
 * @param {string} type whether profile picture or header picture
 * @return {string} cloudinary image url string
 */
export function imageUpload(file, type, userOrRoom_id) {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      if (!file.name) {
        reject(new Error("empty file ", file));
        return;
      }
      // get user credential\
      let body = {
        params: {
          public_id: "",
          overwrite: "false",
        },
      };
      if (type === "user") {
        // if type is profile picture
        body.params.public_id = `ChatApp/user/${userOrRoom_id}`;
        body.params.overwrite = "true";
      } else if (type === "room") {
        // if type is header picture
        body.params.public_id = `ChatApp/room/${userOrRoom_id}`;
        body.params.overwrite = "true";
      }
      const config = {
        headers: {
          "Content-Type": "application/json",
          auth: user.token,
        },
      };
      axios
        .post("/api/cloudinary_signature/", body, config) // api returns signature and timestamp
        .then((res) => {
          console.log(res.data, file);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("public_id", body.params.public_id);
          formData.append("overwrite", body.params.overwrite);
          formData.append("api_key", "356179964254641");
          formData.append("timestamp", res.data.timestamp);
          formData.append("signature", res.data.signature);

          axios
            .post(url, formData) // main api call upload to cloudinary
            .then((res) => {
              console.log(res);
              resolve(res.data.secure_url);
            })
            .catch((err) => {
              reject(new Error("failed after signature " + err));
            });
        })
        .catch((err) => {
          reject(new Error(err));
        });
    }, 5000);
  });
}

const monthMap = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};
/**
 * get formatted date from timestring
 *
 * @param {string} date  unix time string
 * @return {string} formatted date
 */
export function getDateTimeString(date, type) {
  date = new Date(date);
  let year = date.getFullYear(); //get $-digit Year
  let month = date.getMonth() + 1; // get month 0-11
  let day = date.getDate(); // get day 1-31
  let hour = String(date.getHours()).padStart(2, "0"); // get 24 hour
  let minutes = String(date.getMinutes()).padStart(2, "0"); // get day 1-31
  switch (type) {
    case "HrMin":
      return `${monthMap[month]}'${year
        .toString()
        .substr(-2)} at ${hour}:${minutes}`;
      break;
    default:
      return `${monthMap[month]} ${day} ${year} at ${hour}:${minutes}`;
      break;
  }
}
/**
 * Sets value of explore/search cache in sessionStorage.
 *
 * @param {string} username username of user to cache.
 * @param {object} obj array of tweet objects.
 * @param {string} obj.type type of info/tweets (profile,tweets,tweets & replies,media,likes)
 * @param {array} obj.list array of user's tweets
 */
