// Language
const localeSelect = document.getElementById("localeSelect");

const currentLocale = document.cookie.match(/locale=(\w*)/);
if (currentLocale && currentLocale[1]) {
  console.log(currentLocale[1])
  localeSelect.value = currentLocale[1];
}

localeSelect.addEventListener("change", (event) => {
  const locale = event.target.value;
  if (locale && locale.length > 0) {
    const expireDate = new Date();
    expireDate.setMonth((expireDate.getMonth() + 1 % 12));
    document.cookie = `locale=${locale}; SameSite=strict; expires=${expireDate.toUTCString()}; Path=/;` ;
    location.reload();
  } else {
    document.cookie = "locale=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }
});
