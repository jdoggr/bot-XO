const fs = require("fs");
const path = require("path");

// Path to the inventory file
const inventoryFile = path.join(__dirname, "database", "inventory.json");

// Load inventory for a specific user
function loadInventory(userId) {
  if (!fs.existsSync(inventoryFile)) {
    return {};
  }

  const data = JSON.parse(fs.readFileSync(inventoryFile, "utf8"));
  return data[userId] || {};
}

// Save the updated inventory for a specific user
function saveInventory(userId, inventory) {
  const data = JSON.parse(fs.readFileSync(inventoryFile, "utf8"));
  data[userId] = inventory;
  fs.writeFileSync(inventoryFile, JSON.stringify(data, null, 2));
}

module.exports = { loadInventory, saveInventory };
