import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth, provider } from "./config.js";

const btn = document.getElementById("register-btn");

btn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email-register").value;
  const password = document.getElementById("password-register").value;
  const confirm = document.getElementById("confirm-register").value;
  function isValidPassword(password) {
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    // Kiểm tra có ít nhất 1 chữ in hoa
    // /[A-Z]/ là regular expression tìm ký tự từ A đến Z viết hoa
    // .test(password) kiểm tra xem password có khớp với pattern không

    const hasNumber = /[0-9]/.test(password);
    // Kiểm tra có ít nhất 1 số
    // /[0-9]/ là regular expression tìm ký tự từ 0 đến 9

    return hasMinLength && hasUpperCase && hasNumber;
  }
  const isPasswordValid = isValidPassword(password);

  if (email.includes("@gmail.com") === false) {
    alert("Email không chính xác!");
    return;
  }

  if (!isPasswordValid) {
    alert("Mật khẩu phải ít nhất 6 ký tự, có 1 chữ in hoa và 1 số");
    return;
  }

  if (password !== confirm) {
    alert("Password do not match!");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    alert("User registered successfully!");
    document.getElementById("email-register").value = "";
    document.getElementById("password-register").value = "";
    document.getElementById("confirm-register").value = "";
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      alert("Email này đã được đăng ký trước đó");
    } else {
      console.error("Error registering user:", errorCode, errorMessage);
      alert("Đăng ký thất bại: " + error.message);
    }
  }
});

const btn1 = document.getElementById("login-btn");

btn1.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email-login").value;
  const password = document.getElementById("password-login").value;

  if (email.includes("@gmail.com") === false) {
    alert("Email không chính xác!");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    alert("Login successfully!\nEmail: " + userCredential.user.email);
    window.location.href = "./index.html";
  } catch (error) {
    console.error("Error login user:", errorCode, errorMessage);
    alert("Đăng nhập thất bại: " + error.message);
  }
});

const login_google = document.getElementById("google-btn");
login_google.addEventListener("click", async (e) => {
  e.preventDefault();
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      alert(`Chào ${user.displayName}`);
      window.location.href = "./index.html";
    })
    .catch((error) => {
      console.error("Đăng nhập lỗi:", error.message);
    });
});
