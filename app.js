require("dotenv").config();
const express = require("express");
// is a middleware function that forwards queries to the resolver
const graphqlHttp = require("express-graphql");
// takes a string that will be used to generate the schema
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Product = require("./models/product");
const app = express();
const port = 3000;

app.use(express.json());

// all requests are sent to one end point
app.use(
  "/graphql",
  graphqlHttp({
    // the schema defines the queries that can be handled
    schema: buildSchema(`
        type Product {
            _id: ID!
            name: String!
            description: String!
            price: Float!
        }

        input ProductInput {
            name: String!
            description: String!
            price: Float!
        }

        type RootQuery {
            products: [Product!]!
        }

        type RootMutation {
            createProduct(productInput: ProductInput): Product
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
          .then(products => {
            return products;
          })
          .catch(err => {
            throw err;
          });
      },
      createProduct: args => {
        const product = new Product({
          name: args.productInput.name,
          description: args.productInput.description,
          price: +args.productInput.price // + converts to number
        });
        // we must return to make graphql wait for async operation to complete
        return product
          .save()
          .then(result => {
            return result;
          })
          .catch(err => {
            throw err;
          });
      }
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
    graphiql: true
  })
);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    app.listen(port, () => {
      console.log("Example app listening on port 3000");
    });
  })
  .catch(err => {
    console.log("Error on DB connection: " + err);
  });
