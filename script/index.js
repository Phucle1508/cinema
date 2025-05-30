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
    const response = await fetch(url); // Gửi yêu cầu GET đến API

    // Kiểm tra nếu response không thành công
    if (!response.ok) {
      throw Error("Network was not ok", response.status);
    }

    const data = await response.json(); // Chuyển đổi response thành JSON
    // console.log(data.results);
    return data.results; // Trả về mảng kết quả phim
  } catch (e) {
    // Xử lý và in ra lỗi nếu có
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
    // Lấy tất cả documents từ collection "movies-coming-soon"
    const querySnapshot = await getDocs(collection(db, "movies-coming-soon"));
    const movies = [];
    // Lặp qua từng document và thêm dữ liệu vào mảng movies
    querySnapshot.forEach((doc) => {
      movies.push(doc.data());
    });
    return movies; // Trả về mảng phim sắp chiếu
  } catch (error) {
    console.error("Lỗi khi tải danh sách phim sắp chiếu:", error); // Xử lý lỗi và in ra console
    return []; // Trả về mảng rỗng nếu có lỗi
  }
};

// Fetch room services
const fetchRoomServices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "services")); // Lấy tất cả documents từ collection "services"
    const services = [];
    // Lặp qua từng document và thêm dữ liệu cùng với ID vào mảng services
    querySnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    return services; // Trả về mảng dịch vụ phòng
  } catch (error) {
    console.error("Lỗi khi tải danh sách phòng:", error); // Xử lý lỗi và in ra console
    return []; // Trả về mảng rỗng nếu có lỗi
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
    .join(""); // Nối các phần tử HTML lại với nhau
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

  const bookButtons = document.querySelectorAll(".book-btn"); // Lấy tất cả các nút đặt phòng
  // Thêm sự kiện click cho từng nút
  bookButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      // Kiểm tra trạng thái đăng nhập của người dùng
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          alert("Vui lòng đăng nhập để đặt phòng");
          return;
        } else {
          const roomId = e.target.getAttribute("data-room-id"); // Lấy ID phòng từ thuộc tính data-room-id
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
    const movies = await fetchTrending("day"); // Lấy danh sách phim thịnh hành trong ngày
    const currentDate = new Date().getDate(); // Lấy ngày hiện tại

    // Lấy 3 phim từ danh sách theo ngày hiện tại
    const mainMovies = [
      // Sử dụng phép chia lấy dư để luân phiên phim theo ngày

      // Phim thứ nhất: Lấy phần dư của ngày hiện tại chia cho độ dài mảng movies
      // Ví dụ: Nếu hôm nay là ngày 15 và có 10 phim, thì 15 % 10 = 5, sẽ lấy phim thứ 5
      movies[currentDate % movies.length],

      // Phim thứ hai: Lấy phần dư của (ngày hiện tại + 1) chia cho độ dài mảng
      // Tiếp ví dụ trên: (15 + 1) % 10 = 6, sẽ lấy phim thứ 6
      movies[(currentDate + 1) % movies.length],

      // Phim thứ ba: Lấy phần dư của (ngày hiện tại + 2) chia cho độ dài mảng
      // Tiếp ví dụ trên: (15 + 2) % 10 = 7, sẽ lấy phim thứ 7
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
  modal.classList.add("active"); // Thêm class active để hiển thị modal
  bookingForm.setAttribute("data-room-id", roomId); // Lưu ID phòng vào form

  // Đặt ngày tối thiểu là hôm nay
  const today = new Date().toISOString().split("T")[0];
  // Giải thích từng bước:
  // 1. new Date() - Tạo một đối tượng Date chứa thời gian hiện tại
  // Ví dụ: Wed Mar 20 2024 15:30:45 GMT+0700

  // 2. .toISOString() - Chuyển đổi thành chuỗi theo định dạng ISO
  // Kết quả: "2024-03-20T08:30:45.000Z"
  // Trong đó:
  // - 2024-03-20: là ngày (năm-tháng-ngày)
  // - T: là ký tự phân cách giữa ngày và giờ
  // - 08:30:45.000Z: là giờ theo múi giờ UTC

  // 3. .split("T")[0] - Tách chuỗi tại ký tự "T" và lấy phần tử đầu tiên
  // Kết quả cuối cùng: "2024-03-20"
  // Đây là định dạng phù hợp để sử dụng cho input type="date"

  document.getElementById("bookingDate").min = today; // Đặt giá trị min cho input date
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
  SpaceBetween: 30, // Khoảng cách giữa các slide (px)
  autoplay: { delay: 5000, disableOnInteraction: true }, // Thời gian chuyển slide (5 giây) // Dừng autoplay khi người dùng tương tác
  slidesPerView: "auto", // Số slide hiển thị tự động theo container
  loop: true, // Lặp vô tận
  slidesPerGroupAuto: true, // Số slide chuyển mỗi lần tự động theo slidesPerView

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});
