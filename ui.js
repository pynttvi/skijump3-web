import {metadata, createGame} from './game.js';
const $ = id => document.getElementById(id);
document.title = `${metadata.title} · Canvas port`;
for (const [id, value] of Object.entries({'game-title': metadata.title, 'game-description': metadata.description, 'game-edition': metadata.edition})) $(id).textContent = value;
const canvas = $('game'); canvas.width = metadata.width; canvas.height = metadata.height;
for (const [id, label] of Object.entries(metadata.hudLabels)) $(`${id}-label`).textContent = label;
for (const [action, keys] of metadata.controls) {
  const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
  dt.textContent = action; dd.textContent = keys; row.append(dt, dd); $('controls').append(row);
}
for (const scene of metadata.scenes) $('level').add(new Option(scene.name, scene.id));
const game = createGame(canvas);
let running = false, paused = false, map = false, sound = false, elapsed = 0, last = null;
const scene = () => $('level').value;
function status() {
  $('status').textContent = running ? (paused ? 'Paused' : 'Running') : 'Ready';
  $('pause').textContent = paused ? 'Resume' : 'Pause';
  $('mission').textContent = $('level').selectedOptions[0]?.textContent ?? '—';
}
function start() {
  game.start(scene()); running = true; paused = false; elapsed = 0;
  $('overlay').hidden = true; canvas.focus(); status();
}
$('start').onclick = start;
$('pause').onclick = () => {if (!running) return; paused = !paused; game.pause(paused); status();};
function restart() {
  game.restart(scene()); running = true; paused = false; elapsed = 0;
  $('overlay').hidden = true; canvas.focus(); status();
}
$('restart').onclick = restart;
$('level').onchange = restart;
$('map').onclick = () => {map = !map; game.showMap(map); $('map').setAttribute('aria-pressed', String(map));};
$('fullscreen').onclick = async () => {
  try {if (document.fullscreenElement) await document.exitFullscreen(); else await $('play-area').requestFullscreen();}
  catch (error) {$('status').textContent = `Fullscreen unavailable: ${error.message}`;}
};
document.addEventListener('fullscreenchange', () => $('fullscreen').setAttribute('aria-pressed', String(Boolean(document.fullscreenElement))));
$('sound').onclick = async () => {
  $('sound').disabled = true;
  try {
    sound = Boolean(await game.setSound(!sound));
    $('sound').setAttribute('aria-pressed', String(sound)); $('sound').textContent = sound ? 'Disable sound' : 'Enable sound';
    $('audio-status').textContent = sound ? 'Sound on.' : 'Sound off.';
  } catch (error) {$('audio-status').textContent = `Audio unavailable: ${error.message}`;}
  finally {$('sound').disabled = false;}
};
function frame(now) {
  const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1); last = now;
  if (running && !paused) {elapsed += dt; game.update(dt);}
  game.render();
  for (const [key, value] of Object.entries(game.getHUD())) {
    const target = $(key === 'health' ? 'health-value' : key);
    if (target) target.textContent = String(value);
    if (key === 'health') $('health').value = Number(value);
  }
  $('timer').textContent = `${String(Math.floor(elapsed / 60)).padStart(2,'0')}:${String(Math.floor(elapsed % 60)).padStart(2,'0')}`;
  requestAnimationFrame(frame);
}
status(); requestAnimationFrame(frame);
