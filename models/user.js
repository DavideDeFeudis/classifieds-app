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
      // productsList stores a list of IDs
      type: mongoose.Schema.Types.ObjectId,
      // sets up the relation with the product model
      ref: "Product"
    }
  ]
});

module.exports = mongoose.model("User", userSchema);
