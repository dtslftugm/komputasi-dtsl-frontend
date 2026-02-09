/**
 * API Client - Wrapper untuk fetch() calls ke Google Apps Script backend
 */
class APIClient {
    constructor() {
        this.baseURL = CONFIG.API_URL;
    }

    /**
     * Make API request
     * @param {string} path - API endpoint path
     * @param {string} method - HTTP method (GET/POST)
     * @param {object} data - Request data (for POST)
     * @returns {Promise} Response data
     */
    async request(path, method = 'GET', data = null) {
        const url = `${this.baseURL}?path=${encodeURIComponent(path)}`;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (method === 'POST' && data) {
            options.body = JSON.stringify({ path, ...data });
        }

        try {
            const response = await fetch(url, options);
            const json = await response.json();

            if (!json.success) {
                throw new Error(json.message || 'Request failed');
            }

            return json.data || json;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Get initial data for form (dropdowns, config, renewal data)
     */
    async getInitialData(renewalId = null) {
        const path = renewalId
            ? `initial-data&renewal_id=${renewalId}`
            : 'initial-data';
        return this.request(path);
    }

    /**
     * Get available computers for selection
     */
    async getAvailableComputers(room = null) {
        const path = room
            ? `computers-available&room=${encodeURIComponent(room)}`
            : 'computers-available';
        return this.request(path);
    }

    /**
     * Get branding assets (logo, QR)
     */
    async getBranding() {
        return this.request('branding');
    }

    /**
     * Get software access rules
     */
    async getSoftwareRules() {
        return this.request('software-rules');
    }

    /**
     * Submit new request
     */
    async submitRequest(formData) {
        return this.request('submit-request', 'POST', formData);
    }

    /**
     * Upload file to Google Drive
     */
    async uploadFile(rowIndex, fileData, fileName, mimeType) {
        return this.request('upload-file', 'POST', {
            rowIndex,
            fileData,
            fileName,
            mimeType
        });
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Admin login
     */
    async adminLogin(email, password) {
        return this.request('admin-login', 'POST', { email, password });
    }

    /**
     * Get admin requests list
     */
    async getAdminRequests(status = 'Pending') {
        return this.request('admin-requests', 'POST', { status });
    }

    /**
     * Approve a request
     */
    async approveRequest(requestId, expirationDate, adminNotes, activationKey) {
        return this.request('admin-approve', 'POST', {
            requestId,
            expirationDate,
            adminNotes,
            activationKey
        });
    }

    /**
     * Reject a request
     */
    async rejectRequest(requestId, reason) {
        return this.request('admin-reject', 'POST', { requestId, reason });
    }
}

// Create singleton instance
const api = new APIClient();
