const axios = require(“axios”);

// ─── CONFIG ────────────────────────────────────────────────────────────────
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY || “demo”; // get free key at reservoir.tools

const CHAINS = [
{ name: “Ethereum”, base: “https://api.reservoir.tools” },
{ name: “Base”, base: “https://api-base.reservoir.tools” },
];

// How often to check (in ms). Default: every 30 minutes
const POLL_INTERVAL = 30 * 60 * 1000;

// Track already-sent collections so we don’t spam
const seen = new Set();

// ─── TELEGRAM ──────────────────────────────────────────────────────────────
async function sendTelegram(message) {
const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
await axios.post(url, {
chat_id: CHAT_ID,
text: message,
parse_mode: “HTML”,
disable_web_page_preview: false,
});
}

// ─── FETCH FREE MINTS ──────────────────────────────────────────────────────
async function fetchFreeMints(chain) {
const url = `${chain.base}/collections/v7`;
const params = {
sortBy: “createdAt”,
limit: 20,
includeAttributes: false,
normalizeRoyalties: false,
};

const headers = {
accept: “application/json”,
“x-api-key”: RESERVOIR_API_KEY,
};

const res = await axios.get(url, { params, headers });
const collections = res.data?.collections || [];

// Filter: mint price = 0 and minting is active
return collections.filter((c) => {
const mintStages = c.mintStages || [];
const hasFreeMint = mintStages.some(
(stage) => stage.price === “0” || stage.price === 0 || !stage.price
);
const isMinting = c.mintingStatus === “open” || mintStages.length > 0;
return hasFreeMint && isMinting;
});
}

// ─── FORMAT ALERT ──────────────────────────────────────────────────────────
function formatAlert(collection, chainName) {
const name = collection.name || “Unknown Collection”;
const contract = collection.id || “”;
const supply = collection.tokenCount
? `${Number(collection.tokenCount).toLocaleString()} supply`
: “Unknown supply”;
const image = collection.image || “”;
const mintUrl =
collection.externalUrl ||
`https://mint.fun/` ||
`https://opensea.io/collection/${collection.slug}`;

const explorerBase =
chainName === “Base”
? “https://basescan.org/address/”
: “https://etherscan.io/address/”;

return (
`🆓 <b>FREE MINT ALERT</b> on <b>${chainName}</b>\n\n` +
`🖼 <b>${name}</b>\n` +
`📦 ${supply}\n` +
`📄 Contract: <a href="${explorerBase}${contract}">${contract.slice(0, 8)}...${contract.slice(-6)}</a>\n` +
`🔗 <a href="${mintUrl}">Mint Now</a>\n` +
`\n⏰ Spotted just now`
);
}

// ─── MAIN LOOP ─────────────────────────────────────────────────────────────
async function checkMints() {
console.log(`[${new Date().toISOString()}] Checking for free mints...`);

for (const chain of CHAINS) {
try {
const mints = await fetchFreeMints(chain);
console.log(`  ${chain.name}: found ${mints.length} free mint(s)`);

```
  for (const collection of mints) {
    const key = `${chain.name}:${collection.id}`;
    if (seen.has(key)) continue;

    seen.add(key);
    const msg = formatAlert(collection, chain.name);
    await sendTelegram(msg);
    console.log(`  ✅ Sent alert for: ${collection.name}`);

    // Small delay between messages
    await new Promise((r) => setTimeout(r, 1000));
  }
} catch (err) {
  console.error(`  ❌ Error on ${chain.name}:`, err.message);
}
```

}
}

// ─── STARTUP ───────────────────────────────────────────────────────────────
async function start() {
console.log(“🤖 Free Mint Bot starting…”);
console.log(`📡 Watching: Ethereum Mainnet + Base`);
console.log(`⏱  Polling every ${POLL_INTERVAL / 60000} minutes\n`);

if (!TELEGRAM_TOKEN || !CHAT_ID) {
console.error(
“❌ Missing TELEGRAM_TOKEN or CHAT_ID in environment variables.”
);
process.exit(1);
}

await sendTelegram(
“🤖 <b>Free Mint Bot is live!</b>\nWatching Ethereum + Base for free mints. I’ll alert you as soon as I spot one.”
);

// Run immediately on start
await checkMints();

// Then poll on interval
setInterval(checkMints, POLL_INTERVAL);
}

start();
