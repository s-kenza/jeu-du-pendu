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

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

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
	reply.send({ documentationURL: `${BACKEND_URL}/documentation` });
});
// Fonction pour décoder et vérifier le token
app.decorate("authenticate", async (request, reply) => {
	try {
		console.log("Headers:", request.headers);
		await request.jwtVerify();
    	console.log("Authentification réussie pour", request.user);
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
const roomState = new Map(); // roomState est une Map où chaque room a un état avec le mot à deviner et le mot caché
const playersReadyInRoom = {}; // Pour suivre les joueurs prêts à rejouer

const initializeRoomState = (roomId) => {
	return {
	  players: [],
	  wordToGuess: null,
	  hiddenWord: null,
	  guessedLetters: new Set(), // Utilisation d'un Set pour les lettres devinées
	  scores: {},
	  wordGuessed: [],
	  gameState: {
		currentTurn: null,
		isGameOver: false,
		turnCount: 0,
		wrongAttempts: 0,
		lastAction: null,
		timestamp: Date.now()
	  },
	  penalties: {}
	};
  };

  const updateGuessedLetter = (roomId, letter, playerId) => {
	const room = roomState.get(roomId);
	if (!room) return null;
  
	const result = {
	  isCorrect: false,
	  updatedHiddenWord: room.hiddenWord,
	  foundPositions: [],
	  gameOver: false
	};
  
	// Ajouter la lettre aux lettres devinées
	room.guessedLetters.push(letter);
  
	// Vérifier si la lettre est dans le mot
	const wordArray = room.wordToGuess.split('');
	let newHiddenWord = room.hiddenWord.split(' ');
  
	wordArray.forEach((char, index) => {
	  if (char.toLowerCase() === letter.toLowerCase()) {
		result.isCorrect = true;
		result.foundPositions.push(index);
		newHiddenWord[index] = letter;
	  }
	});
  
	// Mettre à jour le mot caché
	room.hiddenWord = newHiddenWord.join(' ');
	result.updatedHiddenWord = room.hiddenWord;
  
	// Vérifier si le mot est complet
	if (room.hiddenWord.replace(/ /g, '').toLowerCase() === room.wordToGuess.toLowerCase()) {
	  result.gameOver = true;
	  room.scores[playerId] = (room.scores[playerId] || 0) + 1;
	}
  
	// Sauvegarder les changements
	roomState.set(roomId, room);
  
	return result;
  };
  
  // Fonction pour récupérer l'état actuel d'une room
const getRoomState = (roomId) => {
	const room = roomState.get(roomId);
	if (!room) return null;
  
	return {
	  ...room,
	  guessedLetters: Array.from(room.guessedLetters), // Convertir le Set en Array pour la transmission
	  remainingLetters: countRemainingLetters(room.hiddenWord),
	  canGuessWord: countRemainingLetters(room.hiddenWord) <= 3
	};
};
  
  // Fonction pour vérifier si une lettre a déjà été devinée
  const isLetterAlreadyGuessed = (roomId, letter) => {
	const room = roomState.get(roomId);
	return room ? room.guessedLetters.has(letter) : false;
  };
  
  // Fonction pour sauvegarder l'état complet de la partie
  const saveGameState = (roomId) => {
	const room = roomState.get(roomId);
	if (!room) return;
  
	const gameState = {
	  ...room,
	  lastSaved: Date.now()
	};
  
	console.log(`État de la partie sauvegardé pour la room ${roomId}:`, gameState);
	return gameState;
  };
// Traiter la connexion

app.io.on("connection", (socket) => {
	console.log(`Joueur connecté : ${socket.id}`);

	socket.on('joinRoom', async ({ roomId, userId }) => {
		console.log('UserId côté serveur:', userId);

		const existingRoom = roomState.get(roomId);
	
		if (!roomState.has(roomId)) {
			// Créer une nouvelle room
			roomState.set(roomId, initializeRoomState(roomId));
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
			
			// Si la partie est en cours, renvoyer l'état actuel au joueur qui revient
			if (room.wordToGuess) {
				socket.emit('gameRejoined', {
					wordToGuess: room.wordToGuess,
					hiddenWord: room.hiddenWord,
					guessedLetters: room.guessedLetters,
					scores: room.scores,
					currentTurn: room.currentTurn, // Ajoutez cette propriété à votre état
					penalties: room.penalties
				});
			}

			return;
		}
	
		if (players.players.length >= 2) {
			// Si la room est pleine, envoyer un événement au client
			socket.emit('roomFull', { message: 'La partie est pleine.' });
			return;
		}
	
		// Mettre à jour le socketId du joueur s'il revient
		const playerIndex = room.players.findIndex(p => p.userId === userId);
		if (playerIndex !== -1) {
			room.players[playerIndex].socketId = socket.id;
		} else {
			room.players.push({ socketId: socket.id, userId });
		}
		socket.join(roomId);
		console.log(`User ${userId} a rejoint la room ${roomId}`);
		console.log('roomState joueurs:', roomState.get(roomId).players);
		console.log('taille roomState joueurs:', roomState.get(roomId).players.length);
	
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
		if (players.players.length === 2 && !room.wordToGuess) {
			const startingPlayer = players.players[Math.floor(Math.random() * players.players.length)].userId;
			console.log('joueur enregistré 1', players.players[0].userId);
			console.log('joueur enregistré 2', players.players[1].userId);
			// Mise à jour de l'état du jeu à "playing" dans la base de données
			try {
				const game = await Game.findOne({ where: { id: roomId } });
				if (game) {
					game.firstPlayer = players.players[0].userId;
					game.secondPlayer = players.players[1].userId;
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
		} else if (room.players.length === 2 && room.wordToGuess) {
			// Si la partie est en cours, envoyer l'état actuel au joueur qui rejoint
			socket.emit('gameRejoined', {
				wordToGuess: room.wordToGuess,
				hiddenWord: room.hiddenWord,
				guessedLetters: room.guessedLetters,
				scores: room.scores,
				currentTurn: room.currentTurn, // Ajoutez cette propriété à votre état
				penalties: room.penalties
			});
		}
	});	

	socket.on('gameStartAction', ({ roomId, word }) => {
		console.log(`Le jeu commence dans la room ${roomId} avec le mot ${word}`);
		app.io.to(roomId).emit('gameStarted', { word });
	});

	socket.on('submitLetter', async ({ roomId, playerId, letter, penalties, playerIdPenalized }) => {
		const room = roomState.get(roomId);
		if (!room) return;
	
		// Vérifier si la lettre a déjà été devinée
		if (room.guessedLetters.includes(letter)) {
			socket.emit('letterAlreadyGuessed', { letter });
			return;
		}
	
		// Mettre à jour l'état avec la nouvelle lettre
		const result = updateGuessedLetter(roomId, letter, playerId);
		if (!result) return;
	
		// Gérer le cas où le jeu est terminé (mot trouvé)
		if (result.gameOver) {
			const looser = getLooserPlayer(room, playerId);
			
			// Mettre à jour la base de données
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
	
			// Émettre les événements de fin de partie
			app.io.to(roomId).emit('gameWon', { 
				winner: playerId, 
				looser: looser, 
				word: room.wordToGuess, 
				scores: room.scores 
			});
			app.io.to(roomId).emit('gameEnded', { 
				winner: playerId, 
				scores: room.scores 
			});
			return;
		}
	
		// Gérer le tour suivant
		let nextPlayerId = getNextPlayer(room, playerId).userId;
	
		// Gérer les pénalités
		if (penalties && penalties[playerIdPenalized] > 0) {
			penalties[playerIdPenalized] -= 1;
			if (penalties[playerIdPenalized] > 0) {
				nextPlayerId = playerId; // Le joueur garde la main
			} else {
				nextPlayerId = getNextPlayer(room, playerId).userId;
			}
		} else {
			// Si pas de lettre trouvée ou pas de pénalité, passer au joueur suivant
			if (!result.isCorrect) {
				nextPlayerId = getNextPlayer(room, playerId).userId;
			}
		}
	
		// Calculer si le bouton de devinette doit être affiché
		const remainingLetters = countRemainingLetters(result.updatedHiddenWord);
		const showGuessButton = remainingLetters <= 3 && remainingLetters > 0;
	
		console.log('nextPlayerId:', nextPlayerId);

		// Émettre les événements de mise à jour
		app.io.to(roomId).emit('letterGuessed', { letter });
		app.io.to(roomId).emit('nextTurn', { 
			playerId: nextPlayerId, 
			updatedHiddenWord: result.updatedHiddenWord, 
			showGuessButton: showGuessButton,
			penalties: penalties,
			playerIdPenalized: playerIdPenalized
		});
	
		// Sauvegarder l'état final de la partie
		saveGameState(roomId);
	});
	
	// Fonctions utilitaires
	const getLooserPlayer = (room, winnerId) => {
		if (Array.isArray(room.players)) {
			return room.players.find(player => player.userId !== winnerId)?.userId;
		} else if (room.players && Array.isArray(room.players.players)) {
			return room.players.players.find(player => player.userId !== winnerId)?.userId;
		}
		return null;
	};
	
	const getNextPlayer = (room, currentPlayerId) => {
		const players = Array.isArray(room.players) ? room.players : room.players.players;
		return players.find(player => player.userId !== currentPlayerId);
	};

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

	socket.on('leaveRoom', ({ roomId, userId }) => {
		console.log(`L'utilisateur ${userId} a quitté la room ${roomId}`);
		
		if (roomState.has(roomId)) {
			const room = roomState.get(roomId);

			// Supprimer le joueur de la room
			room.players = room.players.filter(player => player.userId !== userId);

			roomState.set(roomId, room);

			socket.leave(roomId);
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
			"Serveur Fastify lancé sur " + chalk.blue(BACKEND_URL)
		);
		console.log(
			chalk.bgYellow(
				`Accéder à la documentation sur ${BACKEND_URL}/documentation`
			)
		);
	} catch (err) {
		console.log(err);
		process.exit(1);
	}
};
start();
