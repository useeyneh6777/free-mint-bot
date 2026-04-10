const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY || "demo";

const CHAINS = [
  { name: "Ethereum", base: "https://api.reservoir.tools" },
  { name: "Base", base: "https://api-base.reservoir.tools" },
];

const POLL_INTERVAL = 30 * 60 * 1000;
const seen = new Set();

async function sendTelegram(message) {
  const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
  await axios.post(url, {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "HTML",
  });
}

async function fetchFreeMints(chain) {
  const url = chain.base + "/collections/v7";
  const params = { sortBy: "createdAt", limit: 20 };
  const headers = { accept: "application/json", "x-api-key": RESERVOIR_API_KEY };
  const res = await axios.get(url, { params, headers });
  const collections = res.data && res.data.collections ? res.data.collections : [];
  return collections.filter(function(c) {
    const stages = c.mintStages || [];
    const free = stages.some(function(s) { return s.price === "0" || s.price === 0 || !s.price; });
    return free && (c.mintingStatus === "open" || stages.length > 0);
  });
}

async function checkMints() {
  console.log("Checking for free mints...");
  for (var i = 0; i < CHAINS.length; i++) {
    var chain = CHAINS[i];
    try {
      var mints = await fetchFreeMints(chain);
      for (var j = 0; j < mints.length; j++) {
        var c = mints[j];
        var key = chain.name + ":" + c.id;
        if (seen.has(key)) continue;
        seen.add(key);
        var msg = "Free MINT on " + chain.name + "\n" + (c.name || "Unknown") + "\nContract: " + c.id;
        await sendTelegram(msg);
        await new Promise(function(r) { setTimeout(r, 1000); });
      }
    } catch (err) {
      console.error("Error on " + chain.name + ": " + err.message);
    }
  }
}

async function start() {
  console.log("Bot starting...");
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("Missing TELEGRAM_TOKEN or CHAT_ID");
    process.exit(1);
  }
  await sendTelegram("Free Mint Bot is live! Watching Ethereum + Base.");
  await checkMints();
  setInterval(checkMints, POLL_INTERVAL);
}

start();
