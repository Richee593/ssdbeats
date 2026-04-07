// =====================
// SSDBeats Global Player JS
// =====================

const audio = document.getElementById("ssd-audio");
const player = document.getElementById("ssd-player");

const playBtn = document.getElementById("player-play");
const prevBtn = document.getElementById("player-prev");
const nextBtn = document.getElementById("player-next");

const title = document.getElementById("player-title");
const artist = document.getElementById("player-artist");
const cover = document.getElementById("player-cover");

const progress = document.getElementById("player-progress");
const volume = document.getElementById("player-volume");

const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");

// report after 30sec //
let playTimer = null;
let currentSongId = null;
const playedSongs = new Set();

let isPlaying = false;
let playlist = [];
let currentIndex = 0;
let currentCard = null;

// =====================
// Format time helper
// =====================
function formatTime(time){
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return minutes + ":" + (seconds < 10 ? "0"+seconds : seconds);
}





// =====================
// Play buttons from slider / cards
// =====================
document.querySelectorAll(".play-btn").forEach((btn, index) => {

  btn.addEventListener("click", () => {

    const song = btn.dataset.audio;
    const songTitle = btn.dataset.title;
    const songArtist = btn.dataset.artist;
    const songCover = btn.dataset.cover;
    const songId = btn.dataset.id;

    const card = btn.closest(".card");

    playlist = Array.from(document.querySelectorAll(".play-btn"));

    // SAME CARD CLICKED: toggle pause
    if(currentCard === card && isPlaying){
      audio.pause();
      playBtn.textContent = "▶";
      btn.textContent = "▶";
      card.classList.remove("playing");
      isPlaying = false;
      return;
    }

    // RESET previous card
    if(currentCard && currentCard !== card){
      const oldBtn = currentCard.querySelector(".play-btn");
      if(oldBtn) oldBtn.textContent = "▶";
      currentCard.classList.remove("playing");
    }

    currentIndex = index;
    currentCard = card;

    loadSong(songTitle, songArtist, song, songCover, songId);

    btn.textContent = "⏸";
    card.classList.add("playing");
    
  });
  
});

// =====================
// Load song into player
// =====================
function loadSong(songTitle, songArtist, song, songCover, songId){

  audio.src = song;

  title.textContent = songTitle;
  artist.textContent = songArtist;
  cover.src = songCover;

  player.classList.remove("hidden");

  audio.play();

  isPlaying = true;
  playBtn.textContent = "⏸";

  currentSongId = songId;

  // Start 30s play timer
  if(playTimer) clearTimeout(playTimer);

  playTimer = setTimeout(() => {

    if(currentSongId && !playedSongs.has(currentSongId)){

      playedSongs.add(currentSongId);

      fetch(`/api/player/play/${currentSongId}`, { method: "POST" })
        .then(res => res.json())
        .then(data => console.log("Play recorded:", data))
        .catch(err => console.error("Play tracking error:", err));

    }

  }, 30000); // 30 seconds

}

// =====================
// Play / Pause toggle
// =====================
playBtn.addEventListener("click", () => {
  if(isPlaying){
  audio.pause();
  playBtn.textContent = "▶";
    // Stop 30s timer if user pauses early
    if(playTimer) clearTimeout(playTimer);
    if(currentCard){
      const btn = currentCard.querySelector(".play-btn");
      if(btn) btn.textContent = "▶";
      currentCard.classList.remove("playing");
    }
  } else {
  audio.play();
  playBtn.textContent = "⏸";

  // Restart 30s timer when playback resumes
  if(currentSongId && !playedSongs.has(currentSongId)){

    if(playTimer) clearTimeout(playTimer);

    playTimer = setTimeout(() => {

      if(!playedSongs.has(currentSongId)){

        playedSongs.add(currentSongId);

        fetch(`/api/player/play/${currentSongId}`, { method: "POST" })
          .then(res => res.json())
          .then(data => console.log("Play recorded:", data))
          .catch(err => console.error("Play tracking error:", err));

      }

    }, 30000);

  }
    if(currentCard){
      const btn = currentCard.querySelector(".play-btn");
      if(btn) btn.textContent = "⏸";
      currentCard.classList.add("playing");
    }
  }
  isPlaying = !isPlaying;
});

// =====================
// Next / Previous
// =====================
nextBtn.addEventListener("click", () => {
  currentIndex++;
  if(currentIndex >= playlist.length) currentIndex = 0;
  playlist[currentIndex].click();
});

prevBtn.addEventListener("click", () => {
  currentIndex--;
  if(currentIndex < 0) currentIndex = playlist.length - 1;
  playlist[currentIndex].click();
});

// =====================
// Progress bar & time update
// =====================
audio.addEventListener("timeupdate", () => {
  if(audio.duration){
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.value = percent;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
});

// =====================
// Volume control
// =====================
volume.addEventListener("input", () => {
  audio.volume = volume.value;
  localStorage.setItem("ssd_volume", volume.value);
});

// Load saved volume
const savedVolume = localStorage.getItem("ssd_volume");
if(savedVolume){
  audio.volume = savedVolume;
  volume.value = savedVolume;
}

// =====================
// Auto next song
// =====================
audio.addEventListener("ended", () => {
  nextBtn.click();
});