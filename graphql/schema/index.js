const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    type Product {
        _id: ID!
        name: String!
        description: String!
        price: Float!
        creator: User!
    }
    type User {
        _id: ID!
        email: String!
        pw: String
        productsList: [Product!]!
    }
    type AuthData {
        userId: ID!
        token: String!
        tokenExpiry: Int!
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
        login(email: String!, pw: String!): AuthData!
    }
    type RootMutation {
        createProduct(productInput: ProductInput): Product
        createUser(userInput: UserInput): User
    }
    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);