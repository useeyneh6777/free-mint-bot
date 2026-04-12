const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;

const POLL_INTERVAL = 15 * 60 * 1000;
const seen = new Set();

async function sendTelegram(message) {
  try {
    const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
    await axios.post(url, { chat_id: CHAT_ID, text: message, parse_mode: "HTML" });
  } catch (err) {
    console.error("Telegram error: " + err.message);
  }
}

async function checkEth() {
  try {
    const url = "https://eth-mainnet.g.alchemy.com/nft/v3/" + ALCHEMY_KEY + "/getMintedNfts";
    const res = await axios.get(url, { params: { limit: 20, order​​​​​​​​​​​​​​​​
