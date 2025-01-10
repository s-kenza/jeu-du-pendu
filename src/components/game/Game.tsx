import { useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { io } from 'socket.io-client';

const Game = () => {
  const [socket, setSocket] = useState<any>(null);
  const [games, setGames] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const { userId } = useAuth();
  const [isChoosing, setIsChoosing] = useState(false);
  const [startingPlayer, setStartingPlayer] = useState<string | null>(null);
  const [randomWord, setRandomWord] = useState<string | null>(null); 
  const [message, setMessage] = useState<string | null>(null); // Message à afficher
  const [letter, setLetter] = useState<string>(""); // Lettre entrée par le joueur
  const [hiddenWord, setHiddenWord] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]); // Liste des lettres déjà devinées

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

    newSocket.on('gameWon', ({ winner, word }) => {
      alert(`${winner} a gagné ! Le mot était : ${word}`);
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

    newSocket.on('gameEnded', () => {
      window.location.href = '/game';  // Redirige vers la page d'accueil
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
    } catch (error) {
      console.error("Erreur lors de la récupération des parties:", error);
    }
  };

  const createGame = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://localhost:3000/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: userId }),
      });
      const newGame = await response.json();
      console.log("Nouvelle partie créée:", newGame);
      setRoomId(newGame.id);
      socket.emit('joinRoom', newGame.id);
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
  }, [startingPlayer]); // Lancer le jeu automatiquement dès qu'on connaît le joueur qui commence

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

  return (
    <div>
      {!roomId && (
        <div className="card">
          <h2>Parties disponibles</h2>
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
      )}
      {roomId && !isGameStarted && 
      <div className="card">
        <h2>En attente d'un adversaire...</h2>
      </div>
      }
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
