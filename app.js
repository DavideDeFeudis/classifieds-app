const express = require("express");
// is a middleware function that forwards queries to the resolver
const graphqlHttp = require("express-graphql");
// takes a string that will be used to generate the schema
const { buildSchema } = require("graphql");

const app = express();
const port = 3000;

app.use(express.json());

// all requests are sent to one end point
app.use(
  "/graphql",
  graphqlHttp({
    // the schema defines the queries that can be handled
    schema: buildSchema(`
        type RootQuery {
            products: [String!]!
        }

        type RootMutation {
            createProduct(name: String): String
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    // resolvers, must match schema entries
    rootValue: {
      products: () => {
        return ["product 1", "product 2", "product 3"];
      },
      createProduct: args => {
        console.log(`product created ${args.name}`);
        return args.name;
      }
    },
    /*
    add graphiql: true to use http://localhost:3000/graphql
    example queries:
    query {
        products
    }
    mutation {
        createProduct(name: "product 4")
    }
    */
    graphiql: true
  })
);

app.listen(port, () => {
  console.log("Example app listening on port 3000");
});
