const config = require('../config');
const { UMFutures } = require('@binance/futures-connector');

const apiKey = config.binancePublic;
const apiSecret = config.binanceSecret;

const margin = 5;
const profit = 0.3;
const stopLoss = 0.25;

const umFuturesClient = new UMFutures(apiKey, apiSecret, {
	baseURL: 'https://fapi.binance.com',
});

async function openFutureOrder({ symbol, side, type, quantity, price }) {
	if (!symbol || !side || !type || !quantity || !price) return null;

	return umFuturesClient.newOrder(symbol, side, type, {
		timeInForce: 'GTC',
		quantity,
		price,
	});
}

function getOpenPriceForFutureOrder({ laterCandle, isLaterCandleUp }) {
	// open price should be 43% of the laterCandle
	// Example: if the laterCandle is a down with open is 5$ and close is 3$, the openPrice for the future order should be: 3 + (5 -3) * 42 / 100 = 3.84
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
	closePrice = isLaterCandleUp ? openPrice + (profit / margin) * openPrice : openPrice - (profit / margin) * openPrice;

	return closePrice;
}

function getStopLossForFutureOrder({ openPrice, isLaterCandleUp }) {
	// stoploss should aim for 25%
	let stopLossPrice = 0;

	// since margin is x5, to stoploss at 25%, need to see 5% (25% / 5) change in the openPrice
	stopLossPrice = isLaterCandleUp
		? openPrice - (stopLoss / margin) * openPrice
		: openPrice + (stopLoss / margin) * openPrice;

	return stopLossPrice;
}

module.exports = {
	openFutureOrder,
	getOpenPriceForFutureOrder,
	getClosePriceForFutureOrder,
	getStopLossForFutureOrder,
};
