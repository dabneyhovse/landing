import { DataTypes } from "sequelize";
import db from "../db";

const SiteConfig = db.define("site-config", {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default SiteConfig;
