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
  await initializeRating(); // Khởi tạo rating system

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

      favoriteBtn.style.display = "flex";
      const notFavorite = await checkFavoriteStatus(movie.id);
      if (notFavorite) {
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
fetchComments();

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
  const notFavorite = await checkFavoriteStatus(movieData.id);

  if (notFavorite) {
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

// Hàm xử lý rating
const initializeRating = async () => {
  const stars = document.querySelectorAll(".stars i"); // Lấy tất cả các ngôi sao trong container
  const ratingValue = document.getElementById("rating-value");
  const ratingCount = document.getElementById("rating-count");
  const removeRatingBtn = document.getElementById("remove-rating");
  let userRating = 0; // Lưu giá trị đánh giá của người dùng hiện tại

  // Lấy rating hiện tại từ Firestore
  const fetchRatings = async () => {
    // Lắng nghe thay đổi realtime
    try {
      const q = query(collection(db, `movie-ratings-${movieId}`)); // Truy vấn collection đánh giá của phim
      onSnapshot(q, (querySnapshot) => {
        // Lắng nghe thay đổi realtime
        let totalRating = 0;
        let count = querySnapshot.size; // Số lượng đánh giá

        querySnapshot.forEach((doc) => {
          totalRating += doc.data().rating;
        });

        const averageRating = count > 0 ? (totalRating / count).toFixed(1) : 0;
        // count > 0 ? : Đây là toán tử điều kiện (ternary operator), kiểm tra xem có đánh giá nào không (count lớn hơn 0)
        // Nếu có đánh giá (count > 0): - totalRating / count : Lấy tổng số điểm chia cho số lượt đánh giá để tính trung bình
        // - .toFixed(1) : Làm tròn kết quả đến 1 chữ số thập phân
        // Ví dụ:
        // - Tổng điểm = 27, số lượt = 6
        // - 27/6 = 4.5 (giữ nguyên vì đã có 1 chữ số thập phân)
        ratingValue.textContent = averageRating;
        ratingCount.textContent = count;

        // Kiểm tra xem user đã rate chưa
        if (auth.currentUser) {
          const userRatingQuery = query(
            collection(db, `movie-ratings-${movieId}`),
            where("userId", "==", auth.currentUser.uid)
          );
          getDocs(userRatingQuery).then((snapshot) => {
            if (!snapshot.empty) {
              userRating = snapshot.docs[0].data().rating; // Lấy giá trị rating từ document đầu tiên
              updateStars(userRating);
            }
          });
        }
      });
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  // Cập nhật hiển thị sao
  const updateStars = (rating) => {
    stars.forEach((star, index) => {
      star.classList.toggle("active", index < rating);
      // - star : Từng phần tử sao
      // - index : Vị trí của sao (0-4)
      // classList.toggle() : Phương thức để thêm/xóa class
      //   - Tham số 1: Tên class ('active')
      //   - Tham số 2: Điều kiện boolean (index < rating)
      //   - true : Thêm class 'active'
      //   - false : Xóa class 'active'
      // Ví dụ cách hoạt động:
      //   - Khi rating = 3:
      //     - Sao thứ 1 (index = 0): 0 < 3 -> true -> thêm class 'active'
      //     - Sao thứ 2 (index = 1): 1 < 3 -> true -> thêm class 'active'
      //     - Sao thứ 3 (index = 2): 2 < 3 -> true -> thêm class 'active'
      //     - Sao thứ 4 (index = 3): 3 < 3 -> false -> xóa class 'active'
      //     - Sao thứ 5 (index = 4): 4 < 3 -> false -> xóa class 'active'
      //   Kết quả: 3 sao đầu tiên sẽ sáng (có class 'active'), 2 sao còn lại sẽ tối (không có class 'active')
    });

    // Hiển thị/ẩn nút xóa đánh giá
    removeRatingBtn.style.display = rating > 0 ? "inline-block" : "none";
    // 1. removeRatingBtn.style.display : Đây là cách để điều khiển thuộc tính hiển thị của nút xóa đánh giá
    // 2. rating > 0 ? 'inline-block' : 'none' : Đây là toán tử ba ngôi, hoạt động như sau:
    //   - rating > 0 : Điều kiện kiểm tra xem rating có lớn hơn 0 không
    //   - ? : Nếu điều kiện đúng (true)
    //   - 'inline-block' : Giá trị sẽ được gán nếu điều kiện đúng
    //   - : : Ngược lại (else)
    //   - 'none' : Giá trị sẽ được gán nếu điều kiện sai
    //   Ví dụ cách hoạt động:
    //     - Khi rating = 3 :
    //       - rating > 0 là true
    //       - Nút sẽ được hiển thị ( display: inline-block )
    //     - Khi rating = 0 :
    //       - rating > 0 là false
    //       - Nút sẽ bị ẩn ( display: none )
  };

  // Xử lý sự kiện click sao
  stars.forEach((star) => {
    star.addEventListener("click", async () => {
      if (!auth.currentUser) {
        alert("Vui lòng đăng nhập để đánh giá phim!");
        return;
      }

      const rating = parseInt(star.dataset.rating); // Lấy giá trị đánh giá từ data-rating

      try {
        // Kiểm tra xem user đã rate chưa
        const q = query(
          collection(db, `movie-ratings-${movieId}`),
          where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // Thêm rating mới
          await addDoc(collection(db, `movie-ratings-${movieId}`), {
            userId: auth.currentUser.uid,
            rating: rating,
            createdAt: serverTimestamp(),
          });
        } else {
          // Cập nhật rating cũ
          const docRef = doc(
            db,
            `movie-ratings-${movieId}`,
            querySnapshot.docs[0].id
          );
          await updateDoc(docRef, {
            rating: rating,
            updatedAt: serverTimestamp(),
          });
        }

        userRating = rating;
        updateStars(rating);
      } catch (error) {
        console.error("Error updating rating:", error);
      }
    });

    // Hiệu ứng hover
    star.addEventListener("mouseover", () => {
      const rating = parseInt(star.dataset.rating);
      updateStars(rating);
    });

    star.addEventListener("mouseout", () => {
      updateStars(userRating);
    });
  });

  // Xử lý sự kiện cho nút xóa đánh giá
  removeRatingBtn.addEventListener("click", async () => {
    if (confirm("Bạn có chắc muốn xóa đánh giá của mình?")) {
      try {
        const q = query(
          collection(db, `movie-ratings-${movieId}`),
          where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          await deleteDoc(
            doc(db, `movie-ratings-${movieId}`, querySnapshot.docs[0].id)
          );
          userRating = 0;
          updateStars(0);
        }
      } catch (error) {
        console.error("Error removing rating:", error);
        alert("Có lỗi xảy ra khi xóa đánh giá!");
      }
    }
  });

  await fetchRatings();
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
