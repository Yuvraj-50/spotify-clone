import {ACCESS_TOKEN, EXPIRES_IN, TOKEN_TYPE} from "../common";

const CLIENT_KEY = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const scopes =
  "user-top-read user-follow-read playlist-read-private user-library-read";

const APP_URL = import.meta.env.VITE_APP_URL;

const authorizeUser = () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_KEY}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${scopes}&show_dialog=true`;

  window.open(url, "login", "width=800,height=600");
};

window.setLocalStorage = ({accessToken, tokenType, expiresIn}) => {
  localStorage.setItem(ACCESS_TOKEN, accessToken);
  localStorage.setItem(TOKEN_TYPE, tokenType);
  localStorage.setItem(EXPIRES_IN, Date.now() + expiresIn * 1000);
  window.location.href = APP_URL;
};

///////////////// event listners /////////////////////////
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-to-spotify-btn");
  loginBtn.addEventListener("click", authorizeUser);
});

window.addEventListener("load", () => {
  const accessTokenKey = localStorage.getItem(ACCESS_TOKEN);

  if (accessTokenKey) {
    window.location.href = `${APP_URL}/dashboard/dashboard.html`;
  }

  if (window.opener !== null && !window.opener.closed) {
    window.focus();
    if (window.location.href.includes("error")) {
      window.close();
    }

    const {hash} = window.location;
    const searchparams = new URLSearchParams(hash);
    const accessToken = searchparams.get("#access_token");
    const tokenType = searchparams.get("token_type");
    const expiresIn = searchparams.get("expires_in");

    if (accessToken) {
      window.close();
      window.opener.setLocalStorage({accessToken, tokenType, expiresIn});
    } else {
      window.close();
    }
  }
});
