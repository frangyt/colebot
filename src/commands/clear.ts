import {Message} from 'discord.js';
import {TYPES} from '../types';
import {inject, injectable} from 'inversify';
import PlayerManager from '../managers/player';
import Command from '.';

@injectable()
export default class implements Command {
  public name = 'clear';
  public aliases = ['c'];
  public examples = [
    ['clear', 'Limpa todas as musicas da fila exceto a que está tocando no momento']
  ];

  public requiresVC = true;

  private readonly playerManager: PlayerManager;

  constructor(@inject(TYPES.Managers.Player) playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  public async execute(msg: Message, _: string []): Promise<void> {
    this.playerManager.get(msg.guild!.id).clear();

    await msg.channel.send('mais limpo que bumbum de nenem'); 
  }
}
