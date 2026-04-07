const loadMoreBtn = document.getElementById("loadMoreBtn");
const songsContainer = document.getElementById("songs-container");

if (loadMoreBtn) {

  loadMoreBtn.addEventListener("click", async () => {

    let page = parseInt(loadMoreBtn.dataset.page) + 1;

    const res = await fetch(`/songs?page=${page}`, {
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const html = await res.text();

    songsContainer.insertAdjacentHTML("beforeend", html);

    loadMoreBtn.dataset.page = page;

  });

}