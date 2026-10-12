const FILES={
  roar:'boss-roar.mp3',
  charge:'boss-charge.mp3',
  bossShot:'boss-shot.mp3',
  entry:'boss-entry.mp3',
  phaseRoar:'phase-roar.mp3',
  hit:'player-hit.mp3',
  collect:'powerup.mp3',
  life:'life.mp3',
  attackCollect:'attack-collect.mp3',
  playerShot:'player-shot.mp3',
  bossHit:'boss-hit.mp3',
  victory:'victory.mp3'
};
const MUSIC={
  runner:'music-runner.mp3',
  1:'phase-1.mp3',
  2:'phase-2.mp3',
  3:'phase-3.mp3'
};
let currentMusic=null;
const effectPlayers=new Map();
const unavailableEffects=new Set();
const audioUrl = file => `${'/game/'}audio/${file}`;
function make(src,loop=false,volume=.65){const a=new Audio(src);a.loop=loop;a.volume=volume;return a;}
export const audio={
  play(name){
    const file=FILES[name]; if(!file)return;
    if(unavailableEffects.has(file)) return;
    let a=effectPlayers.get(file);
    if(!a){
      const volume=name==='roar'||name==='entry'||name==='phaseRoar'||name==='victory'?.8:.55;
      a=make(audioUrl(file),false,volume);
      a.addEventListener('error',()=>unavailableEffects.add(file),{once:true});
      effectPlayers.set(file,a);
    }
    if(a.error){ unavailableEffects.add(file); return; }
    a.currentTime=0;
    a.play().catch(()=>{ if(a.error) unavailableEffects.add(file); });
  },
  music(phase){
    this.stopMusic();
    const file=MUSIC[phase]; if(!file)return;
    const src=audioUrl(file);
    currentMusic=make(src,true,.42); currentMusic.play().catch(()=>{});
  },
  stopMusic(){if(currentMusic){currentMusic.pause();currentMusic.currentTime=0;currentMusic=null;}  },
  stopAll(){this.stopMusic();}
};
