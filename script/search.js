import { API_KEY } from "./config.js";
import {
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth } from "./config.js";

// Kiểm tra xem người dùng đã đăng nhập chưa
function renderHeader() {
  const authSection = document.querySelector("#authSection");
  authSection.innerHTML = ``;
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      authSection.innerHTML += `
                <a href='./login_register.html'">Đăng nhập</a>
            `;
    } else if (user.email == "admin@gmail.com") {
      const avatarURL = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        user.email || "Guest"
      )}`;
      authSection.innerHTML += `
                <a id="test" href="./manage.html">Quản lý</a>
                <div class="user-info">
                  <img src="${avatarURL}" alt="avatar" class="user-avatar"/>
                  <p>${user.email}</p>
                  <button class="action-button" id="btn">Đăng xuất</button>
                </div>`;
    } else {
      const avatarURL = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        user.email || "Guest"
      )}`;
      authSection.innerHTML += `
                <a href="./search.html"><i class="fa-solid fa-magnifying-glass"></i></a>
                <a href="#"><i class="fa-regular fa-heart"></i></a>
                <div class="user-info">
                  <img src="${avatarURL}" alt="avatar" class="user-avatar"/>
                  <p>${user.email}</p>
                  <button class="action-button" id="btn">Đăng xuất</button>
                </div>`;
    }

    // Xử lý đăng xuất
    const btn = document.getElementById("btn");
    if (btn) {
      btn.addEventListener("click", async () => {
        try {
          await signOut(auth);
          alert("Đăng xuất thành công");
          window.location.reload();
        } catch (error) {
          console.error("Error signOut user:", errorCode, errorMessage);
          alert("Error signOut user: " + errorMessage);
        }
      });
    }
  });
}
renderHeader();

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
