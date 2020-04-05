require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../../models/product");
const User = require("../../models/user");
const jwt = require("jsonwebtoken");

const getCreator = async (id) => {
  try {
    const creator = await User.findById(id);
    return {
      ...creator._doc,
      pw: null,
      productsList: getProductsList.bind(this, creator.productsList),
    };
  } catch (err) {
    throw err;
  }
};
const getProductsList = async (ids) => {
  try {
    const productsList = await Product.find({ _id: { $in: ids } });
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
        price: +args.productInput.price,
        creator: req.userId,
      });
      const savedProduct = await product.save();
      const user = await User.findById(req.userId); 
      if (!user) throw new Error("user does not exists");
      await user.productsList.push(savedProduct);
      await user.save();
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
      const existingUser = await User.findOne({ email: args.userInput.email });
      if (existingUser)
        throw new Error("user with this email already exists");
      const hashedPw = await bcrypt.hash(args.userInput.pw, 10);
      const user = new User({
        email: args.userInput.email,
        pw: hashedPw,
      });
      const createdUser = await user.save();
      return { ...createdUser._doc, pw: null };
    } catch (err) {
      throw err;
    }
  },
  login: async ({ email, pw }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("user not found");
    const match = await bcrypt.compare(pw, user.pw); 
    if (!match) throw new Error("wrong password");
    const token = jwt.sign(
      { userId: user._id, email }, 
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    return { userId: user._id, token, tokenExpiry: 1 };
  },
};