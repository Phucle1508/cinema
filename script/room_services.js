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

// Hàm thêm dịch vụ phòng mới mới
async function addService(serviceData) {
  try {
    const docRef = await addDoc(collection(db, "services"), serviceData);
    alert("Thêm dịch vụ thành công");
    loadServices(); // Tải lại danh sách dịch vụ
  } catch (error) {
    console.error("Lỗi khi thêm dịch vụ: ", error);
  }
}

// Hàm tải danh sách dich vụ
async function loadServices() {
  try {
    const querySnapshot = await getDocs(collection(db, "services"));
    const servicesList = document.getElementById("services-list");
    servicesList.innerHTML = "";

    Array.from(querySnapshot.docs).map((doc, index) => {
      const service = doc.data();
      const row = document.createElement("tr");
      row.innerHTML = `
          <td><img src="${service.image}" alt="${service.name}" style="width: 100px;"></td>
          <td>${service.name}</td>
          <td>${service.description}</td>
          <td>${service.price}</td>
          <td>
            <button class = "delete-btn" onclick="deleteService('${doc.id}')">Xóa</button>
            <button class = "edit-btn" onclick="editService('${doc.id}')">Sửa</button>
          </td>
        `;
      servicesList.appendChild(row);
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách dịch vụ: ", error);
  }
}

// Hàm xóa dịch vụ
async function deleteService(serviceId) {
  try {
    await deleteDoc(doc(db, "services", serviceId));
    alert("Xóa dịch vụ thành công");
    loadServices(); // Tải lại danh sách dịch vụ
  } catch (error) {
    console.error("Lỗi khi xóa dịch vụ: ", error);
  }
}

let editingServiceId = null;
// Hàm cập nhật dịch vụ
async function editService(serviceId) {
  try {
    editingServiceId = serviceId; // Lưu ID của dịch vụ đang chỉnh sửa
    const serviceDoc = doc(db, "services", serviceId);
    const serviceSnap = await getDoc(serviceDoc);

    if (serviceSnap.exists()) {
      const service = serviceSnap.data();

      // Cuộn lên đầu trang để hiển thị form
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Điền thông tin vào form
      document.getElementById("serviceName").value = service.name;
      document.getElementById("serviceDescription").value = service.description;
      document.getElementById("servicePricePerHour").value = service.price;
      document.getElementById("serviceImage").value = service.image;

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
          document.getElementById("serviceForm").reset();
          editingServiceId = null;
          submitButton.textContent = "Lưu";
          cancelButton.remove();
        });
      }

      // Thêm class để đánh dấu form đang trong chế độ chỉnh sửa
      document.querySelector(".add-service-form").classList.add("editing");
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin dịch vụ:", error);
    alert("Có lỗi xảy ra khi lấy thông tin dịch vụ");
  }
}

// Xử lý sự kiện submit form
document.getElementById("serviceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const serviceData = {
    name: document.getElementById("serviceName").value,
    description: document.getElementById("serviceDescription").value,
    price: document.getElementById("servicePricePerHour").value,
    image: document.getElementById("serviceImage").value,
  };
  try {
    if (editingServiceId) {
      // Nếu đang chỉnh sửa dịch vụ, cập nhật thông tin
      const serviceDoc = doc(db, "services", editingServiceId);
      await updateDoc(serviceDoc, serviceData);
      alert("Cập nhật dịch vụ thành công");

      // Reset trạng thái chỉnh sửa
      editingServiceId = null;
      document.querySelector(".save-btn").textContent = "Lưu";

      // Xóa nút Hủy nếu có
      const cancelButton = document.querySelector(".cancel-btn");
      if (cancelButton) {
        cancelButton.remove();
      }

      // Xóa class editing
      document.querySelector(".add-service-form").classList.remove("editing");
    } else {
      // Thêm dịch vụ mới
      await addService(serviceData);
    }

    // Reset form và tải lại danh sách
    e.target.reset();
    await loadServices();
  } catch (error) {
    console.error("Lỗi khi xử lý dịch vụ:", error);
  }
});

// Tải danh sách dịch vụ khi trang được load
document.addEventListener("DOMContentLoaded", loadServices);

window.deleteService = deleteService;
window.editService = editService;
