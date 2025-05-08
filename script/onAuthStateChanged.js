import {
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth } from "./config.js";

// Để cho menu-toggle hoạt động khi click vào
document.querySelector(".menu-toggle").addEventListener("click", () => {
  const navContainer = document.querySelector(".nav-container");
  navContainer.classList.toggle("active");
});

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
          window.location.href = "./index.html";
        } catch (error) {
          console.error("Error signOut user:", errorCode, errorMessage);
          alert("Error signOut user: " + errorMessage);
        }
      });
    }
  });
}
renderHeader();
