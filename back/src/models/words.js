import { DataTypes } from "@sequelize/core";
import { sequelize } from "../bdd.js";

const Word = sequelize.define("word", {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: false,
		primaryKey: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	}
});

export default Word;