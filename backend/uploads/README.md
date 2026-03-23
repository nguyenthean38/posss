# Uploads Directory

This directory stores uploaded files for the application.

## Directory Structure

```
uploads/
├── products/          # Product images (REQUIRED when creating products)
├── customers/         # Customer avatars (OPTIONAL - default: default-customer.png)
│   └── default-customer.png
└── avatars/           # Staff avatars (OPTIONAL - default: default-staff.png)
    └── default-staff.png
```

## File Upload Rules

### Products
- Image upload is **REQUIRED** when creating a product
- Allowed formats: JPG, PNG, GIF, WEBP
- Maximum size: 2MB
- Naming: `product_{timestamp}_{random}.{ext}`

### Customers
- Avatar upload is **OPTIONAL**
- Default image: `uploads/customers/default-customer.png`
- Allowed formats: JPG, PNG, GIF, WEBP
- Maximum size: 2MB
- Naming: `customer_{timestamp}_{random}.{ext}`

### Staff
- Avatar upload is **OPTIONAL**
- Default image: `uploads/avatars/default-staff.png`
- Allowed formats: JPG, PNG, GIF, WEBP
- Maximum size: 2MB
- Naming: `user_{timestamp}_{random}.{ext}`

## Security

- All uploads are validated for file type and size
- Files are renamed with timestamp and random string to prevent conflicts
- MIME type checking is enforced
- Directory permissions: 0777 (created automatically by FileUpload class)
