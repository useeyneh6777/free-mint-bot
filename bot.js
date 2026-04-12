const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;

const POLL_INTERVAL = 15 * 60 * 1000;
const seen = new Set();

function safeQuery(str = "") {
  return encodeURIComponent(str);
}

async function sendTelegram(message) {
  try {
    const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error("Telegram error: " + err.message);
  }
}

/* ---------------- ETH ---------------- */

async function checkEth() {
  try {
    const url =
      "https://eth-mainnet.g.alchemy.com/nft/v3/" +
      ALCHEMY_KEY +
      "/getMintedNfts";

    const res = await axios.get(url, {
      params: { limit: 20, orderBy: "BLOCK_TIME_DESC" }
    });

    const nfts = res.data && res.data.nfts ? res.data.nfts : [];

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      const contract = nft.contract?.address || "";
      const name = nft.contract?.name || "Unknown Collection";

      const key = "eth:" + contract.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const q = safeQuery(name + " nft mint");
      const xSearch =
        "https://x.com/search?q=" + q + "&src=typed_query";

      const msg =
        "🆓 <b>Free Mint Alert! (Ethereum)</b>\n\n" +
        "🖼 <b>" + name + "</b>\n" +
        "📄 Contract: <code>" + contract + "</code>\n\n" +
        "🔗 Explore Links:\n" +
        "• <a href='https://mint.fun/search?query=" + q + "'>mint.fun</a>\n" +
        "• <a href='https://zora.co/search?q=" + q + "'>Zora</a>\n" +
        "• <a href='https://opensea.io/assets?search[query]=" + q + "'>OpenSea</a>\n" +
        "• <a href='https://magiceden.io/marketplace?search=" + q + "'>Magic Eden</a>\n" +
        "• <a href='https://etherscan.io/address/" + contract + "'>Etherscan</a>\n" +
        "• <a href='" + xSearch + "'>Search on X 𝕏</a>";

      await sendTelegram(msg);
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error("ETH error: " + err.message);
  }
}

/* ---------------- BASE ---------------- */

async function checkBase() {
  try {
    const url =
      "https://base-mainnet.g.alchemy.com/nft/v3/" +
      ALCHEMY_KEY +
      "/getMintedNfts";

    const res = await axios.get(url, {
      params: { limit: 20, orderBy: "BLOCK_TIME_DESC" }
    });

    const nfts = res.data && res.data.nfts ? res.data.nfts : [];

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      const contract = nft.contract?.address || "";
      const name = nft.contract?.name || "Unknown Collection";

      const key = "base:" + contract.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const q = safeQuery(name + " nft mint");
      const xSearch =
        "https://x.com/search?q=" + q + "&src=typed_query";

      const msg =
        "🆓 <b>Free Mint Alert! (Base)</b>\n\n" +
        "🖼 <b>" + name + "</b>\n" +
        "📄 Contract: <code>" + contract + "</code>\n\n" +
        "🔗 Explore Links:\n" +
        "• <a href='https://mint.fun/search?query=" + q + "'>mint.fun</a>\n" +
        "• <a href='https://zora.co/search?q=" + q + "'>Zora</a>\n" +
        "• <a href='https://opensea.io/assets?search[query]=" + q + "'>OpenSea</a>\n" +
        "• <a href='https://magiceden.io/marketplace?search=" + q + "'>Magic Eden</a>\n" +
        "• <a href='https://basescan.org/address/" + contract + "'>Basescan</a>\n" +
        "• <a href='" + xSearch + "'>Search on X 𝕏</a>";

      await sendTelegram(msg);
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error("Base error: " + err.message);
  }
}

/* ---------------- APECHAIN ---------------- */

async function checkApeChain() {
  try {
    const rpc = "https://rpc.apechain.com/http";

    const blockRes = await axios.post(rpc, {
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1
    });

    const blockHex = blockRes?.data?.result;
    if (!blockHex) return;

    const blockNum = parseInt(blockHex, 16);

    const logsRes = await axios.post(rpc, {
      jsonrpc: "2.0",
      method: "eth_getLogs",
      params: [
        {
          fromBlock: "0x" + (blockNum - 100).toString(16),
          toBlock: "latest",
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          ]
        }
      ],
      id: 2
    });

    const logs = logsRes.data?.result || [];

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      const contract = log.address;

      const key = "ape:" + contract.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const q = safeQuery(contract);

      const xSearch =
        "https://x.com/search?q=" + q + "&src=typed_query";

      const msg =
        "🆓 <b>Free Mint Alert! (ApeChain)</b>\n\n" +
        "📄 Contract: <code>" + contract + "</code>\n\n" +
        "🔗 Explore Links:\n" +
        "• <a href='https://apescan.io/address/" + contract + "'>ApeScan</a>\n" +
        "• <a href='https://opensea.io/assets?search[query]=" + q + "'>OpenSea</a>\n" +
        "• <a href='https://magiceden.io/marketplace?search=" + q + "'>Magic Eden</a>\n" +
        "• <a href='" + xSearch + "'>Search on X 𝕏</a>";

      await sendTelegram(msg);
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error("ApeChain error: " + err.message);
  }
}

/* ---------------- MAIN LOOP ---------------- */

async function checkMints() {
  console.log("Checking all chains...");
  await checkEth();
  await checkBase();
  await checkApeChain();
}

async function start() {
  console.log("Bot starting...");

  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    process.exit(1);
  }

  await sendTelegram(
    "🤖 Free Mint Bot is live!\nWatching Ethereum, Base + ApeChain every 15 mins."
  );

  await checkMints();
  setInterval(checkMints, POLL_INTERVAL);
}

start();