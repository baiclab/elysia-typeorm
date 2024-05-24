import { describe, expect, test } from "bun:test";
import Elysia from "elysia";
import typeorm from "../src";
import type { DataSourceOptions } from "typeorm";

const options: DataSourceOptions = {
  type: "sqlite",
  database: ":memory:",
  entities: [],
  synchronize: true,
  // logging: true,
};

const createApp = () => {
  return new Elysia().use(
    typeorm({
      options,
    })
  );
};

describe("Typeorm Plugin", () => {
  test("Is initialized test", async () => {
    const app = createApp().get("/", async ({ ds }) => {
      return ds.isInitialized;
    });

    const response = await app
      .handle(new Request("http://localhost/"))
      .then((res) => res.text());

    expect(response).toBe("true");
  });

  test("Is auto transaction active test", async () => {
    const app = createApp().post("/", async ({ queryRunner }) => {
      return queryRunner.isTransactionActive;
    });

    const response = await app
      .handle(
        new Request("http://localhost/", {
          method: "POST",
        })
      )
      .then((res) => res.text());

    expect(response).toBe("true");
  });

  test("Disable auto transaction test", async () => {
    const app = new Elysia()
      .use(
        typeorm({
          options,
          autoTransaction: {
            enabled: false,
          },
        })
      )
      .post("/", async ({ queryRunner }) => {
        return queryRunner.isTransactionActive;
      });

    const response = await app
      .handle(
        new Request("http://localhost/", {
          method: "POST",
        })
      )
      .then((res) => res.text());

    expect(response).toBe("false");
  });

  test("Transaction auto rollback test", async () => {
    const app = createApp().post("/", async ({ set }) => {
      return (set.status = "Bad Request");
    });

    const response = await app
      .handle(
        new Request("http://localhost/", {
          method: "POST",
        })
      )
      .then((res) => res.text());

    expect(response).toBe("Bad Request");
  });

  test("Transaction auto rollback test (throw error)", async () => {
    const app = createApp().post("/", async ({}) => {
      throw new Error("Error");
    });

    const response = await app
      .handle(
        new Request("http://localhost/", {
          method: "POST",
        })
      )
      .then((res) => res.json());

    expect(response.name).toBe("Error");
  });
});
