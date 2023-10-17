const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    avatar:{
      type:String,
    },
    role: {
      type: Number,
      enum:[12,13],
      default: 13,
    },
    // cart: [
    //   {
    //     product: { type: mongoose.Types.ObjectId, ref: "Product" },
    //     quantity: Number,
    //     color: String,
    //   },
    // ],
    address: { type: String },
    wishList: [{ type: mongoose.Types.ObjectId, ref: "Product" }],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },

    passwordChangedAt: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExprire: {
      type: String,
    },
    registerToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//truoc khi luu se thuc hien callback
userSchema.pre("save", async function (next) {
  // if change password
  if (!this.isModified("password")) {
    next();
  }
  const salt = bcrypt.genSaltSync(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods = {
  isCorrectPassword: async function (password) {
    return await bcrypt.compare(password, this.password);
  },
  createPasswordChangedToken: function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetExprire = Date.now() + 15 * 60 * 1000;
    return resetToken;
  },
};
//Export the model
module.exports = mongoose.model("User", userSchema);
