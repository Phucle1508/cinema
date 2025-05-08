import { API_KEY } from "./config.js";

// Fetch trend movie
const fetchTrending = async (timeWindow) => {
  const url = `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw Error("Network was not ok", response.status);
    }

    const data = await response.json();
    // console.log(data.results);
    return data.results;
  } catch (e) {
    console.log("Error", e);
  }
};

// Fetch popular movie
const fetchPopular = async () => {
  let url = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`;
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

// Hiển thị trend movie
const displayTrendingMovie = (movies) => {
  const movieTrend = document.getElementById("trend-movie");
  movieTrend.innerHTML = "";

  movieTrend.innerHTML = movies
    .map((movie) => {
      return `
      <a href="./info.html?id=${movie.id}" class="swiper-slide">
        <img src="https://image.tmdb.org/t/p/w200/${movie.poster_path}" alt="${movie.title}" />
        <p>${movie.title}</p>
      </a>
    `;
    })
    .join("");
};

// Hiển thị popular movie
const displayPopularMovie = (movies) => {
  const popularMovie = document.getElementById("popular-movie");
  popularMovie.innerHTML = "";

  popularMovie.innerHTML = movies
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

fetchTrending("day").then(displayTrendingMovie);

fetchPopular().then(displayPopularMovie);

// CAROUSEL CINEMA
async function initializeCarousel() {
  try {
    const movies = await fetchTrending("day");
    const currentDate = new Date().getDate();

    // Lấy 3 phim từ danh sách theo ngày hiện tại
    const mainMovies = [
      movies[currentDate % movies.length],
      movies[(currentDate + 1) % movies.length],
      movies[(currentDate + 2) % movies.length],
    ];

    mainMovies.forEach((movie, index) => {
      if (index === 0) {
        document.querySelector(".carousel1").innerHTML += `
        <div class="hero-slide">
          <img 
            id="hero-image-${index}" 
            src="https://image.tmdb.org/t/p/original${movie.backdrop_path}" 
            alt="${movie.title}"
            class="hero-backdrop"
          />
          <div class="hero-content">
            <img 
              id="hero-preview-image-${index}" 
              src="https://image.tmdb.org/t/p/w300${movie.poster_path}" 
              alt="${movie.title}"
              class="hero-poster"
            />
            <div class="hero-info">
              <h1 id="hero-title-${index}">${movie.title || movie.name}</h1>
              <p id="hero-description-${index}">${movie.overview}</p>
              <div class="hero-buttons">
                <a href="#" class="btn btn-primary">
                  <i class="fas fa-play"></i>
                  <span>Xem ngay</span>
                </a>
                <a href="./info.html?id=${movie.id}" class="btn btn-secondary">
                  <i class="fas fa-info-circle"></i>
                  <span>Xem thông tin</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        `;
      }
      if (index === 1) {
        document.querySelector(".carousel2").innerHTML += `
          <div class="hero-slide">
          <img 
            id="hero-image-${index}" 
            src="https://image.tmdb.org/t/p/original${movie.backdrop_path}" 
            alt="${movie.title}"
            class="hero-backdrop"
          />
          <div class="hero-content">
            <img 
              id="hero-preview-image-${index}" 
              src="https://image.tmdb.org/t/p/w300${movie.poster_path}" 
              alt="${movie.title}"
              class="hero-poster"
            />
            <div class="hero-info">
              <h1 id="hero-title-${index}">${movie.title || movie.name}</h1>
              <p id="hero-description-${index}">${movie.overview}</p>
              <div class="hero-buttons">
                <a href="#" class="btn btn-primary">
                  <i class="fas fa-play"></i>
                  <span>Xem ngay</span>
                </a>
                <a href="./info.html?id=${movie.id}" class="btn btn-secondary">
                  <i class="fas fa-info-circle"></i>
                  <span>Xem thông tin</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        `;
      }
      if (index === 2) {
        document.querySelector(".carousel3").innerHTML += `
          <div class="hero-slide">
          <img 
            id="hero-image-${index}" 
            src="https://image.tmdb.org/t/p/original${movie.backdrop_path}" 
            alt="${movie.title}"
            class="hero-backdrop"
          />
          <div class="hero-content">
            <img 
              id="hero-preview-image-${index}" 
              src="https://image.tmdb.org/t/p/w300${movie.poster_path}" 
              alt="${movie.title}"
              class="hero-poster"
            />
            <div class="hero-info">
              <h1 id="hero-title-${index}">${movie.title || movie.name}</h1>
              <p id="hero-description-${index}">${movie.overview}</p>
              <div class="hero-buttons">
                <a href="#" class="btn btn-primary">
                  <i class="fas fa-play"></i>
                  <span>Xem ngay</span>
                </a>
                <a href="./info.html?id=${movie.id}" class="btn btn-secondary">
                  <i class="fas fa-info-circle"></i>
                  <span>Xem thông tin</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        `;
      }
    });
  } catch (error) {
    console.error("Error initializing carousel:", error);
  }
}

initializeCarousel();
const swiper = new Swiper(".swiper", {
  SpaceBetween: 30,
  autoplay: { delay: 5000, disableOnInteraction: true },
  slidesPerView: "auto",
  loop: true,
  slidesPerGroupAuto: true,

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});
