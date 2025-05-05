const fs = require("fs");
const path = require("path");

const balancesFile = path.join(__dirname, "database", "balances.txt");

// Load balances from the file
function loadBalances() {
  if (!fs.existsSync(balancesFile)) {
    return {};
  }

  const data = fs.readFileSync(balancesFile, "utf-8");
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Error parsing balances file:", err);
    return {};
  }
}

// Save balances to the file
function saveBalances(balances) {
  fs.writeFileSync(balancesFile, JSON.stringify(balances, null, 2), "utf-8");
}

// Get a user's balance for a specific server
function getBalance(serverId, userId) {
  const balances = loadBalances();
  if (!balances[serverId]) {
    balances[serverId] = {};
  }
  return balances[serverId][userId] || 0;
}

// Update a user's balance for a specific server
function updateBalance(serverId, userId, amount) {
  const balances = loadBalances();
  if (!balances[serverId]) {
    balances[serverId] = {};
  }
  balances[serverId][userId] = (balances[serverId][userId] || 0) + amount;
  saveBalances(balances);
}

module.exports = { getBalance, updateBalance };
