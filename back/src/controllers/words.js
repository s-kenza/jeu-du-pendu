import Word from "../models/words.js";

export async function getWords() {
    return await Word.findAll();
}

export async function getWordById(id) {
    return await Word.findByPk(id);
}

export async function generateRandomWord() {
    try {
      const words = await Word.findAll(); // Récupérer tous les mots
      if (words.length === 0) {
        throw new Error("Aucun mot disponible dans la base de données.");
      }
      const randomIndex = Math.floor(Math.random() * words.length);
      return words[randomIndex]; // Retourner un mot aléatoire
    } catch (error) {
      console.error("Erreur lors de la récupération d'un mot aléatoire :", error);
      throw error;
    }
}