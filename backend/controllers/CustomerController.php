<?php

class CustomerController {
    private $customerModel;
    private $logModel;

    public function __construct($db) {
        $this->customerModel = new Customer($db);
        $this->logModel = new Log($db);
    }

    // [POST] /api/customers
    // UC-21: Tạo khách hàng mới khi thanh toán lần đầu
    public function store($data) {
        AuthMiddleware::checkAuth();

        $fullName = isset($data['full_name']) ? trim($data['full_name']) : '';
        $phone = isset($data['phone_number']) ? trim($data['phone_number']) : '';
        $address = isset($data['address']) ? trim($data['address']) : null;

        if ($fullName === '' || $phone === '') {
            Response::json(["message" => "Họ tên và SĐT không được để trống"], 400);
        }

        // Kiểm tra trùng SĐT
        if ($this->customerModel->existsByPhone($phone)) {
            Response::json(["message" => "Số điện thoại đã tồn tại trong hệ thống"], 400);
        }

        $newId = $this->customerModel->create($fullName, $phone, $address);
        if ($newId) {
            $customer = $this->customerModel->findById($newId);
            $this->logModel->createLog(
                $_SESSION['user_id'],
                'create_customer',
                'Tạo khách hàng ID=' . $newId . ' SĐT=' . $phone
            );

            Response::json([
                "message" => "Tạo khách hàng thành công",
                "customer" => $customer
            ], 201);
        }

        Response::json(["message" => "Lỗi server khi tạo khách hàng"], 500);
    }

    // [GET] /api/customers/{id}
    // UC-22: Xem thông tin khách hàng + tổng quan mua hàng
    public function show($customerId) {
        AuthMiddleware::checkAuth();

        $customerId = (int)$customerId;
        if ($customerId <= 0) {
            Response::json(["message" => "ID khách hàng không hợp lệ"], 400);
        }

        $customer = $this->customerModel->findById($customerId);
        if (!$customer) {
            Response::json(["message" => "Khách hàng không tồn tại"], 404);
        }

        $overview = $this->customerModel->getPurchaseOverview($customerId, 10);

        $this->logModel->createLog(
            $_SESSION['user_id'],
            'view_customer',
            'Xem hồ sơ khách hàng ID=' . $customerId
        );

        Response::json([
            'customer' => $customer,
            'purchase_overview' => $overview,
        ]);
    }

    // [GET] /api/customers/search-by-phone?phone=...
    // UC-20: Tra cứu khách hàng theo SĐT
    public function searchByPhone() {
        AuthMiddleware::checkAuth();

        $phone = isset($_GET['phone']) ? trim($_GET['phone']) : '';
        if ($phone === '') {
            Response::json(["message" => "Vui lòng nhập số điện thoại"], 400);
        }

        $customer = $this->customerModel->findByPhone($phone);
        if ($customer) {
            $this->logModel->createLog(
                $_SESSION['user_id'],
                'lookup_customer_phone',
                'Tra cứu khách hàng SĐT=' . $phone . ' (ID=' . $customer['id'] . ')'
            );

            Response::json([
                "customer" => $customer
            ]);
        } else {
            $this->logModel->createLog(
                $_SESSION['user_id'],
                'lookup_customer_phone_not_found',
                'Tra cứu khách hàng SĐT=' . $phone . ' nhưng không tìm thấy'
            );

            Response::json([
                "message" => "Khách hàng không tồn tại"
            ], 404);
        }
    }
}

