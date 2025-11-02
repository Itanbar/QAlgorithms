const STATES = [
  { label: "|00⟩", amplitude: 0.5 },
  { label: "|01⟩", amplitude: 0.5 },
  { label: "|10⟩", amplitude: 0.5 },
  { label: "|11⟩", amplitude: 0.5 },
];

const TARGET_INDEX = 3; // |11>
const MAX_ITERATIONS = 4;

let currentStates = [];
let cardElements = [];
let iteration = 0;
let phaseIndex = 0;
let isRunning = false;
let timerHandle = null;
let animationDelay = 1200;

const phaseDescriptions = [
  {
    label: "Oracle",
    apply: (states) => {
      const before = states[TARGET_INDEX].amplitude;
      states[TARGET_INDEX].amplitude *= -1;
      const after = states[TARGET_INDEX].amplitude;
      return `Flips the target amplitude from ${formatAmplitude(
        before,
      )} to ${formatAmplitude(after)}.`;
    },
  },
  {
    label: "Diffusion",
    apply: (states) => {
      const mean =
        states.reduce((sum, state) => sum + state.amplitude, 0) / states.length;
      states.forEach((state) => {
        state.amplitude = 2 * mean - state.amplitude;
      });
      iteration += 1;
      const targetAmplitude = states[TARGET_INDEX].amplitude;
      return `Reflects amplitudes about the mean ${formatAmplitude(
        mean,
      )}, boosting the target to ${formatAmplitude(targetAmplitude)}.`;
    },
  },
];

function cloneInitialStates() {
  return STATES.map((state) => ({ ...state }));
}

function formatAmplitude(value) {
  return value.toFixed(3);
}

function formatProbability(value) {
  return (value * value).toFixed(3);
}

function createStateCard(state, index) {
  const card = document.createElement("article");
  card.className = "state-card";

  const title = document.createElement("div");
  title.className = "state-card__label";
  if (index === TARGET_INDEX) {
    title.classList.add("state-card__label--target");
  }
  title.textContent = state.label;

  const bar = document.createElement("div");
  bar.className = "state-card__bar";

  const positiveFill = document.createElement("div");
  positiveFill.className = "bar-fill bar-fill--positive";
  bar.appendChild(positiveFill);

  const negativeFill = document.createElement("div");
  negativeFill.className = "bar-fill bar-fill--negative";
  bar.appendChild(negativeFill);

  const metrics = document.createElement("div");
  metrics.className = "state-card__metrics";

  const amplitudeLine = document.createElement("div");
  amplitudeLine.className = "state-card__amplitude";
  metrics.appendChild(amplitudeLine);

  const probabilityLine = document.createElement("div");
  probabilityLine.className = "state-card__probability";
  metrics.appendChild(probabilityLine);

  card.appendChild(title);
  card.appendChild(bar);
  card.appendChild(metrics);

  return {
    card,
    title,
    bar,
    positiveFill,
    negativeFill,
    amplitudeLine,
    probabilityLine,
  };
}

function initialiseView() {
  const container = document.getElementById("state-container");
  container.innerHTML = "";
  currentStates = cloneInitialStates();
  iteration = 0;
  phaseIndex = 0;

  cardElements = currentStates.map((state, index) => {
    const elements = createStateCard(state, index);
    container.appendChild(elements.card);
    return elements;
  });

  updateStateCards(currentStates);
  updateIteration();
  updateDescription("Click start to run Grover's iterate.");
  updatePhaseLabel("Idle");
  updateTargetProbability();
}

function updateStateCards(states) {
  const SCALE = 200; // Matches half the bar height (200px total)
  states.forEach((state, index) => {
    const elements = cardElements[index];
    const amplitude = state.amplitude;
    const probability = amplitude * amplitude;
    const scaled = Math.min(Math.abs(amplitude), 1) * SCALE;

    elements.positiveFill.style.transform = `scaleY(${amplitude > 0 ? scaled / SCALE : 0})`;
    elements.negativeFill.style.transform = `scaleY(${amplitude < 0 ? scaled / SCALE : 0})`;

    elements.amplitudeLine.textContent = `Amplitude: ${formatAmplitude(amplitude)}`;
    elements.probabilityLine.textContent = `Probability: ${formatProbability(probability)}`;
  });
}

function updateDescription(text) {
  const element = document.getElementById("step-description");
  element.textContent = text;
}

function updateIteration() {
  const element = document.getElementById("iteration-count");
  element.textContent = iteration.toString();
}

function updatePhaseLabel(label) {
  const element = document.getElementById("phase-label");
  element.textContent = label;
}

function updateTargetProbability() {
  const amplitude = currentStates[TARGET_INDEX].amplitude;
  const probability = amplitude * amplitude;
  const element = document.getElementById("target-probability");
  element.textContent = `${(probability * 100).toFixed(1)}%`;
}

function scheduleNextPhase() {
  clearTimeout(timerHandle);
  timerHandle = setTimeout(runPhase, animationDelay);
}

function runPhase() {
  if (!isRunning) {
    return;
  }

  if (!executePhase()) {
    return;
  }

  scheduleNextPhase();
}

function executePhase() {
  if (iteration >= MAX_ITERATIONS) {
    completeAnimation();
    return false;
  }

  const phase = phaseDescriptions[phaseIndex];
  const detail = phase.apply(currentStates);

  updateStateCards(currentStates);
  updateDescription(`${phase.label}: ${detail}`);
  updatePhaseLabel(phase.label);
  updateTargetProbability();

  phaseIndex = (phaseIndex + 1) % phaseDescriptions.length;
  if (phaseIndex === 0) {
    updateIteration();
  }

  if (iteration >= MAX_ITERATIONS) {
    completeAnimation();
    return false;
  }

  return true;
}

function startAnimation() {
  if (isRunning) {
    return;
  }
  isRunning = true;
  document.getElementById("start-btn").setAttribute("disabled", "true");
  document.getElementById("pause-btn").removeAttribute("disabled");
  document.getElementById("step-btn").setAttribute("disabled", "true");
  runPhase();
}

function stopAnimation() {
  isRunning = false;
  clearTimeout(timerHandle);
  document.getElementById("pause-btn").setAttribute("disabled", "true");
  document.getElementById("start-btn").removeAttribute("disabled");
  document.getElementById("step-btn").removeAttribute("disabled");
}

function completeAnimation() {
  stopAnimation();
  document.getElementById("start-btn").setAttribute("disabled", "true");
  document.getElementById("step-btn").setAttribute("disabled", "true");
  updatePhaseLabel("Complete");
  updateDescription(
    "Animation complete – Grover has boosted the marked state. Reset to run again.",
  );
}

function resetAnimation() {
  stopAnimation();
  currentStates = cloneInitialStates();
  iteration = 0;
  phaseIndex = 0;
  updateStateCards(currentStates);
  updateIteration();
  updateDescription("Click start to run Grover's iterate.");
  updatePhaseLabel("Idle");
  updateTargetProbability();
  document.getElementById("start-btn").removeAttribute("disabled");
  document.getElementById("step-btn").removeAttribute("disabled");
}

document.addEventListener("DOMContentLoaded", () => {
  initialiseView();

  document.getElementById("start-btn").addEventListener("click", () => {
    startAnimation();
  });

  document.getElementById("pause-btn").addEventListener("click", () => {
    stopAnimation();
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    resetAnimation();
  });

  document.getElementById("step-btn").addEventListener("click", () => {
    if (isRunning) {
      stopAnimation();
    }
    executePhase();
  });

  document.getElementById("speed-range").addEventListener("input", (event) => {
    animationDelay = Number(event.target.value);
    if (isRunning) {
      scheduleNextPhase();
    }
  });
});
