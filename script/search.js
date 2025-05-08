import { API_KEY } from "./config.js";

document.getElementById("search-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const query = document.getElementById("search-input").value.trim();

  if (query) {
    fetchMovies(query).then(displayMovies);
  }
});

const fetchMovies = async (query) => {
  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
      query
    )}&api_key=${API_KEY}`
  );

  const data = await response.json();

  return data.results;
};

const displayMovies = (movies) => {
  const movieList = document.getElementById("movies");
  movieList.innerHTML = "";

  if (movieList.length == 0) {
    movieList.innerHTML = `<h2>No movies found</h2>`;
    return;
  }

  movies.forEach((movie) => {
    const movieCard = document.createElement("a");
    movieCard.classList.add("movie-item");
    movieCard.setAttribute("href", `info.html?id=${movie.id}`);
    movieCard.innerHTML = `
        <img src = "https://image.tmdb.org/t/p/w200/${movie.poster_path}">
        <p>${movie.title}</p>
    `;

    movieList.appendChild(movieCard);
  });
};
