let currentQuestion = null;
let selectedLeft = null;
let userMatches = {};

let efQuestions = [];
let currentEFQuestion = null;

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
  document.getElementById("digestivo-screen").classList.add("hidden");
  document.getElementById("home-screen").classList.remove("hidden");

  const definicionesScreen = document.getElementById("definiciones-screen");
  const efScreen = document.getElementById("ef-screen");

  if (definicionesScreen) definicionesScreen.classList.add("hidden");
  if (efScreen) efScreen.classList.add("hidden");
}

function backToActivities() {
  document.getElementById("definiciones-screen")?.classList.add("hidden");
  document.getElementById("ef-screen")?.classList.add("hidden");
  document.getElementById("digestivo-screen").classList.remove("hidden");
}

function selectActivity(activity) {
  if (activity === "definiciones") {
    loadDefinitions();
  } else if (activity === "ef-principio-activo") {
    loadEFPrincipioActivo();
  } else if (activity === "repaso-fallos") {
    alert("Repaso de fallos aún no implementado.");
  } else {
    alert("Actividad aún no implementada: " + activity);
  }
}

/* DEFINICIONES */

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
  const nextButton = document.getElementById("next-button");

  leftCol.innerHTML = "";
  rightCol.innerHTML = "";
  result.innerHTML = "";

  if (nextButton) nextButton.classList.add("hidden");

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

      const leftItems = document.querySelectorAll("#left-column .match-item");

      leftItems.forEach(leftItem => {
        if (leftItem.dataset.value === selectedLeft) {
          leftItem.classList.remove("selected");
          leftItem.classList.add("matched");
          leftItem.innerText = selectedLeft + " → " + item;
        }
      });

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

  const nextButton = document.getElementById("next-button");
  if (nextButton) nextButton.classList.remove("hidden");
}

function nextDefinitionQuestion() {
  loadDefinitions();
}

function saveWrongAnswer(question, userMatches, score, total) {
  const wrongAnswers = JSON.parse(localStorage.getItem("digestivoWrongAnswers")) || [];

  wrongAnswers.push({
    activity: "definiciones",
    date: new Date().toISOString(),
    prompt: question.prompt,
    questionData: question,
    userMatches: userMatches,
    score: score,
    total: total
  });

  localStorage.setItem("digestivoWrongAnswers", JSON.stringify(wrongAnswers));
}

/* EF ↔ PRINCIPIO ACTIVO */

async function loadEFPrincipioActivo() {
  document.getElementById("digestivo-screen").classList.add("hidden");
  document.getElementById("ef-screen").classList.remove("hidden");

  const response = await fetch("data/atc-digestivo/content.json");
  const content = await response.json();

  const principios = extractPrincipiosActivos(content);
  efQuestions = generateEFQuestions(principios);

  nextEFQuestion();
}

function extractPrincipiosActivos(content) {
  const principios = [];

  content.grupos.forEach(grupo => {
    grupo.subgrupos.forEach(subgrupo => {
      collectPrincipios(subgrupo, grupo, principios);
    });
  });

  return principios.filter(item => item.principioActivo);
}

function collectPrincipios(node, grupo, principios) {
  if (node.principiosActivos) {
    node.principiosActivos.forEach(pa => {
      principios.push({
        principioActivo: pa.nombre,
        ef: pa.ef && pa.ef.length > 0 ? pa.ef : ["No consta EF en el temario"],
        grupo: grupo.codigo,
        subgrupo: node.nombre
      });
    });
  }

  if (node.subgruposInternos) {
    node.subgruposInternos.forEach(interno => {
      collectPrincipios(interno, grupo, principios);
    });
  }
}

function generateEFQuestions(principios) {
  const questions = [];

  principios.forEach(item => {
    const correctAnswer = item.ef.join(" / ");

    questions.push({
      type: "pa-to-ef",
      question: `¿Qué EF corresponde a "${item.principioActivo}"?`,
      correctAnswer: correctAnswer,
      options: generateOptions(correctAnswer, principios.map(p => p.ef.join(" / ")))
    });

    item.ef.forEach(efName => {
      if (efName !== "No consta EF en el temario") {
        questions.push({
          type: "ef-to-pa",
          question: `¿Qué principio activo corresponde a "${efName}"?`,
          correctAnswer: item.principioActivo,
          options: generateOptions(item.principioActivo, principios.map(p => p.principioActivo))
        });
      }
    });
  });

  return shuffleArray(questions);
}

function generateOptions(correctAnswer, allPossibleAnswers) {
  const uniqueAnswers = [...new Set(allPossibleAnswers)]
    .filter(answer => answer && answer !== correctAnswer);

  const wrongOptions = shuffleArray(uniqueAnswers).slice(0, 3);

  return shuffleArray([correctAnswer, ...wrongOptions]);
}

function nextEFQuestion() {
  const result = document.getElementById("ef-result");
  const nextButton = document.getElementById("ef-next-button");

  result.innerText = "";
  nextButton.classList.add("hidden");

  currentEFQuestion = efQuestions[Math.floor(Math.random() * efQuestions.length)];

  document.getElementById("ef-question").innerText = currentEFQuestion.question;

  const optionsContainer = document.getElementById("ef-options");
  optionsContainer.innerHTML = "";

  currentEFQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.innerText = option;

    button.onclick = () => checkEFAnswer(button, option);

    optionsContainer.appendChild(button);
  });
}

function checkEFAnswer(button, selectedAnswer) {
  const options = document.querySelectorAll(".quiz-option");

  options.forEach(option => {
    option.disabled = true;

    if (option.innerText === currentEFQuestion.correctAnswer) {
      option.classList.add("correct");
    }
  });

  if (selectedAnswer === currentEFQuestion.correctAnswer) {
    document.getElementById("ef-result").innerText = "Correcto.";
  } else {
    button.classList.add("incorrect");
    document.getElementById("ef-result").innerText =
      `Incorrecto. La respuesta correcta es: ${currentEFQuestion.correctAnswer}`;

    saveWrongEFAnswer(currentEFQuestion, selectedAnswer);
  }

  document.getElementById("ef-next-button").classList.remove("hidden");
}

function saveWrongEFAnswer(question, selectedAnswer) {
  const wrongAnswers = JSON.parse(localStorage.getItem("digestivoWrongAnswers")) || [];

  wrongAnswers.push({
    activity: "ef-principio-activo",
    date: new Date().toISOString(),
    prompt: question.question,
    questionData: question,
    userAnswer: selectedAnswer,
    correctAnswer: question.correctAnswer
  });

  localStorage.setItem("digestivoWrongAnswers", JSON.stringify(wrongAnswers));
}
