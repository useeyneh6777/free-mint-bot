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
    const res = await axios.get(url, { params: { limit: 20, orderBy: "BLOCK_TIME_DESC" } });
    const nfts = res.data && res.data.nfts ? res.data.nfts : [];
    for (var i = 0; i < nfts.length; i++) {
      var nft = nfts[i];
      var contract = nft.contract && nft.contract.address ? nft.contract.address : "";
      var name = nft.contract && nft.contract.name ? nft.contract.name : "Unknown Collection";
      var key = "eth:" + contract;
      if (seen.has(key)) continue;
      seen.add(key);
      var msg =
        "🆓 <b>Free Mint Alert! (Ethereum)</b>\n\n" +
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
    console.error("ETH error: " + err.message);
  }
}

async function checkBase() {
  try {
    const url = "https://base-mainnet.g.alchemy.com/nft/v3/" + ALCHEMY_KEY + "/getMintedNfts";
    const res = await axios.get(url, { params: { limit: 20, orderBy: "BLOCK_TIME_DESC" } });
    const nfts = res.data && res.data.nfts ? res.data.nfts : [];
    for (var i = 0; i < nfts.length; i++) {
      var nft = nfts[i];
      var contract = nft.contract && nft.contract.address ? nft.contract.address : "";
      var name = nft.contract && nft.contract.name ? nft.contract.name : "Unknown Collection";
      var key = "base:" + contract;
      if (seen.has(key)) continue;
      seen.add(key);
      var msg =
        "🆓 <b>Free Mint Alert! (Base)</b>\n\n" +
        "🖼 <b>" + name + "</b>\n" +
        "📄 Contract: <code>" + contract + "</code>\n\n" +
        "🔗 Mint Links:\n" +
        "• <a href='https://mint.fun/base/" + contract + "'>mint.fun</a>\n" +
        "• <a href='https://zora.co/collect/base:" + contract + "'>Zora</a>\n" +
        "• <a href='https://opensea.io/assets/base/" + contract + "'>OpenSea</a>\n" +
        "• <a href='https://basescan.org/address/" + contract + "'>Basescan</a>";
      await sendTelegram(msg);
      await new Promise(function(r) { setTimeout(r, 1000); });
    }
  } catch (err) {
    console.error("Base error: " + err.message);
  }
}

async function checkApeChain() {
  try {
    const rpc = "https://rpc.apechain.com/http";
    const blockRes = await axios.post(rpc, {
      jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1
    });
    const blockNum = parseInt(blockRes.data.result, 16);
    const logsRes = await axios.post(rpc, {
      jsonrpc: "2.0",
      method: "eth_getLogs",
      params: [{
        fromBlock: "0x" + (blockNum - 100).toString(16),
        toBlock: "latest",
        topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                 "0x0000000000000000000000000000000000000000000000000000000000000000"]
      }],
      id: 2
    });
    const logs = logsRes.data.result || [];
    for (var i = 0; i < logs.length; i++) {
      var log = logs[i];
      var contract = log.address;
      var key = "ape:" + contract;
      if (seen.has(key)) continue;
      seen.add(key);
      var msg =
        "🆓 <b>Free Mint Alert! (ApeChain)</b>\n\n" +
        "📄 Contract: <code>" + contract + "</code>\n\n" +
        "🔗 Links:\n" +
        "• <a href='https://apescan.io/address/" + contract + "'>ApeScan</a>\n" +
        "• <a href='https://opensea.io/assets/apechain/" + contract + "'>OpenSea</a>";
      await sendTelegram(msg);
      await new Promise(function(r) { setTimeout(r, 1000); });
    }
  } catch (err) {
    console.error("ApeChain error: " + err.message);
  }
}

async function checkMints() {
  console.log("Checking all chains...");
  await checkEth();
  await checkBase();
  await checkApeChain();
}

async function start() {
  console.log("Bot starting...");
  if (!TELEGRAM_TOKEN || !CHAT_ID) { process.exit(1); }
  await sendTelegram("🤖 Free Mint Bot is live!\nWatching Ethereum, Base + ApeChain every 15 mins.");
  await checkMints();
  setInterval(checkMints, POLL_INTERVAL);
}

start();
