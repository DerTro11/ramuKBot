import {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    ChatInputCommandInteraction,
    MessageFlags
} from "discord.js";

import { Command, RankSubConfig } from "types";
import { getTotalXPForRank } from "../../Services/xpService";
import { RankConfigModel } from "../../MongoDB/models/RankConfig";

const RANKS_PER_PAGE = 10;

function buildRankEmbed(page: number, ranksPerPage: number = RANKS_PER_PAGE, rankConfig?: { [rankId: string]: RankSubConfig }) {
    const embed = new EmbedBuilder()
        .setTitle("📋 Rank Table")
        .setColor(0x5865f2)
        .setFooter({ text: `Page ${page + 1}` });

    const start = page * ranksPerPage;
    const end = start + ranksPerPage;

    for (let i = start + 1; i <= end; i++) {
        const config = rankConfig?.[i.toString()];
        const xp = getTotalXPForRank(i);

        const name = config?.name || "-";
        const prefix = config?.prefix ? `\`${config.prefix}\`` : "-";
        const roles = config?.roleRewards?.length
            ? config.roleRewards.map(id => `<@&${id}>`).join(", ")
            : "-";

        embed.addFields({
            name: `#${i}`,
            value: `XP Required: **${xp}**\nName: **${name}**\nPrefix: ${prefix}\nRoles: ${roles}`,
            inline: false
        });
    }

    return embed;
}

const CommandBody = new SlashCommandBuilder()
    .setName("show-ranks")
    .setDescription("Displays the ranks and XP required")
    .setContexts([0])
    .addIntegerOption(opt =>
        opt
            .setName("rank")
            .setDescription("Optional rank number to jump to")
            .setMinValue(1)
    ) as SlashCommandBuilder;

export const Cmd: Command = {
    CommandBody,
    async execute(interaction: ChatInputCommandInteraction) {
        const inputRank = interaction.options.getInteger("rank");
        const targetPage = inputRank ? Math.floor((inputRank - 1) / RANKS_PER_PAGE) : 0;

        const rankConfig = await RankConfigModel.findOne({GuildID: interaction.guildId})

        
        await interaction.deferReply();

        let currentPage = targetPage;
        const maxPages = 10; // adjust as needed

        const getButtons = () =>
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("prev")
                    .setLabel("◀ Prev")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage <= 0),
                new ButtonBuilder()
                    .setCustomId("next")
                    .setLabel("Next ▶")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage >= maxPages - 1)
            );

        const msg = await interaction.editReply({
            embeds: [buildRankEmbed(currentPage, undefined, rankConfig?.ranks)],
            components: [getButtons()]
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000
        });

        collector.on("collect", async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: "⛔ You can't use these buttons.", flags: MessageFlags.Ephemeral });
                return;
            }

            if (i.customId === "prev") currentPage--;
            else if (i.customId === "next") currentPage++;

            await i.update({
                embeds: [buildRankEmbed(currentPage, undefined, rankConfig?.ranks)],
                components: [getButtons()]
            });
        });

        collector.on("end", async () => {
            try {
                await msg.edit({ components: [] });
            } catch (err) {
                // message was probably deleted or expired
                console.warn("Could not edit message after collector end:", err);
            }
        });
    }
};

export default Cmd;
