import { Sequelize } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connexion à la base de données
 */
export const sequelize = new Sequelize({
	dialect: MySqlDialect,
	database: "railway",
	user: "root",
	password: "lHJpFxnkPvygBvNRaPLQLgpXatFhuqXN",
	host: "mysql.railway.internal",
	port: 3306,
});
