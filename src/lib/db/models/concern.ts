import { DataTypes } from "sequelize";
import db from "../db";

const Concern = db.define("frotator-concern", {
  userId: {
    type: DataTypes.STRING,
  },
  anon: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  text: {
    type: DataTypes.TEXT,
    defaultValue: "",
    allowNull: false,
  },
});

export default Concern;
