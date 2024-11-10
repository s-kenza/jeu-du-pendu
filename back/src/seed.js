import Word from "./models/words.js";

// Liste de mots pour le jeu du pendu
const words = [
  { name: "ordinateur" },
  { name: "javascript" },
  { name: "pendu" },
  { name: "react" },
  { name: "sequelize" },
  { name: "docker" },
  { name: "algorithm" },
  { name: "frontend" },
  { name: "backend" },
];

export async function seedWords() {
  try {
    // Insérer chaque mot dans la table words
    await Word.bulkCreate(words, { ignoreDuplicates: true });
    console.log("Table words peuplée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'ensemencement des mots :", error);
  }
}