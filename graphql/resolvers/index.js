require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../../models/product");
const User = require("../../models/user");
const jwt = require("jsonwebtoken");

// getCreator populates the creator prop (instead of Product.populate('creator'))
// for nested queries
const getCreator = async (id) => {
  try {
    const creator = await User.findById(id);
    return {
      ...creator._doc,
      pw: null,
      // creator.productsList is a list of ids
      productsList: getProductsList.bind(this, creator.productsList),
    };
  } catch (err) {
    throw err;
  }
};

// getProductsList populates the productsList prop, for nested queries
const getProductsList = async (ids) => {
  try {
    const productsList = await Product.find({ _id: { $in: ids } }); // gets all products from this ids arr
    return productsList.map((product) => {
      return {
        ...product._doc,
        creator: getCreator.bind(this, product._doc.creator),
      };
    });
  } catch (err) {
    throw err;
  }
};

module.exports = {
  products: async () => {
    try {
      const products = await Product.find();
      return products.map((product) => {
        return {
          ...product._doc,
          creator: getCreator.bind(this, product._doc.creator),
        };
      });
    } catch (err) {
      throw err;
    }
  },
  createProduct: async (args, req) => {
    if (!req.isAuth) throw new Error("not authorized to create a product");
    try {
      const product = new Product({
        name: args.productInput.name,
        description: args.productInput.description,
        price: +args.productInput.price, // + converts to number
        creator: req.userId,
      });
      const savedProduct = await product.save();
      const user = await User.findById(req.userId); // find the creator
      if (!user) throw new Error("user does not exists");
      // add product to productsList of this user (or just the product id)
      await user.productsList.push(savedProduct);
      await user.save();
      // this is the product that we are required to return (specified in grql schema)
      return {
        ...savedProduct._doc,
        creator: getCreator.bind(this, savedProduct._doc.creator),
      };
    } catch (err) {
      throw err;
    }
  },
  createUser: async (args) => {
    try {
      // check if user with this email already exists in db
      const existingUser = await User.findOne({ email: args.userInput.email });
      if (existingUser)
        throw new Error("a user with this email already exists");
      const hashedPw = await bcrypt.hash(args.userInput.pw, 10);
      // build new user with hashed pw
      const user = new User({
        email: args.userInput.email,
        pw: hashedPw,
      });
      const createdUser = await user.save();
      // this is the user sent to the UI, set pw to null
      // _doc contains props excluding metadata (must use if spread)
      return { ...createdUser._doc, pw: null };
    } catch (err) {
      throw err;
    }
  },
  login: async ({ email, pw }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("user not found");
    const match = await bcrypt.compare(pw, user.pw); // compare incoming pw with stored pw
    if (!match) throw new Error("wrong password");
    const token = jwt.sign(
      { userId: user._id, email }, // the token can store custom data additionally to the default data
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    return { userId: user._id, token, tokenExpiry: 1 };
  },
};
