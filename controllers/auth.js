const User = require("../models/user");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "Không được bỏ trống địa chỉ Email và mật khẩu!",
      });

    // check if the entered email exists
    const found_user = await User.findOne({ email: email });

    if (!found_user)
      return res
        .status(401)
        .json({ success: false, message: "Tài khoản không tồn tại" }); // 401: Unauthorized server code

    // evaluate password
    const is_pw_matched = await bcrypt.compare(password, found_user.password);
    if (is_pw_matched) {
      // generate access and refresh token
      const access_token = jwt.sign(
        {
          userId: found_user._id,
          name: found_user.fullName,
          email: found_user.email,
          role: found_user.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" },
      );

      const refresh_token = jwt.sign(
        {
          email: found_user.email,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "30d" },
      );

      // save refresh_token of the recently logged-in user to database
      await User.findByIdAndUpdate(found_user._id, {
        refreshToken: refresh_token,
      });

      // send back to client the refresh_token securely via "httpOnly" which is not available to javascript - cookies must be sent right before the json in order to succeed
      res.cookie("jwt", refresh_token, {
        httpOnly: true,
        secure: true, // set to false while testing with thunder client / postman, set to true while testing with front-end
        sameSite: "None",
        maxAage: 30 * 24 * 60 * 60 * 1000, // equal to 30 day in milliseconds
      });

      // send back to client the success message and the access_token
      return res.status(200).json({
        data: { accessToken: access_token },
        statusCode: 201,
        message: "Đăng nhập thành công",
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Mật khẩu không chính xác" });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
  }
};

const logout = async (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.jwt) {
      return res.sendStatus(204);
    }

    const refresh_token = cookies.jwt;

    // check if the refresh_token is in the database.
    const found_user = await User.findOne({ refreshToken: refresh_token });

    // If it does NOT exists but we do have a cookie, clear the cookie.
    if (!found_user) {
      res.clearCookie("jwt", { httpOnly: true });
      return res.sendStatus(204);
    }

    // If it does exists, delete the refresh_token in the database and clear the cookie as well
    // update the database
    await User.findByIdAndUpdate(found_user._id, {
      refreshToken: "",
    });

    // clear cookie
    res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "None" });

    return res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.jwt)
      return res.status(401).json({
        message: "You are not allowed to perform this action",
        success: false,
      }); // Unauthorized

    const refresh_token = cookies.jwt;

    // check if the user who is sending refresh_token request exists
    const found_user = await User.findOne({ refreshToken: refresh_token });

    if (!found_user)
      return res.status(403).json({
        message: "You are not allowed to perform this action",
        success: false,
      }); // Forbidden

    // evaluate refresh_token
    jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded_jwt) => {
        if (err || found_user.username !== decoded_jwt.username)
          return res
            .status(403)
            .json({ message: "Refresh Token has expired", success: false });

        // once the refresh_token has been verified, send back a new access_token
        const new_access_token = jwt.sign(
          { username: decoded_jwt.username },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "5m" },
        );

        // send back the new access token to client
        return res.status(200).json({ access_token: new_access_token });
      },
    );
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
};
