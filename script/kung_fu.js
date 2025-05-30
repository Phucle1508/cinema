/* Giống popular movie */
import { API_KEY } from "./config.js";
const fetchKungFu = async () => {
  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_keywords=780

`;
  try {
    let resp = await fetch(url);
    if (!resp.ok) {
      throw new Error("Network was not ok", resp.status);
    }

    let data = await resp.json();
    // console.log(data.results);
    return data.results;
  } catch (e) {
    console.log("Error", e);
  }
};

const displayKungFu = (movies) => {
  const kungfu = document.getElementById("kung-fu");
  kungfu.innerHTML = "";

  kungfu.innerHTML = movies
    .map((item) => {
      return `
        <a href="./info.html?id=${item.id}" class="movie-card">
          <img src="https://image.tmdb.org/t/p/w200/${item.poster_path}" alt="${item.title}" />
          <p>${item.title}</p>
        </a>
      `;
    })
    .join("");
};

fetchKungFu().then(displayKungFu);
