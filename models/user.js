const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  pw: {
    type: String,
    required: true
  },
  productsList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ]
});

module.exports = mongoose.model("User", userSchema);