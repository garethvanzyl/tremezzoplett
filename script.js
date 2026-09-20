const bookingLinks = document.querySelectorAll('a[href="#contact"]');
const heroVideos = document.querySelectorAll(".hero-media");

heroVideos.forEach((video) => {
  const toggle = document.querySelector(".hero-toggle");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) {
    video.autoplay = false;
    video.pause();
  }
  if (toggle) {
    toggle.hidden = false;
    const updateToggle = () => {
      const label = video.paused ? "Play video" : "Pause video";
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
      toggle.firstElementChild.textContent = video.paused ? "\u25b6" : "\u275a\u275a";
    };
    toggle.addEventListener("click", () => {
      if (video.paused) video.play().catch(updateToggle);
      else video.pause();
    });
    video.addEventListener("play", updateToggle);
    video.addEventListener("pause", updateToggle);
    reducedMotion.addEventListener("change", (event) => { if (event.matches) video.pause(); });
    updateToggle();
  }
  const slowVideo = () => {
    video.defaultPlaybackRate = 0.65;
    video.playbackRate = 0.65;
  };
  slowVideo();
  video.addEventListener("loadedmetadata", slowVideo);
  video.addEventListener("play", slowVideo);
});

bookingLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const contact = document.querySelector("#contact");
    if (!contact) return;
    contact.classList.remove("pulse");
    window.setTimeout(() => contact.classList.add("pulse"), 260);
  });
});

window.addEventListener("load", () => {
  document.body.classList.add("ready");
});
