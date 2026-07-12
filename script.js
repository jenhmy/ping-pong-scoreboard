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
let history = [];

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
const undoButton = document.querySelector("#undoButton");

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

function saveSnapshot() {
  history.push(structuredClone(state));

  if (history.length > 100) {
    history.shift();
  }
}

function addPoint(player) {
  if (state.finished) {
    return;
  }

  saveSnapshot();
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

  saveSnapshot();
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

function canWinNextPoint(player) {
  const opponent = player === 0 ? 1 : 0;
  const nextScore = state.scores[player] + 1;

  return (
    nextScore >= state.pointsToWin &&
    nextScore - state.scores[opponent] >= 2
  );
}

function isMatchPoint() {
  return canWinNextPoint(0) || canWinNextPoint(1);
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
  state.pointsToWin = Number(pointsPreset.value);
  state.serveEvery = Number(servePreset.value);
  state.rescueMode = rescueMode.checked;
}

function startMatch() {
  saveSnapshot();
  applySettings();

  state.scores = [0, 0];
  state.startingServer = 0;
  state.waitingForFirstServer = true;
  state.finished = false;

  hideMessage();
  render();
}

function undo() {
  const previousState = history.pop();

  if (!previousState) {
    return;
  }

  state = previousState;

  hideMessage();
  render();
}

function updateName(player) {
  state.names[player] =
    names[player].value.trim() ||
    `JUGADOR ${player + 1}`;

  names[player].value = state.names[player];
}

function showWinner(player) {
  matchMessageText.textContent =
    `${state.names[player]} GANA EL PARTIDO`;

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

  pointsPreset.value = state.pointsToWin;
  servePreset.value = state.serveEvery;
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

/* Puntuación */

players.forEach((player, index) => {
  player.addEventListener("click", event => {
    if (event.target.closest("button, input, select")) {
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

/* Configuración */

pointsPreset.addEventListener("change", () => {
  applySettings();
  render();
});

servePreset.addEventListener("change", () => {
  applySettings();
  render();
});

rescueMode.addEventListener("change", () => {
  applySettings();
  render();
});

/* Botones */

startButton.addEventListener("click", startMatch);
undoButton.addEventListener("click", undo);

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