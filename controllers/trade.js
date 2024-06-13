const { openFutureOrder } = require("../services/trade");

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
        msg: "No symbol/side/type/quantity/price was provided",
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

module.exports = {
  newFutureOrder,
};
