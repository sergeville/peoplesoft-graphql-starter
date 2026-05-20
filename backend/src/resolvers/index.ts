import type { GraphQLContext } from "../graphql/context.js";
import type { EmployeeRecord } from "../peoplesoft/types.js";

type EmployeeParent = EmployeeRecord & {
  asOfDate?: string | null;
};

/**
 * Why: Resolvers stay thin so GraphQL schema maps 1:1 to EmployeeService — schema stability
 * without embedding PS eff-dating or mock/IB routing in the API layer.
 * Course: Module 4–5 (queries) · Module 9 (mutations)
 */
export const resolvers = {
  Query: {
    /**
     * Why: Stash asOfDate on each parent so nested manager/jobHistory inherit the same
     * temporal context as the list query without re-parsing args.
     * Course: Module 4
     */
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

    /**
     * Why: Exposes headcount for pagination controls without transferring full employee lists.
     * Course: Module 4
     */
    employeeCount: async (
      _: unknown,
      args: { asOfDate?: string | null },
      ctx: GraphQLContext,
    ): Promise<number> => ctx.employeeService.countEmployees(args.asOfDate),

    /**
     * Why: Single-record lookup passes through to the BFF with asOfDate for historical views.
     * Course: Module 4/6
     */
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
    /**
     * Why: Mutation delegates to service so GraphQL only validates input shape, not PS hire rules.
     * Course: Module 9
     */
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

    /**
     * Why: Forwards update payload unchanged to the BFF; effdt on parent keeps field resolvers consistent.
     * Course: Module 9
     */
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

    /**
     * Why: Schema says delete but service terminates — documents the PS contract at the API edge.
     * Course: Module 9 · CODE_PATH § ps-terminate-vs-delete
     */
    deleteEmployee: async (
      _: unknown,
      args: { emplid: string },
      ctx: GraphQLContext,
    ): Promise<boolean> => ctx.employeeService.deleteEmployee(args.emplid),
  },

  Employee: {
    /**
     * Why: Manager is a separate fetch so list queries stay light; asOfDate propagates from parent.
     * Course: Module 5
     */
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

    /**
     * Why: Surfaces the query's asOfDate on Employee for clients that display "effective as of" in the UI.
     */
    effectiveDate: (parent: EmployeeParent) => parent.asOfDate ?? null,

    /**
     * Why: jobHistory is loaded on demand so employee lists do not pay for segment expansion.
     * Course: Module 5/10
     */
    jobHistory: async (
      parent: EmployeeParent,
      _: unknown,
      ctx: GraphQLContext,
    ) => {
      return ctx.employeeService.getJobHistory(parent.emplid, parent.asOfDate);
    },
  },
};
