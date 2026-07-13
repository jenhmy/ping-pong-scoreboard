"use strict";

const defaultState = {
  scores: [0, 0],
  names: ["JUGADOR 1", "JUGADOR 2"],
  pointsToWin: 11,
  serveEvery: 2,
  rescueMode: false,
  startingServer: 0,
  waitingForFirstServer: true,
  finished: false
};

let state = createState();

const scores = [
  document.querySelector("#scoreOne"),
  document.querySelector("#scoreTwo")
];

const names = [
  document.querySelector("#playerOneName"),
  document.querySelector("#playerTwoName")
];

const players = [
  document.querySelector("#playerOneZone"),
  document.querySelector("#playerTwoZone")
];

const subtractButtons = [
  document.querySelector("#subtractOne"),
  document.querySelector("#subtractTwo")
];

const addButtons = [
  document.querySelector("#addOne"),
  document.querySelector("#addTwo")
];

const serveIndicators = [
  document.querySelector("#serveOne"),
  document.querySelector("#serveTwo")
];

const pointsPreset = document.querySelector("#pointsPreset");
const servePreset = document.querySelector("#servePreset");
const rescueMode = document.querySelector("#rescueMode");

const startButton = document.querySelector("#startMatchButton");
const swapSidesButton = document.querySelector("#swapSidesButton");

const fullscreenButton = document.querySelector("#fullscreenButton");
const exitFullscreenButton = document.querySelector("#exitFullscreenButton");

const matchMessage = document.querySelector("#matchMessage");
const matchMessageText = document.querySelector("#matchMessageText");

function createState() {
  return {
    ...defaultState,
    scores: [...defaultState.scores],
    names: [...defaultState.names]
  };
}

function getSelectedValue(group) {
  const activeButton = group.querySelector(".segment-button.active");

  return Number(activeButton.dataset.value);
}

function selectSegment(group, selectedButton) {
  group.querySelectorAll(".segment-button").forEach(button => {
    const isSelected = button === selectedButton;

    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function renderSegment(group, value) {
  group.querySelectorAll(".segment-button").forEach(button => {
    const isSelected = Number(button.dataset.value) === value;

    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function addPoint(player) {
  if (state.finished) {
    return;
  }

  state.scores[player]++;

  animateScore(player);
  vibrate();

  if (hasWon(player)) {
    state.finished = true;
    showWinner(player);
  }

  render();
}

function subtractPoint(player) {
  if (state.finished || state.scores[player] === 0) {
    return;
  }

  state.scores[player]--;
  render();
}

function hasWon(player) {
  const opponent = player === 0 ? 1 : 0;

  return (
    state.scores[player] >= state.pointsToWin &&
    state.scores[player] - state.scores[opponent] >= 2
  );
}

function isFinalTiePhase() {
  const finalTieScore = state.pointsToWin - 1;

  return (
    state.scores[0] >= finalTieScore &&
    state.scores[1] >= finalTieScore
  );
}

function getOfficialServer() {
  const totalPoints = state.scores[0] + state.scores[1];

  if (!isFinalTiePhase()) {
    const changes = Math.floor(totalPoints / state.serveEvery);

    return changes % 2 === 0
      ? state.startingServer
      : 1 - state.startingServer;
  }

  const finalTieScore = state.pointsToWin - 1;
  const pointsBeforeFinalTie = finalTieScore * 2;

  const changesBeforeFinalTie =
    Math.floor(pointsBeforeFinalTie / state.serveEvery);

  const serverAtFinalTie =
    changesBeforeFinalTie % 2 === 0
      ? state.startingServer
      : 1 - state.startingServer;

  const pointsSinceFinalTie =
    totalPoints - pointsBeforeFinalTie;

  return pointsSinceFinalTie % 2 === 0
    ? serverAtFinalTie
    : 1 - serverAtFinalTie;
}

function isRescuePhase() {
  const rescueScore = state.pointsToWin - 1;

  return (
    state.scores[0] >= rescueScore ||
    state.scores[1] >= rescueScore
  );
}

function getCurrentServer() {
  if (
    state.rescueMode &&
    isRescuePhase()
  ) {
    if (state.scores[0] < state.scores[1]) {
      return 0;
    }

    if (state.scores[1] < state.scores[0]) {
      return 1;
    }
  }

  return getOfficialServer();
}

function applySettings() {
  state.pointsToWin = getSelectedValue(pointsPreset);
  state.serveEvery = getSelectedValue(servePreset);
  state.rescueMode = rescueMode.checked;
}

function startMatch() {
  applySettings();

  state.scores = [0, 0];
  state.startingServer = 0;
  state.waitingForFirstServer = true;
  state.finished = false;

  hideMessage();
  render();
}

function updateName(player) {
  state.names[player] =
    names[player].value.trim().toUpperCase() ||
    `JUGADOR ${player + 1}`;

  names[player].value = state.names[player];
}

function showWinner(player) {
  matchMessageText.innerHTML =
    `¡VICTORIA PARA<br>${state.names[player]}!`;

  matchMessage.classList.add("visible");
}

function hideMessage() {
  matchMessage.classList.remove("visible");
}

function animateScore(player) {
  scores[player].classList.remove("pop");
  void scores[player].offsetWidth;
  scores[player].classList.add("pop");
}

function vibrate() {
  navigator.vibrate?.(25);
}

function render() {
  scores.forEach((element, index) => {
    element.textContent = state.scores[index];
  });

  names.forEach((input, index) => {
    input.value = state.names[index];
  });

  renderSegment(pointsPreset, state.pointsToWin);
  renderSegment(servePreset, state.serveEvery);
  rescueMode.checked = state.rescueMode;

  if (state.waitingForFirstServer) {
    serveIndicators.forEach(indicator => {
      indicator.classList.remove("active");
    });
  } else {
    const server = getCurrentServer();

    serveIndicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === server);
    });
  }
}

function swapSides() {
  state.scores.reverse();
  state.names.reverse();

  state.startingServer = 1 - state.startingServer;

  players[0].classList.toggle("side-cyan");
  players[0].classList.toggle("side-pink");

  players[1].classList.toggle("side-cyan");
  players[1].classList.toggle("side-pink");

  render();
}

/* Puntuación */

players.forEach((player, index) => {
  player.addEventListener("click", event => {
    if (event.target.closest("button, input")) {
      return;
    }

    if (state.waitingForFirstServer) {
      state.startingServer = index;
      state.waitingForFirstServer = false;
      render();
      return;
    }

    addPoint(index);
  });
});

subtractButtons.forEach((button, index) => {
  button.addEventListener("click", event => {
    event.stopPropagation();
    subtractPoint(index);
  });
});

addButtons.forEach((button, index) => {
  button.addEventListener("click", event => {
    event.stopPropagation();

    if (state.waitingForFirstServer) {
      state.startingServer = index;
      state.waitingForFirstServer = false;
      render();
      return;
    }

    addPoint(index);
  });
});

/* Nombres */

names.forEach((input, index) => {
  input.addEventListener("click", event => {
    event.stopPropagation();
  });

  input.addEventListener("focus", () => {
    input.select();
  });

  input.addEventListener("change", () => {
    updateName(index);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      input.blur();
    }
  });
});

/* Configuración segmentada */

[pointsPreset, servePreset].forEach(group => {
  group.querySelectorAll(".segment-button").forEach(button => {
    button.addEventListener("click", () => {
      selectSegment(group, button);
      applySettings();
      render();
    });
  });
});

rescueMode.addEventListener("change", () => {
  applySettings();
  render();
});

/* Botones */

startButton.addEventListener("click", startMatch);
swapSidesButton.addEventListener("click", swapSides);

/* Pantalla completa */

fullscreenButton.addEventListener("click", async () => {
  try {
    await document.documentElement.requestFullscreen();
    document.body.classList.add("fullscreen-mode");
  } catch {
    document.body.classList.remove("fullscreen-mode");
  }
});

exitFullscreenButton.addEventListener("click", async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  }
});

document.addEventListener("fullscreenchange", () => {
  document.body.classList.toggle(
    "fullscreen-mode",
    Boolean(document.fullscreenElement)
  );
});

render();
