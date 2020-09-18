const q = require("../utils/queryLoader.js").getQueries().conversions;


function buildGraph() {
  const adjacencyList = {};

  const allIds = q["sAllUnitsIds"].pluck().all();
  for (const unitId of allIds) {
    adjacencyList[unitId] = [];
  }

  const allConversions = q["sAllConversions"].all();
  for (const conversion of allConversions) {
    adjacencyList[conversion.unitFrom]
      .push({ to: conversion.unitTo, factor: conversion.factor });

    adjacencyList[conversion.unitTo]
      .push({ to: conversion.unitFrom, factor: 1 / conversion.factor });
  }

  return adjacencyList;
}

function getAllUnits() {
  return q["sAllUnits"].all();
}

function isValidCache(cacheTime, name) {
  const lastUpdate = Number(q["sTimeLastUpdate"]
    .pluck()
    .get(name));
  const cacheDate = Number(cacheTime);

  return lastUpdate <= cacheDate;
}

function updateCacheTime(name) {
  q["uLastUpdateTime"].run({ name, time: Date.now() });
}

function findUnit(name) {
  return q["findUnit"].get({ name });
}

module.exports = {
  buildGraph,
  getAllUnits,
  isValidCache,
  updateCacheTime,
  findUnit,
}
