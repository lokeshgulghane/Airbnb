const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const chatbotController = require("../controllers/chatbot.js");

router.post("/ask", wrapAsync(chatbotController.ask));

module.exports = router;
