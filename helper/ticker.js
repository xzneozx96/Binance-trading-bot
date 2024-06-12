const axios = require('axios');
const { binanceApiBaseUrl } = require('../config/constant');
const { sendFacebookMessage } = require('../services/send-message');
const { logger } = require('./logger');

let lastEvaluatedCandlesticks = {}; // Store candlestick data for all symbols
async function processTickerPrice(tickerData) {
	const parsedData = JSON.parse(tickerData);
	// Example of parsedData: {
	// 	stream: 'bnbusdt@kline_5m',
	// 	data: {
	// 		e: 'kline',
	// 		E: 1718025923948,
	// 		s: 'BNBUSDT',
	// 		k: {
	// 			t: 1718025900000,
	// 			T: 1718026199999,
	// 			s: 'BNBUSDT',
	// 			i: '5m',
	// 			f: 762489598,
	// 			L: 762489696,
	// 			o: '646.00000000',
	// 			c: '646.00000000',
	// 			h: '646.00000000',
	// 			l: '645.90000000',
	// 			v: '6.51900000',
	// 			n: 99,
	// 			x: false,
	// 			q: '4211.11220000',
	// 			V: '4.90100000',
	// 			Q: '3166.04600000',
	// 			B: '0'
	// 		}
	// 	}
	// }

	const { s: symbol, k: candlestick } = parsedData.data;
	const { t: currentStartTime, o: open, c: close, i: klineInterval, h: highestPrice, l: lowestPrice } = candlestick;

	// check if the current start time has been evaluated or not
	// Case 1: already evaluated => stop calculating
	if (lastEvaluatedCandlesticks[symbol] && lastEvaluatedCandlesticks[symbol][klineInterval] === currentStartTime) {
		// logger.info(`the timestamp ${currentStartTime} of symbol ${symbol} has already been evaluated`);
		return;
	}

	// Case 2: not evaluated
	// 2.1. check if the currency has been evaluated or not
	if (!lastEvaluatedCandlesticks[symbol]) {
		lastEvaluatedCandlesticks[symbol] = {
			[klineInterval]: currentStartTime,
			open: open,
			close: close,
		};
	}

	logger.info('current candlestick', parsedData);

	// 2.2. update the lastEvaluatedStartTime prop of the according ticker
	lastEvaluatedCandlesticks[symbol][klineInterval] = currentStartTime;

	// 2.3. evaluate 2 candlesticks that come right before the current one
	const onEvaluateCandleSticks = await fetchPreviousCandlesticks(symbol, currentStartTime, klineInterval);

	// logger.info(`the most 2 recent candlestick bars ${JSON.stringify(onEvaluateCandleSticks)}`);

	if (onEvaluateCandleSticks.length >= 2) {
		// calculate percentageChange
		const percentageChange = evaluateCandlesticks(symbol, onEvaluateCandleSticks);

		// if recogize significant change, send noti over facebook immediately
		// if the symbol is BTC, BNB or ETH, send noti if percentageChange > 3
		const isBigBoss = ['btnusdt', 'bnbusdt', 'ethusdt'].includes(symbol);

		if ((isBigBoss && Math.abs(percentageChange) > 2.3) || (!isBigBoss && Math.abs(percentageChange) > 8)) {
			sendFacebookMessage({
				symbol,
				avgPrice: (parseFloat(highestPrice) + parseFloat(lowestPrice)) / 2,
				kline: klineInterval,
				percentageChange,
			});
		}
	}
}
async function fetchPreviousCandlesticks(symbol, endTime, klineInterval) {
	try {
		const response = await axios.get(binanceApiBaseUrl, {
			params: {
				symbol: symbol,
				interval: klineInterval,
				endTime: endTime,
				limit: 3,
			},
		});

		// Remove the last candlestick as it's the current one
		return response.data.slice(0, 2).map((c) => ({
			startTime: c[0],
			open: parseFloat(c[1]),
			close: parseFloat(c[4]),
		}));
	} catch (error) {
		console.error(`Error fetching candlestick data for ${symbol}:`, error);
		return [];
	}
}

function evaluateCandlesticks(symbol, candlesticks) {
	if (candlesticks.length < 2) {
		return; // Need at least two candlesticks to evaluate
	}

	const [previousCandle, laterCandle] = candlesticks;

	const isLaterCandleUp = laterCandle.close > laterCandle.open;
	const isPreviousCandleUp = previousCandle.close > previousCandle.open;

	const percentageChange = (((laterCandle.close - previousCandle.open) / previousCandle.open) * 100).toFixed(2);

	console.log(
		`Symbol: ${symbol} - Previous candle is ${isPreviousCandleUp ? 'up' : 'down'} - Later candle is ${
			isLaterCandleUp ? 'up' : 'down'
		}`
	);
	console.log(
		'Percentage change:',
		percentageChange > 0
			? `later candle is higher than previous one: ${Math.abs(percentageChange)}`
			: `later candle is lower than previous one: ${Math.abs(percentageChange)}`
	);

	return percentageChange;
}

module.exports = { processTickerPrice };
