import { API_KEY } from "./config.js";

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("id");

if (!movieId) {
  window.location.href = "./index.html";
}
