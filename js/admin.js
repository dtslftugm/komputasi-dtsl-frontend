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
    loadAppBranding(); // Milestone 11 Branding

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
        const res = await api.checkAuth(sessionToken); // Gunakan method yang sesuai
        if (res.success && res.data && res.data.authenticated) {
            currentUser = res.data.user;
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
        if (res.success && res.data) {
            localStorage.setItem('adminAuthToken', res.data.token);
            sessionToken = res.data.token;
            currentUser = res.data.user;
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

                // New Stats (Synced from GAS)
                if (document.getElementById('count-maintenance')) {
                    document.getElementById('count-maintenance').textContent = res.stats.labMaintenance || 0;
                }
                if (document.getElementById('count-total-requests')) {
                    document.getElementById('count-total-requests').textContent =
                        `${res.stats.labUsed || 0} / ${res.stats.labTotal || 0} PC`;
                }
            }

            renderTable();

            // Load Maintenance if stats show some
            if (res.stats && res.stats.labMaintenance > 0) {
                loadMaintenanceList();
            }
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
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted">Tidak ada data permohonan baru.</td></tr>';
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

/**
 * --- MAINTENANCE LOGIC ---
 */
async function loadMaintenanceList() {
    const tbody = document.getElementById('maintenanceSectionBody');
    if (!tbody) return;

    try {
        const res = await api.jsonpRequest('admin-maintenance-list');
        if (res.success && res.data) {
            renderMaintenanceTable(res.data);
            document.getElementById('maintenance-container').classList.remove('d-none');
        } else {
            document.getElementById('maintenance-container').classList.add('d-none');
        }
    } catch (err) {
        console.warn("Failed to load maintenance list:", err);
    }
}

function renderMaintenanceTable(data) {
    const tbody = document.getElementById('maintenanceSectionBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Tidak ada data maintenance.</td></tr>';
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="badge ${item.type === 'PC' ? 'bg-warning text-dark' : 'bg-info text-white'} me-2">${item.type}</span>
                <span class="fw-bold">${item.targetName}</span>
            </td>
            <td>
                <div class="small fw-bold">${item.lastUser || '-'}</div>
                <div class="text-muted extra-small">ID: ${item.requestId || '-'}</div>
            </td>
            <td>
                <div class="small">${item.dateRef || '-'}</div>
                <div class="extra-small text-danger">${item.daysAgo || 0} hari lalu</div>
            </td>
            <td><div class="small text-muted">Maintenance rutin/Cleanup</div></td>
            <td class="text-center">
                <button class="btn btn-outline-primary btn-sm rounded-pill px-3" 
                        onclick="alert('Selesaikan maintenance di dashboard GAS untuk keamanan sinkronisasi data.')">Detail</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showMaintenanceModal() {
    const container = document.getElementById('maintenance-container');
    if (container) {
        container.classList.remove('d-none');
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

// Global functions for UI
window.loadRequests = loadRequests;
window.showSection = (sectionId) => {
    // Basic navigation logic
    console.log("Switching to section:", sectionId);
    // For now, only dashboard is implemented. 
    // If you add more pages, handle them here.
};
window.showMaintenanceModal = showMaintenanceModal;
window.openProcessModal = (id) => alert("Fitur proses detail (modal) akan menyusul di versi berikutnya.");

/**
 * --- AGENDA MANAGEMENT ---
 */
let agendaModalObj = null;

async function openAgendaModal() {
    if (!agendaModalObj) {
        agendaModalObj = new bootstrap.Modal(document.getElementById('agendaModal'));
    }
    refreshAgendaList();
    agendaModalObj.show();
}

async function refreshAgendaList() {
    const tbody = document.getElementById('agenda-list');
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3 small">Memuat data agenda...</td></tr>';

    try {
        const res = await api.jsonpRequest('admin-agendas');
        if (!tbody) return;
        const agendas = res.data || [];
        
        if (agendas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3 small">Tidak ada agenda mendatang</td></tr>';
            return;
        }

        tbody.innerHTML = agendas.map(a => {
            return `
                <tr>
                    <td class="fw-bold text-primary">${a.ruangan}</td>
                    <td>${a.kegiatan}</td>
                    <td><div class="small">${a.mulai} - ${a.selesai}</div></td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center gap-1">
                            <button class="btn btn-outline-danger btn-sm rounded-circle p-1" style="width:24px; height:24px; display:flex; align-items:center; justify-content:center;" onclick="handleHapusAgenda(${a.rowIndex})" title="Hapus">❌</button>
                            <button class="btn btn-outline-warning btn-sm rounded-circle p-1" style="width:24px; height:24px; display:flex; align-items:center; justify-content:center;" onclick="handleBroadcastAgenda(${a.rowIndex})" title="Siarkan Pengingat">📢</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-3 small">Error memuat data</td></tr>';
    }
}

async function handleSimpanAgenda() {
    const data = {
        ruangan: document.getElementById('agenda-ruangan').value,
        kegiatan: document.getElementById('agenda-kegiatan').value,
        mulai: document.getElementById('agenda-mulai').value,
        selesai: document.getElementById('agenda-selesai').value,
        deskripsi: document.getElementById('agenda-deskripsi').value
    };

    showLoading("Menyimpan Agenda...");
    try {
        const res = await api.jsonpRequest('admin-save-agenda', data);
        if (res.success) {
            alert("Agenda berhasil disimpan.");
            document.getElementById('agendaForm').reset();
            refreshAgendaList();
        } else {
            alert("Gagal: " + res.message);
        }
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        hideLoading();
    }
}

async function handleHapusAgenda(rowIndex) {
    if (!confirm("Hapus agenda ini?")) return;
    
    showLoading("Menghapus...");
    try {
        const res = await api.jsonpRequest('admin-delete-agenda', { rowIndex: rowIndex });
        if (res.success) {
            refreshAgendaList();
        } else {
            alert("Gagal: " + res.message);
        }
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        hideLoading();
    }
}

async function handleBroadcastAgenda(rowIndex) {
    if (!confirm("Siarkan pengingat agenda ke pengguna terkait?")) return;
    
    showLoading("Broadcasting...");
    try {
        const res = await api.jsonpRequest('admin-broadcast-agenda', { rowIndex: rowIndex });
        if (res.success) {
            alert(`Broadcast terkirim ke ${res.count} pengguna.`);
        } else {
            alert("Gagal: " + res.message);
        }
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        hideLoading();
    }
}

window.openAgendaModal = openAgendaModal;
window.handleSimpanAgenda = handleSimpanAgenda;
window.handleHapusAgenda = handleHapusAgenda;
window.handleBroadcastAgenda = handleBroadcastAgenda;

/**
 * --- BRANDING LOGIC (Milestone 11) ---
 */
async function loadAppBranding() {
    try {
        const res = await api.getBranding();
        if (res.success && res.data) {
            setupBranding(res.data);
        }
    } catch (e) {
        console.warn('Error loading branding:', e);
    }
}

function setupBranding(data) {
    if (!data) return;

    // Set logos
    const logoEls = document.querySelectorAll('#app-logo, #login-logo');
    if (data.logo) {
        let logoSrc = data.logo;
        if (logoSrc.trim() && !logoSrc.startsWith('http') && !logoSrc.startsWith('data:')) {
            logoSrc = 'data:image/png;base64,' + logoSrc;
        }
        logoEls.forEach(el => { el.src = logoSrc; });
    }

    // Set QR code (optional for admin but kept for consistency)
    const qrEl = document.getElementById('app-qr');
    if (data.qr && qrEl) {
        let qrSrc = data.qr;
        if (qrSrc.trim() && !qrSrc.startsWith('http') && !qrSrc.startsWith('data:')) {
            qrSrc = 'data:image/png;base64,' + qrSrc;
        }
        qrEl.src = qrSrc;
    }
}

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
