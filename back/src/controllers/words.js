import Word from "../models/words.js";

export async function getWords() {
    return await Word.findAll();
}

export async function getWordById(id) {
    return await Word.findByPk(id);
}

export async function generateRandomWord(usedWords = []) {
  try {
      const words = await Word.findAll();
      if (words.length === 0) {
          throw new Error("Aucun mot disponible dans la base de données.");
      }

      // Filtrer les mots non utilisés
      const availableWords = words.filter(word => !usedWords.includes(word.dataValues.name));

      if (availableWords.length === 0) {
          throw new Error("Tous les mots ont été utilisés.");
      }

      const randomIndex = Math.floor(Math.random() * availableWords.length);
      return availableWords[randomIndex];
  } catch (error) {
      console.error("Erreur lors de la récupération d'un mot aléatoire :", error);
      throw error;
  }
}

export function countRemainingLetters(hiddenWord) {
  return hiddenWord.split(' ').filter(char => char === '_').length;
}