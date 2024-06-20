const {
	getAccountTotalBalance,
	getSpotUSDTBalance,
} = require('../services/balance');
const { sendBalanceReport } = require('../services/send-message');

const getAccountTotal = async (req, res) => {
	try {
		const totalBalanceUSD = await getAccountTotalBalance();

		sendBalanceReport(totalBalanceUSD.toFixed(2));

		return res.status(201).json({
			success: true,
			data: {
				totalBalance: totalBalanceUSD.toFixed(2),
			},
		});
	} catch (err) {
		return res.status(500).json({ success: false, err: err.message });
	}
};

const getSpotUSDT = async (req, res) => {
	try {
		const spotUSDTBalance = await getSpotUSDTBalance();

		return res.status(201).json({
			success: true,
			data: {
				spotUSDTBalance: spotUSDTBalance.toFixed(2),
			},
		});
	} catch (err) {
		return res.status(500).json({ success: false, err: err.message });
	}
};

module.exports = {
	getAccountTotal,
	getSpotUSDT,
};
