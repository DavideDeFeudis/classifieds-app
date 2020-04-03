require("dotenv").config();
const express = require("express");
// is a middleware function that forwards queries to the resolver
const graphqlHttp = require("express-graphql");
// takes a string that will be used to generate the schema
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Product = require("./models/product");
const User = require("./models/user");
const app = express();
const port = 3000;

app.use(express.json());

// all requests are sent to one end point
app.use(
  "/graphql",
  graphqlHttp({
    // the schema defines the queries that can be handled
    // input is data coming from the UI passed as args in mutations
    // pw in type User is nullable cause must be set to null to prevent being sent to UI
    // pw in input UserInput is non nullable (!) cause required upon signup and login
    schema: buildSchema(`
        type Product {
            _id: ID!
            name: String!
            description: String!
            price: Float!
        }

        type User {
            _id: ID!
            email: String!
            pw: String 
        }

        input ProductInput {
            name: String!
            description: String!
            price: Float!
        }
        
        input UserInput {
            email: String!
            pw: String! 
        }

        type RootQuery {
            products: [Product!]!
        }

        type RootMutation {
            createProduct(productInput: ProductInput): Product
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    // resolvers, must match schema entries
    rootValue: {
      products: () => {
        // we must return to make graphql wait for async operation to complete
        return Product.find()
          .then((products) => {
            return products;
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
        });
        // we must return to make graphql wait for async operation to complete
        return product
          .save()
          .then((result) => {
            return result;
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
    },
    /*
    add graphiql: true to use http://localhost:3000/graphql
    example queries:
    query {
        products {
            name, description
        }
    }

    mutation {
        createProduct(productInput: { name: "name1", description: "description asdfkjasdf", price: 10 }) 
        {
        _id, name, description, price
        }
    }
    */
    graphiql: true,
  })
);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(port, () => {
      console.log("Example app listening on port 3000");
    });
  })
  .catch((err) => {
    console.log("Error on DB connection: " + err);
  });
