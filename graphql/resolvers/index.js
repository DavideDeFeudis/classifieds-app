const bcrypt = require("bcrypt");
const Product = require("../../models/product");
const User = require("../../models/user");

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
  products: () => {
    // we must return to make graphql wait for async operation to complete
    return Product.find()
      .then((products) => {
        return products.map((product) => {
          return {
            ...product._doc,
            creator: getCreator.bind(this, product._doc.creator),
          };
        });
      })
      .catch((err) => {
        throw err;
      });
  },
  createProduct: (args) => {
    const product = new Product({
      name: args.productInput.name,
      description: args.productInput.description,
      price: +args.productInput.price, // + converts to number
      // for now we hard code the creator id
      // later it will be passed automatically
      // mongoose converts it to an objectId for mongo
      creator: "5e8828b4b93b8edc514dbbc1",
    });
    // we must return to make graphql wait for async operation to complete
    return product
      .save()
      .then((result) => {
        // we don't use the result, instead we get the creator
        return User.findById("5e8828b4b93b8edc514dbbc1");
      })
      .then((user) => {
        if (!user) throw new Error("user does not exists");
        // add product to productsList of this user (or just the ID)
        user.productsList.push(product);
        return user.save();
      })
      .then((user) => {
        return {
          ...product._doc,
          creator: getCreator.bind(this, product._doc.creator),
        };
      })
      .catch((err) => {
        throw err;
      });
  },
  createUser: (args) => {
    // we must return to make graphql wait for async operation to complete
    // check if user with this email already exists in db
    return User.findOne({ email: args.userInput.email })
      .then((user) => {
        if (user) throw new Error("a user with this email already exists");
        return bcrypt.hash(args.userInput.pw, 10);
      })
      .then((hashedPw) => {
        const user = new User({
          email: args.userInput.email,
          pw: hashedPw,
        });
        return user.save();
      })
      .then((createdUser) => {
        // this is the user sent to the UI, set pw to null
        // _doc contains props excluding metadata (must use if spread)
        return { ...createdUser._doc, pw: null };
      })
      .catch((err) => {
        throw err;
      });
  },
};
