import { Sequelize } from "sequelize";

const db = new Sequelize(
  process.env.POSTGRES_DB || "frotator",
  process.env.POSTGRES_USER || "postgres",
  process.env.POSTGRES_PASSWORD || "postgres",
  {
    host: process.env.POSTGRES_HOST || "localhost",
    dialect: "postgres",
    logging: false,
  }
);

export function random() {
  return db.random();
}

export default db;
