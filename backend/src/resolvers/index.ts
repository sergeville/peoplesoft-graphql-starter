import type { GraphQLContext } from "../graphql/context.js";
import type { EmployeeRecord } from "../peoplesoft/types.js";

type EmployeeParent = EmployeeRecord & {
  asOfDate?: string | null;
};

export const resolvers = {
  Query: {
    employees: async (
      _: unknown,
      args: { asOfDate?: string | null },
      ctx: GraphQLContext,
    ): Promise<EmployeeParent[]> => {
      const rows = await ctx.employeeService.listEmployees(args.asOfDate);
      return rows.map((row) => ({ ...row, asOfDate: args.asOfDate ?? null }));
    },

    employee: async (
      _: unknown,
      args: { id: string; asOfDate?: string | null },
      ctx: GraphQLContext,
    ): Promise<EmployeeParent | null> => {
      const row = await ctx.employeeService.getEmployee(args.id, args.asOfDate);
      if (!row) return null;
      return { ...row, asOfDate: args.asOfDate ?? null };
    },
  },

  Employee: {
    manager: async (
      parent: EmployeeParent,
      _: unknown,
      ctx: GraphQLContext,
    ): Promise<EmployeeParent | null> => {
      const manager = await ctx.employeeService.getManager(
        parent.managerEmplid,
        parent.asOfDate,
      );
      return manager ? { ...manager, asOfDate: parent.asOfDate } : null;
    },

    effectiveDate: (parent: EmployeeParent) => parent.asOfDate ?? null,

    jobHistory: async (
      parent: EmployeeParent,
      _: unknown,
      ctx: GraphQLContext,
    ) => {
      return ctx.employeeService.getJobHistory(parent.emplid, parent.asOfDate);
    },
  },
};
