import { DataTypes } from "sequelize";
import db from "../db";

const Event = db.define("frotator-event", {
  eventType: {
    type: DataTypes.ENUM("Dinner", "Dessert", "Linner", "Pod", "N/A"),
    defaultValue: "N/A",
    allowNull: false,
  },
  eventNumber: {
    type: DataTypes.INTEGER,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default Event;
