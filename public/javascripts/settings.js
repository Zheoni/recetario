// Language
const localeSelect = document.getElementById("localeSelect");

const currentLocale = document.cookie.match(/locale=(\w*)/);
if (currentLocale && currentLocale[1]) {
  localeSelect.value = currentLocale[1];
} else {
  localeSelect.value = "";
}

localeSelect.addEventListener("change", (event) => {
  const locale = event.target.value;
  if (locale && locale.length > 0) {
    const expireDate = new Date();
    expireDate.setFullYear((expireDate.getFullYear + 1));
    document.cookie = `locale=${locale}; SameSite=strict; expires=${expireDate.toUTCString()}; Path=/;`;
  } else {
    document.cookie = "locale=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }
  location.reload();
});


// System of units
const unitsFieldset = document.getElementById("unitsFieldset");

const unitSystem = localStorage.getItem("unitSystem");
if (unitSystem) {
  const availableUnits = Array
    .from(document.querySelectorAll("#unitsFieldset input[type=radio]"))
    .map(element => element.id);
  if (availableUnits.includes(unitSystem)) {
    document.getElementById(unitSystem).checked = true;
  }
} else {
  document.getElementById("metric").checked = true;
}

unitsFieldset.addEventListener("change", (event) => {
  const units = event.target.id;
  localStorage.setItem("unitSystem", units);
});


// Temperature
const temperatureFieldset = document.getElementById("temperatureFieldset");

const currentTemperatureUnit = localStorage.getItem("temperatureUnit")
if (currentTemperatureUnit) {
  const availableUnits = Array
    .from(document.querySelectorAll("#temperatureFieldset input[type=radio]"))
    .map(element => element.id);
  if (availableUnits.includes(currentTemperatureUnit)) {
    document.getElementById(currentTemperatureUnit).checked = true;
  }
} else {
  document.getElementById("celsius").checked = true;
}

temperatureFieldset.addEventListener("change", (event) => {
  const tempUnit = event.target.id;
  localStorage.setItem("temperatureUnit", tempUnit);
});



// Best fit
const bestFitCheckbox = document.getElementById("bestFitCheckbox");
const currentBestFit = localStorage.getItem("bestFit");
if (currentBestFit) {
  bestFitCheckbox.checked = currentBestFit === "true";
} else {
  bestFitCheckbox.checked = true;
}

bestFitCheckbox.addEventListener("change", () => {
  const value = bestFitCheckbox.checked;
  localStorage.setItem("bestFit", value);
});


// Delete things
async function deleteCaches() {
  if (!window.caches || document.location.protocol !== "https:") return;
  const keys = await window.caches.keys();
  for (const key of keys) {
    if (key.startsWith("recetario-")) {
      window.caches.delete(key);
      window.console.log("Deleted cache " + key);
    }
  }
  addAlert(bundledLocales["alerts.deletedCaches"], {
    type: "success",
    delay: 5000,
    candismiss: true,
    container: document.getElementById("storedData")
  });
}

document.getElementById("deleteCachesButton")
  .addEventListener("click", () => deleteCaches());

function deleteSettings() {
  document.cookie = "locale=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  localStorage.removeItem("temperatureUnit");
  localStorage.removeItem("unitSystem");
  localStorage.removeItem("bestFit");
  addAlert(bundledLocales["alerts.deletedSettings"], {
    type: "success",
    delay: 5000,
    candismiss: true,
    container: document.getElementById("storedData")
  });
  setTimeout(() => location.reload(), 5500);
}

document.getElementById("deleteSettingsButton")
  .addEventListener("click", () => deleteSettings());
