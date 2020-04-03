const express = require("express");
// is a middleware function that forwards queries to the resolver
const graphqlHttp = require("express-graphql");
// takes a string that will be used to generate the schema
const { buildSchema } = require("graphql");

const app = express();
const port = 3000;

app.use(express.json());

const products = [];

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
        return products;
      },
      createProduct: args => {
        const product = {
          _id: Math.random().toString(),
          name: args.productInput.name,
          description: args.productInput.description,
          price: +args.productInput.price // + converts to number
        };
        products.push(product);
        return product;
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

app.listen(port, () => {
  console.log("Example app listening on port 3000");
});
