export const typeDefs = `#graphql
  type Employee {
    emplid: ID!
    name: String!
    email: String
    department: String
    position: String
    salary: Float
    managerEmplid: String
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

  input EmployeeInput {
    emplid: ID
    name: String!
    email: String
    department: String
    position: String
    salary: Float
    managerEmplid: String
    effdt: String
  }

  type Query {
    employee(id: ID!, asOfDate: String): Employee
    employees(asOfDate: String, limit: Int, offset: Int): [Employee!]!
    employeeCount(asOfDate: String): Int!
  }

  type Mutation {
    createEmployee(input: EmployeeInput!): Employee!
    updateEmployee(emplid: ID!, input: EmployeeInput!): Employee!
    deleteEmployee(emplid: ID!): Boolean!
  }
`;
