"use strict";

const axios = require("axios");

const fetchAllNotes = async (magazineId) => {
  const url = `https://note.com/api/v1/layout/magazine/${magazineId}/section`;
  const result = await axios.get(url + "?page=1");
  const totalCount = result.data.data.section.total_count;
  const pageNum = Math.floor((totalCount / 10) + 1);

  let arr = [];
  for (let page = 1; page < pageNum; page++) {
    const resultPerPage = await axios.get(url + `?page=${page}`);
    arr.push(resultPerPage.data.data.section.contents);
  }

  return arr.flat();
};

const getMonthlyCountForEachUserInMagazine = async (magazineId, dateStr) => {
  const contents = await fetchAllNotes(magazineId);
  let countForEachUser = [];
  let dateFrom, dateTo;

  if (dateStr) {
    // "YYYY-MM"の形式で入力される
    dateFrom = new Date(dateStr);
    dateTo = new Date(dateFrom.getFullYear(), dateFrom.getMonth() + 1, 1);
  } else {
    // dateStrが指定されなかったときは今月のランキング
    const today = new Date();
    dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    dateTo = new Date(dateFrom.getFullYear(), dateFrom.getMonth() + 1, 1);
  }

  for (let content of contents) {
    const urlname = content.user.urlname;
    const publishAt = new Date(content.publish_at);
    if (dateFrom <= publishAt && publishAt < dateTo) {
      const user = countForEachUser.find((v) => v.name == urlname);
      if (user) {
        user.count += 1;
        user.like += content.like_count
      } else {
        const newUser = {
          name: urlname,
          count: 1,
          like: content.like_count
        };
        countForEachUser.push(newUser);
      }
    }
  }

  return countForEachUser;
};

exports.getMonthlyCountForEachUserInMagazine = getMonthlyCountForEachUserInMagazine;
