const User = require("../models/user");
const bcrypt = require("bcrypt");

const getUsers = async (req, res) => {
  try {
    const allUsers = await User.find();

    return res.status(201).json({
      success: true,
      data: {
        total: allUsers.length,
        users: allUsers,
      },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber, role } = req.body;

    // check for duplicate users in the db
    const duplicate = await User.findOne({ email: email });

    if (duplicate)
      return res
        .status(409)
        .json({ success: false, message: "Email đã tồn tại" }); // conflic status code

    try {
      // encrypt the password
      const hashed_pw = await bcrypt.hash(password, 10);

      // update Database
      const new_user = new User({
        email,
        fullName,
        phoneNumber,
        role,
        isActive: true,
        password: hashed_pw,
      });
      await new_user.save();

      return res
        .status(201)
        .json({ success: true, message: "Tạo tài khoản thành công" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { userId } = req.body;
    const onUpdateUser = await User.findById(userId);

    if (!onUpdateUser) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản không tồn tại",
      });
    }

    await User.findByIdAndUpdate(userId, {
      isActive: !onUpdateUser.isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Cập nhật thành công",
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id, fullName, phoneNumber, role } = req.body;

    const onUpdateUser = await User.findById(id);

    if (!onUpdateUser) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản không tồn tại",
      });
    }

    await User.findByIdAndUpdate(id, {
      fullName,
      phoneNumber,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "Cập nhật thành công",
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateStatus,
  updateUser,
};
