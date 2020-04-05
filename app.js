require("dotenv").config();
const express = require("express");
const graphqlHttp = require("express-graphql");
const mongoose = require("mongoose");
const app = express();
const grQlSchema = require("./graphql/schema/index");
const resolvers = require("./graphql/resolvers/index");
const auth = require("./middleware/auth");
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(auth);

app.use(
  "/graphql",
  graphqlHttp({
    schema: grQlSchema,
    rootValue: resolvers,
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
      console.log(`App listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("Error on DB connection: " + err);
  });