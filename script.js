/* ══════════════════════════════════════════════════
   CloudWave — Personal Cloud Music Player
   script.js — Main application logic
   Firebase: Auth, Firestore, Storage
══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   🔧 FIREBASE CONFIGURATION
   Replace these values with your own Firebase
   project credentials from:
   https://console.firebase.google.com/
   → Project Settings → Your apps → Firebase SDK snippet
──────────────────────────────────────────────── */
const firebaseConfig = {
    apiKey: "AIzaSyD_bRezrII8qzV1vOX-6aXp59ycIE6dG30",
    authDomain: "cloud-wave-e63c9.firebaseapp.com",
    projectId: "cloud-wave-e63c9",
    storageBucket: "cloud-wave-e63c9.firebasestorage.app",
    messagingSenderId: "332754977599",
    appId: "1:332754977599:web:de9408c0ac276301efc98a"
  };

/* ─── Init Firebase ─── */
firebase.initializeApp(firebaseConfig);
const auth     = firebase.auth();
const db       = firebase.firestore();
const storage  = firebase.storage();

/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */
let currentUser      = null;   // Firebase User object (null = guest)
let allSongs         = [];     // Full library from Firestore
let favoriteSongIds  = new Set();
let currentPlaylist  = null;   // { id, name, songIds[] }

// Playback state
let playQueue        = [];     // Songs currently in queue
let playIndex        = -1;     // Index into playQueue
let isShuffle        = false;
let repeatMode       = 'none'; // 'none' | 'one' | 'all'
let isSeeking        = false;

// Upload state
let uploadItems      = [];     // Array of upload item objects

/* ══════════════════════════════════════════════════
   DOM CACHE
══════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// Screens
const loadingScreen     = $('loading-screen');
const authOverlay       = $('auth-overlay');
const appEl             = $('app');
const player            = $('player');

// Auth
const loginEmailEl      = $('login-email');
const loginPassEl       = $('login-password');
const loginBtn          = $('login-btn');
const regEmailEl        = $('reg-email');
const regPassEl         = $('reg-password');
const regConfirmEl      = $('reg-confirm');
const registerBtn       = $('register-btn');
const guestBtn          = $('guest-btn');
const logoutBtn         = $('logout-btn');
const authError         = $('auth-error');
const signInTopbarBtn   = $('sign-in-topbar-btn');

// Sidebar / Nav
const sidebarEl         = $('sidebar');
const sidebarOverlay    = $('sidebar-overlay');
const menuBtn           = $('menu-btn');
const sidebarCloseBtn   = $('sidebar-close-btn');
const userEmailDisplay  = $('user-email-display');

// Search / Sort
const searchInput       = $('search-input');
const searchClear       = $('search-clear');
const sortSelect        = $('sort-select');

// Sections
const libraryGrid       = $('library-grid');
const libraryEmpty      = $('library-empty');
const songCountEl       = $('song-count');

const favoritesGrid     = $('favorites-grid');
const favoritesEmpty    = $('favorites-empty');

const playlistsGrid     = $('playlists-grid');
const playlistsEmpty    = $('playlists-empty');
const createPlaylistBtn = $('create-playlist-btn');
const playlistDetail    = $('playlist-detail');
const playlistBackBtn   = $('playlist-back-btn');
const playlistDetailName= $('playlist-detail-name');
const playlistDetailCnt = $('playlist-detail-count');
const playlistSongsGrid = $('playlist-songs-grid');

const recentGrid        = $('recent-grid');
const recentEmpty       = $('recent-empty');
const clearRecentBtn    = $('clear-recent-btn');

const uploadDropZone    = $('upload-drop-zone');
const uploadPickBtn     = $('upload-pick-btn');
const uploadFileInput   = $('upload-file-input');
const uploadQueueEl     = $('upload-queue');

// Player controls
const audioEl           = $('audio-player');
const playBtn           = $('play-btn');
const prevBtn           = $('prev-btn');
const nextBtn           = $('next-btn');
const shuffleBtn        = $('shuffle-btn');
const repeatBtn         = $('repeat-btn');
const muteBtn           = $('mute-btn');
const volumeSlider      = $('volume-slider');
const progressFill      = $('player-progress-fill');
const progressHandle    = $('player-progress-handle');
const progressWrap      = $('player-progress-wrap');
const currentTimeEl     = $('current-time');
const durationEl        = $('duration');
const playerTitle       = $('player-title');
const playerArtist      = $('player-artist');
const playerCoverImg    = $('player-cover-img');
const playerFavBtn      = $('player-fav-btn');

// Modals
const editModal         = $('edit-modal');
const editTitle         = $('edit-title');
const editArtist        = $('edit-artist');
const editAlbum         = $('edit-album');
const editSongId        = $('edit-song-id');
const editSaveBtn       = $('edit-save-btn');
const editCancelBtn     = $('edit-cancel-btn');
const editModalClose    = $('edit-modal-close');
const editCoverImg      = $('edit-cover-img');
const editCoverBtn      = $('edit-cover-btn');
const editCoverInput    = $('edit-cover-input');

const playlistModal     = $('playlist-modal');
const playlistNameInput = $('playlist-name-input');
const playlistCreateBtn = $('playlist-create-btn');
const playlistCancelBtn = $('playlist-cancel-btn');
const playlistModalClose= $('playlist-modal-close');

const addToPlaylistModal = $('add-to-playlist-modal');
const addPlaylistList    = $('add-playlist-list');
const addPlaylistSongId  = $('add-to-playlist-song-id');
const addPlaylistClose   = $('add-playlist-modal-close');
const noPlaylistsHint    = $('no-playlists-hint');

const deleteModal        = $('delete-modal');
const deleteSongName     = $('delete-song-name');
const deleteConfirmBtn   = $('delete-confirm-btn');
const deleteCancelBtn    = $('delete-cancel-btn');
const deleteModalClose   = $('delete-modal-close');

/* ══════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════ */

/** Format seconds → m:ss */
function formatTime(s) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Format bytes → human-readable */
function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/** Show a toast notification */
function showToast(message, type = 'info') {
  const container = $('toast-container');
  const icons = {
    success: 'check-circle',
    error:   'x-circle',
    info:    'info',
    warning: 'alert-triangle'
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  lucide.createIcons({ nodes: [toast] });

  // Auto-remove after 3.5s
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 320);
  }, 3500);
}

/** Sanitize a string for display */
function esc(str) {
  if (!str) return '';
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Generate a short unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Hide loading screen with fade */
function hideLoading() {
  loadingScreen.classList.add('fade-out');
  setTimeout(() => loadingScreen.classList.add('hidden'), 500);
}

/* ══════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════ */

/** Show the app (hide auth overlay) */
function showApp() {
  authOverlay.classList.add('hidden');
  appEl.classList.remove('hidden');
  lucide.createIcons();
}

/** Show auth overlay */
function showAuth() {
  authOverlay.classList.remove('hidden');
  appEl.classList.add('hidden');
}

/** Update UI based on auth state */
function applyAuthState(user) {
  currentUser = user;

  // Show/hide auth-only elements
  $$('.auth-only').forEach(el => {
    if (user) el.classList.remove('hidden');
    else       el.classList.add('hidden');
  });

  // User info in sidebar
  if (user) {
    userEmailDisplay.textContent = user.email;
    signInTopbarBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
  } else {
    userEmailDisplay.textContent = 'Guest';
    signInTopbarBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
  }

  // Refresh favorites then re-render library
  if (user) {
    loadFavorites().then(() => renderLibrary());
  } else {
    favoriteSongIds.clear();
    renderLibrary();
  }

  renderFavorites();
  renderRecent();
}

// Tab switching
$$('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    $$('.auth-form').forEach(f => f.classList.remove('active'));
    $(`${target}-form`).classList.add('active');
    authError.classList.add('hidden');
  });
});

/** Display auth error */
function setAuthError(msg) {
  authError.textContent = msg;
  authError.classList.remove('hidden');
}

// Login
loginBtn.addEventListener('click', async () => {
  const email = loginEmailEl.value.trim();
  const pass  = loginPassEl.value;
  if (!email || !pass) return setAuthError('Please fill in all fields.');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    // onAuthStateChanged will handle the rest
  } catch (e) {
    setAuthError(friendlyAuthError(e.code));
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});

// Register
registerBtn.addEventListener('click', async () => {
  const email   = regEmailEl.value.trim();
  const pass    = regPassEl.value;
  const confirm = regConfirmEl.value;
  if (!email || !pass || !confirm) return setAuthError('Please fill in all fields.');
  if (pass !== confirm) return setAuthError('Passwords do not match.');
  if (pass.length < 6) return setAuthError('Password must be at least 6 characters.');
  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating account…';
  try {
    await auth.createUserWithEmailAndPassword(email, pass);
  } catch (e) {
    setAuthError(friendlyAuthError(e.code));
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create Account';
  }
});

// Guest
guestBtn.addEventListener('click', () => {
  showApp();
  applyAuthState(null);
  loadLibrary();
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await auth.signOut();
  showAuth();
  applyAuthState(null);
});

// Sign-in from topbar (guests)
signInTopbarBtn.addEventListener('click', () => {
  showAuth();
});

function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found':    'No account with that email.',
    'auth/wrong-password':    'Incorrect password.',
    'auth/email-already-in-use': 'Email already registered.',
    'auth/invalid-email':     'Invalid email address.',
    'auth/too-many-requests': 'Too many attempts. Try later.',
    'auth/weak-password':     'Password is too weak.',
    'auth/network-request-failed': 'Network error. Check connection.',
  };
  return map[code] || 'Authentication error. Please try again.';
}

/* ══════════════════════════════════════════════════
   SIDEBAR / NAVIGATION
══════════════════════════════════════════════════ */

function openSidebar() {
  sidebarEl.classList.add('open');
  sidebarOverlay.classList.add('visible');
}
function closeSidebar() {
  sidebarEl.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
}

menuBtn.addEventListener('click', openSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Navigation
$$('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const section = item.dataset.section;
    navigateTo(section);
    closeSidebar();
  });
});

function navigateTo(section) {
  // Hide all sections
  $$('.content-section').forEach(s => s.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target section
  const sectionEl = $(`section-${section}`);
  if (sectionEl) sectionEl.classList.add('active');

  const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');

  // Reset playlist detail
  if (section !== 'playlists') {
    playlistDetail.classList.add('hidden');
    playlistsGrid.classList.remove('hidden');
  }

  // Refresh section data
  if (section === 'favorites')  renderFavorites();
  if (section === 'playlists')  renderPlaylists();
  if (section === 'recent')     renderRecent();
  if (section === 'library')    renderLibrary();
}

/* ══════════════════════════════════════════════════
   LIBRARY — FIRESTORE LOAD
══════════════════════════════════════════════════ */

let unsubscribeSongs = null;

function loadLibrary() {
  // Real-time listener on songs collection
  if (unsubscribeSongs) unsubscribeSongs();

  unsubscribeSongs = db.collection('songs')
    .orderBy('uploadDate', 'desc')
    .onSnapshot(snapshot => {
      allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderLibrary();
      renderFavorites();
      renderRecent();
    }, err => {
      console.error('Library load error:', err);
      showToast('Failed to load library', 'error');
    });
}

/* ══════════════════════════════════════════════════
   RENDER — LIBRARY
══════════════════════════════════════════════════ */

function getSortedFilteredSongs(songs) {
  const q    = searchInput.value.trim().toLowerCase();
  const sort = sortSelect.value;

  let filtered = q
    ? songs.filter(s =>
        (s.title  || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.album  || '').toLowerCase().includes(q))
    : [...songs];

  if (sort === 'newest') filtered.sort((a, b) => (b.uploadDate?.seconds || 0) - (a.uploadDate?.seconds || 0));
  else if (sort === 'oldest') filtered.sort((a, b) => (a.uploadDate?.seconds || 0) - (b.uploadDate?.seconds || 0));
  else if (sort === 'az') filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  return filtered;
}

function renderLibrary() {
  const songs = getSortedFilteredSongs(allSongs);
  songCountEl.textContent = `${allSongs.length} song${allSongs.length !== 1 ? 's' : ''}`;

  libraryGrid.innerHTML = '';
  if (songs.length === 0) {
    libraryEmpty.classList.remove('hidden');
  } else {
    libraryEmpty.classList.add('hidden');
    songs.forEach((song, i) => {
      libraryGrid.appendChild(createSongCard(song, songs, i));
    });
  }
  lucide.createIcons({ nodes: [libraryGrid] });
}

function renderFavorites() {
  const favSongs = allSongs.filter(s => favoriteSongIds.has(s.id));
  favoritesGrid.innerHTML = '';
  if (favSongs.length === 0) {
    favoritesEmpty.classList.remove('hidden');
  } else {
    favoritesEmpty.classList.add('hidden');
    favSongs.forEach((song, i) => {
      favoritesGrid.appendChild(createSongCard(song, favSongs, i));
    });
  }
  lucide.createIcons({ nodes: [favoritesGrid] });
}

/* ──────────────────────────────────────────────
   SONG CARD BUILDER
──────────────────────────────────────────────── */
function createSongCard(song, queue, indexInQueue) {
  const isPlaying = playQueue.length > 0 && playIndex >= 0 && playQueue[playIndex]?.id === song.id;
  const isFav     = favoriteSongIds.has(song.id);
  const card      = document.createElement('div');
  card.className  = `song-card${isPlaying ? ' playing' : ''}`;
  card.dataset.id = song.id;

  card.innerHTML = `
    <div class="song-card-cover">
      ${song.coverUrl
        ? `<img src="${esc(song.coverUrl)}" alt="${esc(song.title)}" class="loaded" />`
        : ''}
      <div class="song-card-cover-placeholder"><i data-lucide="music-2"></i></div>
      <div class="song-card-play-overlay">
        <button class="song-card-play-btn" title="${isPlaying ? 'Pause' : 'Play'}">
          <i data-lucide="${isPlaying ? 'pause' : 'play'}"></i>
        </button>
      </div>
      <span class="playing-indicator">▶ NOW PLAYING</span>
    </div>
    <div class="song-card-info">
      <div class="song-card-title" title="${esc(song.title)}">${esc(song.title) || 'Untitled'}</div>
      <div class="song-card-artist">${esc(song.artist) || 'Unknown Artist'}</div>
      <div class="song-card-actions">
        <button class="song-card-action-btn fav-btn${isFav ? ' fav-active' : ''}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
          <i data-lucide="heart"></i>
        </button>
        <button class="song-card-action-btn dl-btn" title="Download">
          <i data-lucide="download"></i>
        </button>
        <button class="song-card-action-btn add-pl-btn" title="Add to playlist">
          <i data-lucide="list-plus"></i>
        </button>
        ${currentUser ? `
          <button class="song-card-action-btn edit-btn" title="Edit">
            <i data-lucide="pencil"></i>
          </button>
          <button class="song-card-action-btn del-btn" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `;

  // Play on click (card body or play button)
  const playOverlay = card.querySelector('.song-card-play-overlay');
  playOverlay.addEventListener('click', e => {
    e.stopPropagation();
    if (isPlaying) {
      togglePlayPause();
    } else {
      playSongFromQueue(queue, indexInQueue);
    }
  });

  // Favorite
  card.querySelector('.fav-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleFavorite(song.id);
  });

  // Download
  card.querySelector('.dl-btn').addEventListener('click', e => {
    e.stopPropagation();
    downloadSong(song);
  });

  // Add to Playlist
  card.querySelector('.add-pl-btn').addEventListener('click', e => {
    e.stopPropagation();
    if (!currentUser) { showToast('Sign in to add to playlists', 'info'); return; }
    openAddToPlaylistModal(song.id);
  });

  // Edit (auth only)
  if (currentUser) {
    card.querySelector('.edit-btn').addEventListener('click', e => {
      e.stopPropagation();
      openEditModal(song);
    });
    card.querySelector('.del-btn').addEventListener('click', e => {
      e.stopPropagation();
      openDeleteModal(song);
    });
  }

  return card;
}

/* ══════════════════════════════════════════════════
   SEARCH & SORT
══════════════════════════════════════════════════ */
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  searchClear.classList.toggle('hidden', !q);
  renderLibrary();
});
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.add('hidden');
  renderLibrary();
  searchInput.focus();
});
sortSelect.addEventListener('change', renderLibrary);

/* ══════════════════════════════════════════════════
   FAVORITES
══════════════════════════════════════════════════ */

async function loadFavorites() {
  if (!currentUser) { favoriteSongIds.clear(); return; }
  try {
    const snap = await db.collection('favorites')
      .where('userId', '==', currentUser.uid)
      .get();
    favoriteSongIds.clear();
    snap.forEach(doc => favoriteSongIds.add(doc.data().songId));
  } catch (e) {
    console.error('Load favorites error:', e);
  }
}

async function toggleFavorite(songId) {
  if (!currentUser) { showToast('Sign in to save favorites', 'info'); return; }

  const isFav = favoriteSongIds.has(songId);
  const docId = `${currentUser.uid}_${songId}`;

  try {
    if (isFav) {
      await db.collection('favorites').doc(docId).delete();
      favoriteSongIds.delete(songId);
      showToast('Removed from favorites', 'info');
    } else {
      await db.collection('favorites').doc(docId).set({
        userId:    currentUser.uid,
        songId:    songId,
        addedAt:   firebase.firestore.FieldValue.serverTimestamp()
      });
      favoriteSongIds.add(songId);
      showToast('Added to favorites', 'success');
    }
    // Re-render all grids
    renderLibrary();
    renderFavorites();
    updatePlayerFavBtn();
  } catch (e) {
    console.error('Toggle favorite error:', e);
    showToast('Could not update favorites', 'error');
  }
}

function updatePlayerFavBtn() {
  if (playIndex < 0 || !playQueue[playIndex]) return;
  const isFav = favoriteSongIds.has(playQueue[playIndex].id);
  playerFavBtn.classList.toggle('fav-active', isFav);
  playerFavBtn.querySelector('svg')?.setAttribute('fill', isFav ? 'currentColor' : 'none');
}

playerFavBtn.addEventListener('click', () => {
  if (playIndex < 0 || !playQueue[playIndex]) return;
  toggleFavorite(playQueue[playIndex].id);
});

/* ══════════════════════════════════════════════════
   RECENTLY PLAYED
══════════════════════════════════════════════════ */

async function addToRecent(song) {
  if (!currentUser) return;
  const docId = `${currentUser.uid}_${song.id}`;
  try {
    await db.collection('recentlyPlayed').doc(docId).set({
      userId:   currentUser.uid,
      songId:   song.id,
      playedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('Recent error:', e);
  }
}

async function renderRecent() {
  recentGrid.innerHTML = '';
  if (!currentUser) {
    recentEmpty.classList.remove('hidden');
    return;
  }
  try {
    const snap = await db.collection('recentlyPlayed')
      .where('userId', '==', currentUser.uid)
      .orderBy('playedAt', 'desc')
      .limit(30)
      .get();

    const recentSongIds = snap.docs.map(d => d.data().songId);
    const recentSongs   = recentSongIds.map(id => allSongs.find(s => s.id === id)).filter(Boolean);

    if (recentSongs.length === 0) {
      recentEmpty.classList.remove('hidden');
    } else {
      recentEmpty.classList.add('hidden');
      recentSongs.forEach((song, i) => {
        recentGrid.appendChild(createSongCard(song, recentSongs, i));
      });
      lucide.createIcons({ nodes: [recentGrid] });
    }
  } catch (e) {
    console.error('Render recent error:', e);
  }
}

clearRecentBtn.addEventListener('click', async () => {
  if (!currentUser) return;
  try {
    const snap = await db.collection('recentlyPlayed')
      .where('userId', '==', currentUser.uid)
      .get();
    const batch = db.batch();
    snap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    recentGrid.innerHTML = '';
    recentEmpty.classList.remove('hidden');
    showToast('History cleared', 'success');
  } catch (e) {
    showToast('Could not clear history', 'error');
  }
});

/* ══════════════════════════════════════════════════
   PLAYLISTS
══════════════════════════════════════════════════ */

let allPlaylists = [];

async function loadAndRenderPlaylists() {
  if (!currentUser) return;
  try {
    const snap = await db.collection('playlists')
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .get();
    allPlaylists = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPlaylists();
  } catch (e) {
    console.error('Load playlists error:', e);
  }
}

function renderPlaylists() {
  playlistsGrid.innerHTML = '';

  if (!currentUser) {
    playlistsEmpty.classList.remove('hidden');
    return;
  }

  if (allPlaylists.length === 0) {
    playlistsEmpty.classList.remove('hidden');
  } else {
    playlistsEmpty.classList.add('hidden');
    allPlaylists.forEach(pl => {
      playlistsGrid.appendChild(createPlaylistCard(pl));
    });
    lucide.createIcons({ nodes: [playlistsGrid] });
  }
}

function createPlaylistCard(pl) {
  const card = document.createElement('div');
  card.className = 'playlist-card';
  card.innerHTML = `
    <div class="playlist-card-icon"><i data-lucide="list-music"></i></div>
    <div class="playlist-card-name" title="${esc(pl.name)}">${esc(pl.name)}</div>
    <div class="playlist-card-count">${(pl.songIds || []).length} songs</div>
    <div class="playlist-card-actions">
      <button class="playlist-card-del-btn" title="Delete playlist">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `;
  // Open playlist
  card.addEventListener('click', e => {
    if (!e.target.closest('.playlist-card-del-btn')) {
      openPlaylistDetail(pl);
    }
  });
  // Delete
  card.querySelector('.playlist-card-del-btn').addEventListener('click', async e => {
    e.stopPropagation();
    if (!confirm(`Delete playlist "${pl.name}"?`)) return;
    try {
      await db.collection('playlists').doc(pl.id).delete();
      showToast('Playlist deleted', 'success');
      loadAndRenderPlaylists();
    } catch (err) {
      showToast('Could not delete playlist', 'error');
    }
  });
  return card;
}

// Create Playlist
createPlaylistBtn.addEventListener('click', () => {
  playlistNameInput.value = '';
  playlistModal.classList.remove('hidden');
  setTimeout(() => playlistNameInput.focus(), 100);
});
playlistCancelBtn.addEventListener('click', () => playlistModal.classList.add('hidden'));
playlistModalClose.addEventListener('click', () => playlistModal.classList.add('hidden'));
playlistModal.addEventListener('click', e => { if (e.target === playlistModal) playlistModal.classList.add('hidden'); });

playlistCreateBtn.addEventListener('click', async () => {
  const name = playlistNameInput.value.trim();
  if (!name) { showToast('Please enter a playlist name', 'warning'); return; }
  if (!currentUser) return;
  playlistCreateBtn.disabled = true;
  try {
    await db.collection('playlists').add({
      userId:    currentUser.uid,
      name:      name,
      songIds:   [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    playlistModal.classList.add('hidden');
    showToast(`Playlist "${name}" created`, 'success');
    loadAndRenderPlaylists();
  } catch (e) {
    showToast('Could not create playlist', 'error');
  }
  playlistCreateBtn.disabled = false;
});

// Playlist Detail
function openPlaylistDetail(pl) {
  currentPlaylist = pl;
  playlistDetail.classList.remove('hidden');
  playlistsGrid.classList.add('hidden');
  playlistsEmpty.classList.add('hidden');
  playlistDetailName.textContent = pl.name;
  renderPlaylistDetail(pl);
}

function renderPlaylistDetail(pl) {
  const songs = (pl.songIds || []).map(id => allSongs.find(s => s.id === id)).filter(Boolean);
  playlistDetailCnt.textContent = `${songs.length} song${songs.length !== 1 ? 's' : ''}`;
  playlistSongsGrid.innerHTML = '';

  if (songs.length === 0) {
    playlistSongsGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon"><i data-lucide="list-music"></i></div>
        <h3>No songs in this playlist</h3>
        <p>Add songs from the library using the <i data-lucide="list-plus"></i> button</p>
      </div>`;
    lucide.createIcons({ nodes: [playlistSongsGrid] });
    return;
  }

  songs.forEach((song, i) => {
    const card = createSongCard(song, songs, i);
    // Add remove-from-playlist button
    const actions = card.querySelector('.song-card-actions');
    const removeBtn = document.createElement('button');
    removeBtn.className = 'song-card-action-btn';
    removeBtn.title = 'Remove from playlist';
    removeBtn.innerHTML = '<i data-lucide="list-minus"></i>';
    removeBtn.addEventListener('click', async e => {
      e.stopPropagation();
      await removeFromPlaylist(pl.id, song.id);
    });
    actions.appendChild(removeBtn);
    playlistSongsGrid.appendChild(card);
  });
  lucide.createIcons({ nodes: [playlistSongsGrid] });
}

playlistBackBtn.addEventListener('click', () => {
  playlistDetail.classList.add('hidden');
  playlistsGrid.classList.remove('hidden');
  renderPlaylists();
  currentPlaylist = null;
});

// Add to Playlist Modal
function openAddToPlaylistModal(songId) {
  addPlaylistSongId.value = songId;
  addPlaylistList.innerHTML = '';

  if (allPlaylists.length === 0) {
    noPlaylistsHint.classList.remove('hidden');
  } else {
    noPlaylistsHint.classList.add('hidden');
    allPlaylists.forEach(pl => {
      const item = document.createElement('div');
      item.className = 'playlist-picker-item';
      item.innerHTML = `
        <span class="playlist-picker-item-name">${esc(pl.name)}</span>
        <span class="playlist-picker-item-count">${(pl.songIds || []).length} songs</span>
      `;
      item.addEventListener('click', () => addToPlaylist(pl.id, songId));
      addPlaylistList.appendChild(item);
    });
  }
  addToPlaylistModal.classList.remove('hidden');
}

addPlaylistClose.addEventListener('click', () => addToPlaylistModal.classList.add('hidden'));
addToPlaylistModal.addEventListener('click', e => { if (e.target === addToPlaylistModal) addToPlaylistModal.classList.add('hidden'); });

async function addToPlaylist(playlistId, songId) {
  try {
    const ref  = db.collection('playlists').doc(playlistId);
    const snap = await ref.get();
    const existing = snap.data()?.songIds || [];
    if (existing.includes(songId)) {
      showToast('Song already in playlist', 'info');
      addToPlaylistModal.classList.add('hidden');
      return;
    }
    await ref.update({ songIds: firebase.firestore.FieldValue.arrayUnion(songId) });
    showToast('Added to playlist', 'success');
    addToPlaylistModal.classList.add('hidden');
    loadAndRenderPlaylists();
    if (currentPlaylist?.id === playlistId) {
      currentPlaylist.songIds = [...existing, songId];
      renderPlaylistDetail(currentPlaylist);
    }
  } catch (e) {
    showToast('Could not add to playlist', 'error');
  }
}

async function removeFromPlaylist(playlistId, songId) {
  try {
    await db.collection('playlists').doc(playlistId).update({
      songIds: firebase.firestore.FieldValue.arrayRemove(songId)
    });
    showToast('Removed from playlist', 'success');
    await loadAndRenderPlaylists();
    if (currentPlaylist?.id === playlistId) {
      currentPlaylist.songIds = currentPlaylist.songIds.filter(id => id !== songId);
      renderPlaylistDetail(currentPlaylist);
    }
  } catch (e) {
    showToast('Could not remove from playlist', 'error');
  }
}

/* ══════════════════════════════════════════════════
   UPLOAD PANEL
══════════════════════════════════════════════════ */

// Drag & Drop
uploadDropZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadDropZone.classList.add('drag-over');
});
uploadDropZone.addEventListener('dragleave', () => uploadDropZone.classList.remove('drag-over'));
uploadDropZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadDropZone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'audio/mpeg' || f.name.endsWith('.mp3'));
  if (files.length) addFilesToQueue(files);
  else showToast('Please drop MP3 files only', 'warning');
});

uploadPickBtn.addEventListener('click', () => uploadFileInput.click());
uploadDropZone.addEventListener('click', e => {
  if (!e.target.closest('button')) uploadFileInput.click();
});

uploadFileInput.addEventListener('change', () => {
  const files = Array.from(uploadFileInput.files);
  if (files.length) addFilesToQueue(files);
  uploadFileInput.value = ''; // Reset so same file can be re-selected
});

function addFilesToQueue(files) {
  uploadQueueEl.classList.remove('hidden');
  files.forEach(file => {
    const itemId = uid();
    const item = {
      id:        itemId,
      file:      file,
      coverFile: null,
      coverPreview: null,
    };
    uploadItems.push(item);
    uploadQueueEl.appendChild(createUploadItemEl(item));
  });
  lucide.createIcons({ nodes: [uploadQueueEl] });
}

function createUploadItemEl(item) {
  const el = document.createElement('div');
  el.className = 'upload-item';
  el.id = `upload-item-${item.id}`;

  // Derive a default title from filename
  const defaultTitle = item.file.name.replace(/\.mp3$/i, '').replace(/[-_]/g, ' ');

  el.innerHTML = `
    <div class="upload-item-header">
      <div class="upload-item-cover" id="cover-wrap-${item.id}">
        <i data-lucide="image"></i>
        <div class="upload-item-cover-btn"><i data-lucide="camera"></i></div>
        <input type="file" accept="image/*" hidden class="cover-file-input" />
      </div>
      <div class="upload-item-meta">
        <div class="upload-item-filename">${esc(item.file.name)} · ${formatBytes(item.file.size)}</div>
      </div>
    </div>
    <div class="upload-item-fields">
      <div class="form-group">
        <label>Title *</label>
        <input type="text" class="field-title" value="${esc(defaultTitle)}" placeholder="Song title" />
      </div>
      <div class="form-group">
        <label>Artist</label>
        <input type="text" class="field-artist" placeholder="Artist name" />
      </div>
      <div class="form-group" style="grid-column:unset">
        <label>Album</label>
        <input type="text" class="field-album" placeholder="Album name" />
      </div>
    </div>
    <div class="upload-item-progress hidden" id="progress-wrap-${item.id}">
      <div class="progress-bar"><div class="progress-fill" id="progress-fill-${item.id}"></div></div>
      <span class="progress-label" id="progress-label-${item.id}">Uploading…</span>
    </div>
    <div class="upload-item-footer">
      <button class="upload-item-remove">Remove</button>
      <button class="btn-primary upload-item-submit">Upload</button>
    </div>
  `;

  // Cover selection
  const coverWrap  = el.querySelector(`#cover-wrap-${item.id}`);
  const coverInput = el.querySelector('.cover-file-input');
  coverWrap.addEventListener('click', () => coverInput.click());
  coverInput.addEventListener('change', () => {
    const file = coverInput.files[0];
    if (!file) return;
    item.coverFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      item.coverPreview = e.target.result;
      coverWrap.innerHTML = `
        <img src="${e.target.result}" alt="cover" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" />
        <div class="upload-item-cover-btn"><i data-lucide="camera"></i></div>
        <input type="file" accept="image/*" hidden class="cover-file-input" />
      `;
      // Re-attach listener
      const newInput = coverWrap.querySelector('.cover-file-input');
      coverWrap.addEventListener('click', () => newInput.click());
      newInput.addEventListener('change', () => {
        const f2 = newInput.files[0]; if (!f2) return;
        item.coverFile = f2;
        lucide.createIcons({ nodes: [coverWrap] });
      });
      lucide.createIcons({ nodes: [coverWrap] });
    };
    reader.readAsDataURL(file);
  });

  // Remove item
  el.querySelector('.upload-item-remove').addEventListener('click', () => {
    uploadItems = uploadItems.filter(i => i.id !== item.id);
    el.remove();
    if (uploadItems.length === 0) uploadQueueEl.classList.add('hidden');
  });

  // Upload
  el.querySelector('.upload-item-submit').addEventListener('click', () => {
    const title  = el.querySelector('.field-title').value.trim();
    const artist = el.querySelector('.field-artist').value.trim();
    const album  = el.querySelector('.field-album').value.trim();
    if (!title) { showToast('Title is required', 'warning'); return; }
    uploadSong(item, { title, artist, album }, el);
  });

  return el;
}

async function uploadSong(item, meta, el) {
  if (!currentUser) { showToast('You must be signed in to upload', 'error'); return; }

  const submitBtn   = el.querySelector('.upload-item-submit');
  const removeBtn   = el.querySelector('.upload-item-remove');
  const progressWrap= el.querySelector(`#progress-wrap-${item.id}`);
  const progressFill= el.querySelector(`#progress-fill-${item.id}`);
  const progressLbl = el.querySelector(`#progress-label-${item.id}`);

  submitBtn.disabled  = true;
  removeBtn.disabled  = true;
  progressWrap.classList.remove('hidden');

  try {
    // ── 1. Upload audio file ──
    const audioPath = `music/${currentUser.uid}/${Date.now()}_${item.file.name}`;
    const audioRef  = storage.ref(audioPath);
    const audioTask = audioRef.put(item.file);

    await new Promise((resolve, reject) => {
      audioTask.on('state_changed',
        snap => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 80);
          progressFill.style.width = pct + '%';
          progressLbl.textContent  = `Uploading audio… ${pct}%`;
        },
        reject,
        resolve
      );
    });

    const audioUrl = await audioRef.getDownloadURL();
    progressFill.style.width = '85%';

    // ── 2. Upload cover image (if provided) ──
    let coverUrl = '';
    if (item.coverFile) {
      progressLbl.textContent = 'Uploading cover…';
      const coverPath = `covers/${currentUser.uid}/${Date.now()}_${item.coverFile.name}`;
      const coverRef  = storage.ref(coverPath);
      await coverRef.put(item.coverFile);
      coverUrl = await coverRef.getDownloadURL();
    }

    progressFill.style.width = '95%';
    progressLbl.textContent  = 'Saving metadata…';

    // ── 3. Save metadata to Firestore ──
    await db.collection('songs').add({
      title:      meta.title,
      artist:     meta.artist,
      album:      meta.album,
      audioUrl:   audioUrl,
      coverUrl:   coverUrl,
      storagePath: audioPath,
      uploadedBy: currentUser.uid,
      uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
      fileSize:   item.file.size,
    });

    progressFill.style.width = '100%';
    progressWrap.innerHTML   = `
      <div class="upload-status success">
        <i data-lucide="check-circle"></i> Uploaded successfully
      </div>`;
    lucide.createIcons({ nodes: [progressWrap] });
    showToast(`"${meta.title}" uploaded!`, 'success');

    // Auto-remove from queue after 2s
    setTimeout(() => {
      el.remove();
      uploadItems = uploadItems.filter(i => i.id !== item.id);
      if (uploadItems.length === 0) uploadQueueEl.classList.add('hidden');
    }, 2000);

  } catch (e) {
    console.error('Upload error:', e);
    progressWrap.innerHTML = `
      <div class="upload-status error">
        <i data-lucide="x-circle"></i> Upload failed: ${esc(e.message)}
      </div>`;
    lucide.createIcons({ nodes: [progressWrap] });
    submitBtn.disabled = false;
    removeBtn.disabled = false;
    showToast('Upload failed', 'error');
  }
}

/* ══════════════════════════════════════════════════
   EDIT SONG
══════════════════════════════════════════════════ */

let editNewCoverFile = null;

function openEditModal(song) {
  editSongId.value   = song.id;
  editTitle.value    = song.title  || '';
  editArtist.value   = song.artist || '';
  editAlbum.value    = song.album  || '';
  editCoverImg.src   = song.coverUrl || '';
  editNewCoverFile   = null;
  editModal.classList.remove('hidden');
  setTimeout(() => editTitle.focus(), 100);
}

editModalClose.addEventListener('click', () => editModal.classList.add('hidden'));
editCancelBtn.addEventListener('click', () => editModal.classList.add('hidden'));
editModal.addEventListener('click', e => { if (e.target === editModal) editModal.classList.add('hidden'); });

editCoverBtn.addEventListener('click', () => editCoverInput.click());
editCoverInput.addEventListener('change', () => {
  const file = editCoverInput.files[0];
  if (!file) return;
  editNewCoverFile = file;
  const reader = new FileReader();
  reader.onload = e => { editCoverImg.src = e.target.result; };
  reader.readAsDataURL(file);
});

editSaveBtn.addEventListener('click', async () => {
  const id     = editSongId.value;
  const title  = editTitle.value.trim();
  const artist = editArtist.value.trim();
  const album  = editAlbum.value.trim();

  if (!title) { showToast('Title is required', 'warning'); return; }
  if (!currentUser) return;

  editSaveBtn.disabled = true;
  editSaveBtn.textContent = 'Saving…';

  try {
    const updates = { title, artist, album };

    // Upload new cover if changed
    if (editNewCoverFile) {
      const coverPath = `covers/${currentUser.uid}/${Date.now()}_${editNewCoverFile.name}`;
      const ref       = storage.ref(coverPath);
      await ref.put(editNewCoverFile);
      updates.coverUrl = await ref.getDownloadURL();
    }

    await db.collection('songs').doc(id).update(updates);
    editModal.classList.add('hidden');
    showToast('Song updated', 'success');

    // Update playback display if this song is current
    if (playQueue[playIndex]?.id === id) {
      playerTitle.textContent  = title;
      playerArtist.textContent = artist || '—';
      if (updates.coverUrl) playerCoverImg.src = updates.coverUrl;
    }
  } catch (e) {
    showToast('Could not save changes', 'error');
  }

  editSaveBtn.disabled = false;
  editSaveBtn.textContent = 'Save Changes';
});

/* ══════════════════════════════════════════════════
   DELETE SONG
══════════════════════════════════════════════════ */

let songToDelete = null;

function openDeleteModal(song) {
  songToDelete = song;
  deleteSongName.textContent = song.title || 'this song';
  deleteModal.classList.remove('hidden');
}

deleteModalClose.addEventListener('click', () => deleteModal.classList.add('hidden'));
deleteCancelBtn.addEventListener('click', () => deleteModal.classList.add('hidden'));
deleteModal.addEventListener('click', e => { if (e.target === deleteModal) deleteModal.classList.add('hidden'); });

deleteConfirmBtn.addEventListener('click', async () => {
  if (!songToDelete || !currentUser) return;
  deleteConfirmBtn.disabled = true;
  deleteConfirmBtn.textContent = 'Deleting…';

  try {
    // Delete from Storage (audio)
    if (songToDelete.storagePath) {
      try { await storage.ref(songToDelete.storagePath).delete(); } catch (_) {}
    } else if (songToDelete.audioUrl) {
      // fallback: try to delete by URL reference
      try { await storage.refFromURL(songToDelete.audioUrl).delete(); } catch (_) {}
    }

    // Delete from Firestore
    await db.collection('songs').doc(songToDelete.id).delete();

    // Remove from playlists
    const plSnap = await db.collection('playlists')
      .where('userId', '==', currentUser.uid)
      .get();
    const batch = db.batch();
    plSnap.forEach(doc => {
      const ids = doc.data().songIds || [];
      if (ids.includes(songToDelete.id)) {
        batch.update(doc.ref, { songIds: ids.filter(i => i !== songToDelete.id) });
      }
    });
    await batch.commit();

    // Remove from favorites
    const favRef = db.collection('favorites').doc(`${currentUser.uid}_${songToDelete.id}`);
    await favRef.delete().catch(() => {});

    deleteModal.classList.add('hidden');
    showToast(`"${songToDelete.title}" deleted`, 'success');

    // If deleted song is currently playing, skip
    if (playQueue[playIndex]?.id === songToDelete.id) nextSong();

    songToDelete = null;
  } catch (e) {
    console.error('Delete error:', e);
    showToast('Could not delete song', 'error');
  }

  deleteConfirmBtn.disabled = false;
  deleteConfirmBtn.textContent = 'Delete';
});

/* ══════════════════════════════════════════════════
   DOWNLOAD
══════════════════════════════════════════════════ */

function downloadSong(song) {
  if (!song.audioUrl) { showToast('No file URL available', 'error'); return; }
  const a     = document.createElement('a');
  a.href      = song.audioUrl;
  a.download  = `${song.title || 'song'}.mp3`;
  a.target    = '_blank';
  a.rel       = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Download started', 'info');
}

/* ══════════════════════════════════════════════════
   MUSIC PLAYER
══════════════════════════════════════════════════ */

/** Load and play a song from a given queue at the given index */
function playSongFromQueue(queue, index) {
  playQueue = [...queue];
  playIndex = index;
  loadCurrentSong();
}

function loadCurrentSong() {
  if (playIndex < 0 || playIndex >= playQueue.length) return;
  const song = playQueue[playIndex];
  if (!song || !song.audioUrl) { showToast('No audio URL for this song', 'error'); return; }

  audioEl.src = song.audioUrl;
  audioEl.load();
  audioEl.play().catch(e => console.warn('Autoplay blocked:', e));

  // Update player UI
  playerTitle.textContent  = song.title  || 'Untitled';
  playerArtist.textContent = song.artist || '—';

  if (song.coverUrl) {
    playerCoverImg.src = song.coverUrl;
    playerCoverImg.style.display = 'block';
  } else {
    playerCoverImg.src = '';
    playerCoverImg.style.display = 'none';
  }

  player.classList.remove('hidden');
  updatePlayBtnIcon(true);
  updatePlayerFavBtn();
  updateActiveSongCards();
  addToRecent(song);

  // Update document title
  document.title = `${song.title || 'Unknown'} — CloudWave`;
}

function updatePlayBtnIcon(playing) {
  const icon = playing ? 'pause' : 'play';
  playBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
  lucide.createIcons({ nodes: [playBtn] });
}

function updateActiveSongCards() {
  $$('.song-card').forEach(card => {
    const isCurrent = playQueue[playIndex]?.id === card.dataset.id;
    card.classList.toggle('playing', isCurrent);
    const overlay = card.querySelector('.song-card-play-btn');
    if (overlay) {
      overlay.innerHTML = `<i data-lucide="${isCurrent && !audioEl.paused ? 'pause' : 'play'}"></i>`;
    }
  });
  lucide.createIcons({ nodes: [document.body] });
}

function togglePlayPause() {
  if (audioEl.paused) {
    audioEl.play();
  } else {
    audioEl.pause();
  }
}

function prevSong() {
  if (playQueue.length === 0) return;
  // If more than 3 seconds in, restart current song
  if (audioEl.currentTime > 3) {
    audioEl.currentTime = 0;
    return;
  }
  if (isShuffle) {
    playIndex = randomIndex();
  } else {
    playIndex = (playIndex - 1 + playQueue.length) % playQueue.length;
  }
  loadCurrentSong();
}

function nextSong() {
  if (playQueue.length === 0) return;
  if (repeatMode === 'one') {
    audioEl.currentTime = 0;
    audioEl.play();
    return;
  }
  if (isShuffle) {
    playIndex = randomIndex();
  } else {
    playIndex = (playIndex + 1) % playQueue.length;
  }
  loadCurrentSong();
}

function randomIndex() {
  let idx;
  do { idx = Math.floor(Math.random() * playQueue.length); }
  while (playQueue.length > 1 && idx === playIndex);
  return idx;
}

// Audio event listeners
audioEl.addEventListener('play', () => {
  updatePlayBtnIcon(true);
  updateActiveSongCards();
});
audioEl.addEventListener('pause', () => {
  updatePlayBtnIcon(false);
  updateActiveSongCards();
});
audioEl.addEventListener('ended', () => {
  if (repeatMode === 'one') {
    audioEl.currentTime = 0;
    audioEl.play();
  } else if (repeatMode === 'all' || playIndex < playQueue.length - 1) {
    nextSong();
  } else {
    // Queue ended
    updatePlayBtnIcon(false);
    document.title = 'CloudWave';
  }
});
audioEl.addEventListener('timeupdate', () => {
  if (isSeeking) return;
  if (!audioEl.duration) return;
  const pct = (audioEl.currentTime / audioEl.duration) * 100;
  progressFill.style.width   = pct + '%';
  progressHandle.style.left  = pct + '%';
  currentTimeEl.textContent  = formatTime(audioEl.currentTime);
});
audioEl.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audioEl.duration);
});
audioEl.addEventListener('error', () => {
  showToast('Could not load audio', 'error');
});

// Play / Pause button
playBtn.addEventListener('click', togglePlayPause);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

// Shuffle
shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
  showToast(isShuffle ? 'Shuffle on' : 'Shuffle off', 'info');
});

// Repeat
repeatBtn.addEventListener('click', () => {
  const modes = ['none', 'all', 'one'];
  repeatMode  = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
  repeatBtn.classList.toggle('active', repeatMode !== 'none');
  const icons = { none: 'repeat', all: 'repeat', one: 'repeat-1' };
  repeatBtn.innerHTML = `<i data-lucide="${icons[repeatMode]}"></i>`;
  lucide.createIcons({ nodes: [repeatBtn] });
  const labels = { none: 'Repeat off', all: 'Repeat all', one: 'Repeat one' };
  showToast(labels[repeatMode], 'info');
});

// Mute
muteBtn.addEventListener('click', () => {
  audioEl.muted = !audioEl.muted;
  const icon = audioEl.muted ? 'volume-x' : (audioEl.volume < 0.5 ? 'volume-1' : 'volume-2');
  muteBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
  lucide.createIcons({ nodes: [muteBtn] });
});

// Volume slider
volumeSlider.addEventListener('input', () => {
  audioEl.volume = volumeSlider.value;
  audioEl.muted  = (volumeSlider.value == 0);
  const icon = audioEl.muted || volumeSlider.value == 0 ? 'volume-x'
             : volumeSlider.value < 0.5 ? 'volume-1' : 'volume-2';
  muteBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
  lucide.createIcons({ nodes: [muteBtn] });
});

// Seek bar
progressWrap.addEventListener('click', e => {
  const rect = e.currentTarget.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  if (audioEl.duration) {
    audioEl.currentTime = pct * audioEl.duration;
  }
});

let isSeekingMouse = false;
progressWrap.addEventListener('mousedown', () => { isSeeking = true; isSeekingMouse = true; });
document.addEventListener('mouseup', () => {
  if (isSeekingMouse) { isSeeking = false; isSeekingMouse = false; }
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  // Don't intercept when typing in inputs
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      if (playQueue.length) togglePlayPause();
      break;
    case 'ArrowRight':
      if (audioEl.duration) audioEl.currentTime = Math.min(audioEl.duration, audioEl.currentTime + 5);
      break;
    case 'ArrowLeft':
      audioEl.currentTime = Math.max(0, audioEl.currentTime - 5);
      break;
    case 'ArrowUp':
      e.preventDefault();
      audioEl.volume = Math.min(1, audioEl.volume + 0.1);
      volumeSlider.value = audioEl.volume;
      break;
    case 'ArrowDown':
      e.preventDefault();
      audioEl.volume = Math.max(0, audioEl.volume - 0.1);
      volumeSlider.value = audioEl.volume;
      break;
    case 'KeyM':
      muteBtn.click();
      break;
    case 'KeyN':
      nextSong();
      break;
    case 'KeyP':
      prevSong();
      break;
  }
});

/* ══════════════════════════════════════════════════
   FIREBASE AUTH STATE OBSERVER
══════════════════════════════════════════════════ */
auth.onAuthStateChanged(async user => {
  if (user) {
    // Signed in
    showApp();
    applyAuthState(user);
    loadLibrary();
    await loadFavorites();
    renderLibrary();
    await loadAndRenderPlaylists();
    hideLoading();
  } else {
    // Not signed in — check if we already showed app as guest
    if (!appEl.classList.contains('hidden')) {
      // Stay as guest
      applyAuthState(null);
    }
    hideLoading();
  }
});

/* ══════════════════════════════════════════════════
   INIT — run when DOM is ready
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  // Show loading screen initially (auth observer handles the rest)
  // If Firebase doesn't respond in 5s, show auth screen anyway
  setTimeout(() => {
    if (!loadingScreen.classList.contains('hidden')) {
      hideLoading();
      showAuth();
    }
  }, 5000);

  // Keyboard: Enter to submit auth forms
  loginPassEl.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
  loginEmailEl.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
  regConfirmEl.addEventListener('keydown', e => { if (e.key === 'Enter') registerBtn.click(); });
  playlistNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') playlistCreateBtn.click(); });
  editTitle.addEventListener('keydown', e => { if (e.key === 'Enter') editSaveBtn.click(); });
});

/* ══════════════════════════════════════════════════
   GLOBAL RE-INIT LUCIDE after dynamic renders
══════════════════════════════════════════════════ */
// MutationObserver to re-init icons on DOM changes in grids
const gridObserver = new MutationObserver(() => {
  lucide.createIcons();
});
['library-grid','favorites-grid','playlists-grid','recent-grid','playlist-songs-grid','upload-queue']
  .forEach(id => {
    const el = $(id);
    if (el) gridObserver.observe(el, { childList: true, subtree: false });
  });

