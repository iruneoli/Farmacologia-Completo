function selectGroup(group) {
  const homeScreen = document.getElementById("home-screen");
  const digestivoScreen = document.getElementById("digestivo-screen");

  if (group === "digestivo") {
    homeScreen.classList.add("hidden");
    digestivoScreen.classList.remove("hidden");
  } else {
    alert("De momento solo está programado ATC Digestivo.");
  }
}

function goHome() {
  const homeScreen = document.getElementById("home-screen");
  const digestivoScreen = document.getElementById("digestivo-screen");

  digestivoScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
}

function selectActivity(activity) {
  if (activity === "definiciones") {
    loadDefinitions();
  } else if (activity === "ef-principio-activo") {
    loadEFPrincipioActivo();
  } else if (activity === "repaso-fallos") {
    alert("Repaso de fallos aún no implementado.");
  } else {
    alert("Has seleccionado la actividad: " + activity);
  }
}

function backToActivities() {
  document.getElementById("definiciones-screen").classList.add("hidden");
  document.getElementById("digestivo-screen").classList.remove("hidden");
}

let currentQuestion = null;
let selectedLeft = null;
let userMatches = {};

async function loadDefinitions() {
  document.getElementById("digestivo-screen").classList.add("hidden");
  document.getElementById("definiciones-screen").classList.remove("hidden");

  const response = await fetch("data/atc-digestivo/questions/definiciones.json");
  const data = await response.json();

  currentQuestion = data[Math.floor(Math.random() * data.length)];

  renderMatch(currentQuestion);
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function renderMatch(question) {
  const leftCol = document.getElementById("left-column");
  const rightCol = document.getElementById("right-column");
  const result = document.getElementById("result");

  leftCol.innerHTML = "";
  rightCol.innerHTML = "";
  result.innerHTML = "";
document.getElementById("next-button").classList.add("hidden");
  selectedLeft = null;
  userMatches = {};

  const shuffledLeft = shuffleArray(question.leftItems);
  const shuffledRight = shuffleArray(question.rightItems);

  shuffledLeft.forEach(item => {
    const div = document.createElement("div");
    div.className = "match-item";
    div.innerText = item;
    div.dataset.value = item;

    div.onclick = () => {
      document.querySelectorAll("#left-column .match-item").forEach(el => {
        el.classList.remove("selected");
      });

      div.classList.add("selected");
      selectedLeft = item;
    };

    leftCol.appendChild(div);
  });

  shuffledRight.forEach(item => {
    const div = document.createElement("div");
    div.className = "match-item";
    div.innerText = item;
    div.dataset.value = item;

    div.onclick = () => {
      if (!selectedLeft) {
        result.innerText = "Primero selecciona un concepto de la columna izquierda.";
        return;
      }

      userMatches[selectedLeft] = item;

      const leftSelected = document.querySelector(
        `#left-column .match-item[data-value="${CSS.escape(selectedLeft)}"]`
      );

      if (leftSelected) {
        leftSelected.classList.remove("selected");
        leftSelected.classList.add("matched");
        leftSelected.innerText = selectedLeft + " → " + item;
      }

      selectedLeft = null;
      result.innerText = "";
    };

    rightCol.appendChild(div);
  });
}

function checkAnswers() {
  if (!currentQuestion) return;

  let correct = 0;
  const total = currentQuestion.leftItems.length;

  currentQuestion.leftItems.forEach(leftItem => {
    if (userMatches[leftItem] === currentQuestion.correctMatches[leftItem]) {
      correct++;
    }
  });

  document.getElementById("result").innerText =
  `Has acertado ${correct} de ${total}.`;

if (correct < total) {
  saveWrongAnswer(currentQuestion, userMatches, correct, total);
}

document.getElementById("next-button").classList.remove("hidden");

function nextDefinitionQuestion() {
  loadDefinitions();
}

function saveWrongAnswer(question, userMatches, score, total) {
  const wrongAnswers = JSON.parse(localStorage.getItem("digestivoWrongAnswers")) || [];

  const wrongQuestion = {
    activity: "definiciones",
    date: new Date().toISOString(),
    prompt: question.prompt,
    questionData: question,
    userMatches: userMatches,
    score: score,
    total: total
  };

  wrongAnswers.push(wrongQuestion);

  localStorage.setItem("digestivoWrongAnswers", JSON.stringify(wrongAnswers));
}
