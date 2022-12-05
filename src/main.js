import "./style.css";
const appUrl = import.meta.env.VITE_APP_URL;
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("accessToken")) {
    window.location.href = `${appUrl}/dashboard/dashboard.html`;
  } else {
    window.location.href = `${appUrl}/login/login.html`;
  }
});
