import chalk from "chalk";
//pour fastify
import fastify from "fastify";
import fastifyBcrypt from "fastify-bcrypt";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyJWT from "@fastify/jwt";
//routes
import { usersRoutes } from "./routes/users.js";
import { gamesRoutes } from "./routes/games.js";
import { wordsRoutes } from "./routes/words.js";
import Word from "./models/words.js";
import Game from "./models/games.js";
import { seedWords } from "./seed.js";
//bdd
import { sequelize } from "./bdd.js";
//socket.io
import socketioServer from 'fastify-socket.io';

//Test de la connexion
try {
	sequelize.authenticate();
	console.log(chalk.grey("Connecté à la base de données MySQL!"));
} catch (error) {
	console.error("Impossible de se connecter, erreur suivante :", error);
}

/**
 * API
 * avec fastify
 */
let blacklistedTokens = [];
const app = fastify();
//Ajout du plugin fastify-bcrypt pour le hash du mdp
await app
	.register(fastifyBcrypt, {
		saltWorkFactor: 12,
	})
	.register(cors, {
		origin: "*",
	})
	.register(socketioServer, {
		cors: {
			origin: "*",
		},
	})
	.register(fastifySwagger, {
		openapi: {
			openapi: "3.0.0",
			info: {
				title: "Documentation de l'API JDR LOTR",
				description:
					"API développée pour un exercice avec React avec Fastify et Sequelize",
				version: "0.1.0",
			},
		},
	})
	.register(fastifySwaggerUi, {
		routePrefix: "/documentation",
		theme: {
			title: "Docs - JDR LOTR API",
		},
		uiConfig: {
			docExpansion: "list",
			deepLinking: false,
		},
		uiHooks: {
			onRequest: function (request, reply, next) {
				next();
			},
			preHandler: function (request, reply, next) {
				next();
			},
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
		transformSpecification: (swaggerObject, request, reply) => {
			return swaggerObject;
		},
		transformSpecificationClone: true,
	})
	.register(fastifyJWT, {
		secret: "unanneaupourlesgouvernertous",
	});
/**********
 * Routes
 **********/
app.get("/", (request, reply) => {
	reply.send({ documentationURL: "http://localhost:3000/documentation" });
});
// Fonction pour décoder et vérifier le token
app.decorate("authenticate", async (request, reply) => {
	try {
		const token = request.headers["authorization"].split(" ")[1];

		// Vérifier si le token est dans la liste noire
		if (blacklistedTokens.includes(token)) {
			return reply
				.status(401)
				.send({ error: "Token invalide ou expiré" });
		}
		await request.jwtVerify();
	} catch (err) {
		reply.send(err);
	}
});
const rooms = new Map();

// Traiter la connexion

app.io.on("connection", (socket) => {
	console.log(`Joueur connecté : ${socket.id}`);

	// Gestion de la création de salle
	socket.on('joinRoom', (roomId) => {
		if (!rooms.has(roomId)) {
			// La room est créée avec un seul joueur
			rooms.set(roomId, [socket.id]);
			socket.join(roomId);
			socket.emit('roomJoined', { roomId, playerNumber: 1 });
		} else if (rooms.get(roomId).length < 2) {
			// Un deuxième joueur rejoint la room
			rooms.get(roomId).push(socket.id);
			socket.join(roomId);
	
			// Envoyer à chaque joueur l'événement 'roomJoined' avec son numéro de joueur
			socket.emit('roomJoined', { roomId, playerNumber: 2 });
	
			// Émettre 'gameStart' à tous les joueurs dans cette room
			app.io.to(roomId).emit('gameStart');
		} else {
			socket.emit('roomFull', roomId);
		}
	});

	socket.on('chooseStartingPlayer', ({ roomId }) => {
		console.log('Received chooseStartingPlayer event for room', roomId);
		const startingPlayer = Math.random() < 0.5 ? 1 : 2;
		app.io.to(roomId).emit('startingPlayerChosen', startingPlayer);
		console.log(`Joueur ${startingPlayer} commence.`);
	});

	// Gestion de la déconnexion
	socket.on("disconnect", () => {
		console.log(`Joueur déconnecté : ${socket.id}`);
	});
});

//gestion utilisateur
usersRoutes(app);
//gestion des jeux
gamesRoutes(app);
//gestion des mots
wordsRoutes(app);

async function ensureWordsTableFilled() {
	const wordCount = await Word.count();
	if (wordCount === 0) {
	  console.log("La table des mots est vide. Remplissage en cours...");
	  await seedWords();
	} else {
	  console.log(`La table des mots contient déjà ${wordCount} mots.`);
	}
  }

/**********
 * START
 **********/
const start = async () => {
	try {
		await sequelize
			.sync({ alter: true })
			.then(() => {
				console.log(chalk.green("Base de données synchronisée."));
			})
			.catch((error) => {
				console.error(
					"Erreur de synchronisation de la base de données :",
					error
				);
			});
		await app.listen({ port: 3000 });
		await ensureWordsTableFilled();
		console.log(
			"Serveur Fastify lancé sur " + chalk.blue("http://localhost:3000")
		);
		console.log(
			chalk.bgYellow(
				"Accéder à la documentation sur http://localhost:3000/documentation"
			)
		);
	} catch (err) {
		console.log(err);
		process.exit(1);
	}
};
start();
