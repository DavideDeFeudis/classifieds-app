// takes a string that will be used to generate the schema
const { buildSchema } = require("graphql");

// the schema defines the queries that can be handled
// input is data coming from the UI passed as args in mutations
// pw in type User is nullable cause must be set to null to prevent being sent to UI
// pw in input UserInput is non nullable (!) cause required upon signup and login
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
