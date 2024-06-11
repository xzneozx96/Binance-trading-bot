const { WebsocketStream } = require('@binance/connector');
const { processTickerPrice } = require('../helper/ticker');
const { logger } = require('../helper/logger');

const callbacks = {
	open: () => logger.debug('Connected with Websocket server'),
	close: () => logger.debug('Disconnected with Websocket server'),
	message: async (data) => {
		processTickerPrice(data);
	},
};

const websocketStreamClient = new WebsocketStream({ logger, callbacks, combinedStreams: true });

module.exports = { websocketStreamClient };

// setTimeout(() => websocketStreamClient.unsubscribe('bnbusdt@kline_5m'), 3000);
// setTimeout(() => websocketStreamClient.disconnect(), 12000);
