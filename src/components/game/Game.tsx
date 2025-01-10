import { useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { io } from 'socket.io-client';
import confetti from "canvas-confetti";


const Game = () => {
  const [socket, setSocket] = useState<any>(null);
  const [games, setGames] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameEndMessage, setGameEndMessage] = useState('');
  const { userId } = useAuth();
  const [isChoosing, setIsChoosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startingPlayer, setStartingPlayer] = useState<string | null>(null);
  const [randomWord, setRandomWord] = useState<string | null>(null); 
  const [message, setMessage] = useState<string | null>(null); // Message à afficher
  const [letter, setLetter] = useState<string>(""); // Lettre entrée par le joueur
  const [hiddenWord, setHiddenWord] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]); // Liste des lettres déjà devinées
  const [winner, setWinner] = useState<string | null>(null);
  const [loser, setLoser] = useState<string | null>(null);
  const [players, setPlayers] = useState([
    { id: 1, name: winner, points: 1 },
    { id: 2, name: loser, points: 0 }
  ]);

  useEffect(() => {
    if (!userId) return;

    const newSocket: any = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.emit('register', userId);

    if (roomId !== null) {
      console.log("UserId avant joinRoom:", userId);
      newSocket.emit('joinRoom', { roomId, userId });
    }

    newSocket.on('roomJoined', ({ roomId, userId }) => {
      console.log(`Rejoint la room ${roomId} en tant que joueur ${userId}`);
      setRoomId(roomId);
      setPlayerId(userId);
    });

    newSocket.on('startingPlayer', (startingPlayer: any) => {
      console.log(`Le joueur qui commence est : ${startingPlayer}`);
      setStartingPlayer(startingPlayer);
      setIsChoosing(false); // Arrêter l'animation
    });

    newSocket.on('gameStart', ({ roomId, word }) => {
      console.log(`La partie a commencé dans la room ${roomId}`);
      console.log(`Le mot à deviner est : ${word}`);
      setIsGameStarted(true);
      setRandomWord(word);
      // Masquer les lettres du mot avec des underscores
      setHiddenWord("_ ".repeat(word.length).trim())
    });

    newSocket.on('gameStarted', ({ word }) => {
      setRandomWord(word);
      setDisplayWord('_ '.repeat(word.length)); // Afficher les underscores
      setIsGameStarted(true);
    });

    newSocket.on('updateHiddenWord', ({ updatedWord, letter, playerId }) => {
      setHiddenWord(updatedWord); // Mettre à jour le mot caché
    });

    newSocket.on('nextPlayer', (nextPlayerId) => {
      // Vérifie si c'est le tour du joueur actuel
      if (nextPlayerId === playerId) {
        setMessage(`${playerId}, c'est à toi de jouer !`);
      }
    });

    newSocket.on('nextTurn', ({ playerId, updatedHiddenWord }) => {
      setHiddenWord(updatedHiddenWord);
      setStartingPlayer(playerId);
    });

    newSocket.on('gameWon', ({ winner, word, looser }) => {
      // Mettre à jour le message de fin de jeu
      setGameEndMessage(`${winner} a gagné ! Le mot était : ${word}`);
      setWinner(winner);
      setLoser(looser);

      setPlayers([
        { id: 1, name: winner, points: 1 },
        { id: 2, name: looser, points: 0 }
      ]);
      // Mettre à jour l'état pour finir le jeu
      setIsGameStarted(false);
    });

    newSocket.on('letterAlreadyGuessed', ({ letter }) => {
      alert(`La lettre ${letter} a déjà été devinée.`);
    });

    newSocket.on('letterGuessed', ({ letter }) => {
      // Ajouter la lettre à la liste des lettres déjà devinées seulement si elle n'y est pas déjà
      setGuessedLetters((prevGuessedLetters) => {
        if (!prevGuessedLetters.includes(letter)) {
          return [...prevGuessedLetters, letter];
        }
        return prevGuessedLetters;
      });
    });

    newSocket.on('gameEnded', ({ winner }) => {
      // Déclencher les confettis uniquement pour le joueur gagnant
      if (winner === playerId) {
        const end = Date.now() + 3 * 1000; // 3 seconds
        const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

        const frame = () => {
          if (Date.now() > end) return;
    
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            startVelocity: 60,
            origin: { x: 0, y: 0.5 },
            colors: colors
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            startVelocity: 60,
            origin: { x: 1, y: 0.5 },
            colors: colors
          });
    
          requestAnimationFrame(frame);
        };
    
        frame();
      }
    });

    fetchGames();

    return () => {
      newSocket.disconnect();
    };
  }, [userId, roomId]);

  const fetchGames = async () => {
    try {
      const response = await fetch('http://localhost:3000/game', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      setGames(data.filter((game: any) => game.state === 'pending'));
      console.log("Parties récupérées:", data);
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des parties:", error);
    }
  };

  const createGame = async () => {
    const token = localStorage.getItem('authToken');
    console.log(token);
    try {
      const response = await fetch('http://localhost:3000/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: userId }),
      });
      const newGame = await response.json();
      console.log("Nouvelle partie créée:", newGame);
      setRoomId(newGame.gameId);
      socket.emit('joinRoom', newGame.gameId);
    } catch (error) {
      console.error("Erreur lors de la création de la partie:", error);
    }
  };

  const joinGame = (gameId: any, userId: string|null) => {
    setRoomId(gameId);
    setPlayerId(userId);
  };

  const chooseStartingPlayer = (players: string[]) => {
    setIsChoosing(true);
    setTimeout(() => {
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      setStartingPlayer(randomPlayer);
      setIsChoosing(false);
    }, 3000);
  };

  // Afficher les lettres déjà jouées (barrées)
  const renderGuessedLetters = () => {
    return (
      <div>
        {guessedLetters.map((letter, idx) => (
          <span key={idx} style={{ textDecoration: 'line-through' }}>{letter} </span>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (startingPlayer) {
      // Quand le joueur qui commence est défini, afficher le message
      setMessage(`${startingPlayer}, c'est à toi de commencer ! Renseigne une lettre.`);
    }

    if (gameEndMessage && !isGameStarted) {
      const modal = document.getElementById('my_modal_1');
      if (modal) {
        modal.showModal(); // Ouvrir le modal
      }
    }

  }, [startingPlayer, gameEndMessage, isGameStarted]); // Lancer le jeu automatiquement dès qu'on connaît le joueur qui commence

  const handleLetterInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLetter(event.target.value.toUpperCase()); // Enregistrer la lettre en majuscule
  };

  const submitLetter = () => {
    if (guessedLetters.includes(letter)) {
      alert(`La lettre ${letter} a déjà été devinée.`); // Alerte avant d'envoyer
      return; // On sort de la fonction
    }
  
    // Envoyer la lettre au serveur
    socket.emit('submitLetter', { roomId, playerId, letter });
  
    // Ajout de la lettre localement pour la prochaine mise à jour (mais uniquement après la réponse serveur)
    setGuessedLetters((prevGuessedLetters) => [...prevGuessedLetters, letter]);

    setLetter('');
  };

  const refreshGameList = () => {
    setIsLoading(true);
    setTimeout(() => {
      fetchGames();
    }, 1500);
  }

  const handleExitGame = () => {
    setIsLoading(true); // Activer le chargement
    setTimeout(() => {
      setRoomId(null);
      setIsGameStarted(false);
      fetchGames(); // Mettre à jour la liste des parties
    }, 1500); // Temps simulé pour l'actualisation
  };

  const sortedPlayers = players.sort((a, b) => b.points - a.points);

  return (
    <div>
      {isLoading ? (
        <div className="card">
          <div className="title">
            <h2>Parties disponibles</h2>
            <button className="refresh" onClick={refreshGameList}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"></path>
              </svg>
            </button>
          </div>
            <div className="loading-screen">
              <span className="loading loading-ring custom-loading"></span>
            </div>
        </div>
      ) : !roomId ? (
        <div className="card">
          <div className="title">
            <h2>Parties disponibles</h2>
            <button className="refresh" onClick={refreshGameList}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"></path>
              </svg>
            </button>
          </div>
          {games.length === 0 ? (
            <p>Aucune partie n'est disponible. Vous pouvez en créer une.</p>
          ) : (
            <ul>
              {games.map((game: any) => (
                <li className="card game" key={game.id}>
                  <p className="description">Partie {game.id}</p>
                  <p className="by">Créée par {game.creator}</p>
                  <button className="join" onClick={() => joinGame(game.id, userId)}>Rejoindre</button>
                </li>
              ))}
            </ul>
          )}
          <button className="create" onClick={createGame}>Créer une partie</button>
        </div>
      ) : roomId && !isGameStarted && 
      <div className="card">
        <div className="waiting">
          <h2>En attente d'un adversaire
          <span className="loading loading-dots loading-md"></span>
          </h2>
        </div>
        <button className="exit" onClick={handleExitGame}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
          </svg>
            Quitter la partie
        </button>
      </div>
      }

      {/* Afficher le message de fin de jeu si le jeu est terminé */}
      {gameEndMessage && !isGameStarted && (
        <div className="card game-end-message">
          <dialog id="my_modal_1" className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Fin de partie !</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  {/* head */}
                  <thead>
                    <tr>
                      <th>Classement</th>
                      <th>Joueur</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                  {sortedPlayers.map((player, index) => (
                    <tr key={player.name} className={index % 2 === 0 ? "bg-base-200" : ""}>
                      <th>{index + 1}</th>
                      <td>{player.name}</td>
                      <td>{player.points}</td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
              <p className="py-4">{gameEndMessage}</p>
              <div className="modal-action">
                <form method="dialog">
                  <button className="btn">Rejouer</button>
                  <button className="btn">Quitter</button>
                </form>
              </div>
            </div>
          </dialog>
        </div>
      )}

      {isGameStarted && (
        <div className="card">
          <h2>Vous êtes le joueur {playerId}</h2>
          {isChoosing ? (
            <div className="flex justify-center items-center">
              <span className="loading loading-ring loading-lg"></span>
            </div>
          ) : (
            startingPlayer && (
              <p>{startingPlayer} commence</p>
            )
          )}
          {message && <p className="text-lg mt-2">{message}</p>}
          <p className="text-2xl font-bold mt-4">Mot à deviner {hiddenWord}</p>
          {renderGuessedLetters()}
  
          {startingPlayer === playerId && (
            <div>
              <input 
                type="text" 
                value={letter} 
                onChange={handleLetterInput} 
                maxLength={1} 
                placeholder="Entrez une lettre" 
                className="input"
              />
              <button onClick={submitLetter} className="btn">Soumettre la lettre</button>
            </div>
          )}
        </div>
      )}
    </div>
  );  
};

export default Game;
