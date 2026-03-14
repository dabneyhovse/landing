import { DataTypes } from "sequelize";
import db from "../db";

const UserPreference = db.define("frotator-user-preference", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  spamToasts: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

export default UserPreference;
