import { db } from "./config.js";
import {
  collection,
  query,
  getDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Lấy tham chiếu đến các phần tử DOM
const totalBookingsEl = document.getElementById("totalBookings");
const pendingBookingsEl = document.getElementById("pendingBookings");
const approvedBookingsEl = document.getElementById("approvedBookings");
const doneBookingsEl = document.getElementById("doneBookings");
const cancelledBookingsEl = document.getElementById("cancelledBookings");
const bookingTableBody = document.getElementById("bookingTableBody");

// Hàm format ngày giờ
function formatDate(dateString) {
  const date = new Date(dateString); // new Date(dateString) : Tạo một đối tượng Date mới từ chuỗi ngày tháng
  return date.toLocaleDateString("vi-VN");
  //- toLocaleDateString() : Phương thức chuyển đổi đối tượng Date thành chuỗi ngày tháng theo định dạng của ngôn ngữ được chỉ định
  //- "vi-VN" : Mã ngôn ngữ cho tiếng Việt (Việt Nam), sẽ định dạng ngày tháng theo chuẩn Việt Nam
}

// Hàm tạo badge trạng thái
function getStatusBadge(status) {
  const statusText = {
    pending: "Chờ xác nhận",
    approved: "Đã xác nhận",
    done: "Đã hoàn thành",
    cancelled: "Đã hủy",
  };

  return `<span class="status-badge status-${status}">${statusText[status]}</span>`;
}

function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

// Approved booking
window.approvedBooking = async function (bookingId) {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      alert("Không tìm thấy đơn đặt phòng!");
      return;
    }

    await updateDoc(bookingRef, {
      status: "approved",
    });
  } catch (error) {
    console.error("Error approveding booking:", error);
  }
};

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
  } catch (error) {
    console.error("Error cancelling booking:", error);
    alert("Có lỗi xảy ra khi hủy đặt phòng. Vui lòng thử lại!");
  }
};

// Done booking
window.doneBooking = async function (bookingId) {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      alert("Không tìm thấy đơn đặt phòng!");
      return;
    }

    await updateDoc(bookingRef, {
      status: "done",
    });
  } catch (error) {
    console.error("Error doning booking:", error);
  }
};

// Hàm render bảng đặt phòng
function renderBookingTable(bookings) {
  let html = "";
  let total = 0;
  let pending = 0;
  let approved = 0;
  let done = 0;
  let cancelled = 0;

  bookings.forEach((booking) => {
    total++;
    if (booking.status === "pending") pending++;
    if (booking.status === "approved") approved++;
    if (booking.status === "done") done++;
    if (booking.status === "cancelled") cancelled++;

    const actions =
      booking.status === "pending"
        ? `<button class="action-btn approve-btn" onclick="approvedBooking('${booking.id}')">Duyệt</button>
         <button class="action-btn cancelled-btn" onclick="cancelBooking('${booking.id}')">Từ chối</button>`
        : booking.status === "approved"
        ? `<button class="action-btn done-btn" onclick="doneBooking('${booking.id}')">Đã đến & nhận phòng</button>`
        : "";

    html += `
      <tr>
        <td>${booking.customerName}</td>
        <td>${booking.roomName}</td>
        <td>${formatDate(booking.bookingDate)}</td>
        <td>${booking.bookingTime}</td>
        <td>${booking.duration} giờ</td>
        <td>${getStatusBadge(booking.status)}</td>
        <td>${actions}</td>
      </tr>
    `;
  });

  bookingTableBody.innerHTML = html;
  totalBookingsEl.textContent = formatNumber(total);
  pendingBookingsEl.textContent = formatNumber(pending);
  approvedBookingsEl.textContent = formatNumber(approved);
  doneBookingsEl.textContent = formatNumber(done);
  cancelledBookingsEl.textContent = formatNumber(cancelled);
}

// Lắng nghe thay đổi từ collection bookings
const q = query(collection(db, "bookings"));
const unsubscribe = onSnapshot(q, (querySnapshot) => {
  const bookings = [];
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });
  renderBookingTable(bookings);
});

// Cleanup listener khi component unmount
window.addEventListener("unload", () => unsubscribe());
