import type { GraphQLContext } from "../graphql/context.js";
import type { EmployeeRecord } from "../peoplesoft/types.js";

type EmployeeParent = EmployeeRecord & {
  asOfDate?: string | null;
};

export const resolvers = {
  Query: {
    employees: async (
      _: unknown,
      args: {
        asOfDate?: string | null;
        limit?: number | null;
        offset?: number | null;
      },
      ctx: GraphQLContext,
    ): Promise<EmployeeParent[]> => {
      const rows = await ctx.employeeService.listEmployees(
        args.asOfDate,
        args.limit,
        args.offset,
      );
      return rows.map((row) => ({ ...row, asOfDate: args.asOfDate ?? null }));
    },

    employeeCount: async (
      _: unknown,
      args: { asOfDate?: string | null },
      ctx: GraphQLContext,
    ): Promise<number> => ctx.employeeService.countEmployees(args.asOfDate),

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

  Mutation: {
    createEmployee: async (
      _: unknown,
      args: {
        input: {
          emplid?: string | null;
          name: string;
          email?: string | null;
          department?: string | null;
          position?: string | null;
          salary?: number | null;
          managerEmplid?: string | null;
          effdt?: string | null;
        };
      },
      ctx: GraphQLContext,
    ): Promise<EmployeeParent> => {
      const row = await ctx.employeeService.createEmployee(args.input);
      return { ...row, asOfDate: args.input.effdt ?? null };
    },

    updateEmployee: async (
      _: unknown,
      args: {
        emplid: string;
        input: {
          name: string;
          email?: string | null;
          department?: string | null;
          position?: string | null;
          salary?: number | null;
          managerEmplid?: string | null;
          effdt?: string | null;
        };
      },
      ctx: GraphQLContext,
    ): Promise<EmployeeParent> => {
      const row = await ctx.employeeService.updateEmployee(
        args.emplid,
        args.input,
      );
      return { ...row, asOfDate: args.input.effdt ?? null };
    },

    deleteEmployee: async (
      _: unknown,
      args: { emplid: string },
      ctx: GraphQLContext,
    ): Promise<boolean> => ctx.employeeService.deleteEmployee(args.emplid),
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
