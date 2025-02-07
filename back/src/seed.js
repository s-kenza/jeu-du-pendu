import Word from "./models/words.js";

// Liste de mots pour le jeu du pendu
const words = [
  { name: "evolution" },
  { name: "magnitude" },
  { name: "calculateur" },
  { name: "architecture" },
  { name: "frustration" },
  { name: "metamorphose" },
  { name: "ordinateur" },
  { name: "vitesse" },
  { name: "consequence" },
  { name: "magnifique" },
  { name: "champion" },
  { name: "impulsion" },
  { name: "deception" },
  { name: "luminaire" },
  { name: "fluctuation" },
  { name: "dynamique" },
  { name: "processus" },
  { name: "integration" },
  { name: "estimation" },
  { name: "reconnaissance" },
  { name: "temporaire" },
  { name: "precision" },
  { name: "comprehension" },
  { name: "attraction" },
  { name: "formation" },
  { name: "reaction" },
  { name: "impression" },
  { name: "pression" },
  { name: "manipulation" },
  { name: "diplomatie" },
  { name: "fascination" },
  { name: "proportion" },
  { name: "indication" },
  { name: "responsable" },
  { name: "perception" },
  { name: "adaptation" },
  { name: "exploration" },
  { name: "completude" },
  { name: "secretariat" },
  { name: "innovation" },
  { name: "sensation" },
  { name: "initiative" },
  { name: "perfection" },
  { name: "affection" },
  { name: "satisfaction" },
  { name: "proposition" },
  { name: "litterature" },
  { name: "engagement" },
  { name: "revolution" },
  { name: "anticipation" },
  { name: "surprise" },
  { name: "combinaison" },
  { name: "communication" },
  { name: "situation" },
  { name: "justification" },
  { name: "intervention" },
  { name: "perseverance" },
];

export async function seedWords() {
  try {
    // Insérer chaque mot dans la table words
    for (const word of words) {
      const existingWord = await Word.findOne({ where: { name: word.name } });

      if (!existingWord) {
        await Word.create(word);
        console.log(`Mot "${word.name}" ajouté avec succès.`);
      } else {
        console.log(`Le mot "${word.name}" existe déjà.`);
      }
    }

    console.log("Table words peuplée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'ensemencement des mots :", error);
  }
}