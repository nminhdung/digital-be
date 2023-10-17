const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Types.ObjectId, ref: "Product" },
      quantity: { type: Number },
      color: { type: String },
      price: { type: Number },
    },
  ],

  status: {
    type: String,
    default: "Processing",
    enum: ["Cancelled", "Processing", "Succeed"],
  },

  total: { type: Number },
  coupon: { type: mongoose.Types.ObjectId, ref: "Coupon" },

  orderBy: {
    userId:{type: String},
    fullname: { type: String },
    address: { type: String },
    phone: { type: Number, dropDups: true},
  },
});

//Export the model
module.exports = mongoose.model("Order", orderSchema);
