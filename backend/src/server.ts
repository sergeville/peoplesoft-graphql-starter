import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import "dotenv/config";

import { createContext } from "./graphql/context.js";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./resolvers/index.js";

const port = Number(process.env.PORT ?? 4000);

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port },
  context: async () => createContext(),
});

console.log(`GraphQL ready at ${url}`);
console.log(
  `Data source: ${process.env.PEOPLESOFT_DATA_SOURCE ?? "mock"} (set PEOPLESOFT_DATA_SOURCE=integration-broker to use IB REST)`,
);
