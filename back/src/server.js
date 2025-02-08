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
import { scoresRoutes } from "./routes/scores.js";
import Word from "./models/words.js";
import Game from './models/games.js';
import Scores from "./models/scores.js";
import { generateRandomWord, countRemainingLetters }  from "./controllers/words.js";
import { seedWords } from "./seed.js";
//bdd
import { sequelize } from "./bdd.js";
//socket.io
import socketioServer from 'fastify-socket.io';
import { createScore } from "./controllers/scores.js";

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
const roomWords = new Map(); // Map pour stocker le mot de chaque room
let roomState = new Map(); // roomState est une Map où chaque room a un état avec le mot à deviner et le mot caché
const playersReadyInRoom = {}; // Pour suivre les joueurs prêts à rejouer

// Traiter la connexion

app.io.on("connection", (socket) => {
	console.log(`Joueur connecté : ${socket.id}`);

	socket.on('joinRoom', async ({ roomId, userId }) => {
		console.log('UserId côté serveur:', userId);
	
		if (!roomState.has(roomId)) {
			// Créer une nouvelle room
			roomState.set(roomId, { players: [], wordToGuess: null, hiddenWord: null, guessedLetters: [], scores: {}, wordGuessed: [] });
		}
	
		const players = roomState.get(roomId);
		const room = roomState.get(roomId);
		if (!room.wordGuessed) {
			room.wordGuessed = [];
		}

		// Vérifier si le joueur est déjà dans la room
		const isAlreadyInRoom = players.players.some(player => player.userId === userId);
		if (isAlreadyInRoom) {
			console.log(`L'utilisateur ${userId} est déjà dans la room ${roomId}`);
			socket.emit('alreadyInRoom', { message: 'Vous êtes déjà dans cette partie.' });
			return;
		}
	
		if (players.players.length >= 2) {
			// Si la room est pleine, envoyer un événement au client
			socket.emit('roomFull', { message: 'La partie est pleine.' });
			return;
		}
	
		// Ajouter le joueur à la room
		players.players.push({ socketId: socket.id, userId });
		socket.join(roomId);
		console.log(`User ${userId} a rejoint la room ${roomId}`);
	
		// Notifier le joueur qu'il a rejoint la room
		socket.emit('roomJoined', { roomId, userId });
	
		// Initialiser les scores pour la base de données
		try {
			const score = await createScore(userId, roomId);
			console.log(`Score initialisé pour le joueur ${userId} dans la game ${roomId}`);
		} catch (error) {
			console.error("Erreur lors de l'initialisation du score :", error);
		}
	
		// Si 2 joueurs sont dans la room, démarrer la partie
		if (players.players.length === 2) {
			const startingPlayer = players.players[Math.floor(Math.random() * players.players.length)].userId;
	
			// Mise à jour de l'état du jeu à "playing" dans la base de données
			try {
				const game = await Game.findOne({ where: { id: roomId } });
				if (game) {
					game.state = 'playing';
					await game.save();
					console.log(`L'état du jeu dans la base de données a été mis à jour à "playing" pour la game ${roomId}`);
				}
			} catch (error) {
				console.error("Erreur lors de la mise à jour de l'état du jeu :", error);
			}
	
			// Générer un mot aléatoire
			const randomWord = await generateRandomWord();
			if (!randomWord) {
				console.error("Aucun mot n'a été généré.");
				return;
			}
	
			roomWords.set(roomId, randomWord);
			const wordToGuess = randomWord.dataValues.name;

			room.wordGuessed.push(wordToGuess);
	
			console.log(`Le mot à deviner est : ${wordToGuess}`);
	
			app.io.to(roomId).emit('startingPlayer', startingPlayer);
			app.io.to(roomId).emit('gameStart', { roomId, word: wordToGuess });
			console.log(`La partie commence dans la room ${roomId} avec ${startingPlayer} qui commence`);
	
			// Initialisation d'une salle
			const hiddenWord = "_ ".repeat(wordToGuess.length).trim(); // Mot caché (avec des underscores)
			const guessedLetters = []; // Liste des lettres devinées
			const scores = {};
			players.players.forEach(player => {
				scores[player.userId] = 0;
			});
	
			roomState.set(roomId, { wordToGuess, hiddenWord, guessedLetters, players: players.players, scores, wordGuessed: room.wordGuessed });
		}
	});	

	socket.on('gameStartAction', ({ roomId, word }) => {
		console.log(`Le jeu commence dans la room ${roomId} avec le mot ${word}`);
		app.io.to(roomId).emit('gameStarted', { word });
	});

	socket.on('submitLetter', async ({ roomId, playerId, letter, penalties, playerIdPenalized }) => {
		const word = roomWords.get(roomId);
		if(!word) return;

		const room = roomState.get(roomId);
    	if (!room) return;

		let otherPlayer;
		let looser;
		let figure = 0;
		let { wordToGuess, hiddenWord, guessedLetters } = room;

		console.log(`Lettre ${letter} envoyée par ${playerId} dans la room ${roomId}`)
		

		// Vérifier si la lettre a déjà été devinée
		if (guessedLetters.includes(letter)) {
			socket.emit('letterAlreadyGuessed', { letter });
			return;
		}
	
		// Ajouter la lettre devinée
		guessedLetters.push(letter);

		// Mettre à jour le mot caché en remplaçant les underscores par la lettre correcte
		let updatedHiddenWord = hiddenWord.split(' ');
		let foundLetter = false;
	
		// Parcourir le mot à deviner et remplacer les "_" par la lettre correcte
		for (let i = 0; i < wordToGuess.length; i++) {
			if (wordToGuess[i].toUpperCase() === letter) {
				updatedHiddenWord[i] = letter;
				foundLetter = true;
			}
		}

		// Si la lettre est présente, mettre à jour le mot caché
		if (foundLetter) {
			hiddenWord = updatedHiddenWord.join(' '); // Réassembler le mot caché
			room.hiddenWord = hiddenWord; // Mettre à jour l'état de la room avec le nouveau mot caché
	
			const remainingLetters = countRemainingLetters(hiddenWord);
			const showGuessButton = remainingLetters < 6;

			// Vérifier si le mot est complètement trouvé
			const isWordGuessed = hiddenWord.replace(/ /g, '').toLowerCase() === wordToGuess.toLowerCase();
			if (isWordGuessed) {
				// Incrémenter le score du joueur
				room.scores[playerId] = (room.scores[playerId] || 0) + 1;

				if (Array.isArray(room.players)) {
					// Cas où players est un tableau direct
					looser = room.players.find(player => player.userId !== playerId).userId;
				} else if (room.players && Array.isArray(room.players.players)) {
					// Cas où players est un objet contenant un tableau 'players'
					looser = room.players.players.find(player => player.userId !== playerId).userId;
				}

				app.io.to(roomId).emit('gameWon', { winner: playerId, looser: looser, word: wordToGuess, scores: room.scores });
				// Mise à jour de l'état du jeu à "finished" dans la base de données
				try {
					const game = await Game.findOne({ where: { id: roomId } });
					if (game) {
						game.state = 'finished';
						game.winner = playerId;
						await game.save();
						console.log(`L'état du jeu dans la base de données a été mis à jour à "finished" pour la game ${roomId} avec pour gagnant ${playerId}`);
					}

					const score = await Scores.findOne({ where: { playerId: playerId, gameId: roomId } });
					if (score) {
						score.score = room.scores[playerId];
						await score.save();
						console.log(`Le score du joueur ${playerId} a été mis à jour à ${room.scores[playerId]}`);
					}
				} catch (error) {
					console.error("Erreur lors de la mise à jour de l'état du jeu :", error);
				}
				app.io.to(roomId).emit('gameEnded', { winner: playerId, scores: room.scores });
			} else {
				// Vérifier si le joueur a une pénalité
				if (penalties && penalties[playerIdPenalized] > 0) {
					console.log(`Pénalité restante pour ${playerIdPenalized} : ${penalties[playerIdPenalized]}`);
					penalties[playerIdPenalized] -= 1;

					// Si la pénalité n'est pas encore terminée, garder la main au joueur actuel
					if (penalties[playerIdPenalized] > 0) {
						otherPlayer = {};
						otherPlayer.userId = playerId;
			

					}
				} else
				// Si le mot n'est pas encore trouvé, donner la main à l'autre joueur
				if (Array.isArray(room.players)) {
					otherPlayer = room.players.find(player => player.socketId !== socket.id);
		
					
				} else if (room.players && Array.isArray(room.players.players)) {
					otherPlayer = room.players.players.find(player => player.socketId !== socket.id);
		
				}
	
				figure += 1;
				app.io.to(roomId).emit('nextTurn', { playerId: otherPlayer.userId, updatedHiddenWord: hiddenWord, showGuessButton: showGuessButton, figure: figure });
			}
		} else {
			// Vérifier si le joueur a une pénalité
			if (penalties && penalties[playerIdPenalized] > 0) {
				console.log(`Pénalité restante pour ${playerIdPenalized} : ${penalties[playerIdPenalized]}`);
				penalties[playerIdPenalized] -= 1;

				// Si la pénalité n'est pas encore terminée, garder la main au joueur actuel
				if (penalties[playerIdPenalized] > 0) {
					otherPlayer = {};
					otherPlayer.userId = playerId;
		
				}
			} else
			// Si la lettre n'est pas dans le mot, passer à l'autre joueur
			if (Array.isArray(room.players)) {
				otherPlayer = room.players.find(player => player.socketId !== socket.id);
	
			} else if (room.players && Array.isArray(room.players.players)) {
				otherPlayer = room.players.players.find(player => player.socketId !== socket.id);
	
			}
			const remainingLetters = countRemainingLetters(hiddenWord);
        	const showGuessButton = remainingLetters <= 3 && remainingLetters > 0;
			figure += 1;

			app.io.to(roomId).emit('nextTurn', { playerId: otherPlayer.userId, updatedHiddenWord: hiddenWord, showGuessButton: showGuessButton, figure: figure });
		}

		// Envoyer l'événement 'letterGuessed' à tous les joueurs pour qu'ils mettent à jour leurs lettres devinées
		app.io.to(roomId).emit('letterGuessed', { letter });
	})

	socket.on('playerWantsReplay', async ({ playerId, roomId }) => { 
		console.log(`Joueur ${playerId} veut rejouer`);
	
		const room = roomState.get(roomId);
		const players = room ? room.players : [];
		const currentScores = room ? room.scores : {};
		
		if (!playersReadyInRoom[roomId]) {
			playersReadyInRoom[roomId] = [];
		}
	
		if (!playersReadyInRoom[roomId].includes(playerId)) {
			playersReadyInRoom[roomId].push(playerId);
		}
		
		app.io.to(roomId).emit('updateReplayStatus', { playerId });
	
		if (playersReadyInRoom[roomId].length === 2) {
			const startingPlayer = playerId;
			console.log('startingPlayer:', startingPlayer);
			
			// Mise à jour de l'état du jeu à "playing" dans la base de données
			try {
				const game = await Game.findOne({ where: { id: roomId } });
				if (game) {
					game.state = 'playing';
					await game.save();
					console.log(`L'état du jeu dans la base de données a été mis à jour à "playing" pour la game ${roomId}`);
				}
			} catch (error) {
				console.error("Erreur lors de la mise à jour de l'état du jeu :", error);
			}
	
			// Générer un mot aléatoire
			const randomWord = await generateRandomWord(room.wordGuessed);
			if (!randomWord) {
				console.error("Aucun mot n'a été généré.");
				return;
			}
	
			roomWords.set(roomId, randomWord);
			const wordToGuess = randomWord.dataValues.name;

			room.wordGuessed.push(wordToGuess);
	
			console.log(`Le mot à deviner est : ${wordToGuess}`);
	
			app.io.to(roomId).emit('startingPlayer', startingPlayer);
			app.io.to(roomId).emit('gameStart', { roomId, word: wordToGuess });
			console.log(`La partie commence dans la room ${roomId} avec ${startingPlayer} qui commence`);
		
			// Initialisation d'une salle
			const hiddenWord = "_ ".repeat(wordToGuess.length).trim(); // Mot caché (avec des underscores)
			const guessedLetters = []; // Liste des lettres devinées
			
			// Ajout du score accumulé à la partie précédente
			const scores = {};
	
			// Vérifie si players est déjà un tableau
			const playersList = Array.isArray(players) ? players : players.players;
	
			playersList.forEach(player => {
				scores[player.userId] = currentScores[player.userId] || 0;
			});
	
			roomState.set(roomId, { wordToGuess, hiddenWord, guessedLetters, players: playersList, scores, wordGuessed: room.wordGuessed });
	
			app.io.to(roomId).emit('bothPlayersReady');
			// Réinitialiser les joueurs prêts
			playersReadyInRoom[roomId] = [];
		}
		console.log('roomState:', roomState);
	});
	
	socket.on('submitWordGuess', async ({ roomId, playerId, wordGuess }) => {		
		const room = roomState.get(roomId);
		if (!room) return;

		if (!room.penalties) {
			room.penalties = {};
		}

		let looser;

		console.log(`Le joueur ${playerId} a deviné le mot ${wordGuess} dans la room ${roomId}`);
	
		const { wordToGuess, hiddenWord, guessedLetters } = room;
	
		if (wordGuess.toLowerCase() === wordToGuess.toLowerCase()) {
			// Incrémenter le score du joueur
			room.scores[playerId] = (room.scores[playerId] || 0) + 1;
	
			// Mise à jour de l'état du jeu à "finished" dans la base de données
			try {
				const game = await Game.findOne({ where: { id: roomId } });
				if (game) {
					game.state = 'finished';
					game.winner = playerId;
					await game.save();
					console.log(`L'état du jeu dans la base de données a été mis à jour à "finished" pour la game ${roomId} avec pour gagnant ${playerId}`);
				}
	
				const score = await Scores.findOne({ where: { playerId: playerId, gameId: roomId } });
				if (score) {
					score.score = room.scores[playerId];
					await score.save();
					console.log(`Le score du joueur ${playerId} a été mis à jour à ${room.scores[playerId]}`);
				}
			} catch (error) {
				console.error("Erreur lors de la mise à jour de l'état du jeu :", error);
			}

			if (Array.isArray(room.players)) {
				// Cas où players est un tableau direct
				looser = room.players.find(player => player.userId !== playerId).userId;
			} else if (room.players && Array.isArray(room.players.players)) {
				// Cas où players est un objet contenant un tableau 'players'
				looser = room.players.players.find(player => player.userId !== playerId).userId;
			}
	
			app.io.to(roomId).emit('gameWon', { winner: playerId, looser: looser, word: wordToGuess, scores: room.scores });
			app.io.to(roomId).emit('gameEnded', { winner: playerId, scores: room.scores });
		} else {
			// Si le mot n'est pas correct, passer la main à l'autre joueur et lui affliger une pénalité
			room.penalties[playerId] = 3;
			const playerIdPenalized = playerId;
			const otherPlayer = room.players.find(player => player.socketId !== socket.id);
			const remainingLetters = countRemainingLetters(hiddenWord);
			const showGuessButton = false;
			app.io.to(roomId).emit('nextTurn', { playerId: otherPlayer.userId, updatedHiddenWord: hiddenWord, showGuessButton: showGuessButton, penalties: room.penalties, playerIdPenalized });
		}
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

	socket.on('disconnected', (userId) => {
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

//gestion utilisateur
usersRoutes(app);
//gestion des jeux
gamesRoutes(app);
//gestion des mots
wordsRoutes(app);
//gestion des scores
scoresRoutes(app);

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
