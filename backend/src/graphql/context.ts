import {
  createEmployeeServiceFromEnv,
  type EmployeeService,
} from "../services/employeeService.js";

export type GraphQLContext = {
  employeeService: EmployeeService;
};

export function createContext(): GraphQLContext {
  return {
    employeeService: createEmployeeServiceFromEnv(),
  };
}
