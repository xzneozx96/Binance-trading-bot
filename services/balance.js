const { Spot } = require('@binance/connector');

const config = require('../config');
const axios = require('axios');

const apiKey = config.binancePublic;
const apiSecret = config.binanceSecret;

const spot = new Spot(apiKey, apiSecret);

async function getAccountTotalBalance() {
	try {
		const response = await spot.account();

		const balances = response.data.balances;

		// Fetch current prices for all assets
		const prices = await axios.get(
			'https://api.binance.com/api/v3/ticker/price'
		);

		// Create a map of prices for quick lookup
		const priceMap = {};
		prices.data.forEach((price) => {
			priceMap[price.symbol] = parseFloat(price.price);
		});

		// Calculate the total balance in USD
		let totalBalanceUSD = 0;

		for (const balance of balances) {
			const asset = balance.asset;
			const free = parseFloat(balance.free);
			const locked = parseFloat(balance.locked);
			const total = free + locked;

			if (total > 0) {
				if (asset === 'USDT' || asset === 'BUSD') {
					totalBalanceUSD += total; // USDT and BUSD are already in USD
				} else if (priceMap[`${asset}USDT`]) {
					totalBalanceUSD += total * priceMap[`${asset}USDT`];
				} else if (priceMap[`${asset}BUSD`]) {
					totalBalanceUSD += total * priceMap[`${asset}BUSD`];
				}
			}
		}

		return totalBalanceUSD;
	} catch (err) {
		throw new Error(err.response.data.msg);
	}
}

async function getSpotUSDTBalance() {
	try {
		const response = await spot.account();

		const balances = response.data.balances;

		const usdtBalance = balances.find((balance) => balance.asset === 'USDT');

		return parseFloat(usdtBalance.free);
	} catch (err) {
		// return err.response.data.msg;
		throw new Error(err.response.data.msg);
	}
}

module.exports = {
	getAccountTotalBalance,
	getSpotUSDTBalance,
};
