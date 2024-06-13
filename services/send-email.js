const nodeMailer = require("nodemailer");
const User = require("../models/user");
const {
  getWOTemplate,
  getWRTemplate,
  getPMTemplate,
  getCommentPostedTemplate,
} = require("./mail-templates");

const config = {
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "bkgallery611@gmail.com",
    pass: "cvdn earm qtjj dfno",
  },
};

const sendMail = (data) => {
  const transporter = nodeMailer.createTransport(config);
  transporter.sendMail(data, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log(info.response);
    }
  });
};

module.exports = { sendMail, onSendingEmail };
