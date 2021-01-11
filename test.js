const fetcher = require("./noteCountFetcher");

const getResult = async (magazineId) => {
  const result = await fetcher.getCountForEachUserInMagazine(magazineId);
  console.log(JSON.stringify(result, null, 2));
};

getResult('m30aa4d96cb3c');