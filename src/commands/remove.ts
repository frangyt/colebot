import {Message, TextChannel} from 'discord.js';
import {TYPES} from '../types';
import {inject, injectable} from 'inversify';
import PlayerManager from '../managers/player';
import Command from '.';
import LoadingMessage from '../utils/loading-message';
import errorMsg from '../utils/error-msg';

@injectable()
export default class implements Command {
  public name = 'remove';
  public aliases = ['r'];
  public examples = [
    ['remove', 'remove a música atual da fila'],
    ['remove 2', 'remove a segunda música da fila']
  ];

  public requiresVC = true;

  private readonly playerManager: PlayerManager;

  constructor(@inject(TYPES.Managers.Player) playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  public async execute(msg: Message, args: string []): Promise<void> {
    let numPos = 0;

    if (args.length === 1) {
      if (!Number.isNaN(parseInt(args[0], 10))) {
        numPos = parseInt(args[0], 10);
      }
    }

    if (numPos === 1) {
      numPos = 0;
    }

    const player = this.playerManager.get(msg.guild!.id);

    const loader = new LoadingMessage(msg.channel as TextChannel);

    try {
      await loader.start();
      await player.remove(numPos);

      await loader.stop('essa bosta foi removida');
    } catch (_: unknown) {
      await loader.stop(errorMsg('Não existe essa posição na fila'));
    }
  }
}
