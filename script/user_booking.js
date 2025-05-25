import { auth, db } from "./config.js";
import {
  collection,
  query,
  doc,
  getDoc,
  updateDoc,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Format date
function formatDate(dateString) {
  const date = new Date(dateString); // new Date(dateString) : Tạo một đối tượng Date mới từ chuỗi ngày tháng
  return date.toLocaleDateString("vi-VN");
  //- toLocaleDateString() : Phương thức chuyển đổi đối tượng Date thành chuỗi ngày tháng theo định dạng của ngôn ngữ được chỉ định
  //- "vi-VN" : Mã ngôn ngữ cho tiếng Việt (Việt Nam), sẽ định dạng ngày tháng theo chuẩn Việt Nam
}

// Get status badge
function getStatusBadge(status) {
  const statusText = {
    pending: "Chờ xác nhận",
    approved: "Đã xác nhận",
    done: "Đã hoàn thành",
    cancelled: "Đã hủy",
  };

  return `<span class="status-badge status-${status}">${statusText[status]}</span>`;
}

// Render user bookings Hàm renderUserBookings() là một hàm bất đồng bộ phức tạp dùng để hiển thị danh sách đặt phòng của người dùng.
async function renderUserBookings(user) {
  const scheduleContainer = document.getElementById("bookingTableBody");
  const noBookings = document.getElementById("noBookings");
  const bookingTableContainer = document.querySelector(
    ".booking-table-container"
  );

  try {
    const q = query(
      collection(db, "bookings"),
      where("user", "==", user),
      where("isHidden", "!=", true)
    ); //Tạo truy vấn đến collection chứa đặt phòng của người dùng hiện tại

    const querySnapshot = await getDocs(q);
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    // Show no bookings message if empty
    if (bookings.length === 0) {
      scheduleContainer.innerHTML = "";
      bookingTableContainer.style.display = "none";
      noBookings.style.display = "block";
      return;
    }

    // Hide no bookings message and render table
    noBookings.style.display = "none";
    bookingTableContainer.style.display = "block";

    // - Sắp xếp mảng bookings theo thời gian đặt phòng (mới nhất lên đầu)
    // - Sử dụng new Date() để chuyển đổi chuỗi ngày thành đối tượng Date để so sánh
    scheduleContainer.innerHTML = bookings
      .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
      .map(
        (booking) => `
        <tr>
          <td>${booking.roomName}</td>
          <td>${formatDate(booking.bookingDate)}</td>
          <td>${booking.bookingTime}</td>
          <td>${booking.duration}</td>
          <td>${booking.notes || "-"}</td>
          <td>${getStatusBadge(booking.status)}</td>
          <td>
            ${
              booking.status === "pending" || booking.status === "approved"
                ? `<button class="action-btn cancel-btn" onclick="cancelBooking('${booking.id}')">Hủy đặt phòng</button>`
                : `<button class="action-btn delete-btn" onclick="deleteBooking('${booking.id}')">Xóa</button>`
              // ${condition ? trueValue : falseValue}
              // - Nếu điều kiện đúng (status là pending hoặc approved), hiển thị nút "Hủy đặt phòng"
              // - Nếu điều kiện sai (status khác), hiển thị nút "Xóa"
            }
          </td>
        </tr>
      `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching bookings:", error);
  }
}

// Cancel booking
window.cancelBooking = async function (bookingId) {
  if (!confirm("Bạn có chắc chắn muốn hủy đặt phòng này?")) return;

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      alert("Không tìm thấy đơn đặt phòng!");
      return;
    }

    await updateDoc(bookingRef, {
      status: "cancelled",
    });

    alert("Hủy đặt phòng thành công!");
    renderUserBookings(auth.currentUser.uid);
  } catch (error) {
    console.error("Error cancelling booking:", error);
    alert("Có lỗi xảy ra khi hủy đặt phòng. Vui lòng thử lại!");
  }
};

// Hàm xóa đơn đặt phòng
window.deleteBooking = async function (bookingId) {
  if (!confirm("Bạn có chắc chắn muốn xóa đơn đặt phòng này?")) return;

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { isHidden: true });
    alert("Xóa đơn đặt phòng thành công!");
    renderUserBookings(auth.currentUser.uid);
  } catch (error) {
    console.error("Error deleting booking:", error);
    alert("Có lỗi xảy ra khi xóa đơn đặt phòng. Vui lòng thử lại!");
  }
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      renderUserBookings(auth.currentUser.uid);
    } else {
      window.location.href = "./login_register.html";
    }
  });
});
