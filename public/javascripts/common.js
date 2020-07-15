// Javascript that runs on every page

// Give corrent format to date. Done in client due to timezones
const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

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

    const dateString = `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
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


// Search-bar
function search_pressed() {
  console.log("search")
}
