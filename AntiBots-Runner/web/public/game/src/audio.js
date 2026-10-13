const FILES={
  roar:'boss-roar.mp3',
  charge:'boss-charge.mp3',
  bossShot:'boss-shot.mp3',
  tankShot:'misil.m4a',
  dragonShot:'misil.m4a',
  lightning:'rayo.m4a',
  companionMove:'companion-move.m4a',
  dragonRoar:'dragon-roar.m4a',
  entry:'boss-entry.mp3',
  phaseRoar:'phase-roar.mp3',
  hit:'player-hit.mp3',
  collect:'star-collect.wav',
  life:'heart-collect.wav',
  attackCollect:'attack-collect.mp3',
  playerShot:'player-shot.mp3',
  bossHit:'boss-hit.mp3',
  victory:'victory.mp3'
};
const MUSIC={
  runner:'elta-theme.m4a',
  1:'elta-theme.m4a',
  2:'elta-theme.m4a',
  3:'elta-theme.m4a'
};
let currentMusic=null;
const effectPlayers=new Map();
const loopPlayers=new Map();
const unavailableEffects=new Set();
let synthContext=null;
let rainSource=null;
let rainGain=null;
const audioUrl = file => `${'/game/'}audio/${file}`;
function make(src,loop=false,volume=.65){const a=new Audio(src);a.loop=loop;a.volume=volume;return a;}
function getSynthContext(){
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass) return null;
  synthContext ??=new AudioContextClass();
  return synthContext;
}
function playSynthTone(type){
  const ctx=getSynthContext();
  if(!ctx) return;
  if(ctx.state==='suspended') ctx.resume().catch(()=>{});
  const notes=type==='star'
    ? [[0,.075,620,1560,.34,'triangle'],[.04,.10,1040,1960,.26,'sine'],[.13,.11,1560,980,.20,'square']]
    : type==='heart'
      ? [[0,.11,523,523,.30,'sine'],[.10,.11,659,659,.29,'sine'],[.20,.12,784,784,.28,'triangle'],[.30,.20,1047,1047,.30,'sine']]
      : type==='tankShot'
        ? [[0,.15,115,42,.42,'sawtooth'],[.02,.10,235,68,.24,'square']]
        : type==='dragonShot'
          ? [[0,.30,190,62,.36,'sawtooth'],[.015,.34,96,38,.28,'triangle']]
          : type==='lightning'
            ? [[0,.09,1550,270,.32,'square'],[.04,.17,1050,75,.27,'sawtooth'],[.10,.24,280,48,.18,'triangle']]
            : [[0,.13,235,72,.34,'square'],[.035,.19,150,48,.26,'sawtooth']];
  const now=ctx.currentTime;
  for(const [offset,duration,from,to,volume,wave] of notes){
    const oscillator=ctx.createOscillator();
    const gain=ctx.createGain();
    const start=now+offset;
    oscillator.type=wave;
    oscillator.frequency.setValueAtTime(from,start);
    oscillator.frequency.exponentialRampToValueAtTime(to,start+duration);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(volume,start+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start+duration+.02);
  }
}
function startRainSound(){
  if(rainSource) return;
  const ctx=getSynthContext();
  if(!ctx) return;
  if(ctx.state==='suspended') ctx.resume().catch(()=>{});
  const seconds=2;
  const buffer=ctx.createBuffer(1,ctx.sampleRate*seconds,ctx.sampleRate);
  const data=buffer.getChannelData(0);
  let previous=0;
  for(let i=0;i<data.length;i++){
    previous=previous*.96+(Math.random()*2-1)*.04;
    data[i]=previous+(Math.random()*2-1)*.13;
  }
  const filter=ctx.createBiquadFilter();
  filter.type='highpass'; filter.frequency.value=850;
  rainGain=ctx.createGain(); rainGain.gain.value=.055;
  rainSource=ctx.createBufferSource(); rainSource.buffer=buffer; rainSource.loop=true;
  rainSource.connect(filter).connect(rainGain).connect(ctx.destination);
  rainSource.start();
}
function stopRainSound(){
  if(rainSource){ try{rainSource.stop();}catch{} rainSource.disconnect(); rainSource=null; }
  rainGain=null;
}
export const audio={
  unlock(){ const ctx=getSynthContext(); return ctx?.resume().catch(()=>{}); },
  play(name){
    if(name==='collect'){ playSynthTone('star'); return; }
    if(name==='life'){ playSynthTone('heart'); return; }
    if(name==='hit'){ playSynthTone(name); return; }
    const file=FILES[name]; if(!file)return;
    if(unavailableEffects.has(file)) return;
    let a=effectPlayers.get(file);
    if(!a){
      const volume=name==='dragonRoar'?.50:name==='companionMove'?.48:(name==='roar'||name==='entry'||name==='phaseRoar'||name==='victory'?.8:.55);
      a=make(audioUrl(file),false,volume);
      a.addEventListener('error',()=>unavailableEffects.add(file),{once:true});
      effectPlayers.set(file,a);
    }
    if(a.error){ unavailableEffects.add(file); return; }
    a.currentTime=0;
    a.play().catch(()=>{ if(a.error) unavailableEffects.add(file); });
  },
  startLoop(key,name,volume=.42){
    if(loopPlayers.has(key)) return;
    const file=FILES[name]; if(!file || unavailableEffects.has(file)) return;
    const a=make(audioUrl(file),true,volume);
    a.addEventListener('error',()=>unavailableEffects.add(file),{once:true});
    loopPlayers.set(key,a);
    a.play().catch(()=>{ if(a.error) unavailableEffects.add(file); });
  },
  stopLoop(key){
    const a=loopPlayers.get(key); if(!a) return;
    a.pause(); a.currentTime=0; loopPlayers.delete(key);
  },
  pauseLoops(){ loopPlayers.forEach(a=>a.pause()); },
  resumeLoops(){ loopPlayers.forEach(a=>a.play().catch(()=>{})); },
  music(phase){
    this.stopMusic();
    const file=MUSIC[phase]; if(!file)return;
    const src=audioUrl(file);
    currentMusic=make(src,true,.42);
    currentMusic.preload='auto';
    currentMusic.play().catch(()=>{});
  },
  pauseMusic(){ if(currentMusic) currentMusic.pause(); },
  resumeMusic(){ if(currentMusic) currentMusic.play().catch(()=>{}); },
  startRain(){ startRainSound(); },
  stopRain(){ stopRainSound(); },
  pauseRain(){ if(rainGain) rainGain.gain.setTargetAtTime(.0001,getSynthContext().currentTime,.02); },
  resumeRain(){ if(rainGain) rainGain.gain.setTargetAtTime(.055,getSynthContext().currentTime,.02); },
  stopMusic(){if(currentMusic){currentMusic.pause();currentMusic.currentTime=0;currentMusic=null;}  },
  stopAll(){ this.stopMusic(); this.stopRain(); loopPlayers.forEach(a=>{a.pause(); a.currentTime=0;}); loopPlayers.clear(); }
};
