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
  where,
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

  const favoriteBtn = document.getElementById("favorite-btn");
  favoriteBtn.style.display = "none";
  onAuthStateChanged(auth, async (user) => {
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
        await fetchMovieDetails().then(saveToHistory);
        // console.log("Đã lưu vào lịch sử thành công");
      } catch (error) {
        console.error("Lỗi khi lưu lịch sử:", error);
      }

      favoriteBtn.style.display = "flex";
      const isFavorited = await checkFavoriteStatus(movie.id);
      if (isFavorited) {
        favoriteBtn.classList.remove("active");
        favoriteBtn.innerHTML = '<i class="fa-regular fa-heart"></i> Yêu thích';
      } else {
        favoriteBtn.classList.add("active");
        favoriteBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Đã thích';
      }

      favoriteBtn.addEventListener("click", () => handleFavorite(movie));
    }
  });
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

  //     Dòng code new Date(cmt.createAt.seconds * 1000).toLocaleString() được sử dụng để chuyển đổi timestamp từ Firestore thành định dạng ngày giờ có thể đọc được. Hãy phân tích từng phần:
  //     1. cmt.createAt.seconds :
  //        - Trong Firestore, timestamp được lưu trữ dưới dạng đối tượng có thuộc tính seconds (và nanoseconds )
  //        - Thuộc tính seconds chứa số giây kể từ Unix Epoch (1/1/1970 00:00:00 UTC)
  //     2. * 1000 :
  //        - JavaScript sử dụng milliseconds (phần nghìn giây) thay vì seconds
  //        - Vì vậy ta cần nhân với 1000 để chuyển từ seconds sang milliseconds
  //     3. new Date(...) :
  //        - Tạo một đối tượng Date mới từ timestamp đã được chuyển đổi sang milliseconds
  //        - Đối tượng Date này sẽ đại diện cho thời điểm chính xác của timestamp
  //     4. .toLocaleString() :
  //        - Chuyển đổi đối tượng Date thành chuỗi theo định dạng ngày giờ của locale (khu vực) hiện tại
  //        - Ví dụ ở Việt Nam, kết quả sẽ có dạng: "23/12/2023, 15:30:45"

  //      // Giả sử cmt.createAt.seconds = 1703313045
  //      const timestamp = new Date(1703313045 * 1000).toLocaleString();
  //      // Kết quả: "23/12/2023, 15:30:45" (định dạng có thể khác tùy theo locale của máy)

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
fetchComments();

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

// Hàm kiểm tra phim đã được yêu thích chưa
const checkFavoriteStatus = async (movieId) => {
  const q = query(
    collection(db, `favorites-${auth.currentUser.uid}`),
    where("id", "==", movieId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

// Hàm xóa khỏi danh sách yêu thích
const removeFavorite = async (movieId) => {
  try {
    const q = query(
      collection(db, `favorites-${auth.currentUser.uid}`),
      where("id", "==", movieId)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      deleteDoc(doc.ref);
    });
  } catch (error) {
    console.error("Lỗi khi xóa yêu thích:", error);
  }
};

// Hàm xử lý yêu thích
const handleFavorite = async (movieData) => {
  const favoriteBtn = document.getElementById("favorite-btn");
  const isFavorited = await checkFavoriteStatus(movieData.id);

  if (isFavorited) {
    try {
      await addDoc(collection(db, `favorites-${auth.currentUser.uid}`), {
        id: movieData.id,
        title: movieData.title,
        poster_path: movieData.poster_path,
      });
      favoriteBtn.classList.add("active");
      favoriteBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Đã thích';
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  } else {
    try {
      await removeFavorite(movieData.id);
      favoriteBtn.classList.remove("active");
      favoriteBtn.innerHTML = '<i class="fa-regular fa-heart"></i> Yêu thích';
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  }
};

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
