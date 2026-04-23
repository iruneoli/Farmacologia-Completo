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

async function loadDefinitions() {
  document.getElementById("digestivo-screen").classList.add("hidden");
  document.getElementById("definiciones-screen").classList.remove("hidden");

  const response = await fetch("data/atc-digestivo/questions/definiciones.json");
  const data = await response.json();

  const question = data[0]; // primera pregunta

  renderMatch(question);
}

function renderMatch(question) {
  const leftCol = document.getElementById("left-column");
  const rightCol = document.getElementById("right-column");

  leftCol.innerHTML = "";
  rightCol.innerHTML = "";

  question.leftItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "match-item";
    div.innerText = item;
    leftCol.appendChild(div);
  });

  question.rightItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "match-item";
    div.innerText = item;
    rightCol.appendChild(div);
  });
}
