const { sendOrderPlacementNoti } = require('../services/send-message');
const {
	openFutureOrder,
	openSpotOrder,
	monitorSpotOrderStatus,
} = require('../services/trade');

const newFutureOrder = async (req, res) => {
	try {
		const { body } = req;

		const { symbol, side, type, price, quantity } = body;

		const response = await openFutureOrder({
			symbol,
			side,
			type,
			price,
			quantity,
		});

		if (!response) {
			return res.status(201).json({
				success: false,
				msg: 'No symbol/side/type/quantity/price was provided',
			});
		}

		return res.status(201).json({
			success: true,
			data: {
				...response.data,
			},
		});
	} catch (err) {
		console.log(err.response.data);
		return res.status(500).json({ success: false, ...err.response.data });
	}
};

const newSpotOrder = async (req, res) => {
	try {
		const { body } = req;

		const { symbol, side, type, price } = body;

		const response = await openSpotOrder({
			symbol,
			side,
			type,
			price,
		});

		if (!response.data && !response.success) {
			return res.status(400).json({
				success: false,
				msg: response.msg,
			});
		}

		const takeProfit = price + price * 0.05; // 5% profit for BUY order

		const { orderId } = response.data;

		if (orderId) {
			// send noti about the new trade
			await sendOrderPlacementNoti({
				symbol,
				side,
				openPrice: price.toFixed(6),
				takeProfit: takeProfit.toFixed(6),
			});

			// setup take_profit order once the order is FILLED
			monitorSpotOrderStatus({ symbol, orderId, targetPrice: takeProfit });
		}

		return res.status(201).json({
			success: true,
			data: {
				...response.data,
			},
		});
	} catch (err) {
		console.log(err);

		const errorMsg = err.response ? err.response.data : err.data.msg;
		return res.status(500).json({ success: false, ...errorMsg });
	}
};

module.exports = {
	newFutureOrder,
	newSpotOrder,
};
