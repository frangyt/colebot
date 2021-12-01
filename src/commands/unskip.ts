import {Message} from 'discord.js';
import {TYPES} from '../types';
import {inject, injectable} from 'inversify';
import PlayerManager from '../managers/player';
import errorMsg from '../utils/error-msg';
import Command from '.';

@injectable()
export default class implements Command {
  public name = 'unskip';
  public aliases = ['back'];
  public examples = [
    ['unskip', 'toca a música anterior']
  ];

  public requiresVC = true;

  private readonly playerManager: PlayerManager;

  constructor(@inject(TYPES.Managers.Player) playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  public async execute(msg: Message, _: string []): Promise<void> {
    const player = this.playerManager.get(msg.guild!.id);

    try {
      await player.back();

      await msg.channel.send('voltando');
    } catch (_: unknown) {
      await msg.channel.send(errorMsg('não tem música antes dessa'));
    }
  }
}
