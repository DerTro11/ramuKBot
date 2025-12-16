import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} from "discord.js";
import GuildConfig from "../../MongoDB/models/GuildConfig";
import AppConfig from "../../AppConfig";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
    .setName("show-xp-settings")
    .setDescription("Displays how XP is earned in this server.")
    .setContexts([0]);

export const Cmd: Command = {
    CommandBody,
    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId!;
        const guildConfig = await GuildConfig.findOne({ GuildID: guildId });

        const fallback = AppConfig.baseXPAmounts;

        const chatXP = guildConfig?.ChatXPAmount ?? fallback.ChatXPAmount;
        const chatCooldown = (guildConfig?.ChatXPCooldownMs ?? fallback.ChatXPCooldownMs) / 1000;
        const reactionXP = guildConfig?.ReactionXPAmount ?? fallback.ReactionXPAmount;
        const eventXP = guildConfig?.EventXPPerMinute ?? fallback.EventXPPerMinute;
        const bonusMulti = guildConfig?.EventBonusMultiplier ?? fallback.EventBonusMultiplier;
        const penaltyXP = guildConfig?.PenaltyXPAmount ?? fallback.PenaltyXPAmount;

        const thresholdBonus = ((guildConfig?.BonusXPThreshold_Above || fallback.BonusXPThreshold_Above) * 100).toFixed(0);
        const thresholdPenalty = ((guildConfig?.PenaltyXPThreshold_Below || fallback.PenaltyXPThreshold_Below) * 100).toFixed(0);

        const embed = new EmbedBuilder()
            .setTitle("📊 XP Sources & Rewards in this Server")
            .setColor(0x5865f2)
            .setDescription(
                `💬 Chat XP: \`${chatXP} XP\` (Cooldown: \`${chatCooldown} sec\`)\n` +
                `👍 Reaction XP: \`${reactionXP} XP\`\n` +
                `🎮 Event XP: \`${eventXP} XP per minute\`\n` +
                `🎯 Event Bonus Multiplier: \`${bonusMulti}x\`\n` +
                `⚠️ Penalty XP: \`${penaltyXP} XP\`\n\n` +
                `__Thresholds:__\n` +
                `• Bonus awarded when attending \`> ${thresholdBonus}%\`\n` +
                `• Penalty when attending \`< ${thresholdPenalty}%\``
            );

        await interaction.reply({ embeds: [embed] });
    }
};

export default Cmd;
