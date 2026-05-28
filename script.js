// ─── STATE ───────────────────────────────────────────────
const audio = document.getElementById('audioPlayer');
let songs = [];
let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isMuted = false;

// ─── EMOJIS for variety ───────────────────────────────────
const artEmojis = ['🎵','🎶','🎸','🎹','🎺','🎻','🥁','🎷','🎤','🎧','🎼','🎙️'];

function randomEmoji() {
  return artEmojis[Math.floor(Math.random() * artEmojis.length)];
}

// ─── LOAD FILES ───────────────────────────────────────────
function loadFiles(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  files.forEach(file => {
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^/.]+$/, ''); // strip extension
    songs.push({ name, url, emoji: randomEmoji(), duration: '—' });
  });

  renderSongList();

  // Auto-play first added song if nothing is playing
  if (currentIndex === -1) {
    playSong(songs.length - files.length);
  }
}

// ─── RENDER SONG LIST ─────────────────────────────────────
function renderSongList() {
  const list = document.getElementById('songList');
  const empty = document.getElementById('emptyState');

  if (songs.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    return;
  }

  list.innerHTML = songs.map((song, i) => `
    <div class="song-row ${i === currentIndex ? 'active' : ''}" id="row-${i}" onclick="playSong(${i})">
      <div class="song-num">${i === currentIndex && isPlaying ? '▶' : i + 1}</div>
      <div class="song-row-info">
        <div class="song-row-thumb">${song.emoji}</div>
        <div class="song-row-text">
          <div class="song-row-name">${song.name}</div>
          <div class="song-row-file">Local file</div>
        </div>
      </div>
      <div class="song-row-dur">${song.duration}</div>
    </div>
  `).join('');
}

// ─── PLAY SONG ────────────────────────────────────────────
function playSong(index) {
  if (index < 0 || index >= songs.length) return;

  currentIndex = index;
  const song = songs[index];

  audio.src = song.url;
  audio.play();
  isPlaying = true;

  updateUI();
  renderSongList();
}

// ─── TOGGLE PLAY/PAUSE ────────────────────────────────────
function togglePlay() {
  if (songs.length === 0) return;

  if (currentIndex === -1) {
    playSong(0);
    return;
  }

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play();
    isPlaying = true;
  }

  updatePlayBtn();
  renderSongList();
}

// ─── NEXT / PREV ──────────────────────────────────────────
function nextSong() {
  if (songs.length === 0) return;

  let next;
  if (isShuffle) {
    next = Math.floor(Math.random() * songs.length);
  } else {
    next = (currentIndex + 1) % songs.length;
  }
  playSong(next);
}

function prevSong() {
  if (songs.length === 0) return;

  // If more than 3s in, restart current song
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  let prev = (currentIndex - 1 + songs.length) % songs.length;
  playSong(prev);
}

// ─── SHUFFLE / REPEAT ─────────────────────────────────────
function toggleShuffle(btn) {
  isShuffle = !isShuffle;
  btn.classList.toggle('active', isShuffle);
}

function toggleRepeat(btn) {
  isRepeat = !isRepeat;
  btn.classList.toggle('active', isRepeat);
  audio.loop = isRepeat;
}

// ─── LIKE ─────────────────────────────────────────────────
function toggleLike(btn) {
  btn.classList.toggle('liked');
  btn.textContent = btn.classList.contains('liked') ? '♥' : '♡';

  // Sync both heart buttons
  const heartBtn = document.getElementById('heartBtn');
  if (btn !== heartBtn) {
    heartBtn.classList.toggle('liked', btn.classList.contains('liked'));
    heartBtn.textContent = heartBtn.classList.contains('liked') ? '♥' : '♡';
  }
}

// ─── MUTE / VOLUME ────────────────────────────────────────
function toggleMute(btn) {
  isMuted = !isMuted;
  audio.muted = isMuted;

  const icon = document.getElementById('volIcon');
  if (isMuted) {
    icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
  } else {
    icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
  }
}

function setVolume(event) {
  const bar = document.getElementById('volumeBar');
  const rect = bar.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  audio.volume = pct;
  document.getElementById('volumeFill').style.width = (pct * 100) + '%';
  if (pct > 0 && isMuted) toggleMute(document.querySelector('.ctrl-btn.small'));
}

// ─── SEEK ─────────────────────────────────────────────────
function seek(event) {
  if (!audio.duration) return;
  const bar = document.getElementById('progressBar');
  const rect = bar.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  audio.currentTime = pct * audio.duration;
}

// ─── FORMAT TIME ──────────────────────────────────────────
function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── UPDATE UI ────────────────────────────────────────────
function updateUI() {
  if (currentIndex < 0 || !songs[currentIndex]) return;
  const song = songs[currentIndex];

  // Featured section
  document.getElementById('featuredTitle').textContent = song.name;
  document.getElementById('featuredArtist').textContent = 'Local Library';
  document.getElementById('featuredArt').textContent = song.emoji;
  document.getElementById('featuredPlayBtn').textContent = '⏸ Pause';

  // Player bar
  document.getElementById('playerSong').textContent = song.name;
  document.getElementById('playerArtist').textContent = 'Local File';
  document.getElementById('playerThumb').textContent = song.emoji;

  updatePlayBtn();
}

function updatePlayBtn() {
  const icon = document.getElementById('playIcon');
  const featBtn = document.getElementById('featuredPlayBtn');

  if (isPlaying) {
    icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    if (featBtn) featBtn.textContent = '⏸ Pause';
  } else {
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    if (featBtn && currentIndex >= 0) featBtn.textContent = '▶ Play';
  }
}

// ─── AUDIO EVENTS ─────────────────────────────────────────
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressThumb').style.left = pct + '%';
  document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  document.getElementById('totalTime').textContent = formatTime(audio.duration);

  // Store duration in song object
  if (currentIndex >= 0 && songs[currentIndex]) {
    songs[currentIndex].duration = formatTime(audio.duration);
    renderSongList();
  }
});

audio.addEventListener('ended', () => {
  if (!isRepeat) {
    nextSong();
  }
});

audio.addEventListener('play', () => {
  isPlaying = true;
  updatePlayBtn();
  renderSongList();
});

audio.addEventListener('pause', () => {
  isPlaying = false;
  updatePlayBtn();
  renderSongList();
});

// ─── NAV ITEMS ────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});
document.addEventListener('keydown', e => {
  // Don't trigger on input elements
  if (e.target.tagName === 'INPUT') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      nextSong();
      break;
    case 'ArrowLeft':
      prevSong();
      break;
    case 'ArrowUp':
      audio.volume = Math.min(1, audio.volume + 0.1);
      document.getElementById('volumeFill').style.width = (audio.volume * 100) + '%';
      break;
    case 'ArrowDown':
      audio.volume = Math.max(0, audio.volume - 0.1);
      document.getElementById('volumeFill').style.width = (audio.volume * 100) + '%';
      break;
  }
});