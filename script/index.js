import { API_KEY } from "./config.js";
import { auth, db } from "./config.js";
import {
  collection,
  getDocs,
  addDoc,
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

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

// Fetch movies coming soon from Firebase
const fetchMoviesComingSoon = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "movies-coming-soon"));
    const movies = [];
    querySnapshot.forEach((doc) => {
      movies.push(doc.data());
    });
    return movies;
  } catch (error) {
    console.error("Lỗi khi tải danh sách phim sắp chiếu:", error);
    return [];
  }
};

// Fetch room services
const fetchRoomServices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "services"));
    const services = [];
    querySnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    return services;
  } catch (error) {
    console.error("Lỗi khi tải danh sách phòng:", error);
    return [];
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

// Hiển thị phim sắp chiếu
const displayMoviesComingSoon = (movies) => {
  const movieComingSoon = document.getElementById("movies-coming-soon");
  movieComingSoon.innerHTML = "";

  if (movies.length === 0) {
    movieComingSoon.innerHTML = `
      <div class="no-movies">
        <h3>Chưa có phim sắp chiếu</h3>
      </div>
    `;
    return;
  }

  movieComingSoon.innerHTML = movies
    .map((movie) => {
      return `
      <a href="./info_movie_coming_soon.html?title=${movie.title}" class="movie-card">
        <img src="${movie.poster_path}" alt="${movie.title}" />
        <p>${movie.title}</p>
      </a>
    `;
    })
    .join("");
};

// Hiển thị dịch vụ phòng
const displayRoomServices = (services) => {
  const roomServicesList = document.getElementById("room-services-list");
  roomServicesList.innerHTML = "";

  if (services.length === 0) {
    roomServicesList.innerHTML = `
      <div class="no-services">
        <h3>Không có phòng</h3>
      </div>
    `;
    return;
  }

  roomServicesList.innerHTML = services
    .map(
      (service) => `
      <div class="room-card">
        <img src="${service.image}" alt="${service.name}" />
        <div class="room-info">
          <h3>${service.name}</h3>
          <p>${service.description}</p>
          <div class="room-price">${service.price}đ/giờ</div>
          <button class="book-btn" data-room-id="${service.id}">Đặt phòng</button>
        </div>
      </div>
    `
    )
    .join("");

  const bookButtons = document.querySelectorAll(".book-btn");
  bookButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          alert("Vui lòng đăng nhập để đặt phòng");
          return;
        } else {
          const roomId = e.target.getAttribute("data-room-id");
          openBookingModal(roomId);
        }
      });
    });
  });
};

fetchTrending("day").then(displayTrendingMovie);

fetchPopular().then(displayPopularMovie);

fetchMoviesComingSoon().then(displayMoviesComingSoon);

fetchRoomServices().then(displayRoomServices);

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
                <a href="./watch.html?id=${movie.id}" class="btn btn-primary">
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
                <a href="./watch.html?id=${movie.id}" class="btn btn-primary">
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
                <a href="./watch.html?id=${movie.id}" class="btn btn-primary">
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

// Đặt lịch
const modal = document.getElementById("bookingModal");
const closeBtn = document.querySelector(".close-btn");
const bookingForm = document.getElementById("bookingForm");

function openBookingModal(roomId) {
  modal.classList.add("active");
  bookingForm.setAttribute("data-room-id", roomId);

  // Đặt ngày tối thiểu là hôm nay
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("bookingDate").min = today;
}

closeBtn.addEventListener("click", () => {
  modal.classList.remove("active");
});

// Đóng cửa sổ khi nhấp vào bên ngoài
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});

// Xử lý việc gửi biểu mẫu
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const roomId = bookingForm.getAttribute("data-room-id");
  const roomDoc = await getDoc(doc(db, "services", roomId));
  const formData = {
    user: auth.currentUser.uid,
    roomName: roomDoc.data().name,
    customerName: document.getElementById("customerName").value,
    bookingDate: document.getElementById("bookingDate").value,
    bookingTime: document.getElementById("bookingTime").value,
    duration: document.getElementById("duration").value,
    notes: document.getElementById("notes").value,
    isHidden: false,
    status: "pending",
    // pending: "Chờ xác nhận",
    // approved: "Đã xác nhận",
    // done: "Đã hoàn thành",
    // cancelled: "Đã hủy",
  };

  try {
    // Save to Firebase
    const docRef = await addDoc(collection(db, "bookings"), formData);

    // Show success message
    alert("Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.");

    // Reset form and close modal
    modal.classList.remove("active");
    bookingForm.reset();
  } catch (error) {
    console.error("Error saving booking:", error);
    alert("Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại!");
  }
});

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
