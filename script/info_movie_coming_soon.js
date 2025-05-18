import { db } from "./config.js";
import {
  collection,
  getDocs,
  where,
  query,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const movieTitle = decodeURIComponent(urlParams.get("title"));

const fetchMoviesComingSoonDetails = async () => {
  try {
    const q = query(
      collection(db, "movies-coming-soon"),
      where("title", "==", movieTitle)
    );
    const querySnapshot = await getDocs(q);
    const movieDetails = [];
    querySnapshot.forEach((doc) => {
      movieDetails.push(doc.data());
    });
    return movieDetails;
  } catch (error) {
    console.error("Lỗi khi hiển thị chi tiết phim: ", error);
    return [];
  }
};

const displayMovieDetails = async (movie) => {
  document.getElementById("preview-img").src = `${movie.poster_path}`;
  document.getElementById("movie-title").innerText = movie.title;
  document.getElementById("movie-description").innerText = movie.overview;
  document.getElementById(
    "movie-release-date"
  ).innerText += ` ${movie.release_date}`;
  document.getElementById(
    "watch-trailer-btn"
  ).href = `https://www.youtube.com/results?search_query=${movie.title}+trailer`;
};

fetchMoviesComingSoonDetails().then((movies) => {
  if (movies.length > 0) {
    displayMovieDetails(movies[0]);
  } else {
    console.error("Không tìm thấy thông tin phim");
  }
});
