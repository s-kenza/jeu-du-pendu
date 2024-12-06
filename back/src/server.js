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

const activeUsers = new Map(); // Map userId -> socket.id
const rooms = new Map(); // Stocke les rooms et leurs joueurs

// Traiter la connexion

app.io.on("connection", (socket) => {
	console.log(`Joueur connecté : ${socket.id}`);

	socket.on('joinRoom', ({ roomId, userId }) => {
		console.log('UserId côté serveur:', userId);
		if (!rooms.has(roomId)) {
		  // Créer une nouvelle room
		  rooms.set(roomId, []);
		}

		const players = rooms.get(roomId);

		if (players.length >= 2) {
			// Si la room est pleine, envoyer un événement au client
			socket.emit('roomFull', { message: 'La partie est pleine.' });
			return;
		}

		// Ajouter le joueur à la room
		players.push({ socketId: socket.id, userId });
		socket.join(roomId);
		console.log(`User ${userId} a rejoint la room ${roomId}`);
	
		// Notifier le joueur qu'il a rejoint la room
		socket.emit('roomJoined', { roomId, userId });
	
		// Si 2 joueurs sont dans la room, démarrer la partie
		if (players.length === 2) {
			const startingPlayer = players[Math.floor(Math.random() * players.length)].userId;
			app.io.to(roomId).emit('startingPlayer', startingPlayer);
			app.io.to(roomId).emit('gameStart', { roomId });
			console.log(`La partie commence dans la room ${roomId} avec ${startingPlayer} qui commence`);
		}
	});

	socket.on('gameStartAction', ({ roomId, playerId, word }) => {
		console.log(`Le jeu commence dans la room ${roomId} avec le mot ${word}`);
		app.io.to(roomId).emit('gameStarted', { word });
	});

	// Écouter un événement de connexion de l'utilisateur avec son userId
	socket.on('register', (userId) => {
		console.log(`Utilisateur enregistré : ${userId}`);
		
		// Si l'utilisateur a un socket actif, déconnectez-le
		if (activeUsers.has(userId)) {
		  const oldSocketId = activeUsers.get(userId);
		  const oldSocket = app.io.sockets.sockets.get(oldSocketId);
		  if (oldSocket) {
			oldSocket.disconnect(); // Déconnecte l'ancien socket
		  }
		}
	
		// Enregistrer le nouvel ID socket
		activeUsers.set(userId, socket.id);
	
		// Gérer la déconnexion
		socket.on('disconnect', () => {
			console.log(`Client déconnecté : ${socket.id}`);

		   	// Supprimer l'utilisateur de la liste des utilisateurs actifs
			if (activeUsers.get(userId) === socket.id) {
				activeUsers.delete(userId);
			}

			// Supprimer le socket déconnecté des rooms
			rooms.forEach((players, roomId) => {
				const updatedPlayers = players.filter(player => player.socketId !== socket.id);
				if (updatedPlayers.length === 0) {
					rooms.delete(roomId); // Supprimer la room si vide
				} else {
					rooms.set(roomId, updatedPlayers);
				}
			});
		});
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
