import Elysia from "elysia";
import { DataSource, type DataSourceOptions } from "typeorm";

export type AutoTransactionMethods = "POST" | "PUT" | "PATCH" | "DELETE";

export interface TypeormConfig {
  options: DataSourceOptions;
  autoTransaction?: {
    enabled?: boolean;
    methods?: AutoTransactionMethods[];
  };
}
export const typeorm = (config: TypeormConfig) => {
  const { options, autoTransaction = {} } = config;

  const autoTransactionConfig = Object.assign(
    {
      enabled: true,
      methods: ["POST", "PUT", "DELETE", "PATCH"],
    },
    autoTransaction
  );
  let ds: DataSource | undefined;

  return new Elysia({ name: "database", seed: options })
    .derive({ as: "scoped" }, async ({ request }) => {
      if (!ds) {
        ds = new DataSource({
          ...options,
          logging:
            options.logging === undefined
              ? process.env.NODE_ENV === "development"
              : options.logging,
        });
        if (!ds.isInitialized) {
          await ds.initialize();
          // await ds.driver.createQueryRunner("master").createSchema(name, true);
          // await ds.synchronize();
        }
      }

      const queryRunner = ds.createQueryRunner();
      await queryRunner.connect();

      if (
        autoTransactionConfig.enabled === true &&
        autoTransactionConfig.methods.includes(
          request.method as AutoTransactionMethods
        )
      ) {
        await queryRunner.startTransaction();
      }

      return {
        ds,
        queryRunner,
      };
    })
    .onAfterHandle(
      { as: "scoped" },
      async ({ set: { status }, queryRunner }) => {
        if (queryRunner) {
          if (
            autoTransactionConfig.enabled === true &&
            queryRunner.isTransactionActive
          ) {
            if (
              status === 200 ||
              status === 201 ||
              status === "OK" ||
              status === "Created"
            ) {
              await queryRunner.commitTransaction();
            } else {
              await queryRunner.rollbackTransaction();
            }
          }

          await queryRunner.release();
        }
      }
    )
    .onError({ as: "scoped" }, async ({ queryRunner }) => {
      if (queryRunner) {
        if (
          autoTransactionConfig.enabled === true &&
          queryRunner.isTransactionActive
        ) {
          await queryRunner.rollbackTransaction();
        }

        await queryRunner.release();
      }
    });
};

export default typeorm;
