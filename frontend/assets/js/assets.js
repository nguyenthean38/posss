/**
 * Assets Helper Module
 * Centralized asset paths and utilities
 */

export const ASSETS = {
    // Logos & Branding
    logo: {
        svg: 'assets/images/logo.svg',
        png: 'assets/images/logo.png',
        favicon: 'assets/images/favicon.svg',
        faviconIco: 'assets/images/favicon.ico'
    },
    
    branding: {
        logo: 'assets/images/branding/logo.svg',
        logoWhite: 'assets/images/branding/logo-white.svg',
        mark: 'assets/images/branding/mark.svg',
        markWhite: 'assets/images/branding/mark-white.svg',
        emblem: 'assets/images/branding/emblem.svg',
        emblemWhite: 'assets/images/branding/emblem-white.svg',
        lettermark: 'assets/images/branding/lettermark.svg',
        lettermarkWhite: 'assets/images/branding/lettermark-white.svg'
    },
    
    // Placeholders
    placeholder: {
        product: 'assets/images/product-placeholder.svg',
        avatar: 'assets/images/avatar-placeholder.svg'
    },
    
    // Empty States
    empty: {
        cart: 'assets/images/empty-cart.svg',
        data: 'assets/images/empty-data.svg'
    }
};

/**
 * Get product image with fallback
 */
export function getProductImage(imageUrl) {
    if (!imageUrl) {
        return ASSETS.placeholder.product;
    }
    
    // Nếu đã là URL đầy đủ (http/https), trả về luôn
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // Nếu là relative path, thêm backend URL
    // Backend uploads folder: /backend/uploads/...
    return `http://localhost:8080/backend/${imageUrl}`;
}

/**
 * Get avatar image with fallback
 */
export function getAvatarImage(avatarUrl) {
    if (!avatarUrl) {
        return ASSETS.placeholder.avatar;
    }
    
    // Nếu đã là URL đầy đủ (http/https), trả về luôn
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return avatarUrl;
    }
    
    // Nếu là relative path, thêm backend URL
    return `http://localhost:8080/backend/${avatarUrl}`;
}

/**
 * Get logo based on theme
 */
export function getLogo(theme = 'dark') {
    return theme === 'dark' 
        ? ASSETS.branding.logoWhite 
        : ASSETS.branding.logo;
}

/**
 * Get mark icon based on theme
 */
export function getMark(theme = 'dark') {
    return theme === 'dark' 
        ? ASSETS.branding.markWhite 
        : ASSETS.branding.mark;
}

/**
 * Image error handler - set fallback
 */
export function handleImageError(event, fallbackType = 'product') {
    const fallbacks = {
        product: ASSETS.placeholder.product,
        avatar: ASSETS.placeholder.avatar
    };
    
    event.target.src = fallbacks[fallbackType] || fallbacks.product;
    event.target.onerror = null; // Prevent infinite loop
}

/**
 * Preload critical images
 */
export function preloadImages() {
    const criticalImages = [
        ASSETS.logo.svg,
        ASSETS.branding.logoWhite,
        ASSETS.placeholder.product,
        ASSETS.placeholder.avatar
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Category icons mapping (Bootstrap Icons)
export const CATEGORY_ICONS = {
    smartphone: { icon: 'bi-phone', color: '#3b82f6', label: 'Điện thoại' },
    tablet: { icon: 'bi-tablet', color: '#8b5cf6', label: 'Máy tính bảng' },
    laptop: { icon: 'bi-laptop', color: '#06b6d4', label: 'Laptop' },
    watch: { icon: 'bi-smartwatch', color: '#f59e0b', label: 'Đồng hồ thông minh' },
    headphone: { icon: 'bi-headphones', color: '#ec4899', label: 'Tai nghe' },
    speaker: { icon: 'bi-speaker', color: '#10b981', label: 'Loa' },
    charger: { icon: 'bi-battery-charging', color: '#84cc16', label: 'Sạc & cáp' },
    case: { icon: 'bi-phone-flip', color: '#6366f1', label: 'Ốp lưng & bao da' },
    screen: { icon: 'bi-display', color: '#14b8a6', label: 'Kính cường lực' },
    other: { icon: 'bi-box', color: '#64748b', label: 'Phụ kiện khác' }
};

/**
 * Get category icon config
 */
export function getCategoryIcon(categoryType) {
    return CATEGORY_ICONS[categoryType] || CATEGORY_ICONS.other;
}

export default ASSETS;
