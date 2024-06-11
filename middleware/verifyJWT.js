const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJWT = (req, res, next) => {
  const auth_header = req.headers["authorization"]; // Bearer access_token

  if (!auth_header) return res.status(401).json({ msg: "Unauthorized" });

  const access_token = auth_header.split(" ")[1]; // extract the access_token
  jwt.verify(
    access_token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded_token) => {
      if (err)
        return res
          .status(403) // invalid access_token
          .json({
            msg: "Forbidden! You do not have access to this resource !",
          });

      // set the logged in user to the username stored in the token
      req.username = decoded_token.username;
      next();
    }
  );
};

module.exports = verifyJWT;
