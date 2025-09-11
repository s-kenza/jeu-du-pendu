import User from "../models/users.js";
import { Op } from "sequelize";
import crypto from "crypto";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Resend } from 'resend';
import fs from 'fs';

async function generateID(id) {
	const { count } = await findAndCountAllUsersById(id);
	if (count > 0) {
		id = id.substring(0, 5);
		const { count } = await findAndCountAllUsersById(id);
		id = id + (count + 1);
	}
	return id;
}

export async function getUsers() {
	return await User.findAll();
}
export async function getUserById(id) {
	return await User.findByPk(id);
}
export async function findAndCountAllUsersById(id) {
	return await User.findAndCountAll({
		where: {
			id: {
				[Op.like]: `${id}%`,
			},
		},
	});
}
export async function findAndCountAllUsersByEmail(email) {
	return await User.findAndCountAll({
		where: {
			email: {
				[Op.eq]: email,
			},
		},
	});
}
export async function findAndCountAllUsersByUsername(username) {
	return await User.findAndCountAll({
		where: {
			username: {
				[Op.eq]: username,
			},
		},
	});
}

const resend = new Resend('re_8cUce6e4_8713GKcbFecTD66qnnVFQDJC');

function sendEmail(to, verifiedtoken) {
	let html = fs.readFileSync("../templates/emails/confirmation.html", "utf-8");
	html = html.replace("{{TOKEN}}", verifiedtoken);

	return resend.emails.send({
	  from: 'onboarding@resend.dev',
	  to: to,
	  subject: '👋 Confirmez votre inscription',
	  html: html
	});
}

export async function registerUser(userDatas, bcrypt) {
	if (!userDatas) {
		return { error: "Aucune donnée à enregistrer" };
	}
	const { firstname, lastname, username, email, password } = userDatas;
	if (!firstname || !lastname || !username || !email || !password) {
		return { error: "Tous les champs sont obligatoires" };
	}
	//vérification que l'email n'est pas déjà utilisé
	const { count: emailCount } = await findAndCountAllUsersByEmail(email);
	if (emailCount > 0) {
		return { error: "L'adresse email est déjà utilisée." };
	}

	//vérification que le pseudo n'est pas déjà utilisé
	const { count: usernameCount } = await findAndCountAllUsersByUsername(
		username
	);
	if (usernameCount > 0) {
		return { error: "Le nom d'utilisateur est déjà utilisé." };
	}
	//création de l'identifiant
	let id = await generateID(
		(lastname.substring(0, 3) + firstname.substring(0, 3)).toUpperCase()
	);
	//vérification que l'identifiant n'est pas déjà utilisé
	//hashage du mot de passe
	const hashedPassword = await bcrypt.hash(password);
	//génération du token de vérification
	const generateToken = crypto.randomBytes(32).toString('hex');

	//création de l'utilisateur dans la base de données
	const user = {
		id,
		firstname,
		lastname,
		username,
		email,
		password: hashedPassword,
		verifiedtoken: generateToken,
	};

	// Send mail
	try {
		await sendEmail(user.email, user.verifiedtoken);
		console.log("Email de confirmation envoyé avec succès.");
		const newUser = await User.create(user);
		return newUser;
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
		return { error: "Impossible d’envoyer l’email de confirmation. Réessayez plus tard." };
	}
}
export async function loginUser(userDatas, app) {
	if (!userDatas) {
		return { error: "Aucune donnée n'a été envoyée" };
	}
	const { email, password } = userDatas;
	if (!email || !password) {
		return { error: "Tous les champs sont obligatoires" };
	}
	//vérification que l'email est utilisé
	const { count, rows } = await findAndCountAllUsersByEmail(email);
	if (count === 0) {
		return {
			error: "Il n'y a pas d'utilisateur associé à cette adresse email.",
		};
	} else if (rows[0].verified === false) {
		return {
			error: "Votre compte n'est pas encore vérifié. Veuillez vérifier votre boîte mail.",
		};
	}
	//récupération de l'utilisateur
	const user = await User.findOne({
		where: {
			email: {
				[Op.eq]: email,
			},
		},
	});
	//comparaison des mots de passe
	const match = await app.bcrypt.compare(password, user.password);
	if (!match) {
		return { error: "Mot de passe incorrect" };
	}
	// Générer le JWT après une authentification réussie
	const token = app.jwt.sign(
		{ id: user.id, username: user.username },
		{ expiresIn: "3h" }
	);
	return { token };
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Route pour vérifier le compte
export async function verifyUser(token) {
	const user = await User.findOne({
		where: {
			verifiedtoken: {
				[Op.eq]: token,
			},
		},
	});
	if (!user) {
		return { error: "Une erreur est survenue. Demander un nouvel email de confirmation.", code: 400 };
	}
	user.verified = true;
	user.verifiedtoken = null;
	await user.save();
	return user;
}