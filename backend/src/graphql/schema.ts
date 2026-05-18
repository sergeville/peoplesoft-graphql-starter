export const typeDefs = `#graphql
  type Employee {
    emplid: ID!
    name: String!
    email: String
    department: String
    manager: Employee
    effectiveDate: String
    jobHistory: [JobRecord!]!
  }

  type JobRecord {
    position: String!
    startDate: String!
    endDate: String
    salary: Float
  }

  type Query {
    employee(id: ID!, asOfDate: String): Employee
    employees(asOfDate: String, limit: Int, offset: Int): [Employee!]!
    employeeCount(asOfDate: String): Int!
  }
`;
