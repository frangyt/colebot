import {Message, TextChannel} from 'discord.js';
import {TYPES} from '../types';
import {inject, injectable} from 'inversify';
import PlayerManager from '../managers/player';
import LoadingMessage from '../utils/loading-message';
import errorMsg from '../utils/error-msg';
import Command from '.';
import {parseTime} from '../utils/time';

@injectable()
export default class implements Command {
  public name = 'seek';
  public aliases = [];
  public examples = [
    ['seek 10', 'pula para 10 segundos da musica, partindo do inicio'],
    ['seek 1:30', 'pula para 1:30 da musica'],
    ['seek 1:00:00', 'pula para 1:00:00 da musica']
  ];

  public requiresVC = true;

  private readonly playerManager: PlayerManager;

  constructor(@inject(TYPES.Managers.Player) playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  public async execute(msg: Message, args: string []): Promise<void> {
    const player = this.playerManager.get(msg.guild!.id);

    const currentSong = player.getCurrent();

    if (!currentSong) {
      await msg.channel.send(errorMsg('tem nada tocando'));
      return;
    }

    if (currentSong.isLive) {
      await msg.channel.send(errorMsg('não da para pular em live'));
      return;
    }

    const time = args[0];

    let seekTime = 0;

    if (time.includes(':')) {
      seekTime = parseTime(time);
    } else {
      seekTime = parseInt(time, 10);
    }

    if (seekTime > currentSong.length) {
      await msg.channel.send(errorMsg('musica não é tão grande assim'));
      return;
    }

    const loading = new LoadingMessage(msg.channel as TextChannel);

    await loading.start();

    try {
      await player.seek(seekTime);

      await loading.stop();
    } catch (error: unknown) {
      await loading.stop(errorMsg(error as Error));
    }
  }
}
