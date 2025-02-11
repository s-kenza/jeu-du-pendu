import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext"; // Utilisez un contexte de socket si vous en avez un pour partager le socket

const GameWord = ({ roomId, startingPlayer }: { roomId: string|null, startingPlayer: string|null }) => {
  const [word, setWord] = useState<string | null>(null);
  const [maskedWord, setMaskedWord] = useState<string>(""); // Affichage avec des _
  const [lettersGuessed, setLettersGuessed] = useState<string[]>([]); // Liste des lettres devinées
  const [gameOver, setGameOver] = useState<boolean>(false); // Vérifier si la partie est terminée
  const [winner, setWinner] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const socket = useSocket(); // Utilisation du socket partagé (s'il existe)

  useEffect(() => {
    // Lorsque le jeu commence et que c'est le bon joueur, choisir un mot
    if (startingPlayer === socket.id) {
      // Choisir un mot aléatoire depuis une table `words`
      const getRandomWord = async () => {
        try {
          const response = await fetch(`${API_URL}/words`); // Vous devez avoir une API pour récupérer les mots
          const words = await response.json();
          const randomWord = words[Math.floor(Math.random() * words.length)];
          setWord(randomWord);
          setMaskedWord('_'.repeat(randomWord.length)); // Masquer le mot avec des _
          socket.emit('newWordChosen', { roomId, word: randomWord }); // Envoie du mot à la room
        } catch (error) {
          console.error("Erreur lors de la récupération du mot", error);
        }
      };

      getRandomWord();
    }

    // Écouter les événements de mise à jour du mot deviné
    socket.on('updateMaskedWord', (maskedWord: string) => {
      setMaskedWord(maskedWord);
    });

    socket.on('gameOver', (winner: string) => {
      setGameOver(true);
      setWinner(winner); // Indiquer qui a gagné
    });

    return () => {
      socket.off('updateMaskedWord');
      socket.off('gameOver');
    };
  }, [startingPlayer, roomId, socket]);

  // Fonction de gestion des lettres devinées
  const guessLetter = (letter: string) => {
    if (lettersGuessed.includes(letter)) {
      return; // Si la lettre a déjà été devinée, ne rien faire
    }

    setLettersGuessed([...lettersGuessed, letter]);

    // Vérifier si la lettre est dans le mot
    const updatedMaskedWord = word!.split('')
      .map(letterInWord => lettersGuessed.includes(letterInWord) || letterInWord === letter ? letterInWord : '_')
      .join('');

    setMaskedWord(updatedMaskedWord);

    // Émettre l'événement pour mettre à jour les autres joueurs
    socket.emit('guessLetter', { roomId, maskedWord: updatedMaskedWord });

    // Vérifier si le mot a été entièrement deviné
    if (!updatedMaskedWord.includes('_')) {
      socket.emit('gameOver', { roomId, winner: socket.id });
    }
  };

  return (
    <div className="game-word">
      <h3>Mot à deviner:</h3>
      <p>{maskedWord}</p>

      <div>
        <label>Devinez une lettre:</label>
        <input
          type="text"
          maxLength={1}
          onChange={(e) => guessLetter(e.target.value.toUpperCase())}
          disabled={gameOver}
        />
      </div>

      {gameOver && <p>{winner === socket.id ? "Vous avez gagné!" : `${winner} a gagné!`}</p>}
    </div>
  );
};

export default GameWord;
