import { DataTypes } from "@sequelize/core";
import { sequelize } from "../bdd.js";

const Word = sequelize.define('Word', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Pour éviter les doublons dans la base
  },
}, {
  timestamps: true, 
});

export default Word;