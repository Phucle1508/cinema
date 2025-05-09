import { API_KEY } from "./config.js";
import { auth, db } from "./config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("id");

if (!movieId) {
  window.location.href = "./index.html";
}

// Hàm lấy thông tin chi tiết phim từ Api
const fetchMovieDetails = async () => {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`
  );

  const data = await response.json();

  return data;
};

// Hàm lấy danh sách diễn viên từ Api
const fetchCast = async () => {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`
  );

  const data = await response.json();

  return data.cast;
};

// Hàm lấy danh sách phim tương tự
const fetchSimilarMovie = async () => {
  const resp = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${API_KEY}`
  );

  const data = await resp.json();

  return data.results;
};

// Hàm hiển thị chi tiết của phim
const displayMovieDetails = async (movie) => {
  document.getElementById(
    "preview-img"
  ).src = `https://image.tmdb.org/t/p/w300/${movie.poster_path}.jpg`;
  document.getElementById("movie-title").innerText = movie.title;
  document.getElementById("movie-description").innerText = movie.overview;
  document.getElementById(
    "movie-release-date"
  ).innerText += ` ${movie.release_date}`;
  document.getElementById(
    "watch-trailer-btn"
  ).href = `https://www.youtube.com/results?search_query=${movie.title}+trailer`;
  document.getElementById("watch-now-btn").href = `./watch.html?id=${movie.id}`;
};

// Hàm hiển thị danh sách diễn viên
const displayCast = (cast) => {
  const castGrid = document.getElementById("casts-grid");
  castGrid.innerHTML = "";

  castGrid.innerHTML = cast
    .map((item) => {
      return `
      <div>
        <img src="https://image.tmdb.org/t/p/w200/${item.profile_path}" alt="${item.name}">
        <p>${item.name}</p>
        <p>${item.character}</p>
      </div>
    `;
    })
    .join("");
};

// Hàm hiển thị danh sách phim tương tự
const displaySimilarMovie = (movies) => {
  const similarMovie = document.getElementById("similar-movie");
  similarMovie.innerHTML = "";

  if (movies.length > 0) {
    similarMovie.innerHTML = movies
      .map((item) => {
        return `
        <a href="./info.html?id=${item.id}" class="swiper-slide">
          <img src="https://image.tmdb.org/t/p/w200/${item.poster_path}" alt="${item.title}" />
          <p>${item.title}</p>
        </a>
      `;
      })
      .join("");
  }
};

fetchMovieDetails().then(displayMovieDetails);
fetchCast().then(displayCast);
fetchSimilarMovie().then(displaySimilarMovie);

// Xử lý sự kiện khi người dùng gửi bình luận
const handleCommentSubmit = function (event) {
  event.preventDefault();

  const commentInput = document.querySelector("#comment-input");
  const commentText = commentInput.value.trim();

  if (commentText) {
    addDoc(collection(db, `movie-comment-${movieId}`), {
      title: commentText,
      user: {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.email,
        photoURL: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
          auth.currentUser.email || "Guest"
        )}`,
      },
      createAt: serverTimestamp(),
    });

    commentInput.value = "";
  }
};

let commentsPerPage = 5;
let currentPage = 1;
let allComments = [];

// Hàm lấy dữ liệu
const fetchComments = async () => {
  try {
    const q = query(
      collection(db, `movie-comment-${movieId}`),
      orderBy("createAt", "desc")
    );

    const onsnapshot = onSnapshot(q, (querySnapshot) => {
      allComments = [];
      querySnapshot.forEach((doc) => {
        allComments.push(doc.data());
      });

      displayComments(allComments.slice(0, commentsPerPage));
      updateLoadMoreButton();
    });
  } catch (e) {
    console.error("Error: ", e);
  }
};

// Hàm hiển thị bình luận
const displayComments = function (comments) {
  const commentContainer = document.getElementById("comments");
  commentContainer.innerHTML = "";

  if (!comments || comments.length === 0) {
    commentContainer.innerHTML = "<p>Chưa có bình luận nào.</p>";
    return;
  }

  commentContainer.innerHTML = comments
    .map((cmt) => {
      return `
      <div class="comment-content">
        <img src="${cmt.user.photoURL}" alt="avatar" id="avatar-comment" />
        <div class="comment-item">
          <div class="comment-text">
            <strong>${cmt.user.displayName}</strong>
            <p>${cmt.title}</p>
          </div>
          <p>${new Date(cmt.createAt.seconds * 1000).toLocaleString()}</p>
        </div>
      </div>
    `;
    })
    .join("");
};

// Hàm để cập nhật trạng thái nút Load more
const updateLoadMoreButton = () => {
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (currentPage * commentsPerPage >= allComments.length) {
    loadMoreBtn.classList.add("hidden");
  } else {
    loadMoreBtn.classList.remove("hidden");
  }
};

// Event listener cho nút Load more
document.getElementById("load-more-btn").addEventListener("click", () => {
  currentPage++;
  const endIndex = currentPage * commentsPerPage;
  displayComments(allComments.slice(0, endIndex)); // Luôn lấy từ đầu đến vị trí mới
  updateLoadMoreButton();
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    document.getElementById("comment-box-container").innerHTML = `
      <p>You need to be logged in to comment</p>
    `;
  } else {
    document.getElementById("comment-box-container").innerHTML = `
      <img id="avatar-comment" src="${`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        user.email || "Guest"
      )}`}" alt="avatar" />
      <form action="" id="comment-form">
        <input
          type="text"
          placeholder="Add your comment ..."
          id="comment-input"
          required
        />
        <button type="submit">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    `;

    document
      .getElementById("comment-form")
      .addEventListener("submit", handleCommentSubmit);
  }
});

fetchComments();

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
