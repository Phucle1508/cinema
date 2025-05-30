import { auth, db } from "./config.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const historyContainer = document.getElementById("history-container");

// Hàm xóa lịch sử
const deleteHistoryItem = async (historyId) => {
  // Tạo overlay
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  document.body.appendChild(overlay);

  // Tạo dialog xác nhận
  const dialog = document.createElement("div");
  dialog.className = "confirm-dialog";
  dialog.innerHTML = `
        <p>Are you sure you want to delete this movie from history?</p>
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
      await deleteDoc(
        doc(db, `watch-history-${auth.currentUser.uid}`, historyId)
      );
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

// Hàm hiển thị lịch sử xem phim
const displayHistory = async (userId) => {
  try {
    const q = query(
      collection(db, `watch-history-${userId}`),
      orderBy("watchedAt", "desc")
    );

    onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        historyContainer.innerHTML = `
          <div class="no-history">
            <h2>Chưa có lịch sử xem phim</h2>
            <p>Hãy xem một bộ phim để bắt đầu tạo lịch sử của bạn</p>
          </div>
        `;
        return;
      }

      historyContainer.innerHTML = "";
      querySnapshot.forEach((doc) => {
        const historyData = doc.data();
        historyContainer.innerHTML += `
        <div class="history-item">
          <button class="delete-btn" onclick="deleteHistoryItem('${
            doc.id
          }')"><i class="fas fa-trash"></i></button>
          <a href="./info.html?id=${historyData.id}" class="movie-card">
            <img src="https://image.tmdb.org/t/p/w500${
              historyData.poster_path
            }" alt="${historyData.title}">
            <div class="info">
              <h3>${historyData.title}</h3>
              <p>Đã xem: ${new Date(
                historyData.watchedAt.seconds * 1000
              ).toLocaleString()}</p>
            </div>
          </a>
        </div>
        `;
      });
    });
  } catch (error) {
    console.error("Error getting history: ", error);
    historyContainer.innerHTML = `
      <div class="no-history">
        <h2>Đã xảy ra lỗi khi tải lịch sử</h2>
        <p>Vui lòng thử lại sau</p>
      </div>
    `;
  }
};

// Đăng ký hàm xóa lịch sử vào window để có thể gọi từ onclick
window.deleteHistoryItem = deleteHistoryItem;

// Kiểm tra trạng thái đăng nhập và hiển thị lịch sử
onAuthStateChanged(auth, (user) => {
  if (user) {
    displayHistory(user.uid);
  }
});
