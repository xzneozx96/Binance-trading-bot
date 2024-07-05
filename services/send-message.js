const axios = require('axios');

const fbAccessToken =
	'EAANpzAfMX6oBO9yHE0CjM1jqCVnk72wn6xJsVXM7leDHS6tK836cAjUDfi0FGC38WQNoQ4ZAN6qV99kdrMS0CnqxZB1z6Us9hTDnPmXz9DHfXN15dRkjmuqdyuSkWM89wy0sZAid83VD2TVpKv3wfZANafEhvMxCtHZCHQwXEI4OG72FIS0btNGrCoIa0ZBhMZD';

const sendWhaleAlert = async (content) => {
	const {
		symbol,
		avgPrice,
		percentageChange,
		kline,
		orderType,
		openPrice,
		closePrice,
		stopLoss,
	} = content;

	const notiMsg = {
		recipient: {
			id: '6351453234935287',
		},
		message: {
			text: `The following cryptocurrency has experienced a significant change:

- Symbol: ${symbol}
- Average Price: ${avgPrice}
- Kline Interval: ${kline}
- Percentage Change: ${percentageChange}%
- Trade Recommendation:
	Open ${orderType}: ${openPrice},
	Margin: x5,
	Take profit: ${closePrice} (30%),
	Stoploss: ${stopLoss} (25%)
      `,
		},
		messaging_type: 'MESSAGE_TAG',
		tag: 'ACCOUNT_UPDATE',
	};
	console.log('about to send msg', JSON.stringify(notiMsg));

	const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${fbAccessToken}`;
	const params = {
		method: 'POST',
		body: JSON.stringify(notiMsg),
		headers: { 'Content-Type': 'application/json' },
	};

	const req = await fetch(url, params);
	const body = await req.json();

	console.log('send msg success', body);
};

const sendBalanceReport = async (totalBalance) => {
	const notiMsg = {
		recipient: {
			id: '6351453234935287',
		},
		message: {
			text: `Hello Boss, please take a look at your current total balance: ${totalBalance} USD
      `,
		},
		messaging_type: 'MESSAGE_TAG',
		tag: 'ACCOUNT_UPDATE',
	};
	console.log('about to send msg', JSON.stringify(notiMsg));

	const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${fbAccessToken}`;
	const params = {
		method: 'POST',
		body: JSON.stringify(notiMsg),
		headers: { 'Content-Type': 'application/json' },
	};

	const req = await fetch(url, params);
	const body = await req.json();

	console.log('send msg success', body);
};

const sendOrderPlacementNoti = async (content) => {
	const { symbol, side, openPrice, takeProfit } = content;

	const notiMsg = {
		recipient: {
			id: '6351453234935287',
		},
		message: {
			text: `New order has been placed:

- Symbol: ${symbol}
- Order Type: ${side}
- Open Price: ${openPrice}
- Take Profit: ${takeProfit}
      `,
		},
		messaging_type: 'MESSAGE_TAG',
		tag: 'ACCOUNT_UPDATE',
	};
	console.log('about to send msg', JSON.stringify(notiMsg));

	const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${fbAccessToken}`;

	try {
		const response = await axios.post(url, notiMsg, {
			headers: { 'Content-Type': 'application/json' },
		});
		console.log('send msg success', response.data);
	} catch (error) {
		console.error(
			'Error sending message:',
			error.response ? error.response.data : error.message
		);
	}
};

module.exports = { sendWhaleAlert, sendBalanceReport, sendOrderPlacementNoti };
