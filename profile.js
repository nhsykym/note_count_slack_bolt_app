"use strict";

const axios = require("axios");

module.exports.getProfileImageUrl = async (userId) => {
  const url = `https://note.com/api/v2/creators/${userId}`;
  const result = await axios.get(url);
  const imageUrl = result.data.data.profileImageUrl;

  return imageUrl;
};
