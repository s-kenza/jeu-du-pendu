import Word from "../models/words.js";

export async function getWords() {
    return await Word.findAll();
}

export async function getWordById(id) {
    return await Word.findByPk(id);
}