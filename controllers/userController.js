const User = require("../models/user");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const {
  findOneAndDelete,
  findByIdAndUpdate,
  findOne,
  findOneAndUpdate,
} = require("../models/user");
const { users } = require("../ultils/constants");
const sendMail = require("../ultils/sendMail");
const crypto = require("crypto");
const makeToken = require("uniqid");

// const register = asyncHandler(async (req, res) => {
//   const { email, password, firstname, lastname } = req.body;
//   if (!email || !password || !lastname || !firstname) {
//     return res.status(400).json({
//       success: false,
//       mes: "Missing inputs",
//     });
//   }
//   const user = await User.findOne({ email });
//   if (user) {
//     throw new Error("User has existed");
//   } else {
//     const newUser = await User.create(req.body);
//     return res.status(200).json({
//       success: newUser ? true : false,
//       mes: newUser
//         ? "Register is successfully. You can login now"
//         : "Something went wrong",
//     });
//   }
// });

const register = asyncHandler(async (req, res) => {
  const { email, firstname, lastname, password, phone } = req.body;
  if (!email || !password || !lastname || !firstname || !phone) {
    return res.status(400).json({
      success: false,
      mes: "Missing inputs",
    });
  }
  const user = await User.findOne({ email });
  if (user) {
    throw new Error("User has existed");
  } else {
    const token = makeToken();
    const emailEdited = btoa(email) + "@" + token;
    const newUser = await User.create({
      email: emailEdited,
      password,
      firstname,
      lastname,
      phone,
    });
    if (newUser) {
      const html = `<h2>Register code:</h2><br/><blockquote>${token}</blockquote> `;
      const data = {
        email,
        html,
        subject: "Confirm Signup",
      };
      await sendMail(data);
    }
    setTimeout(async () => {
      await User.deleteOne({ email: emailEdited });
    }, [1000 * 60 * 15]);
    return res.json({
      success: newUser ? true : false,
      mes: newUser
        ? "Please check your email to active account"
        : "Something went wrong",
    });
  }
});
const confirmRegister = asyncHandler(async (req, res) => {
  // const cookie = req.cookies;
  const { token } = req.params;

  //lay ra thang email co phan` duoi la token
  const notActivedEmail = await User.findOne({
    email: new RegExp(`${token}$`),
  });
  if (notActivedEmail) {
    notActivedEmail.email = atob(notActivedEmail?.email?.split("@")[0]);
    notActivedEmail.save();
  }
  return res.json({
    success: notActivedEmail ? true : false,
    mes: notActivedEmail
      ? "Register is successfully. You can login now"
      : "Something went wrong",
  });
});
//refresh token => cap moi token
//access token => xac thuc nguoi dung , phan quyen`
const login = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      mes: "Missing inputs",
    });
  }
  const response = await User.findOne({ email });

  const correctPassword = await response.isCorrectPassword(password);
  if (response && correctPassword) {
    //Tach password va role khoi response
    const { password, role, refreshToken, ...data } = response.toObject();
    //Tao accessToken
    const accessToken = generateAccessToken(response._id, role);
    //Tao refreshToken
    const newRefreshToken = generateRefreshToken(response._id);
    //Luu refreshToken vao database
    await User.findByIdAndUpdate(
      response._id,
      { refreshToken: newRefreshToken },
      { new: true }
    );
    //Luu refresh vao cookie thoi gian het han la 7 ngay
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      accessToken,

      userData: data,
    });
  } else {
    throw new Error("Invalid user please check your email or password!");
  }
});
const expiredToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie && !cookie.refreshToken) {
    throw new Error("No refresh token in cookies");
  } else {
    //Check token co con` han su dung ko
    const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET);
    //Check token co giong trong db ko
    const response = await User.findOne({
      _id: rs._id,
      refreshToken: cookie.refreshToken,
    });
    return res.status(200).json({
      success: response ? true : false,
      newAccessToken: response
        ? generateAccessToken(response._id, response.role)
        : "Refresh token invalid",
    });
  }
});
const getUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  // khong hien thi 3 truong trong select
  const user = await User.findById(_id).select("-refreshToken -password ");

  return res.status(200).json({
    success: user ? true : false,
    result: user ? user : "User not found",
  });
});
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie || !cookie.refreshToken) {
    throw new Error("No refresh token");
  } else {
    //xoa token o db
    await User.findOneAndUpdate(
      { refreshToken: cookie.refreshToken },
      { refreshToken: "" },
      { new: true }
    );
    //xoa token o cookie
    res.clearCookie("refreshToken", { httpOnly: true, secure: true });
    return res.status(200).json({ success: true, mes: "Logout is done" });
  }
});

// Client gui Email
// Server check email co hop le khong => server gui email + link (password change token)
// Client check mail => click link
// Client gui API kem token
// Server Check token co giong voi token ma server gui mail hay ko
// Change password

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new Error("Missing Email");
  } else {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    //khi sử dụng hàm đc định nghĩa trong schema phải save() để lưu lại những thay đổi
    //trong trường hợp hàm createPasswordChangedToken sẽ update 2 field là passwordResetToken và passwordResetExpire
    const resetToken = user.createPasswordChangedToken();
    await user.save();

    const html = `Please click this Link to change password.The link is only valid for 15 minutes.
    <a href="${process.env.URL_CLIENT}/reset-password/${resetToken}">CLick here</a> `;

    const data = {
      email,
      html,
      subject: "Forgot password",
    };
    const rs = await sendMail(data);
    return res.status(200).json({
      success: rs.response.includes("OK") ? true : false,
      rs,
      mes: rs.response.includes("OK")
        ? "Please check your email to create new password"
        : "Invalid Email ",
    });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password, token } = req.body;
  if (!password || !token) throw new Error("Missing input");

  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExprire: { $gt: Date.now() },
  });
  if (!user) {
    throw new Error("Invalid reset token");
  } else {
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordChangedAt = Date.now();
    user.passwordResetExprire = undefined;
    await user.save();
    return res.status(200).json({
      success: user ? true : false,
      mes: user ? "Updated password" : "Something went wrong",
    });
  }
});
const getUsers = asyncHandler(async (req, res) => {
  const queries = { ...req.query };
  console.log(queries);
  //Tach cac truong dac biet ra khoi query
  const excludeFields = ["limit", "sort", "page", "fields"];
  excludeFields.forEach((element) => delete queries[element]);

  //Format lai cac operators cho dung cu phap mongoose
  let queryString = JSON.stringify(queries).replace(
    /\b(gte|gt|lt|lte)\b/g,
    (matchedElement) => `$${matchedElement}`
  );

  const formatedQueries = JSON.parse(queryString);

  // if (queries?.name)
  //   formatedQueries.name = { $regex: queries.title, $options: "i" };
  if (req.query.searchKey) {
    delete formatedQueries.searchKey;
    formatedQueries["$or"] = [
      { firstname: { $regex: req.query.searchKey, $options: "i" } },
      { lastname: { $regex: req.query.searchKey, $options: "i" } },
      { email: { $regex: req.query.searchKey, $options: "i" } },
    ];
  }
  console.log(formatedQueries);
  let queryCommand = User.find(formatedQueries);
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    queryCommand = queryCommand.sort(sortBy);
  }
  //fields limit
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    queryCommand = queryCommand.select(fields);
  }
  //pagination
  const page = +req.query.page || 1;
  const limit = +req.query.limit || process.env.LIMIT_PRODUCT;
  const skip = (page - 1) * limit;
  queryCommand.skip(skip).limit(limit);
  //so luong san pham thoa dieu kien
  queryCommand.then(async (response, err) => {
    if (err) throw new Error(err.message);
    const counts = await User.find(formatedQueries).countDocuments();

    return res.status(200).json({
      success: response ? true : false,
      listUser: response ? response : "Cant not get all products",
      counts,
    });
  });
});
const deleteUser = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (!uid) throw new Error("Missing input");
  const response = await User.findByIdAndDelete(uid);
  return res.status(200).json({
    success: response ? true : false,
    mes: response
      ? `User with email ${response.email} deleted`
      : "Can't not delete",
  });
});
const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { firstname, lastname, email, phone, address } = req.body;
  const data = { firstname, lastname, email, phone, address };
  if (!_id || Object.keys(req.body).length === 0)
    throw new Error("Missing input");
  if (req.file) {
    data.avatar = req.file.path;
  }
  const response = await User.findByIdAndUpdate(_id, data, {
    new: true,
  }).select("-password -role -refreshToken");
  return res.status(200).json({
    success: response ? true : false,
    mes: response ? "Updated" : "Something went wrong",
  });
});
const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error("Missing input");
  const response = await User.findByIdAndUpdate(uid, req.body, {
    new: true,
  }).select("-password -role");
  return res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : "Something went wrong",
  });
});
const updateAddressUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!req.body.address) throw new Error("Missing inputs");
  const response = await User.findByIdAndUpdate(
    _id,
    { $push: { address: req.body.address } },
    {
      new: true,
    }
  ).select("-password -role");
  return res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : "Something went wrong",
  });
});

const createUsers = asyncHandler(async (req, res) => {
  const rs = await User.create(users);
  return res.status(200).json({
    success: rs ? true : false,
    listUser: rs ? rs : "Something went wrong",
  });
});
module.exports = {
  register,
  confirmRegister,
  login,
  expiredToken,
  getUser,
  logout,
  forgotPassword,
  resetPassword,
  getUsers,
  deleteUser,
  updateUser,
  updateUserByAdmin,
  updateAddressUser,

  createUsers,
};
