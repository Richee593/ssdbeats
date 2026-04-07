// =========================
// SONG DETAIL PLAYER JS
// =========================

const audio = document.getElementById("single-audio");
const playBtn = document.getElementById("single-play");
const progress = document.getElementById("single-progress");

let isPlaying = false;
let currentRelatedBtn = null;
let playTimer = null;
const playedSongs = new Set();

// Remove any <source> children so JS controls audio completely
while (audio.firstChild) {
  audio.removeChild(audio.firstChild);
}

// =========================
// Start 30s play tracking
// =========================
function startPlayTimer(songId) {
  if (!songId) return;

  if (playTimer) clearTimeout(playTimer);

  playTimer = setTimeout(() => {
    if (playedSongs.has(songId)) return;

    playedSongs.add(songId);

    fetch(`/api/player/play/${songId}`, { method: "POST" })
      .then(res => res.json())
      .then(data => console.log("Play recorded:", data))
      .catch(err => console.error("Play tracking error:", err));
  }, 30000); // 30 seconds
}

// =========================
// MAIN SONG PLAY BUTTON
// =========================
playBtn.addEventListener("click", () => {
  const src = audio.dataset.audio;
  const songId = audio.dataset.id;

  if (!src) return;

  if (!audio.src) {
    audio.src = src;
    audio.load();
  }

  if (isPlaying) {
    audio.pause();
    playBtn.textContent = "▶";
    if (currentRelatedBtn) currentRelatedBtn.textContent = "▶";
  } else {
    audio.play();
    playBtn.textContent = "⏸";
    if (currentRelatedBtn) currentRelatedBtn.textContent = "⏸";

    // Start 30-second tracking
    startPlayTimer(songId);
  }

  isPlaying = !isPlaying;
});

// =========================
// UPDATE PROGRESS BAR
// =========================
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.value = percent;
  }
});

// =========================
// SEEK AUDIO
// =========================
progress.addEventListener("input", () => {
  if (audio.duration) {
    audio.currentTime = (progress.value / 100) * audio.duration;
  }
});

// =========================
// RELATED SONGS PLAY BUTTONS
// =========================
document.querySelectorAll(".single-play-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();

    const src = btn.dataset.audio;
    const songId = btn.dataset.id;

    if (!src) return;

    // Stop current audio
    if (isPlaying) audio.pause();
    if (currentRelatedBtn) currentRelatedBtn.textContent = "▶";

    // Set main player
    audio.src = src;
    audio.dataset.id = songId;
    audio.load();
    audio.play();

    isPlaying = true;
    playBtn.textContent = "⏸";

    btn.textContent = "⏸";
    currentRelatedBtn = btn;

    // Start 30-second tracking
    startPlayTimer(songId);
  });
});

// =========================
// Auto pause when song ends
// =========================
audio.addEventListener("ended", () => {
  isPlaying = false;
  playBtn.textContent = "▶";
  if (currentRelatedBtn) currentRelatedBtn.textContent = "▶";
});



// =========================
// SHARE BUTTON WITH DROPDOWN
// =========================

const sharedSongs = new Set();

document.querySelectorAll(".song-share-btn").forEach(btn => {

  const songId = btn.dataset.id;
  const shareBox = document.getElementById(`share-options-${songId}`);

  btn.addEventListener("click", async (e) => {

    e.preventDefault();

    // Toggle dropdown
    if (shareBox) {
      shareBox.classList.toggle("hidden");
    }

    // Prevent multiple counts
    if (sharedSongs.has(songId)) return;

    try {

      const res = await fetch(`/api/player/share/${songId}`, {
        method: "POST"
      });

      const data = await res.json();

      btn.querySelector(".share-count").textContent = data.shareCount;

      sharedSongs.add(songId);

    } catch(err) {
      console.error("Share error:", err);
    }

  });

});


// =========================
// COPY LINK BUTTON
// =========================

document.querySelectorAll(".copy-link-btn").forEach(btn => {

  btn.addEventListener("click", () => {

    const link = btn.dataset.link;

    navigator.clipboard.writeText(link)
      .then(() => {
        alert("Song link copied!");
      })
      .catch(err => {
        console.error("Copy failed:", err);
      });

  });

});