// js/api.js

const API = {
    // Giả lập dữ liệu sản phẩm
    products: [
        { id: 1, name: "iPhone 15 Pro Max", price: 34990000, img: "https://via.placeholder.com/150", cat: "phone" },
        { id: 2, name: "Samsung Galaxy S24", price: 28990000, img: "https://via.placeholder.com/150", cat: "phone" },
        { id: 3, name: "Ốp lưng MagSafe", price: 590000, img: "https://via.placeholder.com/150", cat: "accessory" },
        { id: 4, name: "Sạc nhanh 20W", price: 450000, img: "https://via.placeholder.com/150", cat: "accessory" },
        { id: 5, name: "Xiaomi Redmi Note 13", price: 4500000, img: "https://via.placeholder.com/150", cat: "phone" },
        { id: 6, name: "Tai nghe AirPods Pro", price: 5500000, img: "https://via.placeholder.com/150", cat: "accessory" }
    ],

    // Hàm lấy danh sách sản phẩm (Giả lập gọi Server)
    async getProducts() {
        // SAU NÀY THAY BẰNG: const res = await fetch('api/products/list.php'); return await res.json();
        return new Promise(resolve => {
            setTimeout(() => resolve(this.products), 300); // Giả lập độ trễ mạng
        });
    },

    // Hàm đăng nhập giả
    async login(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email === 'admin@pos.com' && password === 'admin') {
                    resolve({ status: 'success', role: 'admin', first_login: false });
                } else if (email === 'staff@pos.com' && password === '123') {
                    // Giả lập nhân viên mới đăng nhập lần đầu
                    resolve({ status: 'success', role: 'staff', first_login: true });
                } else {
                    reject({ status: 'error', message: 'Sai thông tin đăng nhập' });
                }
            }, 500);
        });
    }
};