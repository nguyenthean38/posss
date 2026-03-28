// ===== SHARED UTILITIES FOR ALL PAGES =====
// Theme, Language, i18n management

const KEY_THEME = "ps_theme";
const KEY_LANG = "ps_lang";

// ===== i18n TRANSLATIONS =====
export const i18n = {
    vi: {
        // Navigation
        "nav.dashboard": "Tổng quan",
        "nav.pos": "Bán hàng",
        "nav.products": "Sản phẩm",
        "nav.categories": "Danh mục",
        "nav.employees": "Nhân viên",
        "nav.customers": "Khách hàng",
        "nav.reports": "Báo cáo",
        "nav.profile": "Hồ sơ",
        "nav.logout": "Đăng xuất",
        "nav.collapse": "Thu gọn",

        // KPI Cards
        "kpi.revenue": "Tổng doanh thu",
        "kpi.orders": "Tổng đơn hàng",
        "kpi.products": "Tổng sản phẩm",
        "kpi.customers": "Tổng khách hàng",
        "kpi.revenueStaff": "Doanh thu hôm nay (của tôi)",
        "kpi.ordersStaff": "Đơn hôm nay (của tôi)",
        "kpi.productsStaff": "SP bán hôm nay (của tôi)",
        "kpi.customersStaff": "Khách mua hôm nay (của tôi)",
        "reports.staffScopeHint": "Chỉ xem dữ liệu hôm nay do bạn bán.",

        // Panels
        "panel.salesOverview": "Tổng quan doanh số",
        "panel.orders": "Đơn hàng",
        "panel.recentOrders": "Đơn hàng gần đây",
        "panel.topProducts": "Sản phẩm bán chạy",

        // Table Headers
        "table.customerName": "Tên khách hàng",
        "table.total": "Tổng tiền",
        "table.name": "Tên",
        "table.category": "Danh mục",
        "table.price": "Giá",
        "table.stock": "Tồn kho",
        "table.actions": "Thao tác",

        // Roles
        "role.admin": "Quản trị viên",
        "role.manager": "Quản lý",
        "role.cashier": "Thu ngân",

        // Products
        "product.sold45": "Đã bán 45 sản phẩm",
        "product.sold38": "Đã bán 38 sản phẩm",
        "product.sold67": "Đã bán 67 sản phẩm",
        "product.sold120": "Đã bán 120 sản phẩm",
        "product.case": "Ốp lưng iPhone",

        // Buttons
        "btn.add": "Thêm mới",
        "btn.edit": "Chỉnh sửa",
        "btn.delete": "Xóa",
        "btn.save": "Lưu",
        "btn.cancel": "Hủy",
        "btn.search": "Tìm kiếm",
        "btn.filter": "Lọc",
        "btn.export": "Xuất",
        "btn.confirm": "Xác nhận",

        // Common
        "common.loading": "Đang tải...",
        "common.noData": "Không có dữ liệu",
        "common.error": "Đã xảy ra lỗi",
        "common.success": "Thành công",
        "common.cancel": "Hủy",
        "common.save": "Lưu",
        "common.delete": "Xóa",

        // Pages
        "page.products": "Sản phẩm",
        "page.categories": "Danh mục",

        // Products page
        "prod.searchPh": "Tìm sản phẩm theo tên hoặc mã vạch...",
        "prod.add": "Thêm sản phẩm",
        "prod.modalAdd": "Thêm sản phẩm",
        "prod.modalEdit": "Sửa sản phẩm",
        "prod.modalView": "Xem chi tiết",
        "prod.modalDelete": "Xóa sản phẩm",
        "prod.colName": "Tên sản phẩm",
        "prod.colBarcode": "Mã vạch",
        "prod.colCategory": "Danh mục",
        "prod.colCost": "Giá nhập",
        "prod.colPrice": "Giá bán",
        "prod.colStock": "Tồn kho",
        "prod.colActions": "Thao tác",
        "prod.colImage": "Ảnh",
        "prod.fName": "Tên sản phẩm",
        "prod.fBarcode": "Mã vạch",
        "prod.fType": "Loại",
        "prod.fCost": "Giá nhập",
        "prod.fPrice": "Giá bán",
        "prod.fCategory": "Danh mục",
        "prod.fStock": "Tồn kho",

        // Product types
        "type.phone": "Điện thoại",
        "type.earbuds": "Tai nghe",
        "type.case": "Ốp lưng",
        "type.charger": "Sạc",
        "type.cable": "Cáp",
        "type.accessory": "Phụ kiện",

        // View modal
        "view.category": "Danh mục",
        "view.type": "Loại",
        "view.cost": "Giá nhập",
        "view.price": "Giá bán",
        "view.stock": "Tồn kho",
        "view.createdAt": "Ngày tạo",
        "view.profit": "Lợi nhuận",
        "view.name": "Tên",
        "view.desc": "Mô tả",
        "view.icon": "Icon",
        "view.count": "Số sản phẩm",
        "view.createdBy": "Người tạo",

        // Categories page
        "cat.searchPh": "Tìm danh mục...",
        "cat.add": "Thêm",
        "cat.modalAdd": "Thêm danh mục",
        "cat.modalEdit": "Sửa danh mục",
        "cat.modalView": "Xem chi tiết",
        "cat.modalDelete": "Xóa danh mục",
        "cat.deleteHint": "Nếu danh mục đang có sản phẩm, hệ thống sẽ chuyển sản phẩm sang 'Khác'.",
        "cat.fName": "Tên danh mục",
        "cat.fDesc": "Mô tả",
        "cat.fIcon": "Loại icon",
        "cat.items": "sản phẩm",
        "icon.phone": "Điện thoại",
        "icon.accessory": "Phụ kiện",
        "icon.earbuds": "Tai nghe",
        "icon.charger": "Sạc & Pin",
        "icon.watch": "Đồng hồ",
        "icon.other": "Khác",

        // Toast / Confirm
        "toast.saved": "Đã lưu thành công",
        "toast.deleted": "Đã xóa thành công",
        "toast.invalid": "Dữ liệu không hợp lệ",
        "toast.error": "Có lỗi xảy ra",
        "toast.err": "Có lỗi xảy ra",
        "toast.ok": "Thành công",
        "toast.fileTooBig": "Ảnh quá lớn (tối đa 2MB)",
        "toast.fileType": "Định dạng ảnh không hợp lệ",
        "toast.added": "Đã thêm vào giỏ",
        "toast.empty": "Giỏ hàng trống",
        "toast.checkout": "Thanh toán thành công",
        "toast.reportFail": "Lỗi tải báo cáo",
        "toast.success": "Thành công",
        "toast.fail": "Sai tên đăng nhập hoặc mật khẩu",
        "confirm.deleteText": "Bạn có chắc muốn xóa?",

        // Profile
        "info.joined": "Ngày tham gia",
        "toast.pwdMismatch": "Mật khẩu xác nhận không khớp",
        "toast.pwdWeak": "Mật khẩu quá yếu",
        "toast.pwdOk": "Đổi mật khẩu thành công",
        "toast.pwdWrong": "Mật khẩu hiện tại không đúng",
        "pw.weak": "Yếu",
        "pw.medium": "Trung bình",
        "pw.strong": "Mạnh",

        // Shifts & Activity
        "page.shifts": "Điểm danh ca",
        "nav.shifts": "Điểm danh",
        "nav.activity": "Nhật ký",
        "page.activity": "Nhật ký ra vào",
        "sh.date": "Ngày",
        "sh.staff": "Nhân viên",
        "sh.allStaff": "Tất cả",
        "sh.load": "Tải",
        "sh.export": "Xuất CSV",
        "sh.colStaff": "Nhân viên",
        "sh.colIn": "Vào ca",
        "sh.colOut": "Ra ca",
        "sh.colStatus": "Trạng thái",
        "sh.edit": "Sửa",
        "sh.editTitle": "Sửa giờ điểm danh",
        "sh.statusOpen": "Đang mở",
        "sh.statusClosed": "Đã đóng",
        "sh.statusAdj": "Đã chỉnh",
        "shift.title": "Điểm danh ca",
        "shift.none": "Chưa vào ca hôm nay ({date})",
        "shift.open": "Đã vào ca lúc {time}",
        "shift.done": "Đã kết thúc ca lúc {time}",
        "shift.loadErr": "Lỗi tải trạng thái ca",
        "shift.inProgress": "Đang trong ca — vào lúc {time}",
        "shift.toastIn": "Vào ca thành công",
        "shift.toastOut": "Ra ca thành công",
        "shift.btnIn": "Vào ca",
        "shift.btnOut": "Ra ca",
        "act.searchPh": "Tìm theo chi tiết, tên hoặc email nhân viên...",
        "act.search": "Tìm",
        "act.colTime": "Thời gian",
        "act.colUser": "Nhân viên",
        "act.colDetails": "Chi tiết",
        "act.page": "Trang",
        "act.empty": "Không có nhật ký",

        // Employees
        "emp.view": "Xem",
        "emp.lock": "Khóa",
        "emp.unlock": "Mở khóa",
        "emp.needPwd": "Chưa đổi MK",
        "emp.modalAdd": "Thêm nhân viên",
        "status.active": "Hoạt động",
        "status.locked": "Đã khóa",
        "role.admin2": "Quản trị viên",
        "view.status": "Trạng thái",
        "view.role": "Vai trò",
        "view.pwdChanged": "Đã đổi MK",
        "view.yes": "Đã đổi",
        "view.no": "Chưa đổi",
        "view.salesTitle": "Doanh số bán hàng",
        "view.totalOrders": "Tổng đơn hàng",
        "view.totalRevenue": "Tổng doanh thu",
        "view.recentOrders": "Đơn hàng gần đây",
        "view.noOrders": "Chưa có đơn hàng",
        "view.orderId": "Mã đơn",
        "view.customer": "Khách hàng",
        "view.amount": "Số tiền",
        "toast.unlocked": "Đã mở khóa",
        "toast.locked": "Đã khóa",
        "toast.email": "Đã gửi email",

        // Customers
        "cus.orders": "Đơn hàng",
        "cus.revenue": "Doanh thu",
        "cus.modalEdit": "Sửa khách hàng",
        "rank.vip": "VIP",
        "hist.totalOrders": "Tổng đơn",
        "hist.totalSum": "Tổng chi",

        // POS
        "page.pos": "Bán hàng",
        "shift.in": "Vào ca",
        "shift.out": "Ra ca",
        "cart.title": "Giỏ hàng",
        "cart.clear": "Xóa giỏ",
        "cart.total": "Tổng cộng",
        "cart.checkout": "Thanh toán",
        "cart.subtotal": "Tạm tính giỏ",
        "pay.title": "Thanh toán",
        "pay.phone": "Số điện thoại",
        "pay.name": "Tên khách hàng",
        "pay.earnLoyalty": "Tích điểm đơn này",
        "pay.earnYes": "Có",
        "pay.earnNo": "Không",
        "pay.voucher": "Phiếu giảm giá",
        "pay.voucherDiscount": "Giảm phiếu",
        "pay.payable": "Thanh toán",
        "pay.cash": "Tiền khách đưa",
        "pay.change": "Tiền thối",
        "pay.complete": "Hoàn tất thanh toán",
        "pay.method": "Phương thức thanh toán",
        "pay.methodCash": "Tiền mặt",
        "pay.methodQr": "Chuyển khoản (QR SePay)",
        "pay.createQr": "Tạo mã QR thanh toán",
        "pay.voucherNeedPhone": "Nhập SĐT khách để chọn phiếu giảm giá",
        "pay.voucherClear": "Bỏ phiếu",
        "pay.voucherHsd": "HSD",
        "pay.qrTitle": "Thanh toán chuyển khoản",
        "pay.qrRefNote": "Quét QR bên dưới. Mã đơn:",
        "pay.qrWaiting": "Đang chờ thanh toán...",
        "pay.qrSuccess": "Thanh toán thành công!",
        "pay.qrExpired": "Hết thời gian chờ thanh toán",
        "pay.qrSwitchCash": "Đổi sang tiền mặt",
        "pay.qrRetry": "Tạo lại QR",
        "pay.qrOpenWeb": "Mở trang thanh toán SePay",
        "pay.qrCancel": "Đóng",
        "pay.sepayNotConfigured": "Chưa cấu hình SePay (.env)",
        "toast.sepayPaid": "Đã nhận thanh toán chuyển khoản",
        "stock": "Tồn kho",
        "empty.title": "Giỏ hàng trống",
        "pay.voucherNone": "Không dùng voucher",
        "loyalty.pointsPreview": "Tích {pts} điểm",
        "loyalty.pointsPreviewNone": "Không đủ tích điểm",
        "loyalty.hintBalance": "Số dư: {bal} điểm",
        "loyalty.hintNew": "Khách hàng mới",
        "toast.removed": "Đã xóa khỏi giỏ",
        "toast.cleared": "Đã xóa giỏ hàng",
        "toast.paid": "Thanh toán thành công",
        "toast.paidLoyalty": "Thanh toán thành công! +{pts} điểm (Tổng: {bal})",

        // Reports
        "chart.noData": "Không có dữ liệu",
        "modal.orderDetail": "Chi tiết đơn hàng",
        "modal.products": "Sản phẩm",

        "role.staff": "Nhân viên",

        // AI Chat
        "product.sold": "Đã bán",
        "product.items": "sản phẩm",
        "ai.title": "PhoneStore xin chào!",
        "ai.subtitle": "Doanh thu, đơn hàng, báo cáo · 1900 54 54 63",
        "ai.emptyLead": "Gợi ý câu hỏi:",
        "ai.hint1": "Doanh thu hôm nay thế nào?",
        "ai.hint2": "Top sản phẩm bán chạy?",
        "ai.hint3": "Tổng đơn tuần này?",
        "ai.placeholder": "Ví dụ: Doanh thu hôm nay thế nào?",
        "ai.send": "Gửi",
        "ai.inputLabel": "Nhập câu hỏi",
        "ai.fabTitle": "Mở trợ lý AI",
        "ai.close": "Đóng",
        "ai.emptyReply": "(Không có nội dung)",
        "ai.errSend": "Lỗi",
        "ai.errGeneric": "Không gửi được",

        "dash.chartRevenueM": "Doanh thu (triệu)",
        "dash.chartOrders": "Đơn hàng",

        "customer.walkIn": "Khách lẻ",
        "reports.noOrdersInRange": "Không có đơn hàng trong khoảng thời gian này",
        "modal.customerPay": "Khách đưa",
        "modal.changeAmount": "Tiền thối",

        "prod.imageRequired": "Ảnh sản phẩm là bắt buộc",
        "prod.imageLabel": "Ảnh sản phẩm",
        "prod.imageHelp": "JPG, PNG, GIF, WEBP - Tối đa 2MB. Nếu không chọn, sẽ dùng ảnh mặc định.",
        "prod.selectCategory": "Chọn danh mục",
        "prod.restockTitle": "Nhập kho",
        "prod.restockQtyLabel": "Số lượng nhập thêm",
        "toast.qtyInvalid": "Số lượng không hợp lệ",
        "toast.restockOk": "Nhập kho thành công",

        "emp.loadingSales": "Đang tải doanh số...",

        "auth.notLoggedIn": "Chưa đăng nhập",
        "auth.sessionExpired": "Phiên đăng nhập đã hết hạn",
    },
    en: {
        // Navigation
        "nav.dashboard": "Dashboard",
        "nav.pos": "Point of Sale",
        "nav.products": "Products",
        "nav.categories": "Categories",
        "nav.employees": "Employees",
        "nav.customers": "Customers",
        "nav.reports": "Reports",
        "nav.profile": "Profile",
        "nav.logout": "Logout",
        "nav.collapse": "Collapse",

        // KPI Cards
        "kpi.revenue": "Total Revenue",
        "kpi.orders": "Total Orders",
        "kpi.products": "Total Products",
        "kpi.customers": "Total Customers",
        "kpi.revenueStaff": "Today's revenue (mine)",
        "kpi.ordersStaff": "Today's orders (mine)",
        "kpi.productsStaff": "Products sold today (mine)",
        "kpi.customersStaff": "Customers today (mine)",
        "reports.staffScopeHint": "You only see today's data from your sales.",

        // Panels
        "panel.salesOverview": "Sales Overview",
        "panel.orders": "Orders",
        "panel.recentOrders": "Recent Orders",
        "panel.topProducts": "Top Products",

        // Table Headers
        "table.customerName": "Customer Name",
        "table.total": "Total",
        "table.name": "Name",
        "table.category": "Category",
        "table.price": "Price",
        "table.stock": "Stock",
        "table.actions": "Actions",

        // Roles
        "role.admin": "Administrator",
        "role.manager": "Manager",
        "role.cashier": "Cashier",

        // Products
        "product.sold45": "45 products sold",
        "product.sold38": "38 products sold",
        "product.sold67": "67 products sold",
        "product.sold120": "120 products sold",
        "product.case": "iPhone Case",

        // Buttons
        "btn.add": "Add New",
        "btn.edit": "Edit",
        "btn.delete": "Delete",
        "btn.save": "Save",
        "btn.cancel": "Cancel",
        "btn.search": "Search",
        "btn.filter": "Filter",
        "btn.export": "Export",

        // Common
        "common.loading": "Loading...",
        "common.noData": "No data available",
        "common.error": "An error occurred",
        "common.success": "Success",
        "common.cancel": "Cancel",
        "common.save": "Save",
        "common.delete": "Delete",

        // Pages
        "page.products": "Products",
        "page.categories": "Categories",

        // Products page
        "prod.searchPh": "Search products by name or barcode...",
        "prod.add": "Add product",
        "prod.modalAdd": "Add product",
        "prod.modalEdit": "Edit product",
        "prod.modalView": "Details",
        "prod.modalDelete": "Delete product",
        "prod.colName": "Product name",
        "prod.colBarcode": "Barcode",
        "prod.colCategory": "Category",
        "prod.colCost": "Cost",
        "prod.colPrice": "Price",
        "prod.colStock": "Stock",
        "prod.colActions": "Actions",
        "prod.colImage": "Image",
        "prod.fName": "Product name",
        "prod.fBarcode": "Barcode",
        "prod.fType": "Type",
        "prod.fCost": "Cost",
        "prod.fPrice": "Price",
        "prod.fCategory": "Category",
        "prod.fStock": "Stock",

        // Product types
        "type.phone": "Phone",
        "type.earbuds": "Earbuds",
        "type.case": "Case",
        "type.charger": "Charger",
        "type.cable": "Cable",
        "type.accessory": "Accessory",

        // View modal
        "view.category": "Category",
        "view.type": "Type",
        "view.cost": "Cost",
        "view.price": "Price",
        "view.stock": "Stock",
        "view.createdAt": "Created At",
        "view.profit": "Profit",
        "view.name": "Name",
        "view.desc": "Description",
        "view.icon": "Icon",
        "view.count": "Items",
        "view.createdBy": "Created By",

        // Categories page
        "cat.searchPh": "Search categories...",
        "cat.add": "Add",
        "cat.modalAdd": "Add category",
        "cat.modalEdit": "Edit category",
        "cat.modalView": "Details",
        "cat.modalDelete": "Delete category",
        "cat.deleteHint": "If category has products, items will be moved to 'Other'.",
        "cat.fName": "Category name",
        "cat.fDesc": "Description",
        "cat.fIcon": "Icon type",
        "cat.items": "items",
        "icon.phone": "Phone",
        "icon.accessory": "Accessory",
        "icon.earbuds": "Earbuds",
        "icon.charger": "Charging",
        "icon.watch": "Watch",
        "icon.other": "Other",

        // Toast / Confirm
        "toast.saved": "Saved successfully",
        "toast.deleted": "Deleted successfully",
        "toast.invalid": "Invalid data",
        "toast.error": "An error occurred",
        "toast.err": "An error occurred",
        "toast.ok": "Success",
        "toast.fileTooBig": "Image too large (max 2MB)",
        "toast.fileType": "Invalid image format",
        "toast.added": "Added to cart",
        "toast.empty": "Cart is empty",
        "toast.checkout": "Checkout successful",
        "toast.reportFail": "Failed to load report",
        "toast.success": "Success",
        "toast.fail": "Wrong username or password",
        "confirm.deleteText": "Are you sure you want to delete?",

        // Profile
        "info.joined": "Joined",
        "toast.pwdMismatch": "Confirmation password does not match",
        "toast.pwdWeak": "Password is too weak",
        "toast.pwdOk": "Password changed successfully",
        "toast.pwdWrong": "Current password is incorrect",
        "pw.weak": "Weak",
        "pw.medium": "Medium",
        "pw.strong": "Strong",

        // Shifts & Activity
        "page.shifts": "Shift attendance",
        "nav.shifts": "Shifts",
        "nav.activity": "Activity",
        "page.activity": "Activity Log",
        "sh.date": "Date",
        "sh.staff": "Staff",
        "sh.allStaff": "All",
        "sh.load": "Load",
        "sh.export": "Export CSV",
        "sh.colStaff": "Staff",
        "sh.colIn": "Clock-in",
        "sh.colOut": "Clock-out",
        "sh.colStatus": "Status",
        "sh.edit": "Edit",
        "sh.editTitle": "Edit attendance times",
        "sh.statusOpen": "Open",
        "sh.statusClosed": "Closed",
        "sh.statusAdj": "Adjusted",
        "shift.title": "Shift Attendance",
        "shift.none": "Not clocked in today ({date})",
        "shift.open": "Clocked in at {time}",
        "shift.done": "Shift ended at {time}",
        "shift.loadErr": "Error loading shift status",
        "shift.inProgress": "In shift — clocked in at {time}",
        "shift.toastIn": "Clocked in successfully",
        "shift.toastOut": "Clocked out successfully",
        "shift.btnIn": "Clock in",
        "shift.btnOut": "Clock out",
        "act.searchPh": "Search by details, name or email...",
        "act.search": "Search",
        "act.colTime": "Time",
        "act.colUser": "User",
        "act.colDetails": "Details",
        "act.page": "Page",
        "act.empty": "No activity logs",

        // Employees
        "emp.view": "View",
        "emp.lock": "Lock",
        "emp.unlock": "Unlock",
        "emp.needPwd": "Needs password change",
        "emp.modalAdd": "Add employee",
        "status.active": "Active",
        "status.locked": "Locked",
        "role.admin2": "Administrator",
        "view.status": "Status",
        "view.role": "Role",
        "view.pwdChanged": "Password changed",
        "view.yes": "Yes",
        "view.no": "No",
        "view.salesTitle": "Sales Performance",
        "view.totalOrders": "Total orders",
        "view.totalRevenue": "Total revenue",
        "view.recentOrders": "Recent orders",
        "view.noOrders": "No orders yet",
        "view.orderId": "Order ID",
        "view.customer": "Customer",
        "view.amount": "Amount",
        "toast.unlocked": "Unlocked",
        "toast.locked": "Locked",
        "toast.email": "Email sent",

        // Customers
        "cus.orders": "Orders",
        "cus.revenue": "Revenue",
        "cus.modalEdit": "Edit customer",
        "rank.vip": "VIP",
        "hist.totalOrders": "Total orders",
        "hist.totalSum": "Total spent",

        // POS
        "page.pos": "Point of Sale",
        "shift.in": "Clock in",
        "shift.out": "Clock out",
        "cart.title": "Cart",
        "cart.clear": "Clear",
        "cart.total": "Total",
        "cart.checkout": "Checkout",
        "cart.subtotal": "Subtotal",
        "pay.title": "Payment",
        "pay.phone": "Phone number",
        "pay.name": "Customer name",
        "pay.earnLoyalty": "Earn points for this order",
        "pay.earnYes": "Yes",
        "pay.earnNo": "No",
        "pay.voucher": "Voucher",
        "pay.voucherDiscount": "Voucher discount",
        "pay.payable": "Payable",
        "pay.cash": "Cash given",
        "pay.change": "Change",
        "pay.complete": "Complete payment",
        "pay.method": "Payment method",
        "pay.methodCash": "Cash",
        "pay.methodQr": "Bank transfer (SePay QR)",
        "pay.createQr": "Generate payment QR",
        "pay.voucherNeedPhone": "Enter customer phone to use a voucher",
        "pay.voucherClear": "Remove voucher",
        "pay.voucherHsd": "Exp.",
        "pay.qrTitle": "Bank transfer payment",
        "pay.qrRefNote": "Scan the QR below. Invoice:",
        "pay.qrWaiting": "Waiting for payment...",
        "pay.qrSuccess": "Payment successful!",
        "pay.qrExpired": "Payment time expired",
        "pay.qrSwitchCash": "Switch to cash",
        "pay.qrRetry": "Create QR again",
        "pay.qrOpenWeb": "Open SePay payment page",
        "pay.qrCancel": "Close",
        "pay.sepayNotConfigured": "SePay not configured (.env)",
        "toast.sepayPaid": "Bank transfer received",
        "stock": "Stock",
        "empty.title": "Cart is empty",
        "pay.voucherNone": "No voucher",
        "loyalty.pointsPreview": "Earn {pts} points",
        "loyalty.pointsPreviewNone": "Not enough for points",
        "loyalty.hintBalance": "Balance: {bal} points",
        "loyalty.hintNew": "New customer",
        "toast.removed": "Removed from cart",
        "toast.cleared": "Cart cleared",
        "toast.paid": "Payment successful",
        "toast.paidLoyalty": "Payment successful! +{pts} points (Total: {bal})",

        // Reports
        "chart.noData": "No data",
        "modal.orderDetail": "Order details",
        "modal.products": "Products",

        "role.staff": "Staff",

        // AI Chat
        "product.sold": "sold",
        "product.items": "items",
        "ai.title": "PhoneStore says hi!",
        "ai.subtitle": "Revenue, orders, reports · 1900 54 54 63",
        "ai.emptyLead": "Suggested questions:",
        "ai.hint1": "How is today's revenue?",
        "ai.hint2": "Top selling products?",
        "ai.hint3": "Total orders this week?",
        "ai.placeholder": "e.g. How is today's revenue?",
        "ai.send": "Send",
        "ai.inputLabel": "Your question",
        "ai.fabTitle": "Open AI assistant",
        "ai.close": "Close",
        "ai.emptyReply": "(No content)",
        "ai.errSend": "Error",
        "ai.errGeneric": "Could not send",

        "dash.chartRevenueM": "Revenue (M)",
        "dash.chartOrders": "Orders",

        "customer.walkIn": "Walk-in",
        "reports.noOrdersInRange": "No orders in this date range",
        "modal.customerPay": "Customer paid",
        "modal.changeAmount": "Change",

        "prod.imageRequired": "Product image is required",
        "prod.imageLabel": "Product image",
        "prod.imageHelp": "JPG, PNG, GIF, WEBP – Max 2MB. If omitted, a default image will be used.",
        "prod.selectCategory": "Select category",
        "prod.restockTitle": "Restock",
        "prod.restockQtyLabel": "Quantity to add",
        "toast.qtyInvalid": "Invalid quantity",
        "toast.restockOk": "Stock updated successfully",

        "emp.loadingSales": "Loading sales...",

        "auth.notLoggedIn": "Not logged in",
        "auth.sessionExpired": "Session expired",
    }
};

// ===== CORE FUNCTIONS =====
export const getLang = () => localStorage.getItem(KEY_LANG) || "vi";
export const getTheme = () => localStorage.getItem(KEY_THEME) || "dark";
export const t = (k) => i18n[getLang()]?.[k] || i18n.en[k] || k;

export function applyLang() {
    const lang = getLang();
    document.documentElement.lang = lang;
    const label = document.getElementById("langLabel");
    if (label) label.textContent = lang.toUpperCase();

    // Apply translations to all elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.getAttribute("data-i18n"));
    });
    
    // Apply translations to placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
}

export function applyTheme() {
    const theme = getTheme();
    document.body.setAttribute("data-theme", theme);
    const icon = document.querySelector("#btnTheme i");
    if (icon) {
        icon.className = theme === "dark" ? "bi bi-moon-stars" : "bi bi-sun";
    }
}

export function toggleLang() {
    const next = getLang() === "vi" ? "en" : "vi";
    localStorage.setItem(KEY_LANG, next);
    applyLang();
}

export function toggleTheme() {
    const next = getTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(KEY_THEME, next);
    applyTheme();
}

// ===== TOAST NOTIFICATION =====
export function toast(msg, type = "success") {
    const el = document.getElementById("toast");
    if (!el) {
        alert(msg);
        return;
    }
    
    const icon = el.querySelector("i");
    const text = el.querySelector("#toastText");
    
    if (icon) {
        icon.className = type === "success" 
            ? "bi bi-check2-circle" 
            : type === "error" 
            ? "bi bi-x-circle" 
            : "bi bi-info-circle";
    }
    
    if (text) text.textContent = msg;
    
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 3000);
}

// ===== INITIALIZATION =====
export function initThemeAndLang() {
    applyLang();
    applyTheme();

    // Language toggle
    const btnLang = document.getElementById("btnLang");
    if (btnLang) {
        btnLang.onclick = toggleLang;
    }

    // Theme toggle
    const btnTheme = document.getElementById("btnTheme");
    if (btnTheme) {
        btnTheme.onclick = toggleTheme;
    }
}

// ===== SIDEBAR MOBILE =====
export function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const btnMobileMenu = document.getElementById("btnMobileMenu");
    const btnCollapse = document.getElementById("btnCollapse");

    if (btnMobileMenu && sidebar && overlay) {
        btnMobileMenu.onclick = () => {
            sidebar.classList.add("open");
            overlay.classList.add("show");
        };

        overlay.onclick = () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("show");
        };
    }

    if (btnCollapse) {
        btnCollapse.onclick = () => {
            document.querySelector(".ps-app")?.classList.toggle("sidebar-collapsed");
        };
    }
}

// ===== CUSTOM SELECT POPOVER =====
export function initCustomSelects() {
    function enhanceSelect(select) {
        if (select.dataset.psSelectInit) return;
        
        // Hide the original select natively
        select.style.display = 'none';
        select.dataset.psSelectInit = "1";
        
        const wrapper = document.createElement('div');
        wrapper.className = 'dropdown ps-custom-select w-100';
        
        const trigger = document.createElement('button');
        // Copy margins or specific classes if needed, but usually wrapper takes full width
        trigger.className = 'ps-input dropdown-toggle d-flex justify-content-between align-items-center w-100';
        trigger.type = 'button';
        trigger.setAttribute('data-bs-toggle', 'dropdown');
        trigger.setAttribute('aria-expanded', 'false');
        
        // Inherit styles
        if (select.style.width) wrapper.style.width = select.style.width;
        if (select.style.minWidth) wrapper.style.minWidth = select.style.minWidth;
        
        const textSpan = document.createElement('span');
        textSpan.className = 'text-truncate';
        
        const icon = document.createElement('i');
        icon.className = 'bi bi-chevron-down ms-2 flex-shrink-0';
        icon.style.color = 'var(--muted)';
        if (getTheme() === 'dark') icon.style.opacity = '0.7';
        
        trigger.appendChild(textSpan);
        trigger.appendChild(icon);
        
        const menu = document.createElement('ul');
        menu.className = 'dropdown-menu w-100 shadow-sm border-0';
        
        function updateUI() {
            const opt = select.options[select.selectedIndex];
            if (opt) {
                textSpan.textContent = opt.text;
                if (!opt.value) {
                    textSpan.style.color = 'var(--muted)';
                } else {
                    textSpan.style.color = 'inherit';
                }
            } else {
                textSpan.textContent = "";
            }
            
            menu.innerHTML = '';
            Array.from(select.options).forEach((o, index) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.className = 'dropdown-item ps-dropdown-item';
                a.href = '#';
                a.textContent = o.text;
                
                if (o.disabled) {
                    a.classList.add('disabled');
                    if (!o.value) {
                        a.style.fontWeight = '700';
                        a.style.fontSize = '12px';
                        a.style.textTransform = 'uppercase';
                        a.style.color = 'var(--muted)';
                        a.style.padding = '4px 14px';
                        a.style.background = 'transparent';
                    }
                } else {
                    if (select.selectedIndex === index) {
                        a.classList.add('active');
                    }
                    a.onclick = (e) => {
                        e.preventDefault();
                        select.selectedIndex = index;
                        // trigger change
                        select.dispatchEvent(new Event('change'));
                        updateUI();
                    };
                }
                
                li.appendChild(a);
                menu.appendChild(li);
            });
        }
        
        // Bind UI update to native change
        select.addEventListener('change', updateUI);
        
        // Watch for dynamically added options (e.g loadCategories)
        const observer = new MutationObserver(updateUI);
        observer.observe(select, { childList: true, subtree: true });
        
        updateUI();
        
        wrapper.appendChild(trigger);
        wrapper.appendChild(menu);
        
        select.parentNode.insertBefore(wrapper, select.nextSibling);

        // Optional value setter interceptor so programatic setting updates UI too
        try {
            const originalSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
            Object.defineProperty(select, "value", {
                set: function(val) {
                    originalSetter.call(this, val);
                    updateUI(); // auto update
                },
                get: function() {
                    return Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").get.call(this);
                }
            });
        } catch(e) {}
    }

    document.querySelectorAll('select.ps-input').forEach(enhanceSelect);

    const bodyObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element Node
                    if (node.tagName === 'SELECT' && node.classList.contains('ps-input')) {
                        enhanceSelect(node);
                    }
                    node.querySelectorAll?.('select.ps-input').forEach(enhanceSelect);
                }
            });
        });
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
}

// Auto Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomSelects);
} else {
    initCustomSelects();
}
