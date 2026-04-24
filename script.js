let currentQuestion = null;
let selectedLeft = null;
let userMatches = {};

let efQuestions = [];
let currentEFQuestion = null;

let vfQuestions = [];
let currentVFQuestion = null;

let testQuestions = [];
let currentTestQuestion = null;

let adverseQuestions = [];
let currentAdverseQuestion = null;

let wrongQuestions = [];
let currentWrongIndex = 0;
let currentWrongQuestion = null;

/*Antiinfeccioso*/
let currentATC = "digestivo";

/* NAVEGACIÓN */

function selectGroup(group) {
  const homeScreen = document.getElementById("home-screen");
  const digestivoScreen = document.getElementById("digestivo-screen");
  const antiinfeccionScreen = document.getElementById("antiinfeccion-screen");

  homeScreen.classList.add("hidden");

  if (group === "digestivo") {
    currentATC = "digestivo";
    digestivoScreen.classList.remove("hidden");
  } else if (group === "antiinfeccion") {
    currentATC = "antiinfeccion";
    antiinfeccionScreen.classList.remove("hidden");
  } else {
    homeScreen.classList.remove("hidden");
    alert("Este ATC todavía no está programado.");
  }
}

function goHome() {
  document.getElementById("home-screen").classList.remove("hidden");

  document.getElementById("digestivo-screen")?.classList.add("hidden");
  document.getElementById("antiinfeccion-screen")?.classList.add("hidden");

  document.getElementById("definiciones-screen")?.classList.add("hidden");
  document.getElementById("vf-screen")?.classList.add("hidden");
  document.getElementById("test-screen")?.classList.add("hidden");
  document.getElementById("ef-screen")?.classList.add("hidden");
  document.getElementById("adverse-screen")?.classList.add("hidden");
  document.getElementById("wrong-screen")?.classList.add("hidden");
}

function backToActivities() {
  document.getElementById("definiciones-screen")?.classList.add("hidden");
  document.getElementById("vf-screen")?.classList.add("hidden");
  document.getElementById("test-screen")?.classList.add("hidden");
  document.getElementById("ef-screen")?.classList.add("hidden");
  document.getElementById("adverse-screen")?.classList.add("hidden");
  document.getElementById("wrong-screen")?.classList.add("hidden");

  if (currentATC === "digestivo") {
    document.getElementById("digestivo-screen").classList.remove("hidden");
  } else if (currentATC === "antiinfeccion") {
    document.getElementById("antiinfeccion-screen").classList.remove("hidden");
  }
}

function selectActivity(activity) {
  if (activity === "definiciones") {
    loadDefinitions();
  } else if (activity === "verdadero-falso") {
    loadVFQuestions();
  } else if (activity === "test") {
    loadTestQuestions();
  } else if (activity === "ef-principio-activo") {
    loadEFPrincipioActivo();
  } else if (activity === "efectos-adversos") {
    loadAdverseQuestions();
  } else if (activity === "repaso-fallos") {
    loadWrongQuestions();
  } else {
    alert("Actividad aún no implementada: " + activity);
  }
}

/* GUARDADO GENERAL DE ERRORES */

function saveWrongAnswer(entry) {
  const wrongAnswers =
    JSON.parse(localStorage.getItem("digestivoWrongAnswers")) || [];

  wrongAnswers.push({
    atc: "digestivo",
    date: new Date().toISOString(),
    ...entry
  });

  localStorage.setItem("digestivoWrongAnswers", JSON.stringify(wrongAnswers));
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

      document.querySelectorAll("#left-column .match-item").forEach(leftItem => {
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
    saveWrongAnswer({
      activity: "definiciones",
      prompt: currentQuestion.prompt,
      questionData: currentQuestion,
      userAnswer: userMatches,
      correctAnswer: currentQuestion.correctMatches,
      score: correct,
      total: total
    });
  }

  document.getElementById("next-button")?.classList.remove("hidden");
}

function nextDefinitionQuestion() {
  loadDefinitions();
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
        ef:
          pa.ef && pa.ef.length > 0
            ? pa.ef
            : ["No consta EF en el temario"],
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
      options: generateOptions(
        correctAnswer,
        principios.map(p => p.ef.join(" / "))
      )
    });

    item.ef.forEach(efName => {
      if (efName !== "No consta EF en el temario") {
        questions.push({
          type: "ef-to-pa",
          question: `¿Qué principio activo corresponde a "${efName}"?`,
          correctAnswer: item.principioActivo,
          options: generateOptions(
            item.principioActivo,
            principios.map(p => p.principioActivo)
          )
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

  currentEFQuestion =
    efQuestions[Math.floor(Math.random() * efQuestions.length)];

  document.getElementById("ef-question").innerText =
    currentEFQuestion.question;

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
  document.querySelectorAll(".quiz-option").forEach(option => {
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

    saveWrongAnswer({
      activity: "ef-principio-activo",
      prompt: currentEFQuestion.question,
      questionData: currentEFQuestion,
      userAnswer: selectedAnswer,
      correctAnswer: currentEFQuestion.correctAnswer
    });
  }

  document.getElementById("ef-next-button").classList.remove("hidden");
}

async function loadVFQuestions() {
  document.getElementById("digestivo-screen").classList.add("hidden");
  document.getElementById("vf-screen").classList.remove("hidden");

  const response = await fetch("data/atc-digestivo/questions/verdadero-falso.json");
  vfQuestions = await response.json();

  nextVFQuestion();
}

function nextVFQuestion() {
  const result = document.getElementById("vf-result");
  const justification = document.getElementById("vf-justification");
  const nextButton = document.getElementById("vf-next-button");

  result.innerText = "";
  justification.innerText = "";
  justification.classList.remove("show");
  nextButton.classList.add("hidden");

  document.querySelectorAll(".vf-button").forEach(button => {
    button.disabled = false;
    button.classList.remove("correct", "incorrect");
  });

  currentVFQuestion =
    vfQuestions[Math.floor(Math.random() * vfQuestions.length)];

  document.getElementById("vf-question").innerText =
    currentVFQuestion.statement;
}

function checkVFAnswer(userAnswer) {
  if (!currentVFQuestion) return;

  const isCorrect = userAnswer === currentVFQuestion.answer;

  document.querySelectorAll(".vf-button").forEach(button => {
    button.disabled = true;
  });

  const trueButton = document.querySelector(".true-button");
  const falseButton = document.querySelector(".false-button");

  if (currentVFQuestion.answer === true) {
    trueButton.classList.add("correct");
    if (!isCorrect) falseButton.classList.add("incorrect");
  } else {
    falseButton.classList.add("correct");
    if (!isCorrect) trueButton.classList.add("incorrect");
  }

  document.getElementById("vf-result").innerText = isCorrect
    ? "Correcto."
    : "Incorrecto.";

  const justification = document.getElementById("vf-justification");
  justification.innerText = currentVFQuestion.justification;
  justification.classList.add("show");

  if (!isCorrect) {
    saveWrongAnswer({
      activity: "verdadero-falso",
      prompt: currentVFQuestion.statement,
      questionData: currentVFQuestion,
      userAnswer: userAnswer ? "Verdadero" : "Falso",
      correctAnswer: currentVFQuestion.answer ? "Verdadero" : "Falso",
      justification: currentVFQuestion.justification
    });
  }

  document.getElementById("vf-next-button").classList.remove("hidden");
}
async function loadTestQuestions() {
  document.getElementById("digestivo-screen").classList.add("hidden");
  document.getElementById("test-screen").classList.remove("hidden");

  const response = await fetch("data/atc-digestivo/questions/test.json");
  testQuestions = await response.json();

  nextTestQuestion();
}

function nextTestQuestion() {
  const result = document.getElementById("test-result");
  const explanation = document.getElementById("test-explanation");
  const nextButton = document.getElementById("test-next-button");

  result.innerText = "";
  explanation.innerText = "";
  explanation.classList.remove("show");
  nextButton.classList.add("hidden");

  currentTestQuestion =
    testQuestions[Math.floor(Math.random() * testQuestions.length)];

  document.getElementById("test-question").innerText =
    currentTestQuestion.question;

  const optionsContainer = document.getElementById("test-options");
  optionsContainer.innerHTML = "";

  currentTestQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.innerText = option;

    button.onclick = () => checkTestAnswer(button, option);

    optionsContainer.appendChild(button);
  });
}

function checkTestAnswer(button, selectedAnswer) {
  if (!currentTestQuestion) return;

  const isCorrect = selectedAnswer === currentTestQuestion.correctAnswer;

  document.querySelectorAll("#test-options .quiz-option").forEach(option => {
    option.disabled = true;

    if (option.innerText === currentTestQuestion.correctAnswer) {
      option.classList.add("correct");
    }
  });

  if (isCorrect) {
    document.getElementById("test-result").innerText = "Correcto.";
  } else {
    button.classList.add("incorrect");
    document.getElementById("test-result").innerText =
      `Incorrecto. La respuesta correcta es: ${currentTestQuestion.correctAnswer}`;

    saveWrongAnswer({
      activity: "test",
      prompt: currentTestQuestion.question,
      questionData: currentTestQuestion,
      userAnswer: selectedAnswer,
      correctAnswer: currentTestQuestion.correctAnswer,
      explanation: currentTestQuestion.explanation
    });
  }

  const explanation = document.getElementById("test-explanation");
  explanation.innerText = currentTestQuestion.explanation;
  explanation.classList.add("show");

  document.getElementById("test-next-button").classList.remove("hidden");
}

async function loadAdverseQuestions() {
  document.getElementById("digestivo-screen").classList.add("hidden");
  document.getElementById("adverse-screen").classList.remove("hidden");

  const response = await fetch("data/atc-digestivo/content.json");
  const content = await response.json();

  const medicines = extractMedicinesForAdverse(content);
  adverseQuestions = generateAdverseQuestions(medicines);

  nextAdverseQuestion();
}

function extractMedicinesForAdverse(content) {
  const medicines = [];

  content.grupos.forEach(grupo => {
    grupo.subgrupos.forEach(subgrupo => {
      collectMedicinesForAdverse(subgrupo, grupo, medicines);
    });
  });

  return medicines.filter(item => item.name);
}

function collectMedicinesForAdverse(node, grupo, medicines) {
  if (node.principiosActivos) {
    node.principiosActivos.forEach(pa => {
      const adverse =
        pa.efectosAdversos && pa.efectosAdversos.length > 0
          ? pa.efectosAdversos.join(" / ")
          : "No consta efecto adverso en el temario";

      medicines.push({
        name: pa.nombre,
        ef: pa.ef || [],
        adverse: adverse,
        grupo: grupo.codigo,
        subgrupo: node.nombre
      });

      if (pa.ef && pa.ef.length > 0) {
        pa.ef.forEach(efName => {
          medicines.push({
            name: efName,
            ef: [],
            adverse: adverse,
            grupo: grupo.codigo,
            subgrupo: node.nombre
          });
        });
      }
    });
  }

  if (node.subgruposInternos) {
    node.subgruposInternos.forEach(interno => {
      collectMedicinesForAdverse(interno, grupo, medicines);
    });
  }
}

function generateAdverseQuestions(medicines) {
  const allAnswers = [
    ...new Set(medicines.map(item => item.adverse))
  ];

  return shuffleArray(
    medicines.map(item => {
      return {
        question: `El medicamento "${item.name}", ¿qué efecto adverso tiene?`,
        correctAnswer: item.adverse,
        options: generateOptions(item.adverse, allAnswers)
      };
    })
  );
}

function nextAdverseQuestion() {
  const result = document.getElementById("adverse-result");
  const nextButton = document.getElementById("adverse-next-button");

  result.innerText = "";
  nextButton.classList.add("hidden");

  currentAdverseQuestion =
    adverseQuestions[Math.floor(Math.random() * adverseQuestions.length)];

  document.getElementById("adverse-question").innerText =
    currentAdverseQuestion.question;

  const optionsContainer = document.getElementById("adverse-options");
  optionsContainer.innerHTML = "";

  currentAdverseQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.innerText = option;

    button.onclick = () => checkAdverseAnswer(button, option);

    optionsContainer.appendChild(button);
  });
}

function checkAdverseAnswer(button, selectedAnswer) {
  if (!currentAdverseQuestion) return;

  const isCorrect = selectedAnswer === currentAdverseQuestion.correctAnswer;

  document.querySelectorAll("#adverse-options .quiz-option").forEach(option => {
    option.disabled = true;

    if (option.innerText === currentAdverseQuestion.correctAnswer) {
      option.classList.add("correct");
    }
  });

  if (isCorrect) {
    document.getElementById("adverse-result").innerText = "Correcto.";
  } else {
    button.classList.add("incorrect");
    document.getElementById("adverse-result").innerText =
      `Incorrecto. La respuesta correcta es: ${currentAdverseQuestion.correctAnswer}`;

    saveWrongAnswer({
      activity: "efectos-adversos",
      prompt: currentAdverseQuestion.question,
      questionData: currentAdverseQuestion,
      userAnswer: selectedAnswer,
      correctAnswer: currentAdverseQuestion.correctAnswer
    });
  }

  document.getElementById("adverse-next-button").classList.remove("hidden");
}

function loadWrongQuestions() {
  document.getElementById("digestivo-screen").classList.add("hidden");
  document.getElementById("wrong-screen").classList.remove("hidden");

  wrongQuestions =
    JSON.parse(localStorage.getItem("digestivoWrongAnswers")) || [];

  currentWrongIndex = 0;

  renderWrongQuestion();
}

function renderWrongQuestion() {
  const counter = document.getElementById("wrong-counter");
  const content = document.getElementById("wrong-content");

  wrongQuestions =
    JSON.parse(localStorage.getItem("digestivoWrongAnswers")) || [];

  counter.innerText = `Tienes ${wrongQuestions.length} pregunta(s) fallada(s) guardada(s).`;

  if (wrongQuestions.length === 0) {
    content.innerHTML = `
      <p class="quiz-question">No tienes preguntas falladas pendientes.</p>
      <p class="quiz-result">Cuando falles alguna pregunta, aparecerá aquí para repasarla.</p>
    `;
    return;
  }

  if (currentWrongIndex >= wrongQuestions.length) {
    currentWrongIndex = 0;
  }

  currentWrongQuestion = wrongQuestions[currentWrongIndex];

  if (currentWrongQuestion.activity === "definiciones") {
    renderWrongDefinition(currentWrongQuestion, content);
  } else if (
    currentWrongQuestion.activity === "verdadero-falso" ||
    currentWrongQuestion.activity === "test" ||
    currentWrongQuestion.activity === "ef-principio-activo" ||
    currentWrongQuestion.activity === "efectos-adversos"
  ) {
    renderWrongQuiz(currentWrongQuestion, content);
  } else {
    content.innerHTML = `
      <p class="quiz-question">Tipo de pregunta no reconocido.</p>
      <button class="next-button" onclick="removeCurrentWrongQuestion()">Eliminar de fallos</button>
    `;
  }
}

function renderWrongQuiz(wrongQuestion, content) {
  const questionData = wrongQuestion.questionData;

  let questionText =
    wrongQuestion.prompt ||
    questionData.question ||
    questionData.statement ||
    "Pregunta sin texto";

  let options = [];

  if (wrongQuestion.activity === "verdadero-falso") {
    options = ["Verdadero", "Falso"];
  } else {
    options = questionData.options || [];
  }

  content.innerHTML = `
    <p class="quiz-question">${questionText}</p>
    <div id="wrong-options" class="quiz-options"></div>
    <div id="wrong-result" class="quiz-result"></div>
    <div id="wrong-explanation" class="quiz-justification"></div>
  `;

  const optionsContainer = document.getElementById("wrong-options");

  options.forEach(option => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.innerText = option;

    button.onclick = () => checkWrongQuizAnswer(button, option);

    optionsContainer.appendChild(button);
  });
}

function checkWrongQuizAnswer(button, selectedAnswer) {
  const wrongQuestion = currentWrongQuestion;

  let correctAnswer = wrongQuestion.correctAnswer;

  document.querySelectorAll("#wrong-options .quiz-option").forEach(option => {
    option.disabled = true;

    if (option.innerText === correctAnswer) {
      option.classList.add("correct");
    }
  });

  const isCorrect = selectedAnswer === correctAnswer;

  const result = document.getElementById("wrong-result");
  const explanation = document.getElementById("wrong-explanation");

  if (isCorrect) {
    result.innerText = "Correcto. Esta pregunta sale del repaso de fallos.";
    removeCurrentWrongQuestion();

    setTimeout(() => {
      renderWrongQuestion();
    }, 900);
  } else {
    button.classList.add("incorrect");
    result.innerText = `Incorrecto. La respuesta correcta es: ${correctAnswer}`;

    if (wrongQuestion.justification || wrongQuestion.explanation) {
      explanation.innerText = wrongQuestion.justification || wrongQuestion.explanation;
      explanation.classList.add("show");
    }

    const nextButton = document.createElement("button");
    nextButton.className = "next-button";
    nextButton.innerText = "Siguiente fallo";
    nextButton.onclick = nextWrongQuestion;

    result.after(nextButton);
  }
}

function renderWrongDefinition(wrongQuestion, content) {
  const question = wrongQuestion.questionData;

  content.innerHTML = `
    <p class="quiz-question">${question.prompt}</p>

    <div class="match-container">
      <div id="wrong-left-column" class="match-column"></div>
      <div id="wrong-right-column" class="match-column"></div>
    </div>

    <div class="definition-actions">
      <button class="check-button" onclick="checkWrongDefinitionAnswer()">Comprobar</button>
    </div>

    <div id="wrong-result" class="quiz-result"></div>
  `;

  const leftCol = document.getElementById("wrong-left-column");
  const rightCol = document.getElementById("wrong-right-column");

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
      document.querySelectorAll("#wrong-left-column .match-item").forEach(el => {
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
        document.getElementById("wrong-result").innerText =
          "Primero selecciona un concepto de la columna izquierda.";
        return;
      }

      userMatches[selectedLeft] = item;

      document.querySelectorAll("#wrong-left-column .match-item").forEach(leftItem => {
        if (leftItem.dataset.value === selectedLeft) {
          leftItem.classList.remove("selected");
          leftItem.classList.add("matched");
          leftItem.innerText = selectedLeft + " → " + item;
        }
      });

      selectedLeft = null;
      document.getElementById("wrong-result").innerText = "";
    };

    rightCol.appendChild(div);
  });
}

function checkWrongDefinitionAnswer() {
  const question = currentWrongQuestion.questionData;

  let correct = 0;
  const total = question.leftItems.length;

  question.leftItems.forEach(leftItem => {
    if (userMatches[leftItem] === question.correctMatches[leftItem]) {
      correct++;
    }
  });

  const result = document.getElementById("wrong-result");

  if (correct === total) {
    result.innerText = `Correcto. Has acertado ${correct} de ${total}. Esta pregunta sale del repaso de fallos.`;
    removeCurrentWrongQuestion();

    setTimeout(() => {
      renderWrongQuestion();
    }, 900);
  } else {
    result.innerText = `Incorrecto. Has acertado ${correct} de ${total}. Esta pregunta seguirá en fallos.`;

    const nextButton = document.createElement("button");
    nextButton.className = "next-button";
    nextButton.innerText = "Siguiente fallo";
    nextButton.onclick = nextWrongQuestion;

    result.after(nextButton);
  }
}

function removeCurrentWrongQuestion() {
  const wrongAnswers =
    JSON.parse(localStorage.getItem("digestivoWrongAnswers")) || [];

  wrongAnswers.splice(currentWrongIndex, 1);

  localStorage.setItem("digestivoWrongAnswers", JSON.stringify(wrongAnswers));

  wrongQuestions = wrongAnswers;
}

function nextWrongQuestion() {
  currentWrongIndex++;

  if (currentWrongIndex >= wrongQuestions.length) {
    currentWrongIndex = 0;
  }

  renderWrongQuestion();
}
