import UserData from "../MongoDB/models/UserData";
import { GuildMember } from "discord.js";
import { RankConfigModel } from "../MongoDB/models/RankConfig";



// xpService.ts

/**
 * Get total cumulative XP required to reach a specific rank.
 * Rank 1 requires 0 XP, Rank 2 requires 2, Rank 3 requires 6, etc.
 */
export function getTotalXPForRank(rank: number): number {
    //return Math.pow(2, rank) - 2;
    return Math.round( Math.pow(rank, 3) / 10 ) * 10 + 10*rank;
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
    return Math.round( Math.pow(rank, 3) / 10 ) * 10 + 10 * rank + 2;
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



export async function giveCumulativeRankRewards(guildMember: GuildMember) {

    const userDoc = await UserData.findOne({UserId: guildMember.id})
    const guildId = guildMember.guild.id;
    const userXP = userDoc?.ServerXP[guildId];
    if(!userXP) return { roles: [], prefix: undefined };
    const userRank = getRankFromXP(userXP);

    const config = await RankConfigModel.findOne({ GuildID: guildId });
    if (!config || !config.ranks) return { roles: [], prefix: undefined };

    const allRanks = config.ranks;
    const rolesToGive = new Set<string>();
    let latestPrefix: string | undefined;
    const allPrefixes: string[] = [];

    for (let i = 1; i <= userRank; i++) {
        const rankCfg = allRanks[i.toString()];
        if (!rankCfg) continue;

        // Collect all roles up to this rank
        rankCfg.roleRewards?.forEach(roleId => rolesToGive.add(roleId));

        // Collect all prefixes, latest one takes priority
        if (rankCfg.prefix) {
            latestPrefix = rankCfg.prefix;
            allPrefixes.push(rankCfg.prefix);
        }
    }

    // Clean nickname of any existing prefix
    let newNickname = guildMember.nickname || guildMember.user.username;
    for (const prefix of allPrefixes) {
        if (newNickname.startsWith(prefix)) {
            newNickname = newNickname.slice(prefix.length).trimStart();
        }
    }

    // Apply latest prefix
    if (latestPrefix) {
        newNickname = `${latestPrefix} ${newNickname}`;
        try {
            await guildMember.setNickname(newNickname);
        } catch (err) {
            console.warn(`Failed to set nickname for ${guildMember.id}:`, err);
        }
    }

    const rolesAdded: string[] = [];
    for (const roleId of rolesToGive) {
        if (!guildMember.roles.cache.has(roleId)) {
            try {
                await guildMember.roles.add(roleId);
                rolesAdded.push(roleId);
            } catch (err) {
                console.warn(`Failed to add role ${roleId} to ${guildMember.id}:`, err);
            }
        }
    }

    return { roles: rolesAdded, prefix: latestPrefix };
}
