document.addEventListener("DOMContentLoaded", () => {

  // ================= DOT MENU =================
  const dotBtn = document.getElementById("dotMenuBtn");
  const dotDropdown = document.getElementById("dotDropdown");

  if (dotBtn && dotDropdown) {
    dotBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dotDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!dotBtn.contains(e.target) && !dotDropdown.contains(e.target)) {
        dotDropdown.classList.add("hidden");
      }
    });
  }

  // ================= SIDEBAR / HAMBURGER =================
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");
  const closeSidebar = document.getElementById("closeSidebar");
  const overlay = document.getElementById("overlay");

  if (hamburger && sidebar && closeSidebar && overlay) {
    hamburger.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.remove("hidden");
    });

    closeSidebar.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.add("hidden");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.add("hidden");
    });
  }

  // ================= SLIDERS =================
  document.querySelectorAll('.slider-container').forEach(container => {
    const track = container.querySelector('.slider-track');
    const leftArrow = container.querySelector('.slider-arrow.left');
    const rightArrow = container.querySelector('.slider-arrow.right');

    if (leftArrow && rightArrow && track) {
      leftArrow.addEventListener('click', () => {
        track.scrollBy({ left: -220, behavior: 'smooth' });
      });

      rightArrow.addEventListener('click', () => {
        track.scrollBy({ left: 220, behavior: 'smooth' });
      });
    }
  });

});


// ================= SEARCH =================
const input = document.querySelector(".search-wrapper input");

if (input) {
  input.addEventListener("input", async () => {
    const value = input.value.trim();
    if (!value) return;

    try {
      const res = await fetch(`/search-suggestions?q=${value}`);
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.log("Search error", err);
    }
  });
}


// ================= PLAY ALL =================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("play-all-btn")) {

    const songs = JSON.parse(e.target.dataset.songs);
    if (!songs.length) return;

    const first = songs[0];

    if (window.playSong) {
      window.playSong({
        audio: first.audioFile,
        title: first.title,
        artist: first.artist?.name || "",
        cover: first.coverImage
      });
    }
  }
});