import User from "../models/users.js";
import { Op } from "sequelize";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mjml2html from 'mjml';
import path from 'path';
import fs from 'fs/promises';
import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";

const mailerSend = new MailerSend({
	apiKey: process.env.MAIL_TOKEN,
}); 

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

		const newUser = await User.create(user);

	// Send mail
	try {
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
			user: "kenza.schuler@gmail.com",
			pass: "nxtf cqmm lrlz wqed"
			},
		});
		const url = `https://jeu-de-kenza.vercel.app/verify/${newUser.verifiedtoken}`;

		await transporter.sendMail({
			from: `"Kenza" <${"kenza.schuler@gmail.com"}>`,
			to: newUser.email,
			subject: "Confirmation d'inscription",
			html: `<p>Bonjour ${newUser.firstname},</p>
				<p>Merci pour ton inscription 🥰</p>
				<p>👉 <a href="${url}" target="_blank">Active ton compte</a></p>`,
		});

		console.log("✅ Email de confirmation envoyé à :", newUser.email);

	} catch (error) {
		console.log(error);
		return {
			error: "Échec de la création du compte : impossible d'envoyer un mail",
			errorCode: "CANNOT_SEND_MAIL",
			status: 500,
		};
	}

	return newUser;
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

async function sendVerificationEmail(user) {
  // 1. Définir le template MJML
  const templatePath = path.join(__dirname, '..', 'templates', 'verification.mjml');
  let mjmlTemplate = await fs.readFile(templatePath, 'utf-8');

  // Remplacer les variables du template par les valeurs de l'utilisateur
  mjmlTemplate = mjmlTemplate.replace('${user.firstname}', user.firstname)
    						.replace('${user.lastname}', user.lastname)
							.replace('${user.verifiedtoken}', user.verifiedtoken);

  // 2. Convertir MJML en HTML
  const htmlOutput = mjml2html(mjmlTemplate);

  // 3. Configuration du transporteur comme avant
  let transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
    tls: {
      rejectUnauthorized: false
    }
  });

  // 4. Envoi de l'email avec le template HTML converti
  let info = await transporter.sendMail({
    from: '"Votre Application" <noreply@votreapp.com>',
    to: user.email,
    subject: "Vérification de votre compte",
    text: `Bienvenue ${user.firstname} ${user.lastname},\n\nMerci de vous être inscrit. Veuillez vérifier votre compte en cliquant sur le lien suivant : http://localhost:5173/verify/${user.verifiedtoken}`,
    html: htmlOutput.html
  });

  console.log("Message sent: %s", info.messageId);
}

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