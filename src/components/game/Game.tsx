import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { io } from 'socket.io-client';
import confetti from "canvas-confetti";
import { BorderBeam } from "../border-beam.tsx";
import { Particles } from "../particles.tsx";
import { SparklesText } from "../sparkles-text.tsx";
import { InteractiveHoverButton } from "../interactive-hover-button.tsx";
import { PulsatingButton } from "../pulsating-button.tsx"
import ToastNotification from "../auth/ToastNotification.tsx";
import { BoxReveal } from "../magicui/box-reveal.tsx";
import ColourfulText from "../ui/colourful-text.tsx";
import { TypingAnimation } from "../magicui/typing-animation.tsx";
import { Ripple } from "../magicui/ripple.tsx";

const Game = () => {
  const [socket, setSocket] = useState<any>(null);
  const [games, setGames] = useState([]);
  const [roomId, setRoomId] = useState<string | null>(null);
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
  const [scores, setScores] = useState<Record<string, number>>({});
  const [players, setPlayers] = useState([
    { id: playerId, name: winner, points: winner ? scores[winner] || 0 : 0 },
    { id: playerId, name: loser, points: loser ? scores[loser] || 0 : 0 },
  ]);
  const [playersReady, setPlayersReady] = useState<string[]>([]);
  const [color, setColor] = useState("#ffffff");
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [wordGuess, setWordGuess] = useState("");
  const [showGuessButton, setShowGuessButton] = useState(false);
  const [countLetters, setCountLetters] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [playerIdPenalized, setPlayerIdPenalized] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nextPlayerId , setNextPlayerId] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    if (!userId) return;

    const newSocket: any = io(`${API_URL}`);
    setSocket(newSocket);

    newSocket.emit('register', userId);

    console.log(randomWord);
    console.log(nextPlayerId);
    console.log(setTheme);

    const storedRoomId = sessionStorage.getItem('roomId');
    console.log('players length', players.length);
    console.log('players', players);
    if (
      storedRoomId && 
      players.length === 2 && 
      players.every(player => player.id !== null && player.id !== undefined)
    ) {
      setRoomId(storedRoomId);
      setIsGameStarted(true);
    }

    console.log('roomId', roomId);

    if (sessionStorage.getItem('roomId') !== null) {
      console.log('ici');
      newSocket.emit('joinRoom', { roomId, userId });
    }

    newSocket.on('roomJoined', ({ roomId, userId }: { roomId: string, userId: string }) => {
      console.log(`Rejoint la room ${roomId} en tant que joueur ${userId}`);
      setRoomId(roomId);
      setPlayerId(userId);
    });

    newSocket.on('startingPlayer', (startingPlayer: any) => {
      console.log(`Le joueur qui commence est : ${startingPlayer}`);
      setStartingPlayer(startingPlayer);
      setIsChoosing(false); // Arrêter l'animation
      setIsGameStarted(true);
    });

    newSocket.on('gameStart', ({ roomId, word }: { roomId: string, word: string }) => {
      console.log(`La partie a commencé dans la room ${roomId}`);
      console.log(`Le mot à deviner est : ${word}`);
      setIsGameStarted(true);
      setRandomWord(word);
      // Masquer les lettres du mot avec des underscores
      setHiddenWord("_ ".repeat(word.length).trim())

      // Calculer le nombre de lettres du mot
      setCountLetters(word.length);

      setPlayers([
        { id: playerId, name: playerId, points: 0 },
        { id: playerId, name: playerId, points: 0 }
      ])
    });

    newSocket.on('gameStarted', ({ word }: { word: string }) => {
      setRandomWord(word);
      setIsGameStarted(true);
    });

    newSocket.on('updateHiddenWord', ({ updatedWord }: { updatedWord: string }) => {
      setHiddenWord(updatedWord); // Mettre à jour le mot caché
    });

    newSocket.on('nextPlayer', (nextPlayerId: string) => {
      // Vérifie si c'est le tour du joueur actuel
      if (nextPlayerId === playerId) {
        setMessage(`${playerId}, c'est à toi de jouer !`);
      }
    });

    newSocket.on('nextTurn', ({ playerId, updatedHiddenWord, showGuessButton, penalties, playerIdPenalized }: { playerId: string, updatedHiddenWord: string, showGuessButton: boolean, penalties: number, playerIdPenalized: string }) => {
      setHiddenWord(updatedHiddenWord);
      setStartingPlayer(playerId);
      setShowGuessButton(showGuessButton);
      setPenalties(penalties);
      setPlayerIdPenalized(playerIdPenalized);
      setNextPlayerId(playerId);
      console.log("Penalités:", penalties);
      console.log("Joueur pénalisé:", playerIdPenalized);
    });

    newSocket.on('gameWon', ({ winner, word, looser, scores }: { winner: string, word: string, looser: string, scores: Record<string, number> }) => {
      // Mettre à jour le message de fin de jeu
      setGameEndMessage(`${winner} a gagné ! Le mot était : ${word}`);
      setWinner(winner);
      setLoser(looser);
      setScores(scores);

      console.log("Scores:", scores);

      setPlayers([
        { id: winner, name: winner, points: scores[winner] || 0 },
        { id: looser, name: looser, points: scores[looser] || 0 }
      ]);
      // Mettre à jour l'état pour finir le jeu
      setIsGameStarted(false);
      setGuessedLetters([]);
      setShowGuessButton(false);
    });

    newSocket.on('letterAlreadyGuessed', ({ letter }: { letter: string }) => {
      letterAlreadyGuessed(letter);
    });

    newSocket.on('letterGuessed', ({ letter }: { letter: string }) => {
      // Ajouter la lettre à la liste des lettres déjà devinées seulement si elle n'y est pas déjà
      setGuessedLetters((prevGuessedLetters) => {
        if (!prevGuessedLetters.includes(letter)) {
          return [...prevGuessedLetters, letter];
        }
        return prevGuessedLetters;
      });
    });

    newSocket.on('updateReplayStatus', ({ playerId }: { playerId: string }) => {
      setPlayersReady((prevPlayers) => {
        if (!prevPlayers.includes(playerId)) {
          return [...prevPlayers, playerId];
        }
        return prevPlayers;
      });
    });    

    newSocket.on('bothPlayersReady', () => {
      setPlayersReady([]);
      setGuessedLetters([]);
    });

    newSocket.on('gameEnded', ({ winner }: { winner: string }) => {
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

      setGuessedLetters([]);
      setShowGuessButton(false);

    });

    fetchGames();

    return () => {
      newSocket.disconnect();
    };
  }, [userId, roomId, sessionStorage.getItem('roomId')]);

  const fetchGames = async () => {
    try {
      const response = await fetch(`${API_URL}/game`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
          'ngrok-skip-browser-warning': 'any',
        },
      });
  
      const data = await response.json();
      const userId = sessionStorage.getItem('userId'); // Assure-toi que l'ID utilisateur est stocké dans sessionStorage

      const filteredGames = data.filter((game: any) => {
        return (
          game.state === 'pending' ||
          (game.state === 'playing' && !game.winner && (game.firstPlayer === userId || game.secondPlayer === userId))
        );
      });
  
      setGames(filteredGames);
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des parties:", error);
    }
  };  

  const createGame = async () => {
    setIsLoading(true);

    setTimeout(async () => {
    const token = sessionStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'any',
        },
        body: JSON.stringify({ userId: userId }),
      });
      const newGame = await response.json();
      console.log("Nouvelle partie créée:", newGame);
      setRoomId(newGame.gameId);
      sessionStorage.setItem('roomId', newGame.gameId);
    } catch (error) {
      console.error("Erreur lors de la création de la partie:", error);
    }
    setIsLoading(false);
  }, 1500)};

  const joinGame = (gameId: any, userId: string|null) => {
    sessionStorage.setItem('roomId', gameId);
    setIsLoading(true);
    setTimeout(() => {
      setPlayerId(userId);
      setRoomId(gameId);
      setIsLoading(false);
    }, 1500);
};

  const letterAlreadyGuessed = (letter: string) => {
    return (
      <div className="alert">La lettre {letter} a déjà été devinée.</div>
    )
  }

  // Afficher les lettres déjà jouées (barrées)
  const renderGuessedLetters = () => {
    return (
      <div>
        {guessedLetters.map((letter, idx) => (
          // <span className="letter" key={idx} style={{ textDecoration: 'line-through' }}>{letter} </span>
          <kbd key={idx} className="kbd" style={{ textDecoration: 'line-through' }}>{letter}</kbd>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const modal = document.getElementById('my_modal_1');
    
    setMessage(`Renseigne une lettre pour tenter de deviner le mot !`);

    if (gameEndMessage && !isGameStarted) {
      if (modal) {
        (modal as HTMLDialogElement).showModal(); // Ouvrir le modal
      }
    }

  }, [startingPlayer, gameEndMessage, isGameStarted]);

  useEffect(() => {
    setColor(theme === 'dark' ? '#ffffff' : '#000000');
  }, [theme]);

  const handleLetterInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toUpperCase();
    // Vérifier si c'est une seule lettre entre A et Z
    if (/^[A-Z]$/.test(value) && value === '') {
      setLetter(value);
    } else {
      setToastMessage("Veuillez entrer une seule lettre entre A et Z.");
    }
  };

  const submitLetter = () => {
    if (!letter) {
      setToastMessage("Veuillez entrer une lettre.");
      return;
    }
    if (guessedLetters.includes(letter)) {
      alert(`La lettre ${letter} a déjà été devinée.`); // Alerte avant d'envoyer
      return;
    }
  
    // Envoyer la lettre au serveur
    socket.emit('submitLetter', { roomId, playerId, letter, penalties, playerIdPenalized });
  
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
    const roomIdStored = sessionStorage.getItem('roomId');
    const userIdStored = sessionStorage.getItem('userId');
    
    if (roomIdStored && userIdStored) {
      socket.emit('leaveRoom', { roomId, userId });
    }
    
    setIsGameStarted(false);
    sessionStorage.removeItem('roomId');
    
    setIsLoading(true); // Activer le chargement
    setTimeout(() => {
      setRoomId(null);
      fetchGames(); // Mettre à jour la liste des parties
      setGuessedLetters([]); // Réinitialiser les lettres devinées
      setIsGameStarted(false);
      setGameEndMessage('');
      setStartingPlayer(null);
      setRandomWord(null);
      setMessage(null);
      setHiddenWord('');
      setLetter('');
      setWinner(null);
      setLoser(null);
      setScores({});
      setPlayers([]);
      setPlayersReady([]);
      setPenalties(0);
      setPlayerIdPenalized(null);
      setToastMessage(null);
      setNextPlayerId(null);
      setWordGuess("");
      setShowGuessButton(false);
      setCountLetters(0);
    }, 1500); // Temps simulé pour l'actualisation
    const modal = document.getElementById('my_modal_1');
    if (modal) {
      (modal as HTMLDialogElement).close(); // Fermer le modal
    }
  };

  const sortedPlayers = players.sort((a, b) => b.points - a.points);

  const replay = (playerId : string) => {
    if (!playerId) return;
    socket.emit('playerWantsReplay', { playerId, roomId });
  }

  const guessedWordModal = () => {
    const modal = document.getElementById('my_modal_2');
    if (modal) {
      (modal as HTMLDialogElement).showModal()
    }
  }

  const handleguessedWordInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toUpperCase();
    // Vérifier si c'est un mot composé uniquement de lettres de l'alphabet sans accents
    if (value === '' || /^[A-Za-z]+$/.test(value)) {
      setWordGuess(value);
      console.log("Mot deviné:", value);
    } else {
      setToastMessage("Veuillez entrer un mot avec uniquement des lettres sans chiffres, accents ou caractères spéciaux.");
      console.log("Mot invalide:", value);
      return;
    }
  };

  const guessedWord = (wordGuess: string) => {
    console.log("Mot deviné:", wordGuess);
    socket.emit('submitWordGuess', { roomId, playerId, wordGuess });
    const modal = document.getElementById('my_modal_2');
    if (modal) {
      (modal as HTMLDialogElement).close()
    }
    // setWordGuess("");
  }

  console.log("isGameStarted:", isGameStarted);

  return (
    <div>
      <Particles
        key={color}
        className="absolute inset-0 z-0"
        quantity={100}
        ease={80}
        color={color}
        refresh
      />
      {isLoading ? (
        <div className="card">
          <div className="title">
            <SparklesText text="Parties disponibles" />
            <button className="refresh" onClick={refreshGameList}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"></path>
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
            <SparklesText text="Parties disponibles" 
            sparklesCount={10}
            colors={{ first: '#65aa5e', second: '#FE8BBB' }} />
            <button className="refresh" onClick={refreshGameList}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"></path>
              </svg>
            </button>
          </div>
          {games.length === 0 ? (
            <div className="mb-6 mt-6">
              <BoxReveal>
                <p className="mb-6 mt-6 text-xl">Aucune partie n'est disponible. Vous pouvez en créer une.</p>
              </BoxReveal>
            </div>
          ) : (
            <ul>
              {games.map((game: any) => (
                <li className="card game" key={game.id}>
                  <BorderBeam />
                  <p className="description">Partie créée par 
                    <div className="creator">
                      <ColourfulText text={game.creator} />
                    </div>
                    </p>
                  <p className="by">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  Pour 2 joueurs</p>
                  <InteractiveHoverButton className="join" onClick={() => joinGame(game.id, userId)}>Rejoindre</InteractiveHoverButton>
                </li>
              ))}
            </ul>
          )}
          <PulsatingButton className="create" onClick={createGame}>Créer une partie</PulsatingButton>
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

          {/* Modal */}
          <dialog id="my_modal_1" className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Fin de partie ! 🎮</h3>

              {/* Tableau des scores */}
              <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Classement</th>
                    <th>Joueur</th>
                    <th>Points</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, index) => (
                    <tr key={`${player.id}-${index}`} className={index % 2 === 0 ? "bg-base-200" : ""}>
                      <th>{index + 1}</th>

                      {/* Nom en vert si prêt */}
                      <td className={player.id && playersReady?.includes(player.id) ? 'text-green-500 font-bold' : ''}>
                        {player.name}
                      </td>

                      <td>{player.points}</td>

                      {/* Bouton pour rejouer */}
                      <td>
                        {player.name === playerId ? (
                          <button 
                            className={`btn ${player.id && playersReady.includes(player.id) ? 'btn-disabled' : ''}`}
                            onClick={() => player.id && replay(player.id)}
                            disabled={player.id ? playersReady.includes(player.id) : false}
                          >
                            {player.id && playersReady.includes(player.id) ? 'Prêt' : 'Rejouer'}
                          </button>
                        ) : (
                          <button className="btn btn-disabled opacity-50 cursor-not-allowed">
                            {player.id && playersReady.includes(player.id) ? 'Prêt' : 'En attente'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Message de fin */}
            <p className="py-4 text-center">{gameEndMessage}</p>
            
              {/* Bouton pour fermer le modal si nécessaire */}
              <div className="modal-action">
                <button className="btn" onClick={handleExitGame}>
                  Fermer
                </button>
              </div>
            </div>
          </dialog>
        </div>
      )}

        {isGameStarted && (
        <div className="card">
        <h2>Vous êtes le joueur {playerId}</h2>
        {isChoosing && (
        <div className="flex justify-center items-center">
          <span className="loading loading-ring loading-lg"></span>
        </div>
        )}

        {startingPlayer === playerId && (
          <div className="flex justify-center items-center flex-col">
            {guessedLetters.length === 0 && (
              <p className="text-lg mt-2">C'est à toi de commencer !</p>
            )}
            <p className="text-lg mt-2">{message}</p>
          </div>
          )}
        
        {startingPlayer !== playerId && isGameStarted && (
          <div className="flex justify-center items-center">
            <p>Attends que {startingPlayer} joue !</p>
            <div className="flex justify-center items-center">
              <span className="loading loading-ring loading-lg"></span>
            </div>
          </div>
        )}
        <div className="hidden-word">
          <TypingAnimation>Mot à deviner</TypingAnimation>
          <p className="text-2xl font-bold mt-4">{hiddenWord}</p>
        </div>
        {renderGuessedLetters()}

        {startingPlayer === playerId && (
          <div className="flex justify-center items-center mt-4">
            <input 
                type="text" 
                value={letter} 
                onChange={handleLetterInput} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && letter) {
                    submitLetter();
                  } else if (e.key === 'Enter' && !letter) {
                    setToastMessage("Veuillez entrer une lettre.");
                  }
                }}
                maxLength={1} 
                placeholder="Entrez une lettre" 
                className="input"
              />
              <ToastNotification message={toastMessage || ''} setMessage={setToastMessage} />
              <button onClick={submitLetter} className="btn">Soumettre la lettre</button>
              { showGuessButton ? (
                <>
                <dialog id="my_modal_2" className="modal">
                  <div className="modal-box flex flex-col overflow-hidden items-center justify-center text-center"> 
                    <Ripple mainCircleSize={210} mainCircleOpacity={0.25} />
                    <h1 className="font-bold text-6xl ">Devinez le mot</h1>
                    <h2>⚠️ Attention</h2>
                    <p>Si vous décidez de deviner le mot, vous ne pourrez plus proposer de lettres pendant <strong className="text-2xl">2 tours</strong>.</p>
                    <br/>
                    <br/>
                    <div className="flex items-center justify-center gap-2 p-8 bg-base-200 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="stroke-info h-6 w-6 shrink-0">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    <p>Il y a <strong>{countLetters} lettres</strong> dans le mot.</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <input 
                        type="text" 
                        placeholder="Entrez le mot" 
                        className="input border border-base-300 rounded-lg " 
                        value={wordGuess} 
                        onChange={handleguessedWordInput} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && wordGuess) {
                            guessedWord(wordGuess);
                          } else if (e.key === 'Enter' && !wordGuess) {
                            setToastMessage("Veuillez entrer un mot.");
                          }}
                        }
                        />
                      <button className="btn" onClick={() => guessedWord(wordGuess)}>Soumettre</button>
                      <button className="btn" onClick={() => { (document.getElementById('my_modal_2') as HTMLDialogElement).close() }}>Annuler</button>
                    </div>
                  </div>
                </dialog>
                <PulsatingButton pulseColor={'#431176'} className="btn guessWord mx-4" onClick={guessedWordModal}>Devinez le mot</PulsatingButton>
                </>
              ) : null }
          </div>
        )}
        <button className="exit" onClick={handleExitGame}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
          </svg>
          Quitter la partie
        </button>

      </div>
    )}

    </div>
  );  
};

export default Game;
