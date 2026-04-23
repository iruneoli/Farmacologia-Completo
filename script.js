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
    document.getElementById("digestivo-screen").classList.add("hidden");
    document.getElementById("definiciones-screen").classList.remove("hidden");
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
