/**
 * Admin Dashboard Logic for GitHub Pages
 * Menghubungkan UI admin.html dengan APIClient
 */

let pendingRequests = [];
let currentUser = null;
let sessionToken = localStorage.getItem('adminAuthToken');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupUI();
    validateSession();

    // Login Form Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function setupUI() {
    // Search filter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderTable(e.target.value));
    }
}

async function validateSession() {
    if (!sessionToken) {
        showLogin();
        return;
    }

    try {
        const res = await api.postRequest('admin-check-auth', { token: sessionToken });
        if (res.authenticated) {
            currentUser = res.user;
            showDashboard();
        } else {
            handleLogoutAction();
        }
    } catch (err) {
        console.error("Auth check failed:", err);
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    showLoading("Autentikasi...");
    try {
        const res = await api.adminLogin(email, pass);
        if (res.success) {
            localStorage.setItem('adminAuthToken', res.token);
            sessionToken = res.token;
            currentUser = res.user;
            showDashboard();
        } else {
            alert("Login Gagal: " + (res.message || "Email atau password salah"));
        }
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        hideLoading();
    }
}

function showDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard-app').style.display = 'block';
    document.getElementById('user-display-name').textContent = currentUser.nama;
    loadRequests();
}

function showLogin() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('dashboard-app').style.display = 'none';
}

function handleLogout() {
    if (confirm("Keluar dari dashboard?")) {
        handleLogoutAction();
    }
}

function handleLogoutAction() {
    localStorage.removeItem('adminAuthToken');
    sessionToken = null;
    showLogin();
}

async function loadRequests() {
    showLoading("Memuat data...");
    try {
        const res = await api.getAdminRequests();
        if (res.success) {
            pendingRequests = res.data || [];

            // Update stats
            if (res.stats) {
                document.getElementById('count-pending').textContent = res.stats.pending || 0;
                document.getElementById('count-active-users').textContent = res.stats.activeUsers || 0;
                document.getElementById('count-expired').textContent = res.stats.toRevoke || 0;
            }

            renderTable();
        }
    } catch (err) {
        console.error("Load requests failed:", err);
    } finally {
        hideLoading();
    }
}

function renderTable(filter = '') {
    const tbody = document.getElementById('requestTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = filter.toLowerCase();
    const filtered = pendingRequests.filter(r =>
        (r.nama || "").toLowerCase().includes(query) ||
        (r.requestId || "").toLowerCase().includes(query) ||
        (r.nim || "").toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted">Tidak ada data.</td></tr>';
        return;
    }

    filtered.forEach(req => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="fw-bold">${req.nama}</div>
                <div class="text-muted small">${req.nim} | ID: ${req.requestId}</div>
            </td>
            <td>
                <div class="small">${req.software}</div>
                <div class="text-muted extra-small">${req.roomPreference}</div>
            </td>
            <td><span class="badge bg-light text-dark border">${req.requestType}</span></td>
            <td class="text-center">
                <button class="btn btn-primary btn-sm rounded-pill px-3" onclick="openProcessModal('${req.requestId}')">Proses</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global functions for UI
window.handleLogout = handleLogout;
window.loadRequests = loadRequests;
window.openProcessModal = (id) => alert("Fitur proses detail (modal) akan menyusul di versi berikutnya.");

// Loading UI Helpers
function showLoading(text) {
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');
    if (overlay) overlay.style.display = 'flex';
    if (textEl) textEl.textContent = text;
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}
