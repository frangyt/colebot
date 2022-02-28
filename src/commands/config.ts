/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {SlashCommandBuilder} from '@discordjs/builders';
import {CommandInteraction, MessageEmbed} from 'discord.js';
import {injectable} from 'inversify';
import {prisma} from '../utils/db.js';
import updatePermissionsForGuild from '../utils/update-permissions-for-guild.js';
import Command from './index.js';

@injectable()
export default class implements Command {
  public readonly slashCommand = new SlashCommandBuilder()
    .setName('config')
    .setDescription('configure bot settings')
    .addSubcommand(subcommand => subcommand
      .setName('set-playlist-limit')
      .setDescription('set the maximum number of tracks that can be added from a playlist')
      .addIntegerOption(option => option
        .setName('limit')
        .setDescription('maximum number of tracks')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('set-role')
      .setDescription('set the role that is allowed to use the bot')
      .addRoleOption(option => option
        .setName('role')
        .setDescription('allowed role')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('set-wait-after-queue-empties')
      .setDescription('set the time to wait before leaving the voice channel when queue empties')
      .addIntegerOption(option => option
        .setName('delay')
        .setDescription('delay in seconds (set to 0 to never leave)')
        .setRequired(true)
        .setMinValue(0)))
    .addSubcommand(subcommand => subcommand
      .setName('set-leave-if-no-listeners')
      .setDescription('set whether to leave when all other participants leave')
      .addBooleanOption(option => option
        .setName('value')
        .setDescription('whether to leave when everyone else leaves')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('show all settings'));

  async execute(interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case 'set-playlist-limit': {
        const limit = interaction.options.getInteger('limit')!;

        if (limit < 1) {
          throw new Error('invalid limit');
        }

        await prisma.setting.update({
          where: {
            guildId: interaction.guild!.id
          },
          data: {
            playlistLimit: limit
          }
        });

        await interaction.reply('👍 limit updated');

        break;
      }

      case 'set-role': {
        const role = interaction.options.getRole('role')!;

        await prisma.setting.update({
          where: {
            guildId: interaction.guild!.id
          },
          data: {
            roleId: role.id
          }
        });

        await updatePermissionsForGuild(interaction.guild!);

        await interaction.reply('👍 role updated');

        break;
      }

      case 'set-wait-after-queue-empties': {
        const delay = interaction.options.getInteger('delay')!;

        await prisma.setting.update({
          where: {
            guildId: interaction.guild!.id
          },
          data: {
            secondsToWaitAfterQueueEmpties: delay
          }
        });

        await interaction.reply('👍 wait delay updated');

        break;
      }

      case 'set-leave-if-no-listeners': {
        const value = interaction.options.getBoolean('value')!;

        await prisma.setting.update({
          where: {
            guildId: interaction.guild!.id
          },
          data: {
            leaveIfNoListeners: value
          }
        });

        await interaction.reply('👍 leave setting updated');

        break;
      }

      case 'get': {
        const embed = new MessageEmbed().setTitle('Config');

        const config = await prisma.setting.findUnique({where: {guildId: interaction.guild!.id}});

        if (!config) {
          throw new Error('no config found');
        }

        const settingsToShow = {
          'Playlist Limit': config.playlistLimit,
          Role: config.roleId ? `<@&${config.roleId}>` : 'not set',
          'Wait before leaving after queue empty': config.secondsToWaitAfterQueueEmpties === 0 ?
            'never leave' :
            `${config.secondsToWaitAfterQueueEmpties}s`,
          'Leave if there are no listeners': config.leaveIfNoListeners ? 'yes' : 'no'
        };

        let description = '';
        for (const [key, value] of Object.entries(settingsToShow)) {
          description += `**${key}**: ${value}\n`;
        }

        embed.setDescription(description);

        await interaction.reply({embeds: [embed]});

        break;
      }

      default:
        throw new Error('unknown subcommand');
    }
  }
}
