const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const POLL_INTERVAL = 30 * 60 * 1000;
const seen = new Set();

async function sendTelegram(message) {
  try {
    const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("Telegram error: " + err.message);
  }
}

async function checkMints() {
  console.log("Checking mints...");
  try {
    const url = "https://api.reservoir.tools/collections/v7";
    const res = await axios.get(url, {
      params: { sortBy: "createdAt", limit: 20 },
      headers: { accept: "application/json" },
    });
    const collections = res.data && res.data.collections ? res.data.collections : [];
    for (var j = 0; j < collections.length; j++) {
      var c = collections[j];
      var stages = c.mintStages || [];
      var free = stages.some(function(s) { return !s.price || s.price === "0" || s.price === 0; });
      if (!free) continue;
      var key = "eth:" + c.id;
      if (seen.has(key)) continue;
      seen.add(key);
      await sendTelegram("Free MINT on Ethereum\n" + (c.name || "Unknown") + "\nContract: " + c.id);
    }
  } catch (err) {
    console.error("Fetch error: " + err.message);
  }
}

async function start() {
  console.log("Bot starting...");
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("Missing env vars");
    process.exit(1);
  }
  await sendTelegram("Free Mint Bot is live!");
  await checkMints();
  setInterval(checkMints, POLL_INTERVAL);
}

start();
