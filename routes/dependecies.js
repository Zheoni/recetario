const express = require('express');
const router = express.Router();
const path = require("path");

router.use((req, res, next) => {
  res.set("Cache-Control", "public, max-age=604800, immutable");
  next();
})

router.get('/boxicons.min.css', (req, res) => {
  res.sendFile(path.join(__dirname, "..",
    "vendor", "boxicons", "css", "boxicons.min.css"));
});

router.get('/Sortable.min.js', (req, res) => {
  res.sendFile(path.join(__dirname, "..",
    "vendor", "Sortable", "Sortable.min.js"));
})

router.get('/unicodePatterns.min.js', (req, res) => {
  res.sendFile(path.join(__dirname, "..",
    "vendor", "unicode-patterns", "unicodePatterns.min.js"));
});

module.exports = router;
