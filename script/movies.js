/* Giống popular movie */
import { API_KEY } from "./config.js";
const fetchMovies = async () => {
  let url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=vi-VN&region=VN

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

const displayMovies = (movies) => {
  const Movies = document.getElementById("movies");
  Movies.innerHTML = "";

  Movies.innerHTML = movies
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

fetchMovies().then(displayMovies);
