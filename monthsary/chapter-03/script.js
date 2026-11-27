// Chapter 03: scroll story with sound effects made in code (no audio files).

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);

/* ---------- Sound effects (Web Audio) ---------- */
let audio = null;
let muted = false;

function startAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!audio) audio = new AudioCtx();
  if (audio.state === "suspended") audio.resume();
}

function tone({ freq = 440, to = null, dur = 0.15, type = "sine", vol = 0.2, delay = 0 }) {
  if (!audio || muted) return;
  if (audio.state !== "running") audio.resume();
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise({ dur = 0.4, from = 400, to = 2500, vol = 0.2, q = 1, delay = 0 }) {
  if (!audio || muted) return;
  if (audio.state !== "running") audio.resume();
  const t = audio.currentTime + delay;
  const length = Math.floor(audio.sampleRate * dur);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start(t);
  src.stop(t + dur + 0.05);
}

const sfx = {
  pop: () => tone({ freq: 500 + Math.random() * 200, to: 1200, dur: 0.08, type: "triangle", vol: 0.25 }),
  tick: (delay = 0) => tone({ freq: 1800, dur: 0.03, type: "square", vol: 0.04, delay }),
  thud: (delay = 0) => tone({ freq: 130, to: 45, dur: 0.22, type: "sine", vol: 0.5, delay }),
  boing: () => {
    tone({ freq: 160, to: 520, dur: 0.18, type: "sine", vol: 0.3 });
    tone({ freq: 520, to: 260, dur: 0.25, type: "sine", vol: 0.2, delay: 0.16 });
  },
  whoosh: () => noise({ dur: 0.5, from: 300, to: 3000, vol: 0.25 }),
  glitch: () => {
    for (let i = 0; i < 6; i++) {
      tone({ freq: 200 + Math.random() * 900, dur: 0.05, type: "square", vol: 0.06, delay: i * 0.06 });
    }
  },
  chime: () => {
    [523, 659, 784, 1047].forEach((freq, i) => tone({ freq, dur: 0.7, vol: 0.14, delay: i * 0.12 }));
  },
  slurp: () => {
    noise({ dur: 0.35, from: 500, to: 1400, vol: 0.35, q: 6 });
    noise({ dur: 0.45, from: 400, to: 1800, vol: 0.35, q: 6, delay: 0.3 });
  },
};

function buzz(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

/* ---------- 1. Gate and mute ---------- */
const gate = $("gate");
const muteBtn = $("muteBtn");

$("openBtn").addEventListener("click", () => {
  startAudio();
  sfx.chime();
  gate.classList.add("gone");
  document.body.classList.remove("locked");
  muteBtn.hidden = false;
  window.scrollTo(0, 0);
  setTimeout(watchScenes, 300);
});

muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.textContent = muted ? "Sound: Off" : "Sound: On";
  muteBtn.setAttribute("aria-pressed", String(muted));
  if (!muted) startAudio();
});

/* ---------- Sky: night at the top, sunrise at the end ---------- */
const skyStops = [
  [0, [27, 33, 64]],
  [0.4, [40, 42, 82]],
  [0.62, [214, 150, 160]],
  [0.82, [255, 205, 160]],
  [1, [255, 240, 214]],
];
const sky = $("sky");
const stars = $("stars");
const themeColor = document.querySelector('meta[name="theme-color"]');

function skyColor(p) {
  for (let i = 1; i < skyStops.length; i++) {
    const [p1, c1] = skyStops[i];
    const [p0, c0] = skyStops[i - 1];
    if (p <= p1) {
      const t = (p - p0) / (p1 - p0);
      return c0.map((v, k) => Math.round(v + (c1[k] - v) * t));
    }
  }
  return skyStops[skyStops.length - 1][1];
}

let skyQueued = false;
function updateSky() {
  skyQueued = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  const color = `rgb(${skyColor(p).join(",")})`;
  sky.style.background = color;
  themeColor.setAttribute("content", color);
  stars.style.opacity = String(Math.max(0, 1 - p * 1.8));
}

window.addEventListener(
  "scroll",
  () => {
    if (!skyQueued) {
      skyQueued = true;
      requestAnimationFrame(updateSky);
    }
  },
  { passive: true },
);
updateSky();

/* ---------- Reveal text as it scrolls into view ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.25 },
);
document.querySelectorAll(".reveal, .sun").forEach((el) => revealObserver.observe(el));

/* Scene triggers: each runs once, the first time its scene is mostly on screen */
const sceneActions = {
  counter: runCounter,
  finals: dropBooks,
  clock: spinClock,
  jeep: driveJeep,
};

const sceneObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      sceneObserver.unobserve(entry.target);
      sceneActions[entry.target.dataset.scene]?.(entry.target);
    }
  },
  { threshold: 0.5 },
);
// Called after the gate opens, so the first scene doesn't play behind the gate.
function watchScenes() {
  document.querySelectorAll(".scene").forEach((el) => {
    if (sceneActions[el.dataset.scene]) sceneObserver.observe(el);
  });
}

/* ---------- 2. Counter ---------- */
function runCounter() {
  const counter = $("counter");
  const glitchLine = $("glitchLine");
  const after = $("counterAfter");
  const target = 45;

  const finish = () => {
    glitchLine.classList.add("show");
    sfx.glitch();
    buzz(60);
    setTimeout(() => after.classList.add("show"), 900);
  };

  if (reduceMotion) {
    counter.textContent = String(target);
    finish();
    return;
  }

  const duration = 2200;
  const start = performance.now();
  let shown = 0;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const value = Math.max(1, Math.round(target * (1 - Math.pow(1 - t, 3))));
    if (value !== shown) {
      shown = value;
      counter.textContent = `${value}…`;
      sfx.tick();
    }
    if (t < 1) requestAnimationFrame(step);
    else setTimeout(finish, 500);
  };
  requestAnimationFrame(step);
}

/* ---------- 3. Books pile up ---------- */
function dropBooks(scene) {
  const desk = scene.querySelector(".desk");
  desk.classList.add("in");
  const books = desk.querySelectorAll(".book").length;
  for (let i = 0; i < books; i++) sfx.thud(i * 0.35 + 0.4);
}

/* ---------- 4. Miss-you slider: 10 is not enough ---------- */
const missRange = $("missRange");
const missOut = $("missOut");
const missHint = $("missHint");
let missStage = 0;
let lastTickValue = 1;

missRange.addEventListener("input", () => {
  const value = Number(missRange.value);
  if (missStage === 2) return;
  missOut.textContent = String(value);

  if (Math.abs(value - lastTickValue) >= (missStage === 0 ? 1 : 10)) {
    lastTickValue = value;
    sfx.tick();
  }

  if (missStage === 0 && value >= 10) {
    missStage = 1;
    missRange.max = "100";
    missRange.value = "10";
    missHint.textContent = "Wait, 10 is not enough. 1 to 100.";
    missRange.parentElement.classList.add("stretch");
    sfx.boing();
    buzz(40);
    // End the current drag so reaching 100 takes a fresh drag.
    missRange.disabled = true;
    setTimeout(() => (missRange.disabled = false), 600);
  } else if (missStage === 1 && value >= 100) {
    missStage = 2;
    missOut.textContent = "∞";
    missHint.textContent = "100 is not enough either.";
    missRange.disabled = true;
    $("missAnswer").classList.add("show");
    sfx.chime();
    buzz([60, 40, 60]);
  }
});

/* ---------- 4. Who misses who more: "You" runs away ---------- */
const dodgeArea = $("dodgeArea");
const youBtn = $("youBtn");
const meBtn = $("meBtn");

function dodge(event) {
  if (event) event.preventDefault();
  const area = dodgeArea.getBoundingClientRect();
  const btn = youBtn.getBoundingClientRect();
  const me = meBtn.getBoundingClientRect();
  const maxLeft = area.width - btn.width;
  const maxTop = area.height - btn.height;
  const overlaps = (left, top, rect) =>
    Math.abs(left - (rect.left - area.left)) < btn.width + 8 && Math.abs(top - (rect.top - area.top)) < btn.height + 8;
  let left = 0;
  let top = 0;
  // Pick a spot away from the finger and away from the "Me" button.
  for (let tries = 0; tries < 40; tries++) {
    left = Math.random() * maxLeft;
    top = Math.random() * maxTop;
    if (!overlaps(left, top, btn) && !overlaps(left, top, me)) break;
  }
  youBtn.style.left = `${left}px`;
  youBtn.style.top = `${top}px`;
  youBtn.style.transform = "none";
  sfx.pop();
}

youBtn.addEventListener("pointerdown", dodge);
youBtn.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "mouse") dodge();
});
// Keyboard only: a tap already dodged on pointerdown.
youBtn.addEventListener("click", (event) => {
  if (event.detail === 0) dodge(event);
});

meBtn.addEventListener("click", () => {
  sfx.boing();
  buzz(50);
  $("whoAnswer").classList.add("show");
});

/* ---------- 5. Clock spins through the short in-between ---------- */
function spinClock() {
  $("clock").classList.add("spin");
  for (let i = 0; i < 16; i++) sfx.tick(i * 0.13);
  setTimeout(() => sfx.pop(), 2300);
}

/* ---------- 5. Fill the matcha ---------- */
const cupBtn = $("cupBtn");
const cupFill = $("cupFill");
const pearls = $("pearls");
let fill = 0;

cupBtn.addEventListener("click", () => {
  if (fill >= 100) return;
  fill = Math.min(100, fill + 12.5);
  cupFill.style.setProperty("--fill", `${fill}%`);
  sfx.pop();
  buzz(15);

  const pearl = document.createElement("span");
  pearl.className = "pearl";
  pearl.style.left = `${15 + Math.random() * 65}%`;
  pearl.style.setProperty("--to", `${125 + Math.random() * 12}px`);
  pearls.append(pearl);

  if (fill >= 100) {
    $("cupHint").textContent = "Full na!";
    setTimeout(() => {
      sfx.slurp();
      cupBtn.classList.add("full");
      $("cupAnswer").classList.add("show");
      buzz([30, 30, 30]);
    }, 400);
  }
});

/* ---------- 5. Jeep leaves ---------- */
function driveJeep() {
  setTimeout(() => {
    $("jeep").classList.add("go");
    sfx.whoosh();
  }, 1200);
}

/* ---------- 7. Hold to hug ---------- */
const hugBtn = $("hugBtn");
const hugMeter = $("hugMeter");
const hugDuration = 2000;
let hugStart = 0;
let hugFrame = 0;
let hugged = false;

function hugStep(now) {
  const t = Math.min(1, (now - hugStart) / hugDuration);
  hugMeter.style.setProperty("--hug", `${t * 100}%`);
  if (t >= 1) {
    finishHug();
    return;
  }
  hugFrame = requestAnimationFrame(hugStep);
}

function startHug(event) {
  if (hugged) return;
  if (event) event.preventDefault();
  hugStart = performance.now();
  buzz([60, 80, 60, 80, 60, 80, 60, 80, 60, 80, 60, 80]);
  sfx.tick();
  cancelAnimationFrame(hugFrame);
  hugFrame = requestAnimationFrame(hugStep);
}

function stopHug() {
  if (hugged) return;
  cancelAnimationFrame(hugFrame);
  hugMeter.style.setProperty("--hug", "0%");
  buzz(0);
}

function finishHug() {
  hugged = true;
  hugBtn.classList.add("done");
  hugBtn.querySelector(".hug-label").textContent = "Hug received";
  $("coupon").classList.add("show");
  sfx.chime();
  buzz([120, 60, 220]);
  floatHearts();
}

hugBtn.addEventListener("pointerdown", startHug);
hugBtn.addEventListener("pointerup", stopHug);
hugBtn.addEventListener("pointerleave", stopHug);
hugBtn.addEventListener("pointercancel", stopHug);
hugBtn.addEventListener("contextmenu", (event) => event.preventDefault());
// Screen readers send a single click with no hold, so let that finish the hug.
hugBtn.addEventListener("click", (event) => {
  if (event.detail === 0 && !hugged) finishHug();
});
hugBtn.addEventListener("keydown", (event) => {
  if ((event.key === " " || event.key === "Enter") && !event.repeat) startHug(event);
});
hugBtn.addEventListener("keyup", (event) => {
  if (event.key === " " || event.key === "Enter") stopHug();
});

function floatHearts() {
  if (reduceMotion) return;
  const layer = $("hearts");
  for (let i = 0; i < 24; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = ["💗", "💕", "🍵", "💖"][i % 4];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.animationDelay = `${Math.random() * 0.8}s`;
    heart.style.setProperty("--dx", `${(Math.random() - 0.5) * 120}px`);
    heart.style.setProperty("--rot", `${(Math.random() - 0.5) * 60}deg`);
    layer.append(heart);
    setTimeout(() => heart.remove(), 3600);
  }
}
