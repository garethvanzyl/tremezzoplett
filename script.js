const bookingLinks = document.querySelectorAll('a[href="#contact"]');

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
