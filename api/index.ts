import { ApolloServer, gql } from "apollo-server";
import { DocumentNode, GraphQLScalarType, Kind } from "graphql";

const record = {
  serverOffsetMinutes: new Date().getTimezoneOffset(),
  date: new Date(),
};

const DateScalar = new GraphQLScalarType({
  name: "Date",
  description: "A date and time, represented as an ISO-8601 string",

  serialize: (value) => {
    //@ts-ignore
    return value.toISOString();
  },

  parseValue: (value) => {
    console.log(`Parsing value: ${value}`);
    //@ts-ignore
    return new Date(value);
  },
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      console.log(`Parsing literal: ${ast.value}`);
      //@ts-ignore
      return new Date(ast.value);
    }
    return null;
  },
});

const typeDefs = gql`
  scalar Date

  type UpdateResult {
    scalarResult: Date!
    serverLocalString: String!
  }

  type Record {
    date: Date!
    serverOffsetMinutes: Int!
  }

  type Query {
    record: Record!
  }

  type Mutation {
    updateRecord(date: Date!): UpdateResult!
  }
`;

const resolvers = {
  Date: DateScalar,
  Query: {
    record: () => record,
  },
  Mutation: {
    updateRecord: (parent: any, { date }: { date: Date }) => {
      record.date = date;
      return {
        scalarResult: date,
        serverOffsetMinutes: date.getTimezoneOffset(),
        serverLocalString: date.toLocaleString(),
      };
    },
  },
};

async function startApolloServer(typeDefs: DocumentNode, resolvers: any) {
  const server = new ApolloServer({ typeDefs, resolvers });
  const { url } = await server.listen();
  console.log(`🚀 Server ready at ${url}`);
}

startApolloServer(typeDefs, resolvers);
