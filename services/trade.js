const config = require('../config');
const { UMFutures } = require('@binance/futures-connector');
const { Spot } = require('@binance/connector');
const { getSpotUSDTBalance } = require('./balance');

const apiKey = config.binancePublic;
const apiSecret = config.binanceSecret;

const margin = 5;
const futuFrofit = 0.3;
const futuStopLoss = 0.25;

const umFuturesClient = new UMFutures(apiKey, apiSecret, {
	baseURL: 'https://fapi.binance.com',
});

const spotClient = new Spot(apiKey, apiSecret);

async function openFutureOrder({ symbol, side, type, quantity, price }) {
	if (!symbol || !side || !type || !quantity || !price) return null;

	return umFuturesClient.newOrder(symbol, side, type, {
		timeInForce: 'GTC',
		quantity,
		price,
	});
}

async function openSpotOrder({ symbol, side, type, price, qty }) {
	try {
		if (!symbol || !side || !price || !type)
			return {
				success: false,
				msg: 'No symbol/side/price/type was provided',
			};

		const currentUSDTBalance = await getSpotUSDTBalance();

		if (currentUSDTBalance < 5 && side === 'BUY') {
			console.log(
				'Your Spot USDT is less than 10$. Not enough to place any order'
			);
			return {
				success: false,
				msg: 'Your Spot USDT is less than 10$. Not enough to place any order',
			};
		}

		console.log(
			`about to sell ${symbol}, take profit at ${price}, the amount is ${qty}`
		);

		const command =
			side === 'BUY'
				? {
						// using quoteOrderQty, just need to tell Binance how much i'm willing to spend on buying the asset
						// then, Binance will calculate the quantity itself
						// this approach eliminates all unnecessary calculation
						quoteOrderQty: currentUSDTBalance,
				  }
				: {
						price,
						quantity: qty,
						timeInForce: 'GTC',
				  };

		const newOrderResult = await spotClient.newOrder(
			symbol,
			side,
			type,
			command
		);

		return newOrderResult;
	} catch (err) {
		console.error(err.data.message);
		throw new Error(err.data.msg);
	}
}

async function monitorSpotOrderStatus({ symbol, orderId, targetPrice }) {
	const checkOrderStatus = async () => {
		const orderStatusRes = await spotClient.getOrder(symbol, {
			orderId,
		});

		const spotOrder = orderStatusRes.data;

		const { status, origQty } = spotOrder;

		// if the order has been triggered, setup another order that will sell at target price
		if (status === 'FILLED') {
			const side = 'SELL';
			const type = 'LIMIT';

			console.log('sell order has been placed');

			const sellOrderResult = await openSpotOrder({
				symbol,
				side,
				type,
				price: targetPrice,
				qty: origQty,
			});

			console.log('sellOrderResult', sellOrderResult);
		}
		// otherwise, check the order status every 1m
		else {
			console.log('Buy order not filled yet. Checking again in 1 minute...');
			setTimeout(checkOrderStatus, 3000); // Check again in 10 seconds
		}
	};

	checkOrderStatus();
}

function getOpenPriceForFutureOrder({ laterCandle, isLaterCandleUp }) {
	// open price should be 43% of the laterCandle
	// Example: if the laterCandle is a down with open is 5$ and close is 3$, the openPrice for the future order should be: 3 + (5 -3) * 43 / 100 = 3.84
	let openPrice = 0;
	const { open, close } = laterCandle;

	const indicator = (Math.abs(close - open) * 43) / 100;

	openPrice = isLaterCandleUp ? close - indicator : close + indicator;

	return openPrice;
}

function getClosePriceForFutureOrder({ openPrice, isLaterCandleUp }) {
	// close price should aim for 30% profit
	let closePrice = 0;

	// since margin is x5, to achieve 30% profit, need to see 6% (30% / 5) change in the openPrice
	closePrice = isLaterCandleUp
		? openPrice + (futuFrofit / margin) * openPrice
		: openPrice - (futuFrofit / margin) * openPrice;

	return closePrice;
}

function getStopLossForFutureOrder({ openPrice, isLaterCandleUp }) {
	// stoploss should aim for 25%
	let stopLossPrice = 0;

	// since margin is x5, to stoploss at 25%, need to see 5% (25% / 5) change in the openPrice
	stopLossPrice = isLaterCandleUp
		? openPrice - (futuStopLoss / margin) * openPrice
		: openPrice + (futuStopLoss / margin) * openPrice;

	return stopLossPrice;
}

module.exports = {
	openFutureOrder,
	openSpotOrder,
	monitorSpotOrderStatus,
	getOpenPriceForFutureOrder,
	getClosePriceForFutureOrder,
	getStopLossForFutureOrder,
};
