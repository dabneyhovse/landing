import { DataTypes } from "sequelize";
import db from "../db";

const Comment = db.define("frotator-comment", {
  userId: {
    type: DataTypes.STRING,
  },
  text: {
    type: DataTypes.TEXT,
    defaultValue: "",
    allowNull: false,
  },
  private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  anon: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

export default Comment;
