import { Sequelize } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connexion à la base de données
 */
export const sequelize = new Sequelize({
	dialect: MySqlDialect,
	database: process.env.MYSQLDATABASE,
	username: process.env.MYSQLUSER,
	password: process.env.MYSQLPASSWORD,
	host: process.env.MYSQLHOST,
	port: process.env.MYSQLPORT || 3306,
});
