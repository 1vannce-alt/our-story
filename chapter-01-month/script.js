/**
 * Particle System Background
 * Renders smooth floating embers / soft light bokeh elements
 */
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
const reducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

let particles = [];
let w, h;

function initSize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}

window.addEventListener("resize", initSize);
initSize();

class Particle {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = Math.random() * 2.5 + 0.5;
    this.speedX = Math.random() * 0.4 - 0.2;
    this.speedY = Math.random() * -0.6 - 0.2;
    this.baseOpacity = Math.random() * 0.4 + 0.1;
    this.opacity = this.baseOpacity;
    this.opacitySpeed = Math.random() * 0.01 + 0.005;
    this.opacityDirection = Math.random() > 0.5 ? 1 : -1;

    const colors = [
      "253, 251, 247",
      "252, 213, 206",
      "232, 232, 242",
      "255, 255, 255",
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    this.opacity += this.opacitySpeed * this.opacityDirection;
    if (
      this.opacity > this.baseOpacity + 0.3 ||
      this.opacity < this.baseOpacity - 0.1
    ) {
      this.opacityDirection *= -1;
    }

    if (this.y < -10) {
      this.y = h + 10;
      this.x = Math.random() * w;
    }
    if (this.x > w + 10 || this.x < -10) {
      this.speedX = -this.speedX;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${Math.max(0, this.opacity)})`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = `rgba(${this.color}, 0.8)`;
    ctx.fill();
  }
}

function initParticles(count) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }
}

function drawParticles(update = true) {
  ctx.clearRect(0, 0, w, h);
  particles.forEach((particle) => {
    if (update) particle.update();
    particle.draw();
  });
}

function animateParticles() {
  drawParticles();
  requestAnimationFrame(animateParticles);
}

initParticles(
  reducedMotionQuery.matches ? 20 : window.innerWidth < 600 ? 30 : 70,
);
if (reducedMotionQuery.matches) {
  drawParticles(false);
} else {
  animateParticles();
}

/**
 * Story Engine & Audio Controls
 */
const startBtn = document.getElementById("startBtn");
const introScreen = document.getElementById("intro-screen");
const storyContainer = document.getElementById("story-container");
const bgm = document.getElementById("bgm");
const musicToggle = document.getElementById("musicToggle");

function updateMusicControl(isPlaying) {
  musicToggle.textContent = `Music: ${isPlaying ? "On" : "Off"}`;
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute(
    "aria-label",
    isPlaying ? "Turn music off" : "Turn music on",
  );
}

startBtn.addEventListener("click", () => {
  // Modern browsers require interaction before audio can play.
  bgm.volume = 0.5;
  bgm
    .play()
    .then(() => updateMusicControl(true))
    .catch((error) => {
      updateMusicControl(false);
      console.log("Audio play failed or was blocked:", error);
    });

  // 2. Hide Intro Screen
  introScreen.classList.add("hide");

  setTimeout(() => {
    // 3. Remove from flow
    introScreen.style.display = "none";

    // 4. Activate the story container, then let Swiper take over scrolling
    storyContainer.classList.add("active");
    musicToggle.hidden = false;
    initStorySwiper();
  }, 1000); // Wait for transition out
});

musicToggle.addEventListener("click", () => {
  if (bgm.paused) {
    bgm
      .play()
      .then(() => updateMusicControl(true))
      .catch((error) => {
        updateMusicControl(false);
        console.log("Audio play failed or was blocked:", error);
      });
  } else {
    bgm.pause();
    updateMusicControl(false);
  }
});

/**
 * Snap-scrolling letter via Swiper.js
 * Each part of the letter is its own slide. Swiper snaps to the nearest
 * slide on every scroll/swipe, and we toggle the "visible" class on the
 * active slide's text/image to trigger the CSS reveal animation.
 */
let storySwiper = null;

function revealActiveSlide(swiper) {
  document.querySelectorAll(".story-line, .story-image").forEach((el) => {
    el.classList.remove("visible");
  });

  const activeSlide = swiper.slides[swiper.activeIndex];
  if (!activeSlide) return;

  activeSlide.querySelectorAll(".story-line, .story-image").forEach((el) => {
    el.classList.add("visible");
  });
}

function initStorySwiper() {
  if (storySwiper) return;

  storySwiper = new Swiper("#storySwiper", {
    direction: "vertical",
    slidesPerView: 1,
    speed: reducedMotionQuery.matches ? 0 : 900,
    mousewheel: true,
    keyboard: { enabled: true },
    on: {
      init(swiper) {
        revealActiveSlide(swiper);
      },
      slideChangeTransitionEnd(swiper) {
        revealActiveSlide(swiper);
      },
    },
  });
}
