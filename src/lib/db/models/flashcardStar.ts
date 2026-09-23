import { DataTypes } from "sequelize";
import db from "../db";

const FlashcardStar = db.define("frotator-flashcard-star", {
  userId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  froshId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
}, { timestamps: false });

export default FlashcardStar;
