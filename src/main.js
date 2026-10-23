import './style.css';
import { CoastalWorld } from './scene.js';
import { CoastalAudio } from './audio.js';

const $ = (selector) => document.querySelector(selector);
const audio = new CoastalAudio();
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = {
  playing: !motionPreference.matches,
  speed: 1,
  sound: false,
  sunset: false,
  cameraIndex: 0,
  immersive: false,
  autoRotate: false,
  reducedMotion: motionPreference.matches,
  bells: 0,
};
let world;
let toastTimer;

function toast(message) {
  const element = $('#toast');
  element.querySelector('span').textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 2800);
}

function showSceneError() {
  $('#loading-screen').classList.add('loaded');
  $('#scene-error').hidden = false;
}

try {
  world = new CoastalWorld($('#scene'), {
    onInteraction: (target) => {
      if (target === 'peli') {
        const greetings = ['Peli：嘿，今天的风也很温柔！', 'Peli：要一起去海的另一边吗？', 'Peli：别赶路，感受路。', 'Peli：你成功引起了本鹈鹕的注意！'];
        toast(greetings[Math.floor(Math.random() * greetings.length)]);
        audio.chirp();
      } else {
        handleBell(false);
      }
    },
    onContextLost: showSceneError,
  });
} catch (error) {
  console.error('无法初始化 3D 海岸世界：', error);
  showSceneError();
}

$('#reload-button').addEventListener('click', () => window.location.reload());

if (world) startExperience();

function startExperience() {
  world.setReducedMotion(state.reducedMotion);
  world.setPlaying(state.playing);
  updatePlayUI();
  updateSpeedUI();
  updateMotionUI();
  requestAnimationFrame(() => requestAnimationFrame(() => $('#loading-screen').classList.add('loaded')));

  const experience = $('#experience');
  const dialog = $('#story-dialog');
  const settings = $('#settings-panel');

  async function setSound(enabled, notify = true) {
    try {
      await audio.setEnabled(enabled);
      state.sound = enabled;
      const button = $('#sound-toggle');
      button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-label', enabled ? '关闭环境音效' : '开启环境音效');
      button.querySelector('use').setAttribute('href', enabled ? '#icon-volume' : '#icon-muted');
      if (notify) toast(enabled ? '海浪和微风，现在都陪你出发。' : '声音已收起，安静也很美好。');
      return true;
    } catch (error) {
      toast(error.message || '暂时无法开启声音，请再试一次。');
      return false;
    }
  }

  function togglePlay() {
    state.playing = !state.playing;
    world.setPlaying(state.playing);
    updatePlayUI();
    toast(state.playing ? '继续出发，风景就在前方。' : '先歇一会，听听海浪。');
  }

  function setSpeed(value) {
    state.speed = Math.round(Math.min(2, Math.max(0.4, Number(value))) * 10) / 10;
    world.setSpeed(state.speed);
    updateSpeedUI();
  }

  function setImmersive(enabled) {
    state.immersive = enabled;
    experience.classList.toggle('is-riding', enabled);
    world.setImmersive(enabled);
    state.cameraIndex = 0;
    updateCameraUI();
    setSpeed(enabled ? 1.4 : 1);
    if (enabled) {
      state.playing = true;
      world.setPlaying(true);
      updatePlayUI();
      toast('欢迎上车！点一点 Peli，和它打个招呼。');
    }
  }

  function changeCamera() {
    state.cameraIndex = (state.cameraIndex + 1) % 3;
    world.setCameraPreset(state.cameraIndex);
    updateCameraUI();
    const names = ['海岸漫游', '并肩骑行', '追逐风细节'];
    toast(`镜头 0${state.cameraIndex + 1} · ${names[state.cameraIndex]}`);
  }

  function toggleTheme() {
    state.sunset = !state.sunset;
    document.body.classList.toggle('sunset', state.sunset);
    world.setSunset(state.sunset);
    $('#theme-label').textContent = state.sunset ? '回到晴天' : '日落时分';
    $('#theme-toggle').setAttribute('aria-label', state.sunset ? '切换至白天模式' : '切换至日落模式');
    $('#theme-toggle use').setAttribute('href', state.sunset ? '#icon-moon' : '#icon-sun');
    $('#temperature').textContent = state.sunset ? '22°' : '24°';
    $('#weather-description').textContent = state.sunset ? '落日温柔，晚风刚好' : '海风轻柔，适合出发';
    $('meta[name="theme-color"]').setAttribute('content', state.sunset ? '#eee4d6' : '#f3f1e8');
    toast(state.sunset ? '把天空调成橘子味，再骑一小会儿。' : '早安，又是适合出发的一天。');
  }

  async function takeSnapshot() {
    const button = $('#snapshot-button');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      const blob = await world.snapshot();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `peli-coastal-adventure-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      const flash = $('.photo-flash');
      flash.classList.remove('flash');
      void flash.offsetWidth;
      flash.classList.add('flash');
      toast('咔嚓！这一刻的自由，已经收藏。');
    } catch (error) {
      toast(error.message || '照片没能保存，请再试一次。');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  function toggleSettings(force) {
    const open = typeof force === 'boolean' ? force : settings.hidden;
    settings.hidden = !open;
    $('#settings-toggle').setAttribute('aria-expanded', String(open));
    $('#settings-toggle').classList.toggle('active', open);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (experience.requestFullscreen) {
        await experience.requestFullscreen();
      } else {
        toast('这个浏览器暂不支持全屏，横屏也很美。');
      }
    } catch {
      toast('暂时无法进入全屏，请检查浏览器设置。');
    }
  }

  function openDialog(type) {
    toggleSettings(false);
    const content = $('#dialog-content');
    if (type === 'journal') {
      const stats = world.getStats();
      content.innerHTML = `
        <span class="dialog-eyebrow">PELI'S LITTLE TRAVEL JOURNAL · 001</span>
        <h2 class="dialog-title">The scenic<br /><em>route.</em></h2>
        <p class="dialog-description">没有必须抵达的终点，只有舍不得错过的风景。<br />灯塔、野花、面包香，都是今天的小确幸。</p>
        <svg class="route-map" viewBox="0 0 420 145" aria-label="从灯塔经过海岸小屋到自由海岸的路线">
          <path fill="#c2d6ca" d="M0 96c70-50 102-6 163-27s100-6 132 8 77-13 125-5v73H0Z"/>
          <path class="road" d="M27 100c39-81 111 38 165-25s83 52 126 6 58-19 81-8"/>
          <path class="route" d="M27 100c39-81 111 38 165-25s83 52 126 6 58-19 81-8"/>
          <circle cx="28" cy="100" r="6" fill="#cc6542"/><circle cx="193" cy="75" r="5" fill="#f6f4eb" stroke="#cc6542" stroke-width="2"/><circle cx="397" cy="73" r="6" fill="#cc6542"/>
          <text x="15" y="124">灯塔出发</text><text x="169" y="55">海岸小屋</text><text x="348" y="53">自由海岸</text>
          <path d="m63 30 3 20m-8-4 5-16 5 16Z" fill="#71846c" stroke="none"/><path d="M360 105c-7-10 7-10 0 0Zm0-1v13" stroke="#71846c" fill="none"/>
        </svg>
        <div class="journal-stats">
          <div class="journal-stat"><strong>${stats.distance.toFixed(2)}</strong><span>漫游里程 / KM</span></div>
          <div class="journal-stat"><strong>${String(Math.floor(stats.seconds / 60)).padStart(2, '0')}</strong><span>兜风时间 / MIN</span></div>
          <div class="journal-stat"><strong>${String(state.bells).padStart(2, '0')}</strong><span>快乐鸣笛 / RING</span></div>
        </div>
        <p class="journal-note">“骑行 ${stats.distance.toFixed(2)} 公里，收获 ${stats.seconds > 60 ? '一口袋' : '一点点'} 自由。<br />明天也要选择风景更好的那条路。”</p>`;
    } else if (type === 'about') {
      content.innerHTML = `
        <span class="dialog-eyebrow">YOUR UNLIKELY EXPLORER</span>
        <h2 class="dialog-title">Hi, I'm <em>Peli.</em></h2>
        <p class="dialog-description">一只不太按常理出牌的鹈鹕。<br />明明有翅膀，却偏偏喜欢两个轮子。<br /><br />Peli 相信，飞行能越过山海，骑行却能记住沿途的每一朵小花。车篮里永远装着面包，脖子上永远围着幸运围巾，目的地永远是——风想去的地方。</p>
        <div class="dialog-signoff">“Not all who wander need wings.”</div>
        <p class="journal-note">这是一座完全由代码搭建的小岛。每根辐条、每片羽毛、每朵云，都是为你准备的。<br />试着点一点 Peli，或在骑车时按一下 <kbd>B</kbd>。</p>`;
    } else {
      content.innerHTML = `
        <span class="dialog-eyebrow">A LITTLE FIELD GUIDE</span>
        <h2 class="dialog-title">Make yourself<br /><em>at home.</em></h2>
        <p class="dialog-description">这里没有规则，只有几种发现世界的方式。</p>
        <div class="shortcut-list">
          <div class="shortcut-row"><span>拖动 / 单指滑动</span><span>环绕看世界</span></div>
          <div class="shortcut-row"><span>滚轮 / 双指缩放</span><span>靠近一点，或远一点</span></div>
          <div class="shortcut-row"><span><kbd>SPACE</kbd></span><span>骑行 / 暂停</span></div>
          <div class="shortcut-row"><span><kbd>C</kbd></span><span>切换电影镜头</span></div>
          <div class="shortcut-row"><span><kbd>D</kbd> / <kbd>M</kbd></span><span>日落模式 / 环境声音</span></div>
          <div class="shortcut-row"><span><kbd>B</kbd> / <kbd>F</kbd></span><span>车铃 / 全屏</span></div>
          <div class="shortcut-row"><span>点一点 Peli</span><span>打个招呼</span></div>
          <div class="shortcut-row"><span>相机按钮</span><span>保存无界面的 3D 照片</span></div>
        </div>
        <p class="journal-note">小提示：设置里的「轻柔动态效果」会减少镜头、围巾和环境摆动。你的系统减少动态效果偏好也会被自动尊重。</p>`;
    }
    if (!dialog.open) dialog.showModal();
  }

  $('#ride-button').addEventListener('click', () => setImmersive(true));
  $('#back-button').addEventListener('click', () => setImmersive(false));
  $('#explore-nav').addEventListener('click', () => {
    if (dialog.open) dialog.close();
    setImmersive(true);
  });
  $('#journey-nav').addEventListener('click', () => openDialog('journal'));
  $('#about-nav').addEventListener('click', () => openDialog('about'));
  $('#help-button').addEventListener('click', () => openDialog('help'));
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  $('.brand').addEventListener('click', (event) => {
    event.preventDefault();
    if (dialog.open) dialog.close();
    setImmersive(false);
    world.setCameraPreset(0);
    state.cameraIndex = 0;
    updateCameraUI();
  });
  $('#play-toggle').addEventListener('click', togglePlay);
  $('#slower-button').addEventListener('click', () => setSpeed(state.speed - 0.2));
  $('#faster-button').addEventListener('click', () => setSpeed(state.speed + 0.2));
  $('#speed-range').addEventListener('input', (event) => setSpeed(event.target.value));
  $('#camera-toggle').addEventListener('click', changeCamera);
  $('#theme-toggle').addEventListener('click', toggleTheme);
  $('#sound-toggle').addEventListener('click', () => setSound(!state.sound));
  $('#bell-button').addEventListener('click', () => {
    world.ringBell();
    handleBell(true);
  });
  $('#snapshot-button').addEventListener('click', takeSnapshot);
  $('#settings-toggle').addEventListener('click', () => toggleSettings());
  $('#settings-close').addEventListener('click', () => toggleSettings(false));
  $('#orbit-toggle').addEventListener('click', () => {
    state.autoRotate = !state.autoRotate;
    if (state.autoRotate && state.reducedMotion) {
      state.reducedMotion = false;
      world.setReducedMotion(false);
      updateMotionUI();
    }
    world.setAutoRotate(state.autoRotate);
    $('#orbit-toggle').setAttribute('aria-checked', String(state.autoRotate));
    toast(state.autoRotate ? '镜头会慢慢环绕，你只管欣赏。' : '自动环绕已关闭，视角交还给你。');
  });
  $('#motion-toggle').addEventListener('click', () => {
    state.reducedMotion = !state.reducedMotion;
    if (state.reducedMotion) {
      state.autoRotate = false;
      world.setAutoRotate(false);
      $('#orbit-toggle').setAttribute('aria-checked', 'false');
    }
    world.setReducedMotion(state.reducedMotion);
    updateMotionUI();
    toast(state.reducedMotion ? '已减少镜头与环境动态，慢慢看。' : '轻柔的海风与摆动回来了。');
  });
  $('#volume-range').addEventListener('input', (event) => audio.setVolume(event.target.value));
  $('#reset-button').addEventListener('click', () => {
    world.reset();
    state.playing = true;
    state.speed = 1;
    state.cameraIndex = 0;
    state.autoRotate = false;
    state.bells = 0;
    world.setAutoRotate(false);
    $('#orbit-toggle').setAttribute('aria-checked', 'false');
    setImmersive(false);
    updatePlayUI();
    updateSpeedUI();
    updateCameraUI();
    toast('重新出发，好风景值得再看一遍。');
  });
  $('#fullscreen-button').addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    $('#fullscreen-button').setAttribute('aria-label', document.fullscreenElement ? '退出全屏' : '进入全屏');
  });
  document.addEventListener('pointerdown', (event) => {
    if (!settings.hidden && !settings.contains(event.target) && !$('#settings-toggle').contains(event.target)) toggleSettings(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (dialog.open) return;
    const key = event.key.toLowerCase();
    if (key === ' ' && event.target.tagName !== 'BUTTON') {
      event.preventDefault();
      togglePlay();
    } else if (key === 'c') changeCamera();
    else if (key === 'd') toggleTheme();
    else if (key === 'm') setSound(!state.sound);
    else if (key === 'b') {
      world.ringBell();
      handleBell(true);
    } else if (key === 'f') toggleFullscreen();
    else if (key === '?' || key === 'h') openDialog('help');
    else if (key === 'escape') {
      toggleSettings(false);
      if (state.immersive) setImmersive(false);
    }
  });
  motionPreference.addEventListener('change', (event) => {
    state.reducedMotion = event.matches;
    world.setReducedMotion(event.matches);
    if (event.matches) {
      state.autoRotate = false;
      state.playing = false;
      world.setAutoRotate(false);
      world.setPlaying(false);
      $('#orbit-toggle').setAttribute('aria-checked', 'false');
      updatePlayUI();
    }
    updateMotionUI();
  });
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) {
      world.destroy();
      audio.destroy();
    }
  });
}

async function handleBell(visualAlreadyPlayed) {
  if (!visualAlreadyPlayed) world.ringBell();
  state.bells += 1;
  if (!state.sound) {
    try {
      const enabled = await audio.setEnabled(true);
      state.sound = enabled;
      $('#sound-toggle').setAttribute('aria-pressed', String(enabled));
      $('#sound-toggle').setAttribute('aria-label', enabled ? '关闭环境音效' : '开启环境音效');
      $('#sound-toggle use').setAttribute('href', enabled ? '#icon-volume' : '#icon-muted');
    } catch {
      state.sound = false;
    }
  }
  audio.bell();
  const button = $('#bell-button');
  button.classList.remove('ringing');
  void button.offsetWidth;
  button.classList.add('ringing');
  setTimeout(() => button.classList.remove('ringing'), 500);
  toast(state.sound ? '叮铃铃！一路都是好心情。' : '叮铃铃！这个浏览器暂时无法播放声音。');
}

function updatePlayUI() {
  const button = $('#play-toggle');
  button.setAttribute('aria-pressed', String(state.playing));
  button.setAttribute('aria-label', state.playing ? '暂停骑行' : '开始骑行');
  button.querySelector('use').setAttribute('href', state.playing ? '#icon-pause' : '#icon-play');
}

function updateSpeedUI() {
  $('#speed-number').innerHTML = `${state.speed.toFixed(1)}<span>×</span>`;
  $('#speed-range').value = state.speed;
  $('#speed-output').textContent = `${state.speed.toFixed(1)}×`;
  $('#slower-button').disabled = state.speed <= 0.4;
  $('#faster-button').disabled = state.speed >= 2;
}

function updateCameraUI() {
  const names = ['海岸漫游', '并肩骑行', '风之特写'];
  $('#experience').classList.toggle('detail-view', state.cameraIndex !== 0);
  $('#camera-name').textContent = names[state.cameraIndex];
  $('#camera-number').textContent = `0${state.cameraIndex + 1} / 03`;
  document.querySelectorAll('.view-dots i').forEach((dot, index) => dot.classList.toggle('active', index === state.cameraIndex));
}

function updateMotionUI() {
  $('#motion-toggle').setAttribute('aria-checked', String(state.reducedMotion));
}
