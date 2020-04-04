require("dotenv").config();
const express = require("express");
// is a middleware function that forwards queries to the resolver
const graphqlHttp = require("express-graphql");
const mongoose = require("mongoose");
const app = express();
const port = 3000;
const grQlSchema = require("./graphql/schema/index");
const resolvers = require("./graphql/resolvers/index");
const auth = require('./middleware/auth');

app.use(express.json());

app.use(auth);

// all requests are sent to one end point
app.use(
  "/graphql",
  graphqlHttp({
    schema: grQlSchema,
    // resolvers, must match schema entries
    rootValue: resolvers,
    // add graphiql: true to use http://localhost:3000/graphql
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
