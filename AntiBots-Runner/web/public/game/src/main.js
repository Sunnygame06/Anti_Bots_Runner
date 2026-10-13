import { audio } from './audio.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const loadingScreen = document.querySelector('#loadingScreen');
const loadingProgress = document.querySelector('#loadingProgress');
const loadingProgressBar = loadingScreen.querySelector('[role="progressbar"]');
const loadingStatus = document.querySelector('#loadingStatus');
const loadingError = document.querySelector('#loadingError');
const loadingRetry = document.querySelector('#loadingRetry');
const scoreEl = document.querySelector('#score');
const highScoreEl = document.querySelector('#highScore');
const startOverlay = document.querySelector('#startOverlay');
const gameOverOverlay = document.querySelector('#gameOverOverlay');
const pauseOverlay = document.querySelector('#pauseOverlay');
const pauseBadge = document.querySelector('#pauseBadge');
const finalTimeEl = document.querySelector('#finalTime');
const finalScoreEl = document.querySelector('#finalScore');
const livesBar = document.querySelector('#livesBar');
const rosterCards = [...document.querySelectorAll('.roster-card')];
const difficultyButtons = [...document.querySelectorAll('.difficulty-btn')];
const controlButtons = [...document.querySelectorAll('.control-btn')];
const actionButtons = [...document.querySelectorAll('[data-action]')];

const W = canvas.width;
const H = canvas.height;
const LANES = [300, 430, 560];
const ROAD_TOP = 220;
const ROAD_BOTTOM = 650;
const PLAYER_X = 620;
const COLORS = ['#ff304b','#37e76c','#8da8c4','#d7d7db'];
const NAMES = ['Real Anti','Dread Done','Baktunzilla','The One "Shadowman"'];
const AVATAR = [['0%','0%'],['0%','28.571%'],['0%','57.143%'],['0%','85.714%']];
const VAR_C = ['--p1','--p2','--p3','--p4'];

const DIFFICULTY = {
  easy:   { startSpeed:300, obstacleRate:1.10, projectileSpeed:.85 },
  medium: { startSpeed:350, obstacleRate:1.00, projectileSpeed:1.00 },
  hard:   { startSpeed:400, obstacleRate:.90, projectileSpeed:1.20 }
};

const ENEMY_HP = { tank: 2500, dragon: 1500, elta: 3000 };
const STAR_VALUE = 20;
const ENERGY_MAX = 100;
const BOSS_INTERVAL = 60;

const atlas = new Image(); atlas.src = `${'/game/'}assets/players-atlas.png`;
const obstacleAtlas = new Image(); obstacleAtlas.src = `${'/game/'}assets/obstacles-atlas.png`;
const enemyAtlas = new Image(); enemyAtlas.src = `${'/game/'}assets/enemy-atlas.png`;
const tankBossStrip = new Image(); tankBossStrip.src = `${'/game/'}assets/tank-boss-sheet.png`;
const tankCompanionA = new Image(); tankCompanionA.src = `${'/game/'}assets/tank-companion-a-strip.png`;
const tankCompanionB = new Image(); tankCompanionB.src = `${'/game/'}assets/tank-companion-b-strip.png`;
// Hoja entregada por el usuario para Elta: se usa tal cual, sin redibujar sus sprites.
const eltaSheet = new Image(); eltaSheet.src = `${'/game/'}assets/elta-user-sheet.png`;
let eltaSpriteSheet = null;
const stormObstacleSheet = new Image(); stormObstacleSheet.src = `${'/game/'}assets/storm-obstacles-sheet.png`;
const dinosaurObstacleImages = [1,2,3,4].map(index=>{
  const image=new Image();
  image.src=`${'/game/'}assets/dinosaur-obstacle-${index}.png`;
  return image;
});
const tankObstacleImages = [1,2,3,4].map(index=>{
  const image=new Image();
  image.src=`${'/game/'}assets/tank-obstacle-${index}.png`;
  return image;
});
const gameAssets = [atlas, obstacleAtlas, enemyAtlas, tankBossStrip, tankCompanionA, tankCompanionB, eltaSheet, stormObstacleSheet, ...dinosaurObstacleImages, ...tankObstacleImages];
const TANK_ATLAS = { cw:345, ch:199, scale:1.08 };
const TANK_COMP_ATLAS = { cw:240, ch:125, scale:0.76 };
const ELTA_FRAMES = [
  {x:0,y:207,w:175,h:190},{x:152,y:207,w:180,h:190},{x:309,y:207,w:180,h:190},{x:466,y:207,w:180,h:190},{x:630,y:207,w:180,h:190},
  {x:792,y:207,w:180,h:190},{x:952,y:207,w:180,h:190},{x:1119,y:207,w:180,h:190},{x:1293,y:207,w:180,h:190},{x:1475,y:207,w:180,h:190},
  {x:0,y:443,w:175,h:190},{x:157,y:443,w:180,h:190},{x:317,y:443,w:180,h:190},{x:472,y:443,w:180,h:190},{x:644,y:443,w:180,h:190},
  {x:811,y:443,w:180,h:190},{x:968,y:443,w:180,h:190},{x:1136,y:443,w:180,h:190},{x:1308,y:443,w:180,h:190},{x:1479,y:443,w:180,h:190}
];
const ELTA_ANIMATIONS = {
  idle:[0,1,2,3], phase2:[3,4,5,4], phase3:[10,11,12,13], phase4:[18,19,18,19],
  charge:[6,7,8], attack:[8,9], hurt:[16,17]
};
const ELTA_DRAW = { width:216, height:228 };
const ELTA_TOP_Y = 14; // Elta flota arriba, sobre la nube, fuera de los carriles
const STORM_OBSTACLE = {
  stormRock:{x:0,y:0,w:220,h:160,targetH:84},
  // El segundo recorte es un tronco arrancado; durante esta fase no se usan cristales.
  stormLog:{x:220,y:0,w:220,h:160,targetH:74}
};
const PHASE_OBSTACLES = {
  dragon:dinosaurObstacleImages.map((image,index)=>({kind:`dinosaur${index+1}`,image,targetH:82})),
  tank:tankObstacleImages.map((image,index)=>({kind:`tank${index+1}`,image,targetH:78}))
};
const PHASE_OBSTACLE_BY_KIND = Object.fromEntries(
  Object.values(PHASE_OBSTACLES).flat().map(obstacle=>[obstacle.kind,obstacle])
);
const EATLAS = { cw:520, ch:300, lx:6, scale:.82 };
const ATLAS = { cw:232, ch:280, scale:.685 };
const SHEET = {
  shots: [
    {x:8,y:213,w:151,h:122},{x:167,y:213,w:169,h:132},{x:344,y:213,w:254,h:101},
    {x:606,y:213,w:212,h:95},{x:826,y:213,w:242,h:114}
  ],
  boom:{x:1076,y:213,w:199,h:155},
  obstacles:{
    barrierA:{x:8,y:8,w:282,h:197}, scrap:{x:298,y:8,w:270,h:183}, core:{x:576,y:8,w:232,h:175},
    cone:{x:816,y:8,w:136,h:174}, barrierB:{x:960,y:8,w:253,h:139}, spikes:{x:1221,y:8,w:222,h:128}
  }
};
const OBSTACLE_TARGET_H = { barrierA:74, scrap:60, core:66, cone:76, barrierB:68, spikes:48 };

let selectedCharacter = 0;
let selectedDifficulty = 'medium';
let movementControls = 'arrows';
let hi = Number(localStorage.getItem('antibots-runner-solo-hi') || 0);
highScoreEl.textContent = fmt(hi);

const state = {
  running:false, paused:false, over:false, lastTime:0, elapsed:0, score:0, speed:350,
  spawnTimer:0, nextSpawn:1, obstacles:[], projectiles:[], playerShots:[], hearts:[], stars:[], impacts:[], particles:[], bursts:[],
  heartTimer:12, starTimer:4.5, energy:0,
  shake:0, flash:0, roadFlash:0,
  worldTransition:0,
  player:null,
  // La secuencia siempre es dinosaurio → tanque → Elta y espera un minuto tras cada derrota.
  enemyEvent:null, nextEnemyAt:BOSS_INTERVAL, bossSequence:['dragon','tank','elta'], bossStep:0,
  stats:{ obstacles:0, tankEncounters:0, dragonEncounters:0, shotsDodged:0, accomplicesDodged:0, starsCollected:0, heartsCollected:0, damageDealt:0 }
};

function cfg(){ return DIFFICULTY[selectedDifficulty] || DIFFICULTY.medium; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function lerp(a,b,t){ return a+(b-a)*t; }
function rand(a,b){ return a+Math.random()*(b-a); }
function fmt(v){ return Math.max(0,Math.floor(v)).toString().padStart(5,'0'); }
function overlaps(a,b){ return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }
function hexA(hex,a){ const n=parseInt(hex.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

function createPlayer(){
  return { character:selectedCharacter, lane:1, visualY:LANES[1], x:PLAYER_X, lives:3, invuln:0, frame:0, frameTimer:0, alive:true, distance:0, attackCooldown:0 };
}

function setCharacter(i){
  selectedCharacter = clamp(i,0,3);
  rosterCards.forEach((r,idx)=>r.classList.toggle('selected-character',idx===selectedCharacter));
  state.player = createPlayer();
  renderLives();
  drawPreview();
}
function setDifficulty(v){
  selectedDifficulty = DIFFICULTY[v] ? v : 'medium';
  difficultyButtons.forEach(b=>b.classList.toggle('selected',b.dataset.difficulty===selectedDifficulty));
}
function setMovementControls(value){
  movementControls = value === 'ws' ? 'ws' : 'arrows';
  controlButtons.forEach(button=>{
    const selected=button.dataset.control===movementControls;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  if(state.player) renderLives();
}

function renderLives(){
  const p=state.player || createPlayer();
  const i=p.character;
  const hearts=[0,1,2].map(n=>`<svg class="heart ${n<p.lives?'on':'off'}" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 2.7 4.5 6.4 4.5c2.1 0 3.9 1.2 5.6 3.2 1.7-2 3.5-3.2 5.6-3.2 3.7 0 5.5 3.8 4 7.2C19.5 16.4 12 21 12 21z"/></svg>`).join('');
  const movementHint=movementControls==='ws' ? 'W/S mover' : 'flechas mover';
  livesBar.innerHTML=`<div class="life-card solo-life" style="--c:var(${VAR_C[i]})"><i class="avatar" style="--ax:${AVATAR[i][0]};--ay:${AVATAR[i][1]}"></i><div class="life-meta"><strong>${NAMES[i]}</strong><small>3 carriles · carrera infinita · ${movementHint} · ataque automático</small></div><span class="hearts">${hearts}</span></div>`;
}

function resetGame(){
  const p=createPlayer();
  Object.assign(state,{
    running:true, paused:false, over:false, lastTime:performance.now(), elapsed:0, score:0, speed:cfg().startSpeed,
    spawnTimer:0, nextSpawn:.95, obstacles:[], projectiles:[], playerShots:[], hearts:[], stars:[], impacts:[], particles:[], bursts:[],
    heartTimer:18, starTimer:4, energy:0,
    shake:0, flash:0, roadFlash:0, worldTransition:0,
    player:p, enemyEvent:null, nextEnemyAt:BOSS_INTERVAL, bossStep:0,
    stats:{ obstacles:0, tankEncounters:0, dragonEncounters:0, shotsDodged:0, accomplicesDodged:0, starsCollected:0, heartsCollected:0, damageDealt:0 }
  });
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  pauseBadge.classList.add('hidden');
  scoreEl.textContent='00000';
  audio.stopAll();
  audio.music('runner');
  renderLives();
  canvas.focus();
  requestAnimationFrame(loop);
}

function endGame(){
  if(state.over) return;
  state.over=true;
  state.running=false;
  audio.stopAll();
  const final=Math.floor(state.score);
  if(final>hi){ hi=final; localStorage.setItem('antibots-runner-solo-hi',String(hi)); highScoreEl.textContent=fmt(hi); }
  const elapsedSeconds=Math.floor(state.elapsed);
  const minutes=Math.floor(elapsedSeconds/60);
  const seconds=String(elapsedSeconds%60).padStart(2,'0');
  finalTimeEl.textContent=`${minutes}:${seconds}`;
  finalScoreEl.textContent=fmt(final);
  gameOverOverlay.classList.remove('hidden');
}

function damagePlayer(){
  const p=state.player;
  if(!p?.alive || p.invuln>0) return;
  p.lives--;
  p.invuln=1.25;
  state.shake=.22;
  state.flash=.25;
  burstSparks(p.x,p.visualY-70,COLORS[p.character]);
  audio.play('hit');
  renderLives();
  if(p.lives>0) state.heartTimer=Math.min(state.heartTimer,3.5);
  if(p.lives<=0){ p.alive=false; endGame(); }
}

function healPlayer(){
  const p=state.player;
  if(!p?.alive || p.lives>=3) return;
  p.lives++;
  burstSparks(p.x,p.visualY-80,'#ff5577');
  audio.play('life');
  renderLives();
}

function movePlayer(dir){
  const p=state.player;
  if(!state.running || state.paused || !p?.alive) return;
  p.lane = clamp(p.lane+dir,0,2);
}
function togglePause(){
  if(!state.running || state.over) return;
  state.paused=!state.paused;
  pauseBadge.classList.toggle('hidden',!state.paused);
  pauseOverlay.classList.toggle('hidden',!state.paused);
  if(state.paused){ audio.pauseMusic(); audio.pauseRain(); audio.pauseLoops(); }
  else { audio.resumeMusic(); audio.resumeRain(); audio.resumeLoops(); state.lastTime=performance.now(); requestAnimationFrame(loop); }
}
function continueGame(){
  if(!state.running || !state.paused) return;
  state.paused=false;
  pauseOverlay.classList.add('hidden');
  pauseBadge.classList.add('hidden');
  audio.resumeMusic();
  audio.resumeRain();
  audio.resumeLoops();
  state.lastTime=performance.now();
  requestAnimationFrame(loop);
}
function showCharacterMenu(){
  state.running=false;
  state.paused=false;
  state.over=false;
  pauseOverlay.classList.add('hidden');
  pauseBadge.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  startOverlay.classList.remove('hidden');
  audio.stopAll();
  drawPreview();
}

function handleAction(action){
  switch(action){
    case 'pause':
      togglePause();
      break;
  }
}
document.querySelectorAll('[data-pause-choice]').forEach(button=>{
  button.addEventListener('click',()=>{
    switch(button.dataset.pauseChoice){
      case 'continue':
        continueGame();
        break;
      case 'restart':
        resetGame();
        break;
      case 'character':
        showCharacterMenu();
        break;
    }
  });
});

function obstacleMetrics(kind){
  const phaseObstacle=PHASE_OBSTACLE_BY_KIND[kind];
  if(phaseObstacle){
    const h=phaseObstacle.targetH;
    return { w:h*(phaseObstacle.image.naturalWidth/phaseObstacle.image.naturalHeight), h };
  }
  if(STORM_OBSTACLE[kind]){
    const crop=STORM_OBSTACLE[kind], h=crop.targetH;
    return { w:h*(crop.w/crop.h), h };
  }
  const crop=SHEET.obstacles[kind]||SHEET.obstacles.barrierA;
  const h=OBSTACLE_TARGET_H[kind]||66;
  return { w:h*(crop.w/crop.h), h };
}
function obstacleBox(o){ const m=obstacleMetrics(o.kind); return { x:o.x-m.w/2, y:LANES[o.lane]-m.h, w:m.w, h:m.h }; }
function playerBox(){ const p=state.player; return { x:p.x-27, y:p.visualY-138, w:54, h:124 }; }
function pickupBox(u){ return { x:u.x-20, y:LANES[u.lane]-78, w:40, h:40 }; }

function spawnObstacle(){
  const dangerZone=state.obstacles.filter(o=>o.x>W-360).map(o=>o.lane);
  const counts=[0,1,2].map(l=>dangerZone.filter(x=>x===l).length);
  const available=[0,1,2].filter(l=>counts[l]===0);
  if(!available.length) return;
  if(new Set(dangerZone).size>=2) return;
  const spawnX=W+rand(100,190);
  const pickupSafe=available.filter(l=>
    !state.hearts.some(h=>h.lane===l && Math.abs(h.x-spawnX)<190) &&
    !state.stars.some(st=>st.lane===l && Math.abs(st.x-spawnX)<190)
  );
  if(!pickupSafe.length) return;
  const lane=pickupSafe[Math.floor(Math.random()*pickupSafe.length)];
  const phaseKinds=PHASE_OBSTACLES[state.enemyEvent?.type];
  const kinds=phaseKinds || ['cone','spikes','barrierA','barrierB','scrap','core'];
  const selected=kinds[Math.floor(Math.random()*kinds.length)];
  state.obstacles.push({ lane, x:spawnX, kind:phaseKinds ? selected.kind : selected, extra:rand(0,45), counted:false, hit:false });
}

function laneHasNearbyObject(lane,x,pad=150){
  return state.obstacles.some(o=>o.lane===lane && Math.abs(o.x-x)<pad)
    || state.hearts.some(h=>h.lane===lane && Math.abs(h.x-x)<pad)
    || state.stars.some(s=>s.lane===lane && Math.abs(s.x-x)<pad);
}

function safePickupSpot(options={}){
  const minX=options.minX ?? W+120;
  const maxX=options.maxX ?? W+300;
  const pad=options.pad ?? 190;
  for(let i=0;i<24;i++){
    const x=rand(minX,maxX);
    const safeLanes=[0,1,2].filter(l=>!laneHasNearbyObject(l,x,pad));
    if(safeLanes.length){
      const lane=safeLanes[Math.floor(Math.random()*safeLanes.length)];
      return { x, lane };
    }
  }
  return null;
}

function spawnHeart(options={}){
  const pos=safePickupSpot(options);
  if(!pos) return false;
  state.hearts.push({ ...pos, bob:rand(0,10), life:24 });
  return true;
}
function spawnStar(options={}){
  const pos=safePickupSpot(options);
  if(!pos) return false;
  state.stars.push({ ...pos, bob:rand(0,10), life:24, spin:rand(0,Math.PI*2) });
  return true;
}

function seedBattlePickups(){
  // Al iniciar cada combate siempre se colocan estrellas alcanzables.
  // Se separan entre sí y de los obstáculos para que nunca nazcan bloqueadas.
  spawnStar({minX:W+70,maxX:W+150,pad:200});
  spawnStar({minX:W+300,maxX:W+420,pad:200});
  spawnStar({minX:W+560,maxX:W+700,pad:200});
  spawnHeart({minX:W+210,maxX:W+360,pad:220});
  state.starTimer=1.2;
  state.heartTimer=3.8;
}

function startNextBoss(){
  const bossType = state.bossSequence[state.bossStep % state.bossSequence.length];
  state.bossStep += 1;
  if (bossType === 'tank') startTankEncounter();
  else if (bossType === 'elta') startEltaEncounter();
  else startDragonEncounter();
}

function startTankEncounter(){
  if(state.enemyEvent) return;
  const hp=ENEMY_HP.tank;
  state.stats.tankEncounters++;
  state.enemyEvent={
    type:'tank', age:0,
    boss:{ x:-280, targetX:88, y:LANES[1], targetLane:1, aimLane:1, phase:'enter', cooldown:1.0, warning:0, recoil:0, shotFlash:0, hp, maxHp:hp, frame:0, frameTimer:0 },
    accomplices:[
      createCompanion('a',0.9),
      createCompanion('b',2.8)
    ]
  };
  state.roadFlash=.5;
  state.stars = [];
  state.hearts = [];
  state.nextEnemyAt = state.elapsed + BOSS_INTERVAL;
  audio.play('entry');
}

function createCompanion(variant,delay){
  return { variant, lane:Math.floor(Math.random()*3), x:-rand(260,420), vx:520+rand(-25,45), delay, frame:Math.random()*4, frameTimer:0, hit:false, counted:false };
}
function resetCompanion(c){
  c.lane=Math.floor(Math.random()*3);
  c.x=-rand(260,420);
  c.vx=530+rand(-35,65)+state.elapsed*0.35;
  c.frame=Math.random()*4;
  c.frameTimer=0;
  c.hit=false;
  c.counted=false;
}

function startDragonEncounter(){
  if(state.enemyEvent) return;
  const hp=ENEMY_HP.dragon;
  const aimLane = state.player?.lane ?? 1;
  state.stats.dragonEncounters++;
  state.enemyEvent={
    type:'dragon', age:0,
    dragon:{ x:-430, targetX:70, y:LANES[aimLane], targetLane:aimLane, aimLane:aimLane, phase:'enter', cooldown:1.25, warning:0, recoil:0, frame:0, frameTimer:0, hp, maxHp:hp }
  };
  state.roadFlash=.5;
  state.stars = [];
  state.hearts = [];
  state.nextEnemyAt = state.elapsed + BOSS_INTERVAL;
  audio.play('entry');
}

function startEltaEncounter(){
  if(state.enemyEvent) return;
  const hp=ENEMY_HP.elta;
  state.enemyEvent={
    type:'elta', age:0, stormTimer:.9, bolts:[],
    elta:{ x:W-210, y:-260, enter:0, phase:1, frame:0, frameTimer:0, hp, maxHp:hp, recoil:0, aura:0 }
  };
  audio.startRain();
  state.roadFlash=.65;
  // La fase de Elta arranca limpia: sus únicos obstáculos son rocas y troncos de tormenta.
  state.stars=[]; state.hearts=[]; state.obstacles=[];
  state.nextEnemyAt=state.elapsed+BOSS_INTERVAL;
  audio.play('entry');
}

function enemyTarget(ev){ return ev.type==='tank' ? ev.boss : ev.type==='dragon' ? ev.dragon : ev.elta; }

function finishEnemyEncounter(){
  if(!state.enemyEvent) return;
  const ev=state.enemyEvent;
  const target=enemyTarget(ev);
  const cx=ev.type==='tank'?target.x+170:ev.type==='dragon'?target.x+240:target.x;
  const cy=ev.type==='elta'?target.y+85:target.y-45;
  burstSparks(cx,cy,'#ffd85c');
  burstSparks(cx+25,cy+22,'#ff6b47');
  state.bursts.push({ x:cx, y:cy, r:22, life:.45, color:'#ff6b47' });
  if(ev.type==='elta') audio.stopRain();
  if(ev.type==='tank'){ audio.stopLoop('companion-a'); audio.stopLoop('companion-b'); }
  state.enemyEvent=null;
  state.nextEnemyAt = state.elapsed + BOSS_INTERVAL;
  state.roadFlash=.3;
  audio.play('bossHit');
}

function damageEnemy(amount){
  const ev=state.enemyEvent;
  if(!ev) return;
  const target=enemyTarget(ev);
  target.hp=Math.max(0,target.hp-amount);
  target.recoil=Math.max(target.recoil,.18);
  state.stats.damageDealt += amount;
  const bx=ev.type==='tank' ? target.x+175 : ev.type==='dragon' ? target.x+245 : target.x;
  const by=ev.type==='elta' ? target.y+90 : target.y-55;
  burstSparks(bx,by,'#ffe66d');
  audio.play('bossHit');
  if(target.hp<=0) finishEnemyEncounter();
}

function launchPlayerAttack(){
  const p=state.player;
  if(!state.running || state.paused || !p?.alive || !state.enemyEvent) return;
  if(p.attackCooldown>0) return;
  const damage=110;
  const towardRight=state.enemyEvent.type==='elta';
  state.playerShots.push({ x:p.x+(towardRight?6:-6), y:p.visualY-78, vx:towardRight?1180:-1180, life:1.2, spin:0, damage, power:1.5, hit:false });
  p.attackCooldown=.11;
  state.bursts.push({ x:p.x-4, y:p.visualY-78, r:11, life:.22, color:'#ffe66d' });
  burstSparks(p.x-5,p.visualY-78,'#ffe66d');
  audio.play('playerShot');
}

function fireEnemyShot(x,lane,isDragon=false,speedMultiplier=1){
  const speed=(470+state.elapsed*1.7)*cfg().projectileSpeed*speedMultiplier;
  state.projectiles.push({ x, y:LANES[lane]-54, lane, vx:speed, life:3.6, frame:isDragon?4:2, passed:false, dragon:isDragon });
  audio.play(isDragon?'dragonShot':'tankShot');
}

function companionBox(c){
  const w=100,h=56;
  return { x:c.x-w/2, y:LANES[c.lane]-h, w, h };
}

function spawnStormObstacle(phase){
  const kinds=['stormRock','stormLog'];
  const spawnX=W+100;
  // No se agrega un obstáculo que complete los tres carriles en la misma fila.
  const lanesBlockedAhead=new Set(state.obstacles
    .filter(o=>Math.abs(o.x-spawnX)<300)
    .map(o=>o.lane));
  if(lanesBlockedAhead.size>=2) return false;
  let count=1;
  if(phase===2) count=Math.random()<.25?2:1;
  else if(phase===3) count=Math.random()<.45?2:1;
  else if(phase===4) count=Math.random()<.60?2:1;
  count=Math.min(count,2-lanesBlockedAhead.size);
  const used=[];
  for(let i=0;i<count;i++){
    const lanes=[0,1,2].filter(l=>!used.includes(l)&&!lanesBlockedAhead.has(l));
    if(!lanes.length) break;
    const lane=lanes[Math.floor(Math.random()*lanes.length)];
    used.push(lane);
    state.obstacles.push({ lane, x:spawnX+i*130, kind:kinds[Math.floor(Math.random()*kinds.length)], extra:110+phase*45, counted:false, hit:false, storm:true });
  }
  return used.length>0;
}

function addLightningWarning(phase){
  const warning=phase===1?1.72:phase===2?1.44:phase===3?1.18:1.02;
  const playerLane=state.player?.lane ?? 1;
  const attackLanes=[playerLane];
  if(phase===4){
    const otherLanes=[0,1,2].filter(lane=>lane!==playerLane);
    attackLanes.push(otherLanes[Math.floor(Math.random()*otherLanes.length)]);
  }
  for(const lane of attackLanes){
    state.enemyEvent.bolts.push({ lane, warning, fired:false, locked:false, lockTime:0, life:0 });
  }
  audio.play('charge');
}

function updateEnemyEvent(dt){
  const ev=state.enemyEvent;
  if(!ev) return;
  // El combate NO termina por tiempo. El enemigo permanece hasta que su HP llegue a 0.
  ev.age += dt;

  if(ev.type==='tank'){
    const t=ev.boss;
    t.recoil=Math.max(0,t.recoil-dt*1.8);
    t.shotFlash=Math.max(0,t.shotFlash-dt);
    t.lane = t.aimLane ?? t.targetLane ?? 1;
    t.y=lerp(t.y,LANES[t.lane],Math.min(1,dt*5));
    t.frameTimer+=dt;
    if(t.frameTimer>.11){ t.frame=(t.frame+0.65)%3; t.frameTimer=0; }
    t.x=lerp(t.x,t.targetX,Math.min(1,dt*2.8));

    if(t.phase==='enter' && Math.abs(t.x-t.targetX)<8){
      t.phase='cooldown';
      t.cooldown=1.0;
    } else if(t.phase==='cooldown'){
      t.cooldown-=dt;
      if(t.cooldown<=0){
        // El carril se decide una sola vez al empezar el ataque.
        t.targetLane=state.player?.lane ?? t.lane;
        t.aimLane=t.targetLane;
        t.phase='move';
      }
    } else if(t.phase==='move'){
      if(Math.abs(t.y-LANES[t.aimLane])<8){
        t.phase='warning';
        t.warning=.78;
        audio.play('charge');
      }
    } else if(t.phase==='warning'){
      t.warning-=dt;
      if(t.warning<=0){
        fireEnemyShot(t.x+160,t.targetLane,false,1.2);
        t.recoil=.24;
        t.shotFlash=.14;
        t.phase='cooldown';
        t.cooldown=2.2+rand(0.8,1.6);
      }
    }

    for(const c of ev.accomplices){
      if(ev.age < c.delay) continue;
      audio.startLoop(`companion-${c.variant}`,'companionMove');
      c.x += c.vx*dt;
      c.frameTimer += dt;
      if(c.frameTimer>.12){ c.frame=(c.frame+0.7)%4; c.frameTimer=0; }
      const p=state.player;
      if(!c.hit && p?.alive && p.invuln<=0 && p.lane===c.lane && overlaps(playerBox(),companionBox(c))){
        c.hit=true;
        damagePlayer();
      }
      if(!c.counted && c.x>p.x+80){ c.counted=true; if(!c.hit) state.stats.accomplicesDodged++; }
      if(c.x>W+180){ audio.stopLoop(`companion-${c.variant}`); resetCompanion(c); }
    }
  }

  if(ev.type==='dragon'){
    const d=ev.dragon;
    d.recoil=Math.max(0,d.recoil-dt*1.8);
    d.targetLane = d.aimLane;
    d.y=lerp(d.y,LANES[d.targetLane],Math.min(1,dt*5));
    d.frameTimer+=dt;
    if(d.frameTimer>.10){ d.frame=(d.frame+1)%4; d.frameTimer=0; }
    d.x=lerp(d.x,d.targetX,Math.min(1,dt*2.5));

    if(d.phase==='enter' && Math.abs(d.x-d.targetX)<8){
      d.phase='cooldown';
      d.cooldown=1.2;
    } else if(d.phase==='cooldown'){
      d.cooldown-=dt;
      if(d.cooldown<=0){
        d.aimLane = state.player?.lane ?? d.targetLane;
        d.targetLane = d.aimLane;
        d.phase='warning';
        d.warning=.85;
        audio.play('charge');
        audio.play('dragonRoar');
      }
    } else if(d.phase==='warning'){
      d.warning-=dt;
      if(d.warning<=0){
        fireEnemyShot(d.x+255,d.aimLane,true);
        d.recoil=.22;
        d.phase='cooldown';
        d.cooldown=1.3+rand(.5,1.0);
      }
    }
  }

  if(ev.type==='elta'){
    const e=ev.elta;
    e.recoil=Math.max(0,e.recoil-dt*2.4);
    const hpPct=e.hp/e.maxHp;
    e.phase=hpPct>.75?1:hpPct>.50?2:hpPct>.25?3:4;
    e.aura=Math.min(1,e.aura+dt*(e.phase>=3?2:1));
    e.frameTimer+=dt;
    if(e.frameTimer>.16){ e.frame++; e.frameTimer=0; }
    e.enter=Math.min(1,e.enter+dt/1.9);
    const easeIn=1-Math.pow(1-e.enter,3);
    e.y=lerp(-260,ELTA_TOP_Y,easeIn)+(e.enter>=1?Math.sin(ev.age*2.2)*6:0);
    ev.stormTimer-=dt;
    // Eventos más espaciados: los obstáculos son más grandes, así que deben dar tiempo para esquivar.
    const cadence=[2.85,2.45,2.12,1.82][e.phase-1];
    if(ev.stormTimer<=0){
      if(Math.random()<.504) spawnStormObstacle(e.phase); else addLightningWarning(e.phase);
      ev.stormTimer=cadence+rand(.35,.70);
    }
    for(const bolt of ev.bolts){
      if(!bolt.fired && !bolt.locked){
        // El carril queda fijo desde que aparece la advertencia; ya no sigue al jugador.
        bolt.warning-=dt;
        if(bolt.warning<=0){
          bolt.locked=true;
          bolt.lockTime=.26;
        }
      } else if(!bolt.fired && bolt.locked){
        // Pequeño intervalo entre la advertencia y la descarga.
        bolt.lockTime-=dt;
        if(bolt.lockTime<=0){
          bolt.fired=true;
          bolt.life=.30;
          state.flash=Math.max(state.flash,.10);
          state.roadFlash=Math.max(state.roadFlash,.20);
          const p=state.player;
          if(p?.alive && p.lane===bolt.lane) damagePlayer();
          burstSparks(PLAYER_X,LANES[bolt.lane]-45,'#ffe66d');
          audio.play('lightning');
        }
      } else {
        bolt.life-=dt;
      }
    }
    ev.bolts=ev.bolts.filter(b=>!b.fired || b.life>0);
  }
}

function updatePickups(dt){
  const p=state.player;
  for(const arr of [state.hearts,state.stars]){
    for(const u of arr){
      u.x -= state.speed*dt;
      u.life -= dt;
    }
  }
  for(const h of state.hearts){
    if(p?.alive && p.lives<3 && overlaps(playerBox(),pickupBox(h))){
      h.life=0;
      state.stats.heartsCollected++;
      healPlayer();
    }
  }
  for(const s of state.stars){
    if(p?.alive && overlaps(playerBox(),pickupBox(s))){
      s.life=0;
      state.stats.starsCollected++;
      burstSparks(s.x,LANES[s.lane]-48,'#ffe66d');
      state.bursts.push({ x:s.x, y:LANES[s.lane]-48, r:14, life:.28, color:'#ffe66d' });
      launchPlayerAttack();
      audio.play('collect');
    }
  }
  state.hearts = state.hearts.filter(h=>h.life>0 && h.x>-60);
  state.stars = state.stars.filter(s=>s.life>0 && s.x>-60);
}

function updatePlayerShots(dt){
  const ev=state.enemyEvent;
  for(const s of state.playerShots){
    s.x += s.vx*dt;
    s.life -= dt;
    s.spin += dt*11;
    if(ev && !s.hit){
      const enemy=enemyTarget(ev);
      const hitX=ev.type==='tank' ? enemy.x+200 : ev.type==='dragon' ? enemy.x+285 : enemy.x-70;
      const reached=ev.type==='elta' ? s.x>=hitX : s.x<=hitX;
      if(reached){
        s.hit=true;
        s.life=0;
        damageEnemy(s.damage);
      }
    }
  }
  state.playerShots = state.playerShots.filter(s=>s.life>0 && s.x>-120);
}

function update(dt){
  if(!state.player) state.player=createPlayer();
  state.elapsed += dt;
  // Al llegar Elta el bosque nocturno se mezcla suavemente; al derrotarla vuelve la ciudad.
  const eltaPresent=state.enemyEvent?.type==='elta';
  state.worldTransition=lerp(state.worldTransition,eltaPresent?1:0,Math.min(1,dt*.72));
  // La dificultad define la velocidad inicial. A partir de ahí se acelera
  // exactamente una unidad por segundo, sin saltos por cada fotograma.
  state.speed = cfg().startSpeed + Math.floor(state.elapsed);

  // El puntaje conserva su ritmo normal; solo la velocidad aumenta de uno en uno.
  state.score += dt * (55 + state.speed*.19);
  scoreEl.textContent = fmt(state.score);

  const p=state.player;
  p.visualY = lerp(p.visualY,LANES[p.lane],Math.min(1,dt*14));
  p.invuln = Math.max(0,p.invuln-dt);
  p.attackCooldown = Math.max(0,p.attackCooldown-dt);
  p.distance += state.speed*dt;
  p.frameTimer += dt;
  if(p.frameTimer>=.075){ p.frame=(p.frame+1)%8; p.frameTimer-=.075; }

  state.spawnTimer += dt;
  // Ningún obstáculo urbano se mezcla con la fase de Elta.
  const bossObstacleReduction = state.enemyEvent?.type === 'tank';
  const eltaStormActive = state.enemyEvent?.type === 'elta';
  if(state.spawnTimer>=state.nextSpawn){
    const shouldSpawn = !eltaStormActive && (!bossObstacleReduction || Math.random() < 0.1);
    if(shouldSpawn){ spawnObstacle(); }
    state.spawnTimer=0;
    const speedFactor=clamp((state.speed-cfg().startSpeed)/500,0,.42);
    // Durante la carrera normal aparecen un 10% más rápido; con enemigos se mantiene la cadencia propia del combate.
    const runningMultiplier=state.enemyEvent ? 1:.9;
    state.nextSpawn=Math.max(.38*runningMultiplier,((1.05-speedFactor)*cfg().obstacleRate+rand(.05,.28))*runningMultiplier);
  }

  for(const o of state.obstacles){
    o.x -= (state.speed+o.extra)*dt;
    if(!o.hit && o.lane===p.lane && overlaps(playerBox(),obstacleBox(o))){ o.hit=true; damagePlayer(); }
    if(!o.counted && o.x<p.x-70){ o.counted=true; if(!o.hit) state.stats.obstacles++; }
  }
  state.obstacles = state.obstacles.filter(o=>o.x>-220);

  if(state.enemyEvent){
    state.starTimer -= dt;
    if(state.starTimer<=0){
      spawnStar({minX:W+70,maxX:W+220,pad:190});
      state.starTimer = rand(1.6,2.4);
    }
  } else {
    state.stars = [];
    state.starTimer = 1.4;
  }

  if(p.lives >= 3){
    state.hearts = [];
    state.heartTimer = rand(18.0,24.0);
  } else {
    state.heartTimer -= dt;
    if(state.heartTimer<=0){
      if(!state.hearts.length){
        const battle=!!state.enemyEvent;
        spawnHeart({minX:battle?W+90:W+130,maxX:battle?W+240:W+320,pad:220});
      }
      state.heartTimer = state.enemyEvent ? rand(11.0,14.0) : rand(18.0,24.0);
    }
    if(state.enemyEvent && p.lives<3 && !state.hearts.length && state.heartTimer>7.5) state.heartTimer=7.5;
  }
  updatePickups(dt);

  if(!state.enemyEvent && state.elapsed>=state.nextEnemyAt){
    startNextBoss();
  }
  updateEnemyEvent(dt);

  for(const s of state.projectiles){
    s.x += s.vx*dt;
    s.life -= dt;
    if(s.lane===p.lane && Math.abs(s.x-p.x)<34 && p.invuln<=0){
      s.life=0;
      damagePlayer();
      state.impacts.push({ x:s.x, y:s.y, life:.28, max:.28 });
    }
    if(!s.passed && s.x>p.x+55){ s.passed=true; state.stats.shotsDodged++; }
  }
  state.projectiles = state.projectiles.filter(s=>s.life>0 && s.x<W+180);

  updatePlayerShots(dt);

  for(const im of state.impacts) im.life -= dt;
  state.impacts = state.impacts.filter(im=>im.life>0);

  for(const b of state.bursts){ b.life -= dt; b.r += dt*80; }
  state.bursts = state.bursts.filter(b=>b.life>0);
  updateParticles(dt);
  state.shake = Math.max(0,state.shake-dt);
  state.flash = Math.max(0,state.flash-dt);
  state.roadFlash = Math.max(0,state.roadFlash-dt);
}

function burstSparks(x,y,color){
  for(let i=0;i<18;i++){
    const a=rand(0,Math.PI*2), s=rand(90,300);
    state.particles.push({ x,y, vx:Math.cos(a)*s, vy:Math.sin(a)*s-50, life:rand(.3,.6), max:.6, r:rand(1.5,3.5), color, g:520 });
  }
}
let dustTimer=0;
function updateParticles(dt){
  dustTimer -= dt;
  if(dustTimer<=0 && state.player?.alive){
    dustTimer=.065;
    state.particles.push({ x:state.player.x-22, y:state.player.visualY+4, vx:-rand(90,190), vy:-rand(8,50), life:.4, max:.4, r:rand(2,5), color:'#c8b9d6', g:-15, dust:true });
  }
  for(const q of state.particles){ q.life-=dt; q.x+=q.vx*dt; q.y+=q.vy*dt; q.vy+=q.g*dt; }
  state.particles = state.particles.filter(q=>q.life>0);
}

function makeLayer(w,h,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d'),w,h); return c; }
function prepareEltaSpriteSheet(){
  if(!eltaSheet.naturalWidth) return;
  const prepared=document.createElement('canvas');
  prepared.width=eltaSheet.naturalWidth; prepared.height=eltaSheet.naturalHeight;
  const pctx=prepared.getContext('2d');
  pctx.drawImage(eltaSheet,0,0);
  const pixels=pctx.getImageData(0,0,prepared.width,prepared.height);
  for(let i=0;i<pixels.data.length;i+=4){
    const r=pixels.data[i], g=pixels.data[i+1], b=pixels.data[i+2];
    const high=Math.max(r,g,b), low=Math.min(r,g,b);
    // Solo borra el gris/negro neutro del fondo original. Oro, chispas y contornos quedan intactos.
    if(high<=36 && high-low<=6) pixels.data[i+3]=0;
  }
  pctx.putImageData(pixels,0,0);
  eltaSpriteSheet=prepared;
}
function seeded(seed){ let s=seed; return ()=> (s=(s*16807)%2147483647)/2147483647; }
const skyLayer=makeLayer(W,H,g=>{
  const sky=g.createLinearGradient(0,0,0,ROAD_TOP+20); sky.addColorStop(0,'#07031a'); sky.addColorStop(.4,'#2a0a3f'); sky.addColorStop(.78,'#7a1440'); sky.addColorStop(1,'#ff4a4a'); g.fillStyle=sky; g.fillRect(0,0,W,H);
  const r=seeded(42); for(let i=0;i<130;i++){ g.fillStyle=`rgba(255,255,255,${.25+r()*.65})`; g.fillRect(r()*W,r()*(ROAD_TOP-60),r()<.1?2:1,r()<.1?2:1); }
  const sun=g.createLinearGradient(0,40,0,210); sun.addColorStop(0,'#ffe27a'); sun.addColorStop(.5,'#ff6a4a'); sun.addColorStop(1,'#ff2d75'); g.fillStyle=sun; g.beginPath(); g.arc(930,145,82,0,Math.PI*2); g.fill();
});
function mountainTile(seed,base,amp,color){ return makeLayer(W,H,g=>{ const r=seeded(seed), pts=[]; for(let i=0;i<=16;i++) pts.push([i*W/16, base-(.25+r()*.75)*amp]); g.fillStyle=color; g.beginPath(); g.moveTo(0,H); pts.forEach(p=>g.lineTo(...p)); g.lineTo(W,H); g.closePath(); g.fill(); }); }
const mtFar=mountainTile(7,ROAD_TOP-8,120,'#3a0f45');
const mtNear=mountainTile(19,ROAD_TOP-2,80,'#230a30');
function cityTile(seed){ return makeLayer(W,H,g=>{ const r=seeded(seed); let x=0; while(x<W){ const bw=35+r()*70, bh=40+r()*120, top=ROAD_TOP-bh; g.fillStyle='#12081c'; g.fillRect(x,top,bw,bh); for(let wy=top+10; wy<ROAD_TOP-8; wy+=13) for(let wx=x+7; wx<x+bw-7; wx+=11) if(r()<.13){ g.fillStyle=r()<.5?'rgba(61,230,255,.65)':'rgba(255,190,120,.7)'; g.fillRect(wx,wy,4,5); } x+=bw+4+r()*7; } }); }
const city=cityTile(203);
const tankApocalypseSky=makeLayer(W,H,g=>{
  const sky=g.createLinearGradient(0,0,0,ROAD_TOP+16);
  sky.addColorStop(0,'#160d19'); sky.addColorStop(.55,'#47252a'); sky.addColorStop(1,'#a34b35');
  g.fillStyle=sky; g.fillRect(0,0,W,ROAD_TOP+16);
  const r=seeded(742);
  for(let i=0;i<8;i++){
    const x=70+i*165+r()*35, y=30+r()*75, rx=75+r()*90, ry=12+r()*15;
    g.fillStyle=`rgba(30,25,34,${.24+r()*.2})`;
    g.beginPath(); g.ellipse(x,y,rx,ry,-.08,0,Math.PI*2); g.fill();
  }
  g.fillStyle='#291c29'; g.beginPath(); g.moveTo(0,ROAD_TOP);
  for(let x=0;x<=W;x+=46) g.lineTo(x,ROAD_TOP-14-r()*38);
  g.lineTo(W,ROAD_TOP); g.closePath(); g.fill();
  let x=-12;
  while(x<W){
    const bw=42+r()*66, bh=55+r()*98, top=ROAD_TOP-bh;
    g.fillStyle=r()<.5?'#211923':'#30202a';
    g.fillRect(x,top,bw,bh);
    g.fillStyle='#17151e';
    g.fillRect(x+bw*.55,top-8-r()*14,bw*.45,8+r()*14);
    if(r()<.5){ g.fillRect(x+5,top-9,Math.max(8,bw*.3),9); }
    for(let wy=top+12;wy<ROAD_TOP-8;wy+=17){
      for(let wx=x+8;wx<x+bw-5;wx+=15){
        const light=r();
        if(light<.16){ g.fillStyle='#ff8245'; g.fillRect(wx,wy,5,7); }
        else if(light<.28){ g.fillStyle='rgba(243,185,119,.32)'; g.fillRect(wx,wy,5,7); }
      }
    }
    x+=bw+7+r()*12;
  }
  for(let i=0;i<34;i++){
    g.fillStyle=r()<.35?'#ffb24e':'rgba(255,123,62,.65)';
    g.fillRect(Math.floor(r()*W),Math.floor(r()*(ROAD_TOP-16)),r()<.12?3:1,r()<.12?3:1);
  }
  g.fillStyle='rgba(20,13,22,.78)'; g.fillRect(0,ROAD_TOP-5,W,12);
});
const redMountainSky=makeLayer(W,H,g=>{
  const sky=g.createLinearGradient(0,0,0,ROAD_TOP+12);
  sky.addColorStop(0,'#260817'); sky.addColorStop(.48,'#741b29'); sky.addColorStop(1,'#d54a32');
  g.fillStyle=sky; g.fillRect(0,0,W,ROAD_TOP+14);
  const r=seeded(329);
  // Ceniza y chispas discretas de un paisaje volcánico en pixel art.
  for(let i=0;i<70;i++){
    const x=Math.floor(r()*W), y=Math.floor(r()*(ROAD_TOP-30));
    g.fillStyle=r()<.18?'#ffcb68':'rgba(255,174,94,.42)'; g.fillRect(x,y,r()<.14?3:1,r()<.14?3:1);
  }
  // Cordillera lejana escalonada.
  g.fillStyle='#522035'; g.beginPath(); g.moveTo(0,ROAD_TOP);
  for(let x=0;x<=W;x+=38){ const peak=ROAD_TOP-35-r()*45; g.lineTo(x,peak); g.lineTo(x+19,ROAD_TOP-16-r()*22); }
  g.lineTo(W,ROAD_TOP); g.closePath(); g.fill();
  // Volcán central construido en escalones, con lava roja y naranja.
  const mx=W*.46, base=ROAD_TOP+8;
  g.fillStyle='#39141f'; g.beginPath(); g.moveTo(mx-230,base); g.lineTo(mx-155,base-44); g.lineTo(mx-96,base-92); g.lineTo(mx-42,base-145); g.lineTo(mx+2,base-164); g.lineTo(mx+55,base-134); g.lineTo(mx+126,base-70); g.lineTo(mx+205,base); g.closePath(); g.fill();
  g.fillStyle='#6f2025'; g.beginPath(); g.moveTo(mx-162,base); g.lineTo(mx-35,base-145); g.lineTo(mx+3,base-157); g.lineTo(mx+131,base); g.closePath(); g.fill();
  g.fillStyle='#c9472e'; g.fillRect(mx-26,base-137,24,8); g.fillRect(mx-12,base-129,16,24); g.fillRect(mx-4,base-105,13,34);
  g.fillStyle='#ff9e43'; g.fillRect(mx-20,base-134,9,7); g.fillRect(mx-7,base-110,7,25);
  g.fillStyle='#1b0a14'; g.fillRect(0,ROAD_TOP-6,W,16);
});
const forestSky=makeLayer(W,H,g=>{
  const sky=g.createLinearGradient(0,0,0,ROAD_TOP+15); sky.addColorStop(0,'#050817'); sky.addColorStop(.56,'#15235c'); sky.addColorStop(1,'#263475'); g.fillStyle=sky; g.fillRect(0,0,W,ROAD_TOP+18);
  const r=seeded(617); for(let i=0;i<95;i++){ g.fillStyle=`rgba(235,241,255,${.22+r()*.68})`; g.fillRect(r()*W,r()*(ROAD_TOP-26),1,1); }
  g.fillStyle='#ffe7a1'; g.beginPath(); g.arc(W*.75,82,43,0,Math.PI*2); g.fill(); g.fillStyle='rgba(255,255,255,.2)'; g.beginPath(); g.arc(W*.75,82,57,0,Math.PI*2); g.fill();
  g.fillStyle='#0b1231'; g.beginPath(); g.moveTo(0,ROAD_TOP); for(let i=0;i<=15;i++){ const x=i*W/15; g.lineTo(x,154-r()*52); } g.lineTo(W,ROAD_TOP); g.closePath(); g.fill();
  for(let i=0;i<19;i++){
    const x=i*W/18+r()*38-20, h=92+r()*104, base=ROAD_TOP+10;
    g.fillStyle='#070d22'; g.fillRect(x-8,base-h*.74,17,h*.82);
    g.fillStyle='#090f28'; for(let y=base-h;y<base-h*.22;y+=12){ const spread=20+(base-h*.22-y)*.38; g.beginPath(); g.moveTo(x,y-18); g.lineTo(x-spread,y+28); g.lineTo(x+spread,y+28); g.closePath(); g.fill(); }
  }
  g.fillStyle='rgba(113,148,209,.16)'; g.fillRect(0,ROAD_TOP-14,W,22);
});
// Fondo de Elta: bosque nocturno 2D, con el mismo lenguaje de siluetas que la ciudad.
const stormSky2D=makeLayer(W,H,g=>{
  const sky=g.createLinearGradient(0,0,0,ROAD_TOP);
  sky.addColorStop(0,'#050a17'); sky.addColorStop(.60,'#111d35'); sky.addColorStop(1,'#26364b');
  g.fillStyle=sky; g.fillRect(0,0,W,ROAD_TOP);
  const r=seeded(881);
  // Nubes en bloques: composición limpia y 2D, no textura realista.
  for(let row=0;row<2;row++) for(let i=0;i<11;i++){
    const x=i*125+r()*42-40, y=14+row*38+r()*12, w=105+r()*88, h=18+r()*16;
    g.fillStyle=row===0?'#0b1225':'#101b30';
    g.fillRect(x,y,w,h); g.fillRect(x+18,y-9,w*.55,12);
  }
  // Luna centrada, parcialmente cubierta por el bosque.
  g.fillStyle='rgba(188,210,219,.18)'; g.beginPath(); g.arc(W*.5,86,59,0,Math.PI*2); g.fill();
  g.fillStyle='#dbe8d0'; g.beginPath(); g.arc(W*.5,86,42,0,Math.PI*2); g.fill();
  g.fillStyle='#bfceb9'; g.fillRect(W*.5-19,68,12,6); g.fillRect(W*.5+10,96,10,5); g.fillRect(W*.5-4,108,7,4);
  // Colinas y pinos en silueta, equivalentes al skyline urbano.
  g.fillStyle='#0c1726'; g.beginPath(); g.moveTo(0,ROAD_TOP);
  for(let x=0;x<=W;x+=52) g.lineTo(x,ROAD_TOP-22-r()*28);
  g.lineTo(W,ROAD_TOP); g.closePath(); g.fill();
  for(let i=0;i<25;i++){
    const x=i*W/24+r()*24-12, base=ROAD_TOP+5, h=28+r()*44;
    g.fillStyle=i%2?'#07101b':'#0a1521';
    g.beginPath(); g.moveTo(x,base-h); g.lineTo(x-h*.32,base); g.lineTo(x+h*.32,base); g.closePath(); g.fill();
    g.fillRect(x-2,base-h*.30,4,h*.38);
  }
  g.fillStyle='rgba(121,154,161,.22)'; g.fillRect(0,ROAD_TOP-4,W,4);
});
const vignette=makeLayer(W,H,g=>{ const v=g.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H*.95); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.55)'); g.fillStyle=v; g.fillRect(0,0,W,H); g.fillStyle='rgba(0,0,0,.08)'; for(let y=0;y<H;y+=4) g.fillRect(0,y,W,1); });
function drawTile(img,offset){ const o=((offset%W)+W)%W; ctx.drawImage(img,-o,0); ctx.drawImage(img,W-o,0); }

function drawBackground(){
  const t=state.elapsed;
  // La distancia se acumula de forma continua en update(). No se usa t*speed,
  // porque al subir la velocidad cada segundo eso provocaba un salto del fondo.
  const distance=state.player?.distance || 0;
  const scene=state.enemyEvent?.type;
  if(scene==='tank') ctx.drawImage(tankApocalypseSky,0,0);
  else if(scene==='dragon') ctx.drawImage(redMountainSky,0,0);
  else {
    ctx.drawImage(skyLayer,0,0); drawTile(mtFar,distance*.02); drawTile(mtNear,distance*.038); drawTile(city,distance*.085);
    if(state.worldTransition>0){ ctx.save(); ctx.globalAlpha=state.worldTransition; ctx.drawImage(forestSky,0,0); ctx.restore(); }
  }
  // Una pista continua por escenario: evita las bandas oscuras que parecían un reflejo.
  const theme=scene==='tank'
    ? { base:'#171116', top:'#392329', mid:'#251920', low:'#130f15', edge:'#c26042', dash:'#854433', ground:'#0d0b10' }
    : scene==='dragon'
    ? { base:'#160a13', top:'#692034', mid:'#351421', low:'#190b13', edge:'#ff6a45', dash:'#b84232', ground:'#0c0710' }
    : scene==='elta'
      ? { base:'#0a1220', top:'#1c3143', mid:'#111f30', low:'#08121e', edge:'#8db5c5', dash:'#526f83', ground:'#050a11' }
      : { base:'#0c0919', top:'#2d2443', mid:'#1b1731', low:'#0c0a19', edge:'#35d9ef', dash:'#825fbd', ground:'#08060f' };
  ctx.fillStyle=theme.base; ctx.fillRect(0,ROAD_TOP,W,ROAD_BOTTOM-ROAD_TOP);
  ctx.fillStyle='#090b14'; ctx.fillRect(0,ROAD_TOP-13,W,13);
  ctx.fillStyle=theme.edge; ctx.globalAlpha=.78; ctx.fillRect(0,ROAD_TOP-2,W,3); ctx.globalAlpha=1;
  for(let i=0;i<3;i++){
    const cy=LANES[i], top=cy-66, bottom=cy+50, h=bottom-top;
    const g=ctx.createLinearGradient(0,top,0,bottom);
    g.addColorStop(0,theme.top); g.addColorStop(.53,theme.mid); g.addColorStop(1,theme.low);
    ctx.fillStyle=g; ctx.fillRect(0,top,W,h);
    // Bordes mate, con pequeñas marcas de desplazamiento en lugar de una reflexión especular.
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,top,W,5);
    ctx.fillStyle=theme.edge; ctx.globalAlpha=.38; ctx.fillRect(0,top+5,W,2); ctx.globalAlpha=1;
    ctx.fillStyle='rgba(0,0,0,.68)'; ctx.fillRect(0,bottom-7,W,7);
    const drift=(distance*.18+i*23)%86;
    ctx.fillStyle=theme.dash; ctx.globalAlpha=.33;
    for(let x=-drift;x<W;x+=86){ ctx.fillRect(x,cy+27,24,2); ctx.fillRect(x+8,cy+31,7,2); }
    ctx.globalAlpha=1;
  }
  // Suelo inferior compacto, sin prolongar visualmente los carriles como un espejo.
  ctx.fillStyle=theme.ground; ctx.fillRect(0,ROAD_BOTTOM-8,W,H-ROAD_BOTTOM+8);
  ctx.fillStyle='rgba(255,255,255,.035)'; ctx.fillRect(0,ROAD_BOTTOM-8,W,2);
  for(let x=18;x<W;x+=94){
    const h=scene==='dragon'?9:scene==='elta'?7:5;
    ctx.fillStyle=scene==='dragon'?'#29101a':scene==='elta'?'#0b1a20':'#100d20';
    ctx.fillRect(x,H-18-h,26,h); ctx.fillRect(x+6,H-23-h,12,6);
  }
  if(state.worldTransition>0){
    ctx.save(); ctx.globalAlpha=state.worldTransition*.74;
    for(let i=0;i<3;i++){ const y=LANES[i]+34; ctx.fillStyle='#0a1c25'; ctx.fillRect(0,y,W,9); ctx.fillStyle='rgba(80,111,83,.52)'; for(let x=(i%2)*43;x<W;x+=86){ ctx.fillRect(x,y-5,18,4); ctx.fillRect(x+5,y-10,6,6); } }
    ctx.restore();
  }
  if(state.roadFlash>0){ ctx.fillStyle=`rgba(255,60,80,${state.roadFlash*.14})`; ctx.fillRect(0,ROAD_TOP,W,ROAD_BOTTOM-ROAD_TOP); }
}

function drawPlayer(){
  const p=state.player; if(!p || !atlas.complete || !atlas.naturalWidth) return;
  const i=p.character;
  ctx.save();
  if(p.invuln>0 && Math.floor(p.invuln*12)%2===0) ctx.globalAlpha=.35;
  const phase=(p.frame+p.frameTimer/.075)*Math.PI/4;
  const bob=Math.round((Math.sin(phase)+1)*1.5);
  ctx.save();
  ctx.lineCap='round';
  for(let streak=0;streak<3;streak++){
    const y=p.visualY-34+streak*22+Math.sin(phase-streak)*3;
    ctx.globalAlpha=.2+.12*Math.sin(phase-streak);
    ctx.strokeStyle=COLORS[i];
    ctx.lineWidth=streak===1?3:2;
    ctx.beginPath(); ctx.moveTo(p.x-38-streak*7,y); ctx.lineTo(p.x-57-streak*10,y); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(p.x,p.visualY+8,31+bob,7,0,0,Math.PI*2); ctx.fill();
  ctx.translate(p.x,p.visualY+bob);
  const halo=ctx.createRadialGradient(0,8,2,0,8,48); halo.addColorStop(0,hexA(COLORS[i],.5)); halo.addColorStop(1,hexA(COLORS[i],0)); ctx.fillStyle=halo; ctx.beginPath(); ctx.ellipse(0,8,48,13,0,0,Math.PI*2); ctx.fill();
  const f=p.frame%8, s=ATLAS.scale, row=i*2+Math.floor(f/4);
  ctx.drawImage(atlas,(f%4)*ATLAS.cw,row*ATLAS.ch,ATLAS.cw,ATLAS.ch,-ATLAS.cw*s/2,4-266*s,ATLAS.cw*s,ATLAS.ch*s);
  ctx.restore();
}

function drawObstacle(o){
  const phaseObstacle=PHASE_OBSTACLE_BY_KIND[o.kind];
  const isStorm=!!STORM_OBSTACLE[o.kind];
  const source=phaseObstacle ? phaseObstacle.image : isStorm ? stormObstacleSheet : obstacleAtlas;
  if(!source.complete || !source.naturalWidth) return;
  const {w,h}=obstacleMetrics(o.kind), y=LANES[o.lane];
  ctx.fillStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(o.x,y+4,w*.55,7,0,0,Math.PI*2); ctx.fill();
  if(phaseObstacle){
    ctx.drawImage(source,o.x-w/2,y-h,w,h);
    return;
  }
  const crop=isStorm ? STORM_OBSTACLE[o.kind] : SHEET.obstacles[o.kind]||SHEET.obstacles.barrierA;
  ctx.drawImage(source,crop.x,crop.y,crop.w,crop.h,o.x-w/2,y-h,w,h);
}

function drawHeartPath(cx,cy,s){
  ctx.beginPath();
  ctx.moveTo(cx, cy+s*.32);
  ctx.bezierCurveTo(cx-s, cy-s*.55, cx-s*.35, cy-s*1.35, cx, cy-s*.55);
  ctx.bezierCurveTo(cx+s*.35, cy-s*1.35, cx+s, cy-s*.55, cx, cy+s*.32);
  ctx.closePath();
}
function drawStarShape(x,y,r1,r2,points=8){
  ctx.beginPath();
  for(let i=0;i<points*2;i++){
    const a=-Math.PI/2 + i*Math.PI/points;
    const r=i%2===0 ? r2 : r1;
    const px=x+Math.cos(a)*r, py=y+Math.sin(a)*r;
    i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
  }
  ctx.closePath();
}
function drawPickups(){
  for(const h of state.hearts){
    const y=LANES[h.lane]-44+Math.sin((state.elapsed+h.bob)*4)*5;
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(h.x,LANES[h.lane]+6,23,6,0,0,Math.PI*2); ctx.fill();
    const glow=ctx.createRadialGradient(h.x,y,2,h.x,y,34); glow.addColorStop(0,'rgba(255,130,160,.55)'); glow.addColorStop(1,'rgba(255,130,160,0)');
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(h.x,y,34,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff5f83'; ctx.shadowColor='#ff5f83'; ctx.shadowBlur=12; drawHeartPath(h.x,y,13); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='#fff0f4'; drawHeartPath(h.x,y,9); ctx.fill();
  }
  for(const s of state.stars){
    const y=LANES[s.lane]-46+Math.sin((state.elapsed+s.bob)*4.5)*5;
    const pulse=.75+.25*Math.sin((state.elapsed+s.spin)*8);
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(s.x,LANES[s.lane]+6,24,6,0,0,Math.PI*2); ctx.fill();
    const glow=ctx.createRadialGradient(s.x,y,2,s.x,y,38); glow.addColorStop(0,`rgba(255,225,120,${.45*pulse})`); glow.addColorStop(1,'rgba(255,225,120,0)');
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(s.x,y,38,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffd24c'; ctx.shadowColor='#ffd24c'; ctx.shadowBlur=14; drawStarShape(s.x,y,8,18,4); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='#fff7c6'; drawStarShape(s.x,y,5,12,4); ctx.fill();
  }
}

function drawTankBoss(t){
  const y=t.y, aimY=LANES[t.aimLane], x=t.x-t.recoil*20;
  if(t.warning>0){
    const pulse=.45+.55*Math.sin(state.elapsed*22);
    ctx.save(); ctx.globalAlpha=.16+.25*pulse; ctx.fillStyle='#ff304b'; ctx.fillRect(0,aimY-78,W,100); ctx.restore();
    ctx.save(); ctx.strokeStyle='#ff5b72'; ctx.setLineDash([12,9]); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+190,aimY-52); ctx.lineTo(W,aimY-52); ctx.stroke(); ctx.restore();
  }
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.43)'; ctx.beginPath(); ctx.ellipse(x+110,y+4,110,12,0,0,Math.PI*2); ctx.fill();
  if(tankBossStrip.complete && tankBossStrip.naturalWidth){
    const drawFrame = t.shotFlash > 0 ? 3 : Math.floor(t.frame) % 3;
    const dw=TANK_ATLAS.cw*TANK_ATLAS.scale, dh=TANK_ATLAS.ch*TANK_ATLAS.scale;
    ctx.drawImage(tankBossStrip,drawFrame*TANK_ATLAS.cw,0,TANK_ATLAS.cw,TANK_ATLAS.ch,x-45,y-dh+12,dw,dh);
  }
  ctx.restore();
}

function drawCompanion(c,age){
  if(age<c.delay) return;
  const y=LANES[c.lane], x=c.x;
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x,y+3,52,8,0,0,Math.PI*2); ctx.fill();
  const strip=c.variant==='a' ? tankCompanionA : tankCompanionB;
  if(strip.complete && strip.naturalWidth){
    const drawFrame = Math.min(3, Math.floor(c.frame) % 4);
    const dw=TANK_COMP_ATLAS.cw*TANK_COMP_ATLAS.scale, dh=TANK_COMP_ATLAS.ch*TANK_COMP_ATLAS.scale;
    ctx.drawImage(strip,drawFrame*TANK_COMP_ATLAS.cw,0,TANK_COMP_ATLAS.cw,TANK_COMP_ATLAS.ch,x-dw/2,y-dh+12,dw,dh);
  }
  ctx.restore();
}

function drawDragon(d){
  if(!enemyAtlas.complete || !enemyAtlas.naturalWidth) return;
  const y=d.y, x=d.x-d.recoil*18, aimY=LANES[d.aimLane];
  if(d.warning>0){
    const pulse=.5+.5*Math.sin(state.elapsed*19);
    ctx.save(); ctx.globalAlpha=.15+.28*pulse; ctx.fillStyle='#ff3d4f'; ctx.fillRect(0,aimY-78,W,100); ctx.restore();
  }
  const frame=d.warning>0 ? (4+Math.floor(state.elapsed*10)%2) : (d.frame%4);
  const col=frame%4, row=Math.floor(frame/4);
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.42)'; ctx.beginPath(); ctx.ellipse(x+125,y+6,140,13,0,0,Math.PI*2); ctx.fill();
  const s=EATLAS.scale;
  ctx.drawImage(enemyAtlas,col*EATLAS.cw,row*EATLAS.ch,EATLAS.cw,EATLAS.ch,x-105-EATLAS.lx*s,y-205,EATLAS.cw*s,EATLAS.ch*s);
  ctx.restore();
}

function cloudPuffs(t,count,x0,x1,yBase,rMin,rMax,seed){
  for(let i=0;i<count;i++){
    const k=i/(count-1), n=Math.sin(i*12.9898+seed)*43758.5453, r0=n-Math.floor(n);
    const r=rMin+(rMax-rMin)*r0;
    const x=lerp(x0,x1,k)+Math.sin(t*.35+i*1.7+seed)*18;
    const y=yBase+Math.sin(t*.6+i*2.3+seed)*7+(r0-.5)*26;
    const g=ctx.createRadialGradient(x,y-r*.25,r*.15,x,y,r);
    g.addColorStop(0,'rgba(22,22,38,.98)'); g.addColorStop(.7,'rgba(6,7,16,.96)'); g.addColorStop(1,'rgba(3,4,10,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
}

// Atmósfera de la tormenta: es estrictamente un fondo tenue y nunca tapa los carriles.
function drawStormShade(ev){
  const e=ev.elta, a=clamp(e.enter*1.15,0,1);
  if(a<=0) return;
  const t=state.elapsed;
  ctx.save();
  ctx.globalAlpha=a*.94;
  ctx.drawImage(stormSky2D,0,0);
  const veil=ctx.createLinearGradient(0,0,0,ROAD_TOP);
  veil.addColorStop(0,`rgba(9,12,30,${.16*a})`);
  veil.addColorStop(.55,`rgba(16,18,43,${.10*a})`);
  veil.addColorStop(1,`rgba(18,20,50,${.06*a})`);
  ctx.fillStyle=veil;
  ctx.fillRect(0,0,W,ROAD_TOP);
  const flicker=Math.max(0,Math.sin(t*5.1)*Math.sin(t*2.3));
  if(e.phase>=2 && flicker>.55){
    ctx.globalAlpha=a*(flicker-.45)*.22;
    ctx.fillStyle='#8f85e5';
    ctx.beginPath();
    ctx.ellipse(W*.55+Math.sin(t)*160,95,230,55,0,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawElta(e,ev){
  const phase=e.phase, x=e.x-e.recoil*18, y=e.y;
  ctx.save();
  const pulse=.55+.45*Math.sin(state.elapsed*5.5);
  const aura=ctx.createRadialGradient(x,y+110,12,x,y+110,140+phase*13);
  aura.addColorStop(0,`rgba(255,204,62,${.18+.10*pulse})`);
  aura.addColorStop(.42,`rgba(122,102,255,${.11+.08*pulse})`);
  aura.addColorStop(1,'rgba(40,35,105,0)');
  ctx.fillStyle=aura;
  ctx.beginPath();
  ctx.arc(x,y+110,150+phase*13,0,Math.PI*2);
  ctx.fill();
  if(phase>=3){
    const glow=ctx.createRadialGradient(x,y+105,8,x,y+105,155);
    glow.addColorStop(0,'rgba(255,218,66,.24)');
    glow.addColorStop(1,'rgba(255,218,66,0)');
    ctx.fillStyle=glow;
    ctx.beginPath();
    ctx.arc(x,y+105,155,0,Math.PI*2);
    ctx.fill();
  }
  let animation=ELTA_ANIMATIONS.idle;
  let animationSpeed=1;
  if(e.recoil>0){ animation=ELTA_ANIMATIONS.hurt; animationSpeed=2; }
  else {
    const chargingBolt=ev.bolts.find(b=>!b.fired);
    const firedBolt=ev.bolts.find(b=>b.fired&&b.life>0);
    if(chargingBolt){ animation=ELTA_ANIMATIONS.charge; animationSpeed=1.5; }
    else if(firedBolt){ animation=ELTA_ANIMATIONS.attack; animationSpeed=2; }
    else if(phase===2) animation=ELTA_ANIMATIONS.phase2;
    else if(phase===3) animation=ELTA_ANIMATIONS.phase3;
    else if(phase===4) animation=ELTA_ANIMATIONS.phase4;
  }
  const frameIndex=animation[Math.floor(e.frame*animationSpeed)%animation.length];
  const frame=ELTA_FRAMES[frameIndex];
  if(eltaSpriteSheet&&frame){
    ctx.drawImage(eltaSpriteSheet,frame.x,frame.y,frame.w,frame.h,x-ELTA_DRAW.width/2,y,ELTA_DRAW.width,ELTA_DRAW.height);
  }
  ctx.restore();
}

function drawRain(){
  const ev=state.enemyEvent; if(ev?.type!=='elta') return;
  const phase=ev.elta.phase, count=68+phase*42, speed=330+phase*68;
  ctx.save();
  // Dos profundidades: la lejana es fina, la frontal es más brillante y rápida.
  for(let layer=0;layer<2;layer++){
    ctx.strokeStyle=layer ? `rgba(180,210,255,${.18+phase*.045})` : `rgba(95,130,184,${.16+phase*.04})`;
    ctx.lineWidth=layer ? 1.5 : 1;
    const n=layer ? Math.floor(count*.58) : count;
    for(let i=0;i<n;i++){
      const x=(i*(layer?97:61)+state.elapsed*(speed*(layer?1.18:.72)))%(W+80)-40;
      const y=(i*(layer?53:37)+state.elapsed*(speed*(layer?1.35:.86)))%(H+96)-48;
      const len=(layer?15:9)+phase*(layer?2:1);
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-5-layer*3,y+len); ctx.stroke();
    }
  }
  ctx.restore();
}

function lightningRowPath(y,seed){
  ctx.beginPath(); ctx.moveTo(0,y);
  const segments=15;
  for(let i=1;i<=segments;i++){
    const x=i*W/segments;
    const offset=Math.sin(seed+i*2.31)*12+(i%2?7:-6);
    ctx.lineTo(x,y+offset);
  }
}

function lightningBoltPath(x,y,seed){
  const segments=7, width=132;
  ctx.beginPath(); ctx.moveTo(x+width/2,y);
  for(let i=1;i<=segments;i++){
    const px=x+width/2-i*width/segments;
    const py=y+Math.sin(seed+i*2.17)*10+(i%2?6:-6);
    ctx.lineTo(px,py);
  }
}

function drawLightningWarnings(){
  const ev=state.enemyEvent; if(ev?.type!=='elta') return;
  for(const bolt of ev.bolts){
    const y=LANES[bolt.lane]-45;
    if(!bolt.fired){
      const a=bolt.locked ? .86 : .35+.65*Math.abs(Math.sin(state.elapsed*15));
      ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle='#ffe36a'; ctx.shadowColor='#ffd12e'; ctx.shadowBlur=15; ctx.lineWidth=2;
      ctx.setLineDash(bolt.locked?[7,4]:[14,10]); lightningRowPath(y,bolt.lane*19); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    } else {
      const seed=bolt.lane*19+Math.floor(state.elapsed*9);
      ctx.save(); ctx.strokeStyle='#d99b16'; ctx.shadowColor='#ffbf22'; ctx.shadowBlur=26; ctx.lineWidth=13; lightningRowPath(y,seed); ctx.stroke();
      ctx.strokeStyle='#fff6b0'; ctx.shadowColor='#fff2a1'; ctx.shadowBlur=12; ctx.lineWidth=4; lightningRowPath(y,seed); ctx.stroke(); ctx.restore();
    }
  }
}

function drawStormCloudCover(ev){
  const a=clamp(ev.elta.enter*1.2,0,1);
  if(a<=0) return;
  const fogTop=LANES[0]-66;
  const fogBottom=LANES[2]+50;
  const fogHeight=fogBottom-fogTop;
  const fogFrontX=PLAYER_X+450;
  if(fogFrontX>=W) return;
  const t=state.elapsed;
  ctx.save();

  const body=ctx.createLinearGradient(fogFrontX-110,0,fogFrontX+90,0);
  body.addColorStop(0,'rgba(180,204,218,0)');
  body.addColorStop(.22,`rgba(180,204,218,${.08*a})`);
  body.addColorStop(.55,`rgba(180,204,218,${.82*a})`);
  body.addColorStop(1,`rgba(180,204,218,${.96*a})`);
  ctx.fillStyle=body;
  ctx.fillRect(fogFrontX-110,fogTop,W-fogFrontX+110,fogHeight);

  for(let layer=0;layer<4;layer++){
    const count=6;
    const rowY=fogTop+fogHeight*(.16+layer*.22);
    for(let i=0;i<count;i++){
      const k=i/(count-1);
      const x=fogFrontX-60+k*(W-fogFrontX+80)+Math.sin(t*.16+i*1.8+layer)*18;
      const y=rowY+Math.sin(t*.22+i*1.5+layer*2)*18;
      const rx=95+Math.sin(i*2.4+layer)*30;
      const ry=27+Math.sin(i*1.7+layer*2)*11;
      ctx.save();
      ctx.translate(x,y);
      ctx.scale(1,ry/rx);
      const wisp=ctx.createRadialGradient(-rx*.2,-rx*.15,rx*.04,0,0,rx);
      wisp.addColorStop(0,`rgba(217,229,235,${.20*a})`);
      wisp.addColorStop(.48,`rgba(182,204,216,${.13*a})`);
      wisp.addColorStop(1,'rgba(160,186,202,0)');
      ctx.fillStyle=wisp;
      ctx.beginPath();
      ctx.arc(0,0,rx,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawEnemyEvent(){
  const ev=state.enemyEvent; if(!ev) return;
  if(ev.type==='tank'){
    drawTankBoss(ev.boss);
    for(const c of ev.accomplices) drawCompanion(c,ev.age);
  } else if(ev.type==='dragon') drawDragon(ev.dragon);
  else if(ev.type==='elta') drawElta(ev.elta,ev);
}

function drawProjectiles(){
  for(const s of state.projectiles){
    if(obstacleAtlas.complete && obstacleAtlas.naturalWidth){
      const crop=SHEET.shots[s.frame]||SHEET.shots[1], dw=88, dh=dw*(crop.h/crop.w);
      ctx.drawImage(obstacleAtlas,crop.x,crop.y,crop.w,crop.h,s.x-dw/2,s.y-dh/2,dw,dh);
    } else {
      ctx.fillStyle='#ff713c'; ctx.beginPath(); ctx.arc(s.x,s.y,11,0,Math.PI*2); ctx.fill();
    }
  }
  for(const im of state.impacts){
    const a=clamp(im.life/im.max,0,1);
    ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#ff713c'; ctx.beginPath(); ctx.arc(im.x,im.y,38*(1-a*.4),0,Math.PI*2); ctx.fill(); ctx.restore();
  }
}

function drawPlayerShots(){
  for(const s of state.playerShots){
    ctx.save();
    ctx.translate(s.x,s.y);
    ctx.rotate(s.spin);
    ctx.shadowColor='#ffd24c';
    ctx.shadowBlur=18;
    ctx.fillStyle='#ffd24c';
    drawStarShape(0,0,9+s.power*5,18+s.power*10,4);
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#fff8d6';
    drawStarShape(0,0,5+s.power*3,10+s.power*5,4);
    ctx.fill();
    ctx.restore();
  }
}
function drawParticles(){ for(const q of state.particles){ const a=clamp(q.life/q.max,0,1); ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=q.color; ctx.shadowColor=q.dust?'transparent':q.color; ctx.shadowBlur=q.dust?0:10; ctx.beginPath(); ctx.arc(q.x,q.y,q.r,0,Math.PI*2); ctx.fill(); ctx.restore(); } }
function drawBursts(){ for(const b of state.bursts){ ctx.save(); ctx.strokeStyle=b.color; ctx.globalAlpha=Math.max(0,b.life/.35); ctx.lineWidth=5; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*1.6,0,Math.PI*2); ctx.stroke(); ctx.restore(); } }

function pill(x,y,w,h){ ctx.fillStyle='rgba(10,5,18,.72)'; roundRect(x,y,w,h,h/2); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.14)'; ctx.stroke(); }
function drawHUD(){
  ctx.textBaseline='middle';

  if(state.enemyEvent){
    const ev=state.enemyEvent;
    const enemy=enemyTarget(ev);
    ctx.save(); ctx.textAlign='center'; ctx.globalAlpha=.96; ctx.fillStyle='rgba(55,5,14,.86)'; roundRect(W/2-260, 90, 520, 68, 12); ctx.fill(); ctx.strokeStyle='#ff304b'; ctx.lineWidth=2; ctx.stroke();
    const enemyName=ev.type==='tank' ? 'TANQUE ZOMBI' : ev.type==='dragon' ? 'DINOSAURIO ROBÓTICO' : 'ELTA · DIOSA DEL SOL';
    ctx.fillStyle='#fff'; ctx.font='900 17px Orbitron,monospace'; ctx.fillText(enemyName, W/2, 112);
    ctx.fillStyle='rgba(255,255,255,.16)'; roundRect(W/2-210, 130, 420, 12, 6); ctx.fill();
    const hpPct=clamp(enemy.hp/enemy.maxHp,0,1); if(hpPct>0){ ctx.fillStyle='#ff304b'; roundRect(W/2-210, 130, 420*hpPct, 12, 6); ctx.fill(); }
    ctx.fillStyle='#ffc5cf'; ctx.font='700 11px Orbitron,monospace'; ctx.fillText('BOSS activo', W/2, 152);
    ctx.restore();
  }

  ctx.textBaseline='alphabetic';
}
function drawOverlayFx(){ ctx.drawImage(vignette,0,0); if(state.flash>0){ ctx.fillStyle=`rgba(255,40,70,${state.flash})`; ctx.fillRect(0,0,W,H); } }

function draw(){
  ctx.save();
  if(state.shake>0) ctx.translate(rand(-5,5),rand(-3,3));
  drawBackground();
  if(state.enemyEvent?.type==='elta') drawStormShade(state.enemyEvent);
  state.obstacles.forEach(drawObstacle);
  drawPickups();
  drawEnemyEvent();
  if(state.enemyEvent?.type==='elta') drawStormCloudCover(state.enemyEvent);
  drawLightningWarnings();
  drawProjectiles();
  drawPlayerShots();
  drawPlayer();
  drawParticles();
  drawRain();
  drawBursts();
  ctx.restore();
  drawOverlayFx();
  drawHUD();
}

function drawPreview(){
  state.elapsed=0; state.speed=cfg().startSpeed; state.obstacles=[]; state.projectiles=[]; state.playerShots=[]; state.enemyEvent=null; state.hearts=[]; state.stars=[]; state.energy=0;
  if(!state.player) state.player=createPlayer();
  draw();
}
function loop(now){
  if(!state.running || state.paused || state.over) return;
  const dt=Math.min(.033,(now-state.lastTime)/1000||0);
  state.lastTime=now;
  update(dt);
  draw();
  if(state.running && !state.paused && !state.over) requestAnimationFrame(loop);
}

window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','KeyW','KeyS'].includes(e.code)) e.preventDefault();
  if(e.repeat) return;
  if((movementControls==='arrows' && e.code==='ArrowUp') || (movementControls==='ws' && e.code==='KeyW')) movePlayer(-1);
  if((movementControls==='arrows' && e.code==='ArrowDown') || (movementControls==='ws' && e.code==='KeyS')) movePlayer(1);
  if(e.code==='KeyP') togglePause();
  if(e.code==='KeyF' && !handheldQuery.matches) toggleFullscreen();
});

let touchStart = null;
canvas.addEventListener('pointerdown', e => {
  touchStart = { id:e.pointerId, x:e.clientX, y:e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup', e => {
  if(!touchStart || touchStart.id!==e.pointerId) return;
  const dx = e.clientX - touchStart.x;
  const dy = e.clientY - touchStart.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if(state.running && !state.paused){
    const rotatedPortrait=window.matchMedia('(orientation: portrait) and (pointer: coarse)').matches;
    if(rotatedPortrait && absX > 18 && absX > absY*.6) movePlayer(dx < 0 ? 1 : -1);
    else if(!rotatedPortrait && absY > 18 && absY > absX*.6) movePlayer(dy > 0 ? 1 : -1);
  }
  touchStart = null;
});
canvas.addEventListener('lostpointercapture', () => { touchStart = null; });
canvas.addEventListener('pointercancel', () => { touchStart = null; });

// Botones táctiles independientes del canvas: funcionan incluso al mantener otro dedo sobre la pantalla.
document.querySelectorAll('[data-lane]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse' && event.button!==0) return;
    event.preventDefault();
    movePlayer(button.dataset.lane==='up' ? -1 : 1);
  });
  // Evitar que el navegador genere un segundo click por el toque.
  button.addEventListener('click',event=>event.preventDefault());
});
actionButtons.forEach(btn => btn.addEventListener('click', () => handleAction(btn.dataset.action)));
rosterCards.forEach((card,i)=>card.addEventListener('click',()=>setCharacter(i)));
difficultyButtons.forEach(b=>b.addEventListener('click',()=>setDifficulty(b.dataset.difficulty)));
controlButtons.forEach(button=>button.addEventListener('click',()=>setMovementControls(button.dataset.control)));
document.querySelector('#menuBtn').addEventListener('click',()=>{
  showCharacterMenu();
});

const fsTarget=document.querySelector('.game-card');
const fsBtn=document.querySelector('#fsBtn');
const handheldQuery=window.matchMedia('(pointer: coarse)');
if(handheldQuery.matches) document.body.classList.add('mobile-game-active');
function isFullscreen(){ return !!(document.fullscreenElement||document.webkitFullscreenElement) || fsTarget.classList.contains('pseudo-fs'); }
function syncFullscreenUI(){ const on=isFullscreen(); fsTarget.classList.toggle('is-fs',on); document.body.classList.toggle('fs-active',on); if(fsBtn){ fsBtn.textContent=on?'✕ Salir':'⛶ Pantalla completa'; fsBtn.setAttribute('aria-pressed',String(on)); } }
function startGame(){
  audio.unlock();
  resetGame();
}
async function toggleFullscreen(){
  if(handheldQuery.matches) return;
  if(isFullscreen()){
    if(fsTarget.classList.contains('pseudo-fs')) fsTarget.classList.remove('pseudo-fs');
    else if(document.exitFullscreen) await document.exitFullscreen().catch(()=>{});
  } else if(fsTarget.requestFullscreen){
    try{ await fsTarget.requestFullscreen(); }catch{ fsTarget.classList.add('pseudo-fs'); }
  } else fsTarget.classList.add('pseudo-fs');
  syncFullscreenUI(); canvas.focus();
}
document.querySelector('#startBtn').addEventListener('click',startGame);
document.querySelector('#restartBtn').addEventListener('click',startGame);
fsBtn?.addEventListener('click',toggleFullscreen);
document.addEventListener('fullscreenchange',syncFullscreenUI);
handheldQuery.addEventListener('change',event=>{
  document.body.classList.toggle('mobile-game-active',event.matches);
});

setDifficulty('medium');
setMovementControls('arrows');
setCharacter(0);

async function loadGameAssets(){
  loadingError.classList.add('hidden');
  loadingRetry.disabled=true;
  loadingProgress.style.width='0%';
  loadingProgressBar.setAttribute('aria-valuenow','0');
  loadingStatus.textContent='Cargando recursos... 0%';

  let loaded=0;
  const results=await Promise.allSettled(gameAssets.map(image=>image.decode().finally(()=>{
    loaded++;
    const percent=Math.round(loaded/gameAssets.length*100);
    loadingProgress.style.width=`${percent}%`;
    loadingProgressBar.setAttribute('aria-valuenow',String(percent));
    loadingStatus.textContent=`Cargando recursos... ${percent}%`;
  })));
  const failed=results.filter(result=>result.status==='rejected');
  if(failed.length){
    console.error('No se pudieron cargar los recursos del juego.',failed.map(result=>result.reason));
    loadingStatus.textContent='Error al cargar. Revisa tu conexión y vuelve a intentarlo.';
    loadingError.classList.remove('hidden');
    loadingRetry.disabled=false;
    return;
  }

  try{
    prepareEltaSpriteSheet();
    if(!state.running && !state.over) drawPreview();
    startOverlay.classList.remove('hidden');
    loadingStatus.textContent='¡Listo!';
    loadingScreen.classList.add('is-loaded');
    loadingScreen.setAttribute('aria-hidden','true');
    window.setTimeout(()=>loadingScreen.classList.add('hidden'),450);
  }catch(error){
    console.error('No se pudo preparar el juego después de cargar sus recursos.',error);
    loadingStatus.textContent='No se pudo preparar el juego. Inténtalo de nuevo.';
    loadingError.classList.remove('hidden');
    loadingRetry.disabled=false;
  }
}

loadingRetry.addEventListener('click',()=>window.location.reload());
loadGameAssets();
