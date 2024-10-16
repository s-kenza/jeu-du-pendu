import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const Game = () => {
  const [socket, setSocket] = useState(null);
  const [games, setGames] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [userId, setUserId] = useState(''); // Assurez-vous d'avoir l'ID de l'utilisateur connecté

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    setUserId('SMIALI');

    newSocket.on('roomJoined', ({ roomId, playerNumber }) => {
      setRoomId(roomId);
      setPlayerNumber(playerNumber);
    });

    newSocket.on('gameStart', () => {
      setIsGameStarted(true);
    });

    newSocket.on('opponentAction', (action) => {
      // Gérer l'action de l'adversaire
    });

    newSocket.on('playerLeft', () => {
      setIsGameStarted(false);
      // Gérer la déconnexion de l'adversaire
    });

    fetchGames();

    return () => {
      newSocket.disconnect();
    };
  }, []);

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
      setGames(data.filter(game => game.state === 'pending'));
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

  const joinGame = (gameId) => {
    setRoomId(gameId);
    socket.emit('joinRoom', gameId);
  };

  const makeMove = (action) => {
    socket.emit('gameAction', { roomId, action });
    // Mettre à jour l'état du jeu localement
  };

  return (
    <div>
      {!roomId && (
        <div>
          <h2>Parties disponibles</h2>
          {games.length === 0 ? (
            <p>Aucune partie n'est disponible. Vous pouvez en créer une.</p>
          ) : (
            <ul>
              {games.map(game => (
                <li key={game.id}>
                  Partie {game.id} - Créée par {game.creator} -
                  <button onClick={() => joinGame(game.id)}> - Rejoindre</button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={createGame}>Créer une partie</button>
        </div>
      )}
      {roomId && !isGameStarted && <p>En attente d'un adversaire...</p>}
      {isGameStarted && (
        <div>
          <p>Vous êtes le joueur {playerNumber}</p>
          {/* Interface de jeu */}
        </div>
      )}
    </div>
  );
};

export default Game;