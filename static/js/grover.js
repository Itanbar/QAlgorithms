const DEFAULT_QUBITS = 5;
const MIN_QUBITS = 2;
const MAX_QUBITS = 6;

let config = createConfig(DEFAULT_QUBITS);
let currentStates = [];
let cardElements = [];
let iteration = 0;
let isRunning = false;
let timerHandle = null;
let animationDelay = 1200;

function createConfig(numQubits) {
  const qubits = Math.max(MIN_QUBITS, Math.min(MAX_QUBITS, numQubits));
  const numStates = 1 << qubits;
  const optimalIterations = Math.max(
    1,
    Math.round((Math.PI / 4) * Math.sqrt(numStates)),
  );
  const maxIterations = optimalIterations + 4;

  return {
    numQubits: qubits,
    numStates,
    targetIndex: numStates - 1,
    initialAmplitude: 1 / Math.sqrt(numStates),
    optimalIterations,
    maxIterations,
  };
}

function getTargetLabel() {
  return `|${"1".repeat(config.numQubits)}⟩`;
}

function createInitialStates() {
  return Array.from({ length: config.numStates }, (_, index) => ({
    label: `|${index.toString(2).padStart(config.numQubits, "0")}⟩`,
    amplitude: config.initialAmplitude,
  }));
}

function createStateCard(state, index) {
  const card = document.createElement("article");
  card.className = "state-card";

  const title = document.createElement("div");
  title.className = "state-card__label";
  if (index === config.targetIndex) {
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
  currentStates = createInitialStates();
  iteration = 0;

  const container = document.getElementById("state-container");
  container.innerHTML = "";

  cardElements = currentStates.map((state, index) => {
    const elements = createStateCard(state, index);
    container.appendChild(elements.card);
    return elements;
  });

  updateStateCards(currentStates);
  updateIteration();
  updateTargetProbability();
  updateTargetStateLabel();
  updateDescription(introMessage());
  updateStatusLabel("Idle");

  const qubitSelect = document.getElementById("qubit-select");
  if (qubitSelect) {
    qubitSelect.value = String(config.numQubits);
  }
}

function introMessage() {
  return `Ready to search ${config.numStates} states. The oracle marks ${getTargetLabel()} as the solution. Use Start for continuous iterations or Step to apply the Grover iterate once.`;
}

function formatFixed(value, decimals) {
  if (!Number.isFinite(value)) {
    return "NaN";
  }
  const rounded = value.toFixed(decimals);
  return Number(rounded) === 0 ? (0).toFixed(decimals) : rounded;
}

function formatAmplitude(value) {
  return formatFixed(value, 3);
}

function formatProbability(value) {
  return formatFixed(Math.max(0, value), 3);
}

function updateStateCards(states) {
  const MIN_VISIBLE_SCALE = 0.04;
  states.forEach((state, index) => {
    const elements = cardElements[index];
    if (!elements) {
      return;
    }
    const amplitude = state.amplitude;
    const probability = Math.max(0, amplitude * amplitude);
    const absAmplitude = Math.min(Math.abs(amplitude), 1);
    const scale = amplitude === 0 ? 0 : Math.max(absAmplitude, MIN_VISIBLE_SCALE);

    elements.positiveFill.style.transform = `scaleY(${amplitude > 0 ? scale : 0})`;
    elements.negativeFill.style.transform = `scaleY(${amplitude < 0 ? scale : 0})`;

    elements.amplitudeLine.textContent = `Amplitude: ${formatAmplitude(amplitude)}`;
    elements.probabilityLine.textContent = `Probability: ${formatProbability(
      probability,
    )}`;
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

function updateStatusLabel(label) {
  const element = document.getElementById("status-label");
  element.textContent = label;
}

function updateTargetProbability() {
  if (!currentStates.length) {
    return;
  }
  const amplitude = currentStates[config.targetIndex].amplitude;
  const probability = Math.max(0, amplitude * amplitude);
  const percent = Math.max(0, probability * 100);
  const rounded = percent.toFixed(1);
  const safeRounded = Number(rounded) === 0 ? (0).toFixed(1) : rounded;

  const element = document.getElementById("target-probability");
  element.textContent = `${safeRounded}%`;
}

function updateTargetStateLabel() {
  const element = document.getElementById("target-state");
  if (element) {
    element.textContent = getTargetLabel();
  }
}

function scheduleNextStep() {
  clearTimeout(timerHandle);
  timerHandle = setTimeout(runStep, animationDelay);
}

function runStep() {
  if (!isRunning) {
    return;
  }

  if (!executeGroverStep()) {
    return;
  }

  scheduleNextStep();
}

function executeGroverStep({ manual = false } = {}) {
  if (iteration >= config.maxIterations) {
    completeAnimation();
    return false;
  }

  const targetIndex = config.targetIndex;
  const targetLabel = getTargetLabel();

  const amplitudeBefore = currentStates[targetIndex].amplitude;
  const amplitudeAfterOracle = applyOracle(currentStates, targetIndex);
  const mean = applyDiffusion(currentStates);
  iteration += 1;

  const amplitudeAfter = currentStates[targetIndex].amplitude;
  const probability = Math.max(0, amplitudeAfter * amplitudeAfter);

  updateStateCards(currentStates);
  updateIteration();
  updateTargetProbability();

  const description = [
    `Iteration ${iteration}:`,
    `oracle inverted ${targetLabel} (${formatAmplitude(amplitudeBefore)} → ${formatAmplitude(
      amplitudeAfterOracle,
    )})`,
    `and diffusion reflected around the mean ${formatAmplitude(mean)},`,
    `yielding amplitude ${formatAmplitude(amplitudeAfter)} (probability ${formatProbability(
      probability,
    )}).`,
  ].join(" ");

  updateDescription(description);

  if (isRunning) {
    updateStatusLabel("Running");
  } else if (manual) {
    updateStatusLabel("Manual step");
  }

  if (iteration >= config.maxIterations) {
    completeAnimation();
    return false;
  }

  return true;
}

function applyOracle(states, targetIndex) {
  states[targetIndex].amplitude *= -1;
  return states[targetIndex].amplitude;
}

function applyDiffusion(states) {
  const mean =
    states.reduce((sum, state) => sum + state.amplitude, 0) / states.length;
  states.forEach((state) => {
    state.amplitude = 2 * mean - state.amplitude;
  });
  return mean;
}

function startAnimation() {
  if (isRunning) {
    return;
  }
  if (iteration >= config.maxIterations) {
    return;
  }

  isRunning = true;
  document.getElementById("start-btn").setAttribute("disabled", "true");
  document.getElementById("pause-btn").removeAttribute("disabled");
  document.getElementById("step-btn").setAttribute("disabled", "true");
  updateStatusLabel("Running");
  runStep();
}

function stopAnimation({ status = "Paused", allowResume = true } = {}) {
  isRunning = false;
  clearTimeout(timerHandle);
  document.getElementById("pause-btn").setAttribute("disabled", "true");
  if (allowResume) {
    document.getElementById("start-btn").removeAttribute("disabled");
    document.getElementById("step-btn").removeAttribute("disabled");
  } else {
    document.getElementById("start-btn").setAttribute("disabled", "true");
    document.getElementById("step-btn").setAttribute("disabled", "true");
  }
  updateStatusLabel(status);
}

function completeAnimation() {
  const element = document.getElementById("step-description");
  element.textContent = `${element.textContent} Maximum of ${config.maxIterations} Grover iterations reached for this configuration. Reset to start again or choose a different qubit count.`;
  stopAnimation({ status: "Complete", allowResume: false });
}

function resetAnimation() {
  stopAnimation({ status: "Idle" });
  initialiseView();
}

function setQubitCount(qubits) {
  const clamped = Math.max(MIN_QUBITS, Math.min(MAX_QUBITS, Number(qubits)));
  if (clamped === config.numQubits) {
    return;
  }
  stopAnimation({ status: "Idle" });
  config = createConfig(clamped);
  initialiseView();
}

function updateAnimationDelay(value) {
  animationDelay = Number(value);
  if (isRunning) {
    scheduleNextStep();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initialiseView();

  document.getElementById("start-btn").addEventListener("click", () => {
    startAnimation();
  });

  document.getElementById("pause-btn").addEventListener("click", () => {
    if (!isRunning) {
      return;
    }
    stopAnimation({ status: "Paused" });
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    resetAnimation();
  });

  document.getElementById("step-btn").addEventListener("click", () => {
    if (isRunning) {
      stopAnimation({ status: "Paused" });
    }
    executeGroverStep({ manual: true });
  });

  document.getElementById("speed-range").addEventListener("input", (event) => {
    updateAnimationDelay(event.target.value);
  });

  const qubitSelect = document.getElementById("qubit-select");
  if (qubitSelect) {
    qubitSelect.addEventListener("change", (event) => {
      setQubitCount(Number(event.target.value));
    });
  }
});
