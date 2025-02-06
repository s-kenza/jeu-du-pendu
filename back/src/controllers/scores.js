import Scores from "../models/scores.js";

export async function getScores() {
    return await Scores.findAll();
}

export async function getScoresById(id) {
    return await Scores.findByPk(id);
}

export async function createScore(userId, gameId) {
    if (!userId || !gameId) {
        return { error: "Il manque des paramètres" };
    }
    const datas = await Scores.create({ playerId: userId, gameId: gameId });
    return { scoreId: datas.dataValues.id };
}