import { DataTypes } from "sequelize";
import db from "../db";

const Frosh = db.define("frotator-frosh", {
  uuid: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  firstName: {
    type: DataTypes.STRING,
    defaultValue: "",
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    defaultValue: "",
    allowNull: false,
  },
  preferredName: {
    type: DataTypes.STRING,
    defaultValue: "",
    allowNull: true,
  },
  pronouns: {
    type: DataTypes.STRING,
    defaultValue: "",
    allowNull: true,
  },
  year: {
    type: DataTypes.STRING,
    defaultValue: "First Year",
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  groupName: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  anagram: {
    type: DataTypes.STRING,
    defaultValue: null,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  rank: {
    type: DataTypes.INTEGER,
    defaultValue: -1,
  },
  bioPDF: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  bio: {
    type: DataTypes.JSON,
    defaultValue: {
      hometown: "",
      major: "",
      hobbies: "",
      clubs: "",
      funfact: "",
    },
  },
  dinnerGroup: {
    type: DataTypes.STRING,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Frosh as any).prototype.safeName = function (this: any) {
  return `${this.preferredName ? this.preferredName : this.firstName} ${this.lastName}`;
};

export default Frosh;
