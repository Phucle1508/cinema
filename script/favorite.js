import { auth, db } from "./config.js";
import {
  collection,
  query,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const favoriteGrid = document.getElementById("favorite-grid");

// Hàm xóa phim yêu thích
const removeFavorites = async (favoriteId) => {
  // Tạo overlay
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  document.body.appendChild(overlay);

  // Tạo dialog xác nhận
  const dialog = document.createElement("div");
  dialog.className = "confirm-dialog";
  dialog.innerHTML = `
          <p>Are you sure you want to delete this movie from favorite?</p>
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
      await deleteDoc(doc(db, `favorites-${auth.currentUser.uid}`, favoriteId));
      document.body.removeChild(dialog);
      document.body.removeChild(overlay);
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử:", error);
    }
  });

  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(dialog);
    document.body.removeChild(overlay);
  });
};

// Hiển thị danh sách phim yêu thích
const displayFavorites = async (userId) => {
  try {
    const q = query(collection(db, `favorites-${userId}`));

    onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        favoriteGrid.innerHTML = `
            <div class="no-favorites">
                <h2>Chưa có phim yêu thích</h2>
                <p>Hãy thêm phim vào danh sách yêu thích của bạn</p>
            </div>
            `;
        return;
      }

      favoriteGrid.innerHTML = "";
      querySnapshot.forEach((doc) => {
        const favoriteData = doc.data();
        favoriteGrid.innerHTML += `
            <div class="favorite-item">
              <button class="delete-btn" onclick="removeFavorites('${doc.id}')"><i class="fas fa-trash"></i></button>
              <a href="./info.html?id=${favoriteData.id}" class="movie-card">
                <img src="https://image.tmdb.org/t/p/w500${favoriteData.poster_path}" alt="${favoriteData.title}">
                <div class="info">
                  <h3>${favoriteData.title}</h3>
                </div>
              </a>
            </div>
            `;
      });
    });
  } catch (error) {
    console.error("Error getting history: ", error);
    historyContainer.innerHTML = `
          <div class="no-favorites">
            <h2>Đã xảy ra lỗi khi tải yêu thích</h2>
            <p>Vui lòng thử lại sau</p>
          </div>
        `;
  }
};

// Đăng ký hàm xóa vào window object
window.removeFavorites = removeFavorites;

// Kiểm tra đăng nhập và hiển thị danh sách
auth.onAuthStateChanged((user) => {
  if (user) {
    displayFavorites(user.uid);
  }
});
