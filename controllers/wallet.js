const { Spot } = require('@binance/connector');
const config = require('../config');
const { logger } = require('../helper/logger');

const apiKey = config.binancePublic;
const apiSecret = config.binanceSecret;

const client = new Spot(apiKey, apiSecret);

const getBalance = async (req, res) => {
	try {
		const response = await client.accountSnapshot('SPOT');

		const snapshot = response.data;

		return res.status(201).json({
			success: true,
			data: {
				snapshot,
			},
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({ success: false, message: 'Lỗi Server. Vui lòng thử lại sau' });
	}
};

module.exports = {
	getBalance,
};
