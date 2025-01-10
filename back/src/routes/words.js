import { getWords, getWordById, generateRandomWord } from "../controllers/words.js";

export function wordsRoutes(app) {
    // Obtenir la liste des mots
    app.get("/word",
        async (request, reply) => {
        reply.send(await getWords());
    });

    // Obtenir un mot aléatoire
    app.get("/word/random",
        async (request, reply) => {
        const randomWord = await generateRandomWord();
        reply.send(randomWord);
    });

    // Obtenir un mot à partir de son id
    app.get("/word/:id",
        async (request, reply) => {
        reply.send(await getWordById(request.params.id));
    });
}