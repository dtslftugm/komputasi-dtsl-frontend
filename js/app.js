/**
 * Main Application Logic
 */

// ===== DOM ELEMENTS =====
const form = document.getElementById('submission-form');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');
const successModal = new bootstrap.Modal(document.getElementById('success-modal'));
const needsComputerCheckbox = document.getElementById('needsComputer');
const computerSection = document.getElementById('computer-section');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initialized');
    await loadInitialData();
    setupEventListeners();
});

// ===== LOAD INITIAL DATA =====
async function loadInitialData() {
    try {
        showLoading('Memuat data...');

        const data = await api.getInitialData();

        // Populate dropdowns
        if (data.prodiList) {
            populateSelect('prodi', data.prodiList);
        }

        // Show announcement if exists
        if (data.announcementText) {
            document.getElementById('announcement-text').textContent = data.announcementText;
            document.getElementById('announcement-alert').classList.remove('d-none');
        }

        hideLoading();
    } catch (error) {
        console.error('Failed to load initial data:', error);
        hideLoading();
        showError('Gagal memuat data. Pastikan backend sudah di-deploy.');
    }
}

// ===== POPULATE SELECT OPTIONS =====
function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option;
        optElement.textContent = option;
        select.appendChild(optElement);
    });
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', handleSubmit);

    // Computer checkbox toggle
    needsComputerCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            computerSection.classList.remove('d-none');
        } else {
            computerSection.classList.add('d-none');
        }
    });

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('mulai').setAttribute('min', today);
    document.getElementById('akhir').setAttribute('min', today);
}

// ===== FORM SUBMISSION =====
async function handleSubmit(e) {
    e.preventDefault();

    try {
        showLoading('Mengirim permohonan...');

        // Gather form data
        const formData = {
            nama: document.getElementById('nama').value.trim(),
            nim: document.getElementById('nim').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            prodi: document.getElementById('prodi').value,
            keperluanPenggunaan: document.getElementById('keperluan').value,
            topik: document.getElementById('topik').value.trim(),
            software: document.getElementById('software').value.trim(),
            mulaiPemakaian: document.getElementById('mulai').value,
            akhirPemakaian: document.getElementById('akhir').value || null,
            needsComputer: needsComputerCheckbox.checked,
            computerRoomPreference: document.getElementById('roomPreference').value || null,
            linkSurat: document.getElementById('linkSurat').value.trim(),
            timestamp: new Date().toISOString()
        };

        // Submit to API
        const result = await api.submitRequest(formData);

        hideLoading();

        if (result.success) {
            showSuccess(`Permohonan berhasil dikirim!<br>Request ID: <strong>${result.requestId || 'N/A'}</strong><br><br>Kami akan memverifikasi berkas Anda dan mengirimkan informasi akses melalui email.`);
            form.reset();
            computerSection.classList.add('d-none');
        } else {
            showError(result.message || 'Gagal mengirim permohonan');
        }

    } catch (error) {
        hideLoading();
        console.error('Submit error:', error);
        showError('Terjadi kesalahan: ' + error.message);
    }
}

// ===== UI HELPERS =====
function showLoading(message = 'Mohon Tunggu...') {
    loadingMessage.textContent = message;
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function showSuccess(message) {
    document.getElementById('success-message').innerHTML = message;
    successModal.show();
}

function showError(message) {
    alert('❌ Error: ' + message);
}

// ===== UTILITY FUNCTIONS =====
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateNIM(nim) {
    return /^\d{2}\/\d{6}\/\w{2}\/\d{5}$/.test(nim);
}
