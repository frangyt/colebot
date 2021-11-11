import {Message, MessageEmbed, CollectorFilter} from 'discord.js';
import {TYPES} from '../types';
import {inject, injectable} from 'inversify';
import PlayerManager from '../managers/player';
import {STATUS} from '../services/player';
import Command from '.';
import getProgressBar from '../utils/get-progress-bar';
import {prettyTime} from '../utils/time';
import getYouTubeID from 'get-youtube-id';
import errorMsg from '../utils/error-msg';
import { getMostPopularVoiceChannel } from '../utils/channels';

@injectable()
export default class implements Command {
  public name = 'currentsong';
  public aliases = ['cs'];
  public examples = [
    ['currentSong', 'shows current song']   
  ];

  private readonly playerManager: PlayerManager;

  constructor(@inject(TYPES.Managers.Player) playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  public async execute(msg: Message): Promise<void> {
    const player = this.playerManager.get(msg.guild!.id);

    const msgAux = msg;

    const currentlyPlaying = player.getCurrent();

    if (currentlyPlaying) {
      
      const embed = new MessageEmbed();

      embed.setTitle(currentlyPlaying.title);
      embed.setURL(`https://www.youtube.com/watch?v=${currentlyPlaying.url.length === 11 ? currentlyPlaying.url : getYouTubeID(currentlyPlaying.url) ?? ''}`);

      let description = player.status === STATUS.PLAYING ? '⏹️' : '▶️';
      description += ' ';
      description += getProgressBar(20, player.getPosition() / currentlyPlaying.length);
      description += ' ';
      description += `\`[${prettyTime(player.getPosition())}/${currentlyPlaying.isLive ? 'live' : prettyTime(currentlyPlaying.length)}]\``;
      description += ' 🔉';      

      embed.setDescription(description);

      let footer = `Source: ${currentlyPlaying.artist}`;

      if (currentlyPlaying.playlist) {
        footer += ` (${currentlyPlaying.playlist.title})`;
      }

      embed.setFooter(footer);      

      const res = await msg.channel.send(embed);        


      await res.react('⏮️');
      await res.react('⏸️');
      await res.react('↩️');
      await res.react('▶️');
      await res.react('⏭️');

      
      
      const filter = (reaction:any) => {
        return reaction.emoji.name === '⏭️' || 
               reaction.emoji.name === '⏸️' ||
               reaction.emoji.name === '↩️' || 
               reaction.emoji.name === '⏮️' || 
               reaction.emoji.name === '▶️' ;
      };

      const collector = res.createReactionCollector( filter, { time: 15000 });

      collector.on('collect', (reaction) => {
        switch (reaction.emoji.name){
          case '⏭️':
            this.skip(msgAux);     
            collector.stop();    
            break;   
          case '⏸️':
            if (player.status !== STATUS.PLAYING) {
              msg.channel.send(errorMsg('not currently playing'));
              return;
            }        
            player.pause();
            break;
          case '⏮️':
            this.unskip(msgAux);
            collector.stop();
            break;
          case '▶️':           
            if (player.status == STATUS.PLAYING) {
              msg.channel.send(errorMsg('A Musica já esta playando'));
              return;
            }
            player.play();            
            break;
          default:
            console.log("emoji invalido");
        }
      });

    } else {
      await msg.channel.send('queue empty');
    }
  }

  private skip(msg: Message){
    const player = this.playerManager.get(msg.guild!.id);
    player.forward(1);
    this.execute(msg);
  }
  private unskip(msg: Message){    
    const player = this.playerManager.get(msg.guild!.id);
    try {
      player.back();
    } catch (_: unknown) {
      msg.channel.send(errorMsg('no song to go back to'));
    }
    this.execute(msg);
  }
}
