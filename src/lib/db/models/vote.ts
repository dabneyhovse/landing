import { DataTypes } from "sequelize";
import db from "../db";

const Vote = db.define("frotator-vote", {
  userId: {
    type: DataTypes.STRING,
  },
  approve: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

export default Vote;
