import {Message, TextChannel} from 'discord.js';
import {TYPES} from '../types';
import {inject, injectable} from 'inversify';
import PlayerManager from '../managers/player';
import Command from '.';
import LoadingMessage from '../utils/loading-message';
import errorMsg from '../utils/error-msg';

@injectable()
export default class implements Command {
  public name = 'skip';
  public aliases = ['s'];
  public examples = [
    ['skip', 'pula a música atual'],
    ['skip 2', 'pula as duas proximas músicas']
  ];

  public requiresVC = true;

  private readonly playerManager: PlayerManager;

  constructor(@inject(TYPES.Managers.Player) playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  public async execute(msg: Message, args: string []): Promise<void> {
    let numToSkip = 1;

    if (args.length === 1) {
      if (!Number.isNaN(parseInt(args[0], 10))) {
        numToSkip = parseInt(args[0], 10);
      }
    }

    const player = this.playerManager.get(msg.guild!.id);

    const loader = new LoadingMessage(msg.channel as TextChannel);

    try {
      await loader.start();
      await player.forward(numToSkip);

      await loader.stop('bora que bora');
    } catch (_: unknown) {
      await loader.stop(errorMsg('num tem mais música'));
    }
  }
}
