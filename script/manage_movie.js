import { db } from "./config.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Hàm thêm phim mới
async function addMovie(movieData) {
  try {
    const docRef = await addDoc(
      collection(db, "movies-coming-soon"),
      movieData
    );
    alert("Thêm phim thành công");
    loadMovies(); // Tải lại danh sách phim
  } catch (error) {
    console.error("Lỗi khi thêm phim: ", error);
  }
}

// Hàm tải danh sách phim
async function loadMovies() {
  try {
    const querySnapshot = await getDocs(collection(db, "movies-coming-soon"));
    const moviesList = document.getElementById("movies-list");
    moviesList.innerHTML = "";

    querySnapshot.docs.map((doc, index) => {
      const movie = doc.data();
      const row = document.createElement("tr"); // Tạo một hàng mới trong bảng
      row.innerHTML = `
        <td>${index + 1}</td>
        <td><img src="${movie.poster_path}" alt="${
        movie.title
      }" style="width: 100px;"></td>
        <td>${movie.title}</td>
        <td>${movie.overview}</td>
        <td>${movie.release_date}</td>
        <td>
          <button class = "delete-btn" onclick="deleteMovie('${
            doc.id
          }')">Xóa</button>
          <button class = "edit-btn" onclick="editMovie('${
            doc.id
          }')">Sửa</button>
        </td>
      `;
      moviesList.appendChild(row);
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách phim: ", error);
  }
}

// Hàm xóa phim
async function deleteMovie(movieId) {
  try {
    await deleteDoc(doc(db, "movies-coming-soon", movieId));
    alert("Xóa phim thành công");
    loadMovies(); // Tải lại danh sách phim
  } catch (error) {
    console.error("Lỗi khi xóa phim: ", error);
  }
}

let editingMovieId = null;
// Hàm cập nhật phim
async function editMovie(movieId) {
  try {
    editingMovieId = movieId; // Lưu ID của phim đang chỉnh sửa
    const movieDoc = doc(db, "movies-coming-soon", movieId);
    const movieSnap = await getDoc(movieDoc);

    if (movieSnap.exists()) {
      const movie = movieSnap.data();

      // Cuộn lên đầu trang để hiển thị form
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Điền thông tin vào form
      document.getElementById("movieTitle").value = movie.title;
      document.getElementById("movieDescription").value = movie.overview;
      document.getElementById("releaseDate").value = movie.release_date;
      document.getElementById("movieImage").value = movie.poster_path;

      // Thay đổi nút Lưu thành Cập nhật
      const submitButton = document.querySelector(".save-btn");
      submitButton.textContent = "Cập nhật";

      // Thêm nút Hủy
      let cancelButton = document.querySelector(".cancel-btn");
      if (!cancelButton) {
        cancelButton = document.createElement("button");
        cancelButton.className = "cancel-btn";
        cancelButton.type = "button";
        cancelButton.textContent = "Hủy";
        submitButton.parentNode.insertBefore(
          cancelButton,
          submitButton.nextSibling
        );

        // Xử lý sự kiện khi nhấn nút Hủy
        cancelButton.addEventListener("click", () => {
          document.getElementById("movieForm").reset();
          editingMovieId = null;
          submitButton.textContent = "Lưu";
          cancelButton.remove();
        });
      }

      // Thêm class để đánh dấu form đang trong chế độ chỉnh sửa
      document.querySelector(".add-movie-form").classList.add("editing");
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin phim:", error);
    alert("Có lỗi xảy ra khi lấy thông tin phim");
  }
}

// Xử lý sự kiện submit form
document.getElementById("movieForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const movieData = {
    title: document.getElementById("movieTitle").value,
    overview: document.getElementById("movieDescription").value,
    release_date: document.getElementById("releaseDate").value,
    poster_path: document.getElementById("movieImage").value,
  };
  try {
    if (editingMovieId) {
      // Nếu đang chỉnh sửa phim, cập nhật thông tin
      const movieDoc = doc(db, "movies-coming-soon", editingMovieId);
      await updateDoc(movieDoc, movieData);
      alert("Cập nhật phim thành công");

      // Reset trạng thái chỉnh sửa
      editingMovieId = null;
      document.querySelector(".save-btn").textContent = "Lưu";

      // Xóa nút Hủy nếu có
      const cancelButton = document.querySelector(".cancel-btn");
      if (cancelButton) {
        cancelButton.remove();
      }

      // Xóa class editing
      document.querySelector(".add-movie-form").classList.remove("editing");
    } else {
      // Thêm phim mới
      await addMovie(movieData);
    }

    // Reset form và tải lại danh sách
    e.target.reset();
    await loadMovies();
  } catch (error) {
    console.error("Lỗi khi xử lý phim:", error);
  }
});

// Tải danh sách phim khi trang được load
document.addEventListener("DOMContentLoaded", loadMovies);

window.deleteMovie = deleteMovie;
window.editMovie = editMovie;
