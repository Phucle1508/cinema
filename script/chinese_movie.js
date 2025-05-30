/* Giống popular movie */
import { API_KEY } from "./config.js";
const fetchChineseMovie = async () => {
  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_origin_country=CN&sort_by=popularity.desc

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

const displayChineseMovie = (movies) => {
  const chineseMovie = document.getElementById("chinese-movie");
  chineseMovie.innerHTML = "";

  chineseMovie.innerHTML = movies
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

fetchChineseMovie().then(displayChineseMovie);
