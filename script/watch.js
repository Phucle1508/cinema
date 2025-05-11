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
  deleteDoc,
  doc,
  updateDoc,
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

// Hàm hiển thị chi tiết phim
const displayMovieDetails = async (movie) => {
  document.querySelector(
    "iframe"
  ).src = `https://www.2embed.cc/embed/${movie.id}`;
  document.querySelector("#movie-title").innerText = movie.title || movie.name;
  document.querySelector("#movie-description").innerText = movie.overview;

  if (movie.release_date)
    document.querySelector(
      "#release-date"
    ).innerText = `Release Date: ${movie.release_date}`;
};
fetchMovieDetails().then(displayMovieDetails);

// Hàm lấy danh sách phim tương tự
const fetchSimilarMovie = async () => {
  const resp = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${API_KEY}`
  );

  const data = await resp.json();

  return data.results;
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
        allComments.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      displayComments(allComments.slice(0, commentsPerPage));
      updateLoadMoreButton();
    });
  } catch (e) {
    console.error("Error: ", e);
  }
  updateLoadMoreButton();
};

// Hàm xóa bình luận
const deleteComment = async (commentId) => {
  // Tạo overlay
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  document.body.appendChild(overlay);

  // Tạo dialog xác nhận
  const dialog = document.createElement("div");
  dialog.className = "confirm-dialog";
  dialog.innerHTML = `
      <p>Are you sure you want to delete this comment?</p>
      <div class="buttons">
        <button class="confirm-btn">Xóa</button>
        <button class="cancel-btn">Hủy</button>
      </div>
    `;
  document.body.appendChild(dialog);

  // Xử lý sự kiện cho các nút
  const confirmBtn = dialog.querySelector(".confirm-btn");
  const cancelBtn = dialog.querySelector(".cancel-btn");

  confirmBtn.addEventListener("click", async () => {
    try {
      await deleteDoc(doc(db, `movie-comment-${movieId}`, commentId));
      document.body.removeChild(dialog);
      document.body.removeChild(overlay);
    } catch (error) {
      console.error("Error deleting comment: ", error);
    }
  });

  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(dialog);
    document.body.removeChild(overlay);
  });
};

// Hàm chỉnh sửa comment
const editComment = async (commentId, currentContent) => {
  // Tạo overlay
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  document.body.appendChild(overlay);

  // Tạo dialog chỉnh sửa
  const dialog = document.createElement("div");
  dialog.className = "edit-dialog";
  dialog.innerHTML = `
    <h3>Chỉnh sửa bình luận</h3>
    <textarea id="edit-comment-input">${currentContent}</textarea>
    <div class="buttons">
      <button class="save-btn">Lưu</button>
      <button class="cancel-btn">Hủy</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const saveBtn = dialog.querySelector(".save-btn");
  const cancelBtn = dialog.querySelector(".cancel-btn");
  const textarea = dialog.querySelector("#edit-comment-input");

  saveBtn.addEventListener("click", async () => {
    const newContent = textarea.value.trim();
    if (newContent) {
      try {
        await updateDoc(doc(db, `movie-comment-${movieId}`, commentId), {
          title: newContent,
          createAt: serverTimestamp(),
        });
        document.body.removeChild(dialog);
        document.body.removeChild(overlay);
      } catch (error) {
        console.error("Error updating comment: ", error);
      }
    }
  });

  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(dialog);
    document.body.removeChild(overlay);
  });
};

// Hàm hiển thị bình luận
const displayComments = function (comments) {
  const commentContainer = document.getElementById("comments");
  commentContainer.innerHTML = "";

  if (!comments || comments.length === 0) {
    commentContainer.innerHTML = "<p>No comments yet.</p>";
    return;
  }

  commentContainer.innerHTML = comments
    .map((cmt) => {
      // Chỉ hiển thị nút xóa và sửa khi người dùng đã đăng nhập và là chủ comment hoặc admin
      const isOwnerOrAdmin =
        auth.currentUser &&
        (cmt.user.uid === auth.currentUser.uid ||
          auth.currentUser.email === "admin@gmail.com");

      const actionButtons = isOwnerOrAdmin
        ? `<button class="edit-comment" onclick="editComment('${cmt.id}', '${cmt.title}')">
           <i class="fas fa-edit"></i>
         </button>
         <button class="delete-comment" onclick="deleteComment('${cmt.id}')">
           <i class="fas fa-trash"></i>
         </button>`
        : "";

      return `
      <div class="comment-content">
        ${actionButtons}
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

  if (allComments.length > 0 && allComments.length <= 5) {
    commentContainer.innerHTML += `
        <div class="no-more-comments">
          <p>No more comments</p>
        </div>
      `;
  }
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

// Hàm lưu lịch sử xem phim
const saveToHistory = async (movie) => {
  try {
    await addDoc(collection(db, `watch-history-${auth.currentUser.uid}`), {
      id: movie.id,
      title: movie.title || movie.name,
      poster_path: movie.poster_path,
      watchedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving to history: ", error);
  }
};

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

    try {
      fetchMovieDetails().then(saveToHistory);
      // console.log("Đã lưu vào lịch sử thành công");
    } catch (error) {
      console.error("Lỗi khi lưu lịch sử:", error);
    }
  }
});

fetchComments();
// Thêm hàm deleteComment vào window object để có thể gọi từ onclick
window.deleteComment = deleteComment;
// Thêm hàm editComment vào window object để có thể gọi từ onclick
window.editComment = editComment;

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
