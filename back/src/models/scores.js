import { DataTypes } from "@sequelize/core";
import { sequelize } from "../bdd.js";
import Game from "./games.js";
import User from "./users.js";

const Scores = sequelize.define('scores', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
});
Scores.belongsTo(Game, { 
    targetKey: "id", 
    foreignKey: "gameId", 
    as: "game" 
});
Scores.belongsTo(User, {
    targetKey: "id",
    foreignKey: "playerId",
    as: "player",
});
  
  export default Scores;