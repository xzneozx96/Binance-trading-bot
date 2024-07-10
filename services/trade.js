const config = require('../config');
const { UMFutures } = require('@binance/futures-connector');
const { Spot } = require('@binance/connector');
const { getSpotUSDTBalance } = require('./balance');
const { sendOrderPlacementNoti } = require('./send-message');

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

		const formattedPrice = await formatPriceToRequiredPrecision(symbol, price);

		const formattedQuantity = qty
			? qty
			: await formatQtyToRequiredPrecision(
					symbol,
					(currentUSDTBalance - 0.5) / price
			  );

		return spotClient.newOrder(symbol, side, type, {
			price: formattedPrice,
			quantity: formattedQuantity,
			timeInForce: 'GTC',
		});
	} catch (err) {
		if (err.data && err.data.msg) {
			throw new Error(err.data.msg);
		} else {
			throw new Error(err);
		}
	}
}

async function monitorSpotOrderStatus({ symbol, orderId, targetPrice }) {
	const checkOrderStatus = async () => {
		const orderStatusRes = await spotClient.getOrder(symbol, {
			orderId,
		});

		const spotOrder = orderStatusRes.data;

		const { status, executedQty, price: entryPrice } = spotOrder;

		// if the order has been triggered, setup another order that will sell at target price
		if (status === 'FILLED') {
			clearInterval(orderCheckInterval);

			const side = 'SELL';
			const type = 'LIMIT';

			sendOrderPlacementNoti({
				symbol,
				side: 'SELL',
				openPrice: parseFloat(entryPrice),
				takeProfit: targetPrice,
			});

			const sellOrderResult = await openSpotOrder({
				symbol,
				side,
				type,
				price: targetPrice,
				qty: parseFloat(executedQty),
			});

			console.log('sellOrderResult', sellOrderResult.data);
		}
	};

	const orderCheckInterval = setInterval(checkOrderStatus, 10000);
	checkOrderStatus();
}

async function formatPriceToRequiredPrecision(symbol, price) {
	const response = await spotClient.exchangeInfo();
	const symbolInfo = response.data.symbols.find((s) => s.symbol === symbol);

	// Get the allowed precision for price and quantity
	const pricePrecision = symbolInfo.filters.find(
		(f) => f.filterType === 'PRICE_FILTER'
	).tickSize;

	// Convert precision to number of decimal places
	const priceDecimals = Math.log10(1 / parseFloat(pricePrecision));

	const formattedPrice = parseFloat(price).toFixed(priceDecimals);

	return formattedPrice;
}

async function formatQtyToRequiredPrecision(symbol, qty) {
	const response = await spotClient.exchangeInfo();
	const symbolInfo = response.data.symbols.find((s) => s.symbol === symbol);

	// Get the allowed precision for quantity
	const lotSizePrecision = symbolInfo.filters.find(
		(f) => f.filterType === 'LOT_SIZE'
	).stepSize;

	// Convert precision to number of decimal places
	const quantityDecimals = Math.log10(1 / parseFloat(lotSizePrecision));

	const formattedQty = parseFloat(qty).toFixed(quantityDecimals);

	return formattedQty;
}

async function getCurrentPrice(symbol) {
	const response = await spotClient.tickerPrice(symbol);
	const latestPrice = response.data.price;

	return latestPrice;
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
	getCurrentPrice,
	getOpenPriceForFutureOrder,
	getClosePriceForFutureOrder,
	getStopLossForFutureOrder,
};
