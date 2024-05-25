# @baiclab/elysia-typeorm

Plugin for [Elysia](https://github.com/elysiajs/elysia) for using TypeORM.

## Installation

```bash
bun add @baiclab/elysia-typeorm
```

## Example

```typescript
import { Elysia } from "elysia";
import { typeorm } from "@baiclab/elysia-typeorm";

const app = new Elysia()
  .use(
    typeorm({
      options: {
        type: "sqlite",
        database: ":memory:",
        entities: [],
        synchronize: true,
      },
    })
  )
  .get("/", async ({ ds }) => {
    return ds.isInitialized;
  })
  .listen(8080);
```

## Config

### options

This options is TypeORM [Data Source Options](https://typeorm.io/data-source-options).

### autoTransaction

This option is whether to automatically create a transaction.

#### enabled: boolean

- `true`: Automatically create a transaction.
- `false`: Do not automatically create a transaction.

#### methods: ("POST" | "PUT" | "PATCH" | "DELETE")[]

The methods that automatically create a transaction.

```typescript
import { Elysia } from "elysia";
import { typeorm } from "@baiclab/elysia-typeorm";

const app = new Elysia()
  .use(
    typeorm({
      options: {
        type: "sqlite",
        database: ":memory:",
        entities: [],
        synchronize: true,
      },
      autoTransaction: {
        enabled: true,
        methods: ["POST", "PUT", "PATCH", "DELETE"],
      },
    })
  )
  .post("/", async ({ queryRunner }) => {
    return queryRunner.isTransactionActive;
  })
  .listen(8080);
```
