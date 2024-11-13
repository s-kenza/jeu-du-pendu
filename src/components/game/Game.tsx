import { useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { io } from 'socket.io-client';

const Game = () => {
  const [socket, setSocket] = useState<any>(null);
  const [games, setGames] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [userId, setUserId] = useState(''); // Assurez-vous d'avoir l'ID de l'utilisateur connecté
  const [startingPlayer, setStartingPlayer] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    setUserId('SMIALI');

    newSocket.on('roomJoined', ({ roomId, playerNumber }) => {
      setRoomId(roomId);
      console.log('Received roomJoined event', roomId, playerNumber);
      setPlayerNumber(playerNumber);
    });

    newSocket.on('gameStart', () => {
      console.log('Received gameStart event');
      setIsGameStarted(true);
      // Attendre quelques secondes avant de choisir le joueur qui commence
      setTimeout(() => {
        if(roomId) {
          chooseStartingPlayer(roomId);
        } else {
          console.log('Room ID is not set yet');
        }
      }, 3000); // 3 secondes de délai
    });

    newSocket.on('startingPlayerChosen', (player) => {
      console.log('Received startingPlayerChosen event', player);
      setStartingPlayer(player);
    });

    newSocket.on('roomFull', () => {
      console.log("La partie est pleine");
    });

    fetchGames();

    return () => {
      newSocket.off('roomJoined');
      newSocket.off('gameStart');
    };
  }, []);
  // }, [roomId, isGameStarted]);

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

  // Créer une nouvelle partie
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

  const joinGame = (gameId: any) => {
    setRoomId(gameId);
    socket.emit('joinRoom', gameId);
  };

  // Fonction qui choisit au hasard entre les deux joueurs qui commence
  const chooseStartingPlayer = (roomId: string) => {
    console.log(roomId);
    console.log('Emitting chooseStartingPlayer event');
    socket.emit('chooseStartingPlayer', { roomId });
  };

  // const makeMove = (action) => {
  //   socket.emit('gameAction', { roomId, action });
  //   // Mettre à jour l'état du jeu localement
  // };

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
                  <button className="join" onClick={() => joinGame(game.id)}>Rejoindre</button>
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
          <h2>Vous êtes le joueur {playerNumber}</h2>
          {startingPlayer && (
            <p>{startingPlayer} commence</p>
          )}
          {/* Interface de jeu */}
        </div>
      )}
    </div>
  );
};

export default Game;