const fs = require("fs");
const path = require("path");

// Path to the 'database' folder where server-specific shop files will be stored
const shopDirectory = path.join(__dirname, "database", "shops");

// Ensure the 'shops' directory exists
if (!fs.existsSync(shopDirectory)) {
  fs.mkdirSync(shopDirectory, { recursive: true });
}

// Load shop items for a specific server
function loadShop(serverId) {
  const shopFilePath = path.join(shopDirectory, `shop_${serverId}.json`);

  if (fs.existsSync(shopFilePath)) {
    try {
      const data = fs.readFileSync(shopFilePath, "utf-8");
      return JSON.parse(data); // Return parsed JSON
    } catch (error) {
      console.error(
        `Error reading or parsing shop file for server ${serverId}:`,
        error
      );
      return {}; // Return an empty object if there's an error
    }
  }

  return {}; // Return empty shop if the file doesn't exist
}

// Save shop items for a specific server
function saveShop(serverId, shopItems) {
  const shopFilePath = path.join(shopDirectory, `shop_${serverId}.json`);
  const data = JSON.stringify(shopItems, null, 2); // Pretty-print JSON data
  fs.writeFileSync(shopFilePath, data, "utf-8"); // Write to the file
}

module.exports = { loadShop, saveShop };
