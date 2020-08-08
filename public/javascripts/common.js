// Javascript that runs on every page

// Give corrent format to date. Done in client due to timezones
const dates = document.getElementsByClassName("date-to-format");

for (let element of dates) {
  const regex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;

  const match = regex.exec(element.textContent);

  if (match) {
    const date = new Date(Date.UTC(
      match[1],
      match[2] - 1,
      match[3],
      match[4],
      match[5],
      match[6]));

    const dateString = Intl.DateTimeFormat(document.documentElement.lang, {
      weekday: "long",
      day: "numeric",
      year: "numeric",
      month: "long"
    }).format(date);
    element.textContent = dateString;
  }
}


// Current page navbar highlight
const currentPage = document.getElementById("current-page");

if (currentPage) {
  switch (currentPage.content) {
    case "index":
      document.getElementById("nav-home").classList.add('active');
      break;
    case "create":
      document.getElementById("nav-create").classList.add('active');
      break;
    case "about":
      document.getElementById("nav-about").classList.add('active');
      break;
  }
}


// Alerts
const main_element = document.getElementsByTagName("main")[0];

function dismissAlert(alert_div, withDelay = false) {
  if (!alert_div) return;
  
  if (withDelay) {
    alert_div.classList.add("fade-out");
    setTimeout((element) => {
      element.classList.add("hidden");
    }, 500, alert_div);
  } else {
    alert_div.classList.add("hidden");
  }
}

function addAlert(content, options = {type, delay, candismiss, container, scrollback, id}) {
  const defaults = {
    type: "default",
    delay: -1,
    candismiss: false,
    container: main_element,
    scrollback: false,
    id: null
  };

  options = Object.assign({}, defaults, options);

  const alert_div = document.createElement("div");
  alert_div.classList.add("alert", `alert-${options.type}`);
  alert_div.textContent = content;

  if (options.id) {
    alert_div.id = options.id;
  }

  if (options.candismiss) {
    const dismiss_button = document.createElement("button");
    dismiss_button.setAttribute("type", "button");
    dismiss_button.classList.add("close");
    dismiss_button.innerHTML = "&times;";

    dismiss_button.onclick = () => dismissAlert(alert_div);
    alert_div.appendChild(dismiss_button);
  }

  options.container.insertBefore(alert_div, options.container.firstChild);

  if (options.scrollback) {
    window.scrollTo(0, 0);
  }

  if (options.delay >= 0) {
    setTimeout((element) => {
      dismissAlert(element, true);
    }, options.delay, alert_div);
  }

  return alert_div;
}

const alerts = document.getElementsByName("alert");
for (let i = 0; i < alerts.length; ++i) {
  const meta_element = alerts[i];

  const content = meta_element.content;
  const type = meta_element.getAttribute("type") || "success";
  const delay = Number(meta_element.getAttribute("delay")) || -1;
  const candismiss = meta_element.getAttribute("candismiss") === "true" || false;

  addAlert(content, {type, delay, candismiss});
}


// Tags icons
function setTagIcon(tag, classes) {
  const icon = document.createElement("i");
  tag.insertBefore(icon, tag.firstChild);
  icon.outerHTML = `<i class="${classes.join(" ")}"></i>`;
}

const timeTags = document.getElementsByClassName("time-tag");
for (let i = 0; i < timeTags.length; ++i) {
  setTagIcon(timeTags[i], ["far", "fa-clock"]);
}

const typeTags = document.getElementsByClassName("type-tag");
for (let i = 0; i < typeTags.length; ++i) {
  setTagIcon(typeTags[i], ["fas", "fa-concierge-bell"]);
}

const servingsTag = document.getElementsByClassName("servings-tag");
for (let i = 0; i < servingsTag.length; ++i) {
  setTagIcon(servingsTag[i], ["fas", "fa-users"]);
}
