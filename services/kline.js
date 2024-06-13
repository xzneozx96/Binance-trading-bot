const axios = require("axios");
const { WebsocketStream } = require("@binance/connector");
const { logger } = require("../helper/logger");
const { binanceApiBaseUrl } = require("../config/constant");
const { sendWhaleAlert } = require("./send-message");
const {
  getClosePriceForFutureOrder,
  getStopLossForFutureOrder,
  getOpenPriceForFutureOrder,
} = require("./trade");

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
  const {
    t: currentStartTime,
    o: open,
    c: close,
    i: klineInterval,
    h: highestPrice,
    l: lowestPrice,
  } = candlestick;

  // check if the current start time has been evaluated or not
  // Case 1: already evaluated => stop calculating
  if (
    lastEvaluatedCandlesticks[symbol] &&
    lastEvaluatedCandlesticks[symbol][klineInterval] === currentStartTime
  ) {
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

  logger.info("current candlestick", parsedData);

  // 2.2. update the lastEvaluatedStartTime prop of the according ticker
  lastEvaluatedCandlesticks[symbol][klineInterval] = currentStartTime;

  // 2.3. evaluate 2 candlesticks that come right before the current one
  const onEvaluateCandleSticks = await fetchPreviousCandlesticks(
    symbol,
    currentStartTime,
    klineInterval,
  );

  // logger.info(`the most 2 recent candlestick bars ${JSON.stringify(onEvaluateCandleSticks)}`);

  if (onEvaluateCandleSticks.length >= 2) {
    // calculate percentageChange
    const { laterCandle, percentageChange, isLaterCandleUp } =
      evaluateCandlesticks(symbol, onEvaluateCandleSticks);

    // if recogize significant change, send noti over facebook immediately
    // if the symbol is BTC, BNB or ETH, send noti if percentageChange > 3
    const isBigBoss = ["btnusdt", "bnbusdt", "ethusdt"].includes(
      symbol.toLowerCase(),
    );

    if (
      (isBigBoss && Math.abs(percentageChange) > 0.23) ||
      (!isBigBoss && Math.abs(percentageChange) > 8)
    ) {
      // step 1: calculate the trade
      const openPrice = getOpenPriceForFutureOrder({
        laterCandle,
        isLaterCandleUp,
      });
      const closePrice = getClosePriceForFutureOrder({
        openPrice,
        isLaterCandleUp,
      });
      const stopLoss = getStopLossForFutureOrder({
        openPrice,
        isLaterCandleUp,
      });

      // step 2: send recommendation over facebook
      sendWhaleAlert({
        symbol,
        avgPrice: (parseFloat(highestPrice) + parseFloat(lowestPrice)) / 2,
        kline: klineInterval,
        percentageChange,
        orderType: isLaterCandleUp ? "LONG" : "SHORT",
        openPrice,
        closePrice,
        stopLoss,
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

  const percentageChange = (
    ((laterCandle.close - previousCandle.open) / previousCandle.open) *
    100
  ).toFixed(2);

  console.log(
    `Symbol: ${symbol} - Previous candle is ${isPreviousCandleUp ? "up" : "down"} - Later candle is ${
      isLaterCandleUp ? "up" : "down"
    }`,
  );
  console.log(
    "Percentage change:",
    percentageChange > 0
      ? `later candle is higher than previous one: ${Math.abs(percentageChange)}`
      : `later candle is lower than previous one: ${Math.abs(percentageChange)}`,
  );

  return { laterCandle, percentageChange, isLaterCandleUp };
}

const callbacks = {
  open: () => logger.debug("Connected with Websocket server"),
  close: () => logger.debug("Disconnected with Websocket server"),
  message: async (data) => {
    processTickerPrice(data);
  },
};

const websocketStreamClient = new WebsocketStream({
  logger,
  callbacks,
  combinedStreams: true,
});

module.exports = { websocketStreamClient };

// setTimeout(() => websocketStreamClient.unsubscribe('bnbusdt@kline_5m'), 3000);
// setTimeout(() => websocketStreamClient.disconnect(), 12000);
