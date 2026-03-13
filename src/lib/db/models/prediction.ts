import { DataTypes } from "sequelize";
import db from "../db";

const Prediction = db.define("frotator-prediction", {
  userId: {
    type: DataTypes.INTEGER,
  },
  house: DataTypes.ENUM(
    "dabney",
    "blacker",
    "ricketts",
    "fleming",
    "page",
    "avery",
    "venerable",
    "lloyd"
  ),
  bet: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

export default Prediction;
