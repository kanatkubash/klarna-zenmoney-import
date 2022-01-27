export default {
  type: "sqlite",
  database: "db.sqlite",
  synchronize: true,
  logging: true,
  entities: [__dirname + "/ZenMoney/**/*.ts"],
  //   migrations: ["src/migration/**/*.ts"],
  //   subscribers: ["src/subscriber/**/*.ts"],
  cli: {
    // entitiesDir: "src/entity",
    migrationsDir: "migration",
    // subscribersDir: "src/subscriber",
  },
  logger: "advanced-console",
};
