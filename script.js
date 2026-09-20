const bookingLinks = document.querySelectorAll('a[href="#contact"]');
const heroVideos = document.querySelectorAll(".hero-media");

heroVideos.forEach((video) => {
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
