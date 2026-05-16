// Global Variables
let originalImage = null;
let originalImageData = null;
let compressedBlob = null;
let originalWidth = 0;
let originalHeight = 0;
let originalSize = 0;

// DOM Elements
const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const formatSelect = document.getElementById('formatSelect');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const loadingOverlay = document.getElementById('loadingOverlay');
const notification = document.getElementById('notification');

// Upload Handlers
uploadBox.addEventListener('click', () => imageInput.click());

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = 'var(--primary-color)';
    uploadBox.style.background = 'rgba(0, 240, 255, 0.15)';
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = '';
    uploadBox.style.background = '';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '';
    uploadBox.style.background = '';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageUpload(files[0]);
    }
});

imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageUpload(e.target.files[0]);
    }
});

// Quality Slider
qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value;
});

// Image Upload Handler
function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        showNotification('⚠️ Please select a valid image file!', 'error');
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        showNotification('⚠️ File size exceeds 50MB limit!', 'error');
        return;
    }

    originalSize = file.size;
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            originalWidth = img.naturalWidth;
            originalHeight = img.naturalHeight;

            // Display original preview
            originalPreview.innerHTML = '';
            const imgClone = img.cloneNode();
            imgClone.style.maxWidth = '100%';
            imgClone.style.maxHeight = '100%';
            originalPreview.appendChild(imgClone);

            // Store image data
            originalImageData = e.target.result;

            // Update controls
            widthInput.value = originalWidth;
            heightInput.value = originalHeight;
            widthInput.disabled = false;
            heightInput.disabled = false;
            qualitySlider.disabled = false;
            formatSelect.disabled = false;
            processBtn.disabled = false;

            showNotification('✅ Image loaded successfully!', 'success');
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// Aspect Ratio Lock
widthInput.addEventListener('change', () => {
    const width = parseInt(widthInput.value);
    if (width && originalHeight && originalWidth) {
        const ratio = width / originalWidth;
        const newHeight = Math.round(originalHeight * ratio);
        heightInput.value = newHeight;
    }
});

heightInput.addEventListener('change', () => {
    const height = parseInt(heightInput.value);
    if (height && originalWidth && originalHeight) {
        const ratio = height / originalHeight;
        const newWidth = Math.round(originalWidth * ratio);
        widthInput.value = newWidth;
    }
});

// Process Image
function processImage() {
    if (!originalImage) {
        showNotification('⚠️ Please select an image first!', 'error');
        return;
    }

    const width = parseInt(widthInput.value) || originalWidth;
    const height = parseInt(heightInput.value) || originalHeight;
    const quality = parseInt(qualitySlider.value) / 100;
    const format = formatSelect.value;

    showLoading(true);

    // Simulate processing time
    setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(originalImage, 0, 0, width, height);

        const mimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`;
        canvas.toBlob((blob) => {
            compressedBlob = blob;
            const compressedSize = blob.size;

            // Show compressed preview
            const compressedImage = new Image();
            compressedImage.src = URL.createObjectURL(blob);
            compressedImage.onload = () => {
                compressedPreview.innerHTML = '';
                const imgClone = compressedImage.cloneNode();
                imgClone.style.maxWidth = '100%';
                imgClone.style.maxHeight = '100%';
                compressedPreview.appendChild(imgClone);
            };

            // Calculate binary data
            const binaryData = generateBinaryData(blob);
            displayBinaryStream(binaryData);

            // Update statistics
            updateStatistics(originalSize, compressedSize, width, height, binaryData.length, quality);

            // Enable download
            downloadBtn.disabled = false;

            showLoading(false);
            showNotification('✅ Image processed successfully!', 'success');
        }, mimeType, quality);
    }, 1500);
}

// Generate Binary Data
function generateBinaryData(blob) {
    const reader = new FileReader();
    let binaryString = '';

    return new Promise((resolve) => {
        reader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);
            for (let i = 0; i < Math.min(bytes.length, 500); i++) {
                binaryString += bytes[i].toString(2).padStart(8, '0') + ' ';
            }
            resolve(binaryString);
        };
        reader.readAsArrayBuffer(blob);
    }).then((binary) => {
        return binary;
    });
}

// Display Binary Stream
function displayBinaryStream(binaryData) {
    const binaryStream = document.getElementById('binaryStream');
    binaryStream.innerHTML = '';

    if (binaryData) {
        const binaryText = document.createElement('div');
        binaryText.innerHTML = binaryData;
        binaryStream.appendChild(binaryText);
    }
}

// Update Statistics
function updateStatistics(originalSize, compressedSize, width, height, binarySize, quality) {
    const savedSize = originalSize - compressedSize;
    const savedPercent = ((savedSize / originalSize) * 100).toFixed(2);
    const compressionRatio = ((compressedSize / originalSize) * 100).toFixed(2);

    // Update stat cards
    document.getElementById('originalSizeStat').textContent = formatBytes(originalSize);
    document.getElementById('compressedSizeStat').textContent = formatBytes(compressedSize);
    document.getElementById('compressionRatioStat').textContent = compressionRatio + '%';
    document.getElementById('savedSizeStat').textContent = formatBytes(savedSize);
    document.getElementById('dimensionsStat').textContent = `${width} × ${height}`;
    document.getElementById('binarySizeStat').textContent = binarySize + ' bits';

    // Update stat bars
    document.querySelectorAll('.stat-fill').forEach((fill, index) => {
        if (index === 1) fill.style.width = compressionRatio + '%';
        if (index === 2) fill.style.width = savedPercent + '%';
        if (index === 3) fill.style.width = (100 - parseInt(compressionRatio)) + '%';
    });
}

// Format Bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// Download Image
function downloadImage() {
    if (!compressedBlob) {
        showNotification('⚠️ Please compress an image first!', 'error');
        return;
    }

    const url = URL.createObjectURL(compressedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed-image-${Date.now()}.${formatSelect.value}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('✅ Image downloaded successfully!', 'success');
}

// Copy Binary Data
function copyBinaryData() {
    const binaryStream = document.getElementById('binaryStream').textContent;
    if (!binaryStream || binaryStream.includes('Binary data')) {
        showNotification('⚠️ No binary data to copy!', 'error');
        return;
    }

    navigator.clipboard.writeText(binaryStream).then(() => {
        showNotification('✅ Binary data copied to clipboard!', 'success');
    });
}

// Switch Tab
function switchTab(tab) {
    const originalPreviewElem = document.getElementById('originalPreview');
    const compressedPreviewElem = document.getElementById('compressedPreview');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'original') {
        originalPreviewElem.classList.remove('hidden');
        compressedPreviewElem.classList.add('hidden');
    } else {
        originalPreviewElem.classList.add('hidden');
        compressedPreviewElem.classList.remove('hidden');
    }
}

// Reset All
function resetAll() {
    originalImage = null;
    originalImageData = null;
    compressedBlob = null;
    originalWidth = 0;
    originalHeight = 0;
    originalSize = 0;

    imageInput.value = '';
    widthInput.value = '';
    heightInput.value = '';
    qualitySlider.value = 85;
    qualityValue.textContent = '85';
    formatSelect.value = 'jpeg';

    widthInput.disabled = true;
    heightInput.disabled = true;
    qualitySlider.disabled = true;
    formatSelect.disabled = true;
    processBtn.disabled = true;
    downloadBtn.disabled = true;

    originalPreview.innerHTML = '<div class="empty-state"><span class="empty-icon">🖼️</span><p>No image loaded</p></div>';
    compressedPreview.innerHTML = '<div class="empty-state"><span class="empty-icon">✨</span><p>Compressed image preview</p></div>';
    document.getElementById('binaryStream').innerHTML = '<span class="binary-placeholder">Binary data will appear here...</span>';

    document.querySelectorAll('.stat-value').forEach(el => {
        if (!el.id.includes('qualityValue')) el.textContent = '0';
    });

    document.getElementById('dimensionsStat').textContent = '0 × 0';
    document.getElementById('binarySizeStat').textContent = '0 bits';

    showNotification('🔄 All fields reset!', 'info');
}

// Show Loading
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = 'notification show';

    setTimeout(() => {
        notif.classList.remove('show');
    }, 3000);
}