// Menunggu sampai semua konten HTML dimuat
document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. Jalankan Inisialisasi Navigasi ---
    initActiveNav();

    // --- 2. Jalankan Inisialisasi Halaman Scan ---
    if (document.getElementById('xray-input')) {
        initScanPage();
    }
});


/**
 * Fungsi untuk memberi kelas 'active' pada link navbar yang sesuai.
 */
function initActiveNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop();
    const activePage = (currentPage === "") ? "index.html" : currentPage;

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === activePage) {
            link.classList.add('active');
        }
    });
}


/**
 * Fungsi untuk semua logika di halaman skrining (scan.html).
 */
function initScanPage() {
    // --- 2a. Ambil semua elemen UI ---
    const xrayInput = document.getElementById('xray-input');
    const uploadLabel = document.querySelector('.upload-label'); // <-- TAMBAHAN
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const scanButton = document.getElementById('scan-btn');
    
    const resultsSection = document.getElementById('results-section');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultContent = document.getElementById('result-content');
    
    const resultFinding = document.getElementById('result-finding');
    const resultScore = document.getElementById('result-score');
    
    const heatmapContainer = document.getElementById('heatmap-container');
    const originalImageResult = document.getElementById('original-image-result');
    const heatmapImageResult = document.getElementById('heatmap-image-result');

    let selectedFile = null;

    // --- 2b. Event listener untuk KLIK (pilih file) ---
    xrayInput.addEventListener('change', function() {
        // Ambil file dari input klik
        const file = this.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // --- 2c. Event listener untuk DRAG & DROP --- // <-- BLOK TAMBAHAN
    if (uploadLabel) {
        // Mencegah browser membuka file saat di-drag
        uploadLabel.addEventListener('dragover', function(event) {
            event.preventDefault();
            uploadLabel.classList.add('dragging'); // (Opsional) ganti tampilan
        });

        // (Opsional) Kembalikan tampilan saat file ditarik keluar
        uploadLabel.addEventListener('dragleave', function() {
            uploadLabel.classList.remove('dragging');
        });

        // Ini bagian penting: saat file DIJATUHKAN (drop)
        uploadLabel.addEventListener('drop', function(event) {
            event.preventDefault(); // Mencegah browser membuka file
            uploadLabel.classList.remove('dragging');

            // Ambil file dari event drop
            const file = event.dataTransfer.files[0];
            
            // Masukkan file ke input (agar konsisten)
            xrayInput.files = event.dataTransfer.files;

            if (file) {
                handleFile(file);
            }
        });
    }

    // --- 2d. Fungsi baru untuk memproses file (biar tidak duplikat) ---
    function handleFile(file) {
        selectedFile = file; // Simpan file
            
        // Tampilkan preview gambar
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);
        
        // Aktifkan tombol scan
        scanButton.disabled = false;
    }


    // --- 2e. Event listener saat tombol "Analisis Gambar" diklik ---
    scanButton.addEventListener('click', async function() {
        if (!selectedFile) {
            alert('Tolong pilih file gambar terlebih dahulu.');
            return;
        }

        // Tampilkan loading & scroll
        resultsSection.style.display = 'block';
        loadingSpinner.style.display = 'block';
        resultContent.style.display = 'none';
        heatmapContainer.style.display = 'none';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        const formData = new FormData();
        formData.append('file', selectedFile);

        const API_URL = 'https://blaziooon-tubris.hf.space/predict'; 
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error dari server: ${response.statusText}`);
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error('Error saat fetch API:', error);
            loadingSpinner.style.display = 'none';
            resultFinding.textContent = 'Analisis Gagal';
            resultFinding.classList.add('result-positive');
            resultScore.textContent = 'Gagal terhubung ke server AI. Pastikan server app.py sudah jalan.';
            resultContent.style.display = 'block';
        }
    });

    // --- 2f. Fungsi untuk Menampilkan Hasil ---
    function displayResults(data) {
        loadingSpinner.style.display = 'none';
        resultContent.style.display = 'block';

        resultFinding.textContent = data.hasil;
        resultScore.textContent = `Tingkat Keyakinan Model: ${data.confidence}`;

        resultFinding.classList.remove('result-positive', 'result-negative');
        
        if (data.hasil.toLowerCase() === 'tuberculosis') {
            resultFinding.classList.add('result-positive'); // Merah
        } else {
            resultFinding.classList.add('result-negative'); // Hijau
        }

        if (data.heatmap_base64) {
            heatmapImageResult.src = 'data:image/jpeg;base64,' + data.heatmap_base64;
            originalImageResult.src = imagePreview.src;
            heatmapContainer.style.display = 'block';
        }
    }
}
