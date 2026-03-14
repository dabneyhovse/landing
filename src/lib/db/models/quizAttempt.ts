import { DataTypes } from "sequelize";
import db from "../db";

const QuizAttempt = db.define("frotator-quiz-attempt", {
  userId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userPicture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currentIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  questions: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default QuizAttempt;
