import {Message} from 'discord.js';
import {TYPES} from '../types';
import {inject, injectable} from 'inversify';
import PlayerManager from '../managers/player';
import errorMsg from '../utils/error-msg';
import Command from '.';

@injectable()
export default class implements Command {
  public name = 'loop';
  public aliases = ['l'];
  public examples = [
    ['loop', 'deixa a fila em loop']
  ];

  public requiresVC = true;

  private readonly playerManager: PlayerManager;

  constructor(@inject(TYPES.Managers.Player) playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  public async execute(msg: Message, _: string []): Promise<void> {
    const player = this.playerManager.get(msg.guild!.id);

    if (player.isQueueEmpty()) {
      await msg.channel.send(errorMsg('não tem musica na fila'));
      return;
    }

    player.loop();

    if (player.islooping()) {
      await msg.channel.send('loop ativado');
    } else {
      await msg.channel.send('loop desativado');
    }
  }
}
