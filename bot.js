const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;

const POLL_INTERVAL = 30 * 60 * 1000;
const seen = new Set();

async function sendTelegram(message) {
  try {
    const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
    await axios.post(url, { chat_id: CHAT_ID, text: message, parse_mode: "HTML" });
  } catch (err) {
    console.error("Telegram error: " + err.message);
  }
}

async function checkMints() {
  console.log("Checking mints...");
  try {
    const url = "https://eth-mainnet.g.alchemy.com/nft/v3/" + ALCHEMY_KEY + "/getMintedNfts";
    const res = await axios.get(url, {
      params: { limit: 20, orderBy: "BLOCK_TIME_DESC" }
    });
    const nfts = res.data && res.data.nfts ? res.data.nfts : [];
    for (var i = 0; i < nfts.length; i++) {
      var nft = nfts[i];
      var contract = nft.contract && nft.contract.address ? nft.contract.address : "";
      var name = nft.contract && nft.contract.name ? nft.contract.name : "Unknown Collection";
      var key = "eth:" + contract + ":" + (nft.tokenId || "");
      if (seen.has(key)) continue;
      seen.add(key);
      var msg =
        "🆓 <b>Free Mint Alert!</b>\n\n" +
        "🖼 <b>" + name + "</b>\n" +
        "📄 Contract: <code>" + contract + "</code>\n\n" +
        "🔗 Mint Links:\n" +
        "• <a href='https://mint.fun/eth/" + contract + "'>mint.fun</a>\n" +
        "• <a href='https://zora.co/collect/eth:" + contract + "'>Zora</a>\n" +
        "• <a href='https://opensea.io/assets/ethereum/" + contract + "'>OpenSea</a>\n" +
        "• <a href='https://etherscan.io/address/" + contract + "'>Etherscan</a>";
      await sendTelegram(msg);
      await new Promise(function(r) { setTimeout(r, 1000); });
    }
  } catch (err) {
    console.error("Fetch error: " + err.message);
  }
}

async function start() {
  console.log("Bot starting...");
  if (!TELEGRAM_TOKEN || !CHAT_ID) { process.exit(1); }
  await sendTelegram("🤖 Free Mint Bot is live! Watching Ethereum for free mints.");
  await checkMints();
  setInterval(checkMints, POLL_INTERVAL);
}

start();
