import UserData from "../MongoDB/models/UserData";
// xpService.ts

/**
 * Get total cumulative XP required to reach a specific rank.
 * Rank 1 requires 0 XP, Rank 2 requires 2, Rank 3 requires 6, etc.
 */
export function getTotalXPForRank(rank: number): number {
    return Math.pow(2, rank) - 2;
}

/**
 * Given total XP, determine what rank the user is currently at.
 */
export function getRankFromXP(xp: number): number {
    let rank = 1;
    while (getTotalXPForRank(rank + 1) <= xp) {
        rank++;
    }
    return rank;
}

/**
 * XP needed between current rank and the next one.
 */
export function getXPForNextRank(rank: number): number {
    return Math.pow(2, rank);
}

/**
 * XP still needed to reach the next rank.
 */
export function getRemainingXPToNextRank(currentXP: number): number {
    const currentRank = getRankFromXP(currentXP);
    const nextRankXP = getTotalXPForRank(currentRank + 1);
    return nextRankXP - currentXP;
}


/**
 * Adds XP to a user for a specific guild.
 * Returns whether the user ranked up, and what their new XP & rank is.
 */
export async function addXPToUser(userId: string, guildId: string, amount: number) {
    const user = await UserData.findOneAndUpdate(
        { UserId: userId },
        { $setOnInsert: { ServerXP: {} } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!user.ServerXP) user.ServerXP = {};

    const oldXP = user.ServerXP[guildId] || 0;
    const oldRank = getRankFromXP(oldXP);

    const newXP = oldXP + amount;
    const newRank = getRankFromXP(newXP);

    user.ServerXP[guildId] = newXP;
    user.markModified("ServerXP"); 

    await user.save();

    return {
        oldXP,
        newXP,
        oldRank,
        newRank,
        rankedUp: newRank > oldRank
    };
}
