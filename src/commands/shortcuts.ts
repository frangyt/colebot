import {Message} from 'discord.js';
import {injectable} from 'inversify';
import {Shortcut, Settings} from '../models';
import errorMsg from '../utils/error-msg';
import Command from '.';

@injectable()
export default class implements Command {
  public name = 'shortcuts';
  public aliases = [];
  public examples = [
    ['shortcuts', 'mostra todos os atalhos'],
    ['shortcuts set s skip', 'define `s` para `skip`'],
    ['shortcuts set festinha play https://www.youtube.com/watch?v=zK6oOJ1wz8k', 'aliases `festinha` para um comando especifico'],
    ['shortcuts delete festinha', 'remove o atalho `festinha`']
  ];

  public async execute(msg: Message, args: string []): Promise<void> {
    if (args.length === 0) {
      // Get shortcuts for guild
      const shortcuts = await Shortcut.findAll({where: {guildId: msg.guild!.id}});

      if (shortcuts.length === 0) {
        await msg.channel.send('não existe atalhos');
        return;
      }

      // Get prefix for guild
      const settings = await Settings.findOne({where: {guildId: msg.guild!.id}});

      if (!settings) {
        return;
      }

      const {prefix} = settings;

      const res = shortcuts.reduce((accum, shortcut) => {
        accum += `${prefix}${shortcut.shortcut}: ${shortcut.command}\n`;

        return accum;
      }, '');

      await msg.channel.send(res);
    } else {
      const action = args[0];

      const shortcutName = args[1];

      switch (action) {
        case 'set': {
          const shortcut = await Shortcut.findOne({where: {guildId: msg.guild!.id, shortcut: shortcutName}});

          const command = args.slice(2).join(' ');

          const newShortcut = {shortcut: shortcutName, command, guildId: msg.guild!.id, authorId: msg.author.id};

          if (shortcut) {
            if (shortcut.authorId !== msg.author.id && msg.author.id !== msg.guild!.owner!.id) {
              await msg.channel.send(errorMsg('acesso negado'));
              return;
            }

            await shortcut.update(newShortcut);
            await msg.channel.send('atalho atualizado');
          } else {
            await Shortcut.create(newShortcut);
            await msg.channel.send('atalho criado');
          }

          break;
        }

        case 'delete': {
          // Check if shortcut exists
          const shortcut = await Shortcut.findOne({where: {guildId: msg.guild!.id, shortcut: shortcutName}});

          if (!shortcut) {
            await msg.channel.send(errorMsg('atalho não existe'));
            return;
          }

          // Check permissions
          if (shortcut.authorId !== msg.author.id && msg.author.id !== msg.guild!.owner!.id) {
            await msg.channel.send(errorMsg('acesso negado'));
            return;
          }

          await shortcut.destroy();

          await msg.channel.send('atalho removido');

          break;
        }

        default: {
          await msg.channel.send(errorMsg('comando desconhecido'));
        }
      }
    }
  }
}
