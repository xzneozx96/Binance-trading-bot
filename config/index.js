require('dotenv').config();

module.exports = {
	serverPort: process.env.SERVER_PORT,
	frontendDomain: process.env.FRONTEND_DOMAIN,
	deployedDomain: process.env.DEPLOYED_DOMAIN,
	dbURI: process.env.DB_URI,
	binancePublic: process.env.BINANCE_PUBLIC,
	binanceSecret: process.env.BINANCE_SECRET,
};
