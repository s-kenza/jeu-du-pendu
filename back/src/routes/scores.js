import { getScores, getScoresById } from "../controllers/scores.js";

export function scoresRoutes(app) {
    // Obtenir la liste des mots
    app.get("/scores",
        async (request, reply) => {
        reply.send(await getScores());
    });

    // Obtenir un mot à partir de son id
    app.get("/scores/:id",
        async (request, reply) => {
        reply.send(await getScoresById(request.params.id));
    });
}