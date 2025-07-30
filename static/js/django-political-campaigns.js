// Django Political Campaigns JavaScript
// Provides frontend functionality for political campaign management

class PoliticalCampaignManager {
    constructor() {
        this.csrfToken = null;
        this.currentCampaign = null;
        this.audiences = [];
        this.campaigns = [];
        this.init();
    }

    init() {
        this.setupCSRF();
        this.bindEvents();
        this.loadInitialData();
    }

    setupCSRF() {
        // Get CSRF token from cookie
        this.csrfToken = this.getCookie('csrftoken');
    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    bindEvents() {
        // Campaign creation/editing
        const createCampaignBtn = document.getElementById('create-campaign-btn');
        if (createCampaignBtn) {
            createCampaignBtn.addEventListener('click', () => this.showCreateCampaignModal());
        }

        const campaignForm = document.getElementById('campaign-form');
        if (campaignForm) {
            campaignForm.addEventListener('submit', (e) => this.handleCampaignSubmit(e));
        }

        // Audience management
        const createAudienceBtn = document.getElementById('create-audience-btn');
        if (createAudienceBtn) {
            createAudienceBtn.addEventListener('click', () => this.showCreateAudienceModal());
        }

        const audienceForm = document.getElementById('audience-form');
        if (audienceForm) {
            audienceForm.addEventListener('submit', (e) => this.handleAudienceSubmit(e));
        }

        // Campaign execution
        const startCampaignBtns = document.querySelectorAll('.start-campaign-btn');
        startCampaignBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.startCampaign(e.target.dataset.campaignId));
        });

        const pauseCampaignBtns = document.querySelectorAll('.pause-campaign-btn');
        pauseCampaignBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.pauseCampaign(e.target.dataset.campaignId));
        });

        // Filter functionality
        const campaignFilters = document.getElementById('campaign-filters');
        if (campaignFilters) {
            campaignFilters.addEventListener('change', () => this.filterCampaigns());
        }

        // Refresh buttons
        const refreshBtn = document.getElementById('refresh-campaigns-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadCampaigns());
        }
    }

    async loadInitialData() {
        this.showLoading('Loading campaigns and audiences...');
        try {
            await Promise.all([
                this.loadCampaigns(),
                this.loadAudiences()
            ]);
        } catch (error) {
            this.showError('Failed to load initial data: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadCampaigns() {
        try {
            const response = await fetch('/api/campaigns/api/campaigns/', {
                headers: {
                    'Authorization': `Token ${this.getAuthToken()}`,
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Handle DRF paginated response
                this.campaigns = data.results || data;
                this.renderCampaigns();
            } else {
                throw new Error('Failed to fetch campaigns');
            }
        } catch (error) {
            this.showError('Error loading campaigns: ' + error.message);
        }
    }

    async loadAudiences() {
        try {
            const response = await fetch('/api/campaigns/api/audiences/', {
                headers: {
                    'Authorization': `Token ${this.getAuthToken()}`,
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Handle DRF paginated response
                this.audiences = data.results || data;
                this.renderAudiences();
                this.populateAudienceSelectors();
            } else {
                throw new Error('Failed to fetch audiences');
            }
        } catch (error) {
            this.showError('Error loading audiences: ' + error.message);
        }
    }

    renderCampaigns() {
        const container = document.getElementById('campaigns-list');
        if (!container) return;

        if (this.campaigns.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <h5 class="text-muted">No campaigns found</h5>
                    <p class="text-muted">Create your first campaign to get started</p>
                    <button class="btn btn-primary" onclick="campaignManager.showCreateCampaignModal()">
                        Create Campaign
                    </button>
                </div>
            `;
            return;
        }

        const html = this.campaigns.map(campaign => this.renderCampaignCard(campaign)).join('');
        container.innerHTML = html;
    }

    renderCampaignCard(campaign) {
        const statusBadge = this.getStatusBadge(campaign.status);
        const metrics = this.renderCampaignMetrics(campaign);
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card campaign-card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${campaign.name}</h6>
                        ${statusBadge}
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-2">${campaign.campaign_type.replace('_', ' ').toUpperCase()}</p>
                        <p class="small text-muted mb-3">${campaign.message_template.substring(0, 100)}...</p>
                        ${metrics}
                        <div class="mt-3">
                            <small class="text-muted">
                                Created: ${new Date(campaign.created_at).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-outline-primary btn-sm" 
                                    onclick="campaignManager.editCampaign('${campaign.id}')">
                                Edit
                            </button>
                            ${this.renderCampaignActions(campaign)}
                            <button class="btn btn-outline-secondary btn-sm" 
                                    onclick="campaignManager.viewCampaignDetails('${campaign.id}')">
                                Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCampaignActions(campaign) {
        switch (campaign.status) {
            case 'draft':
                return `
                    <button class="btn btn-success btn-sm start-campaign-btn" 
                            data-campaign-id="${campaign.id}">
                        Start
                    </button>
                `;
            case 'running':
                return `
                    <button class="btn btn-warning btn-sm pause-campaign-btn" 
                            data-campaign-id="${campaign.id}">
                        Pause
                    </button>
                `;
            case 'paused':
                return `
                    <button class="btn btn-success btn-sm start-campaign-btn" 
                            data-campaign-id="${campaign.id}">
                        Resume
                    </button>
                `;
            default:
                return '';
        }
    }

    renderCampaignMetrics(campaign) {
        if (campaign.sent_count === 0) {
            return '<p class="small text-muted">No metrics available</p>';
        }

        const openRate = campaign.sent_count > 0 ? 
            ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1) : 0;
        const clickRate = campaign.sent_count > 0 ? 
            ((campaign.clicked_count / campaign.sent_count) * 100).toFixed(1) : 0;

        return `
            <div class="row text-center">
                <div class="col-4">
                    <small class="text-muted d-block">Sent</small>
                    <strong>${campaign.sent_count}</strong>
                </div>
                <div class="col-4">
                    <small class="text-muted d-block">Open Rate</small>
                    <strong>${openRate}%</strong>
                </div>
                <div class="col-4">
                    <small class="text-muted d-block">Click Rate</small>
                    <strong>${clickRate}%</strong>
                </div>
            </div>
        `;
    }

    getStatusBadge(status) {
        const statusConfig = {
            'draft': { color: 'secondary', text: 'Draft' },
            'scheduled': { color: 'info', text: 'Scheduled' },
            'running': { color: 'success', text: 'Running' },
            'paused': { color: 'warning', text: 'Paused' },
            'completed': { color: 'primary', text: 'Completed' },
            'cancelled': { color: 'danger', text: 'Cancelled' }
        };

        const config = statusConfig[status] || { color: 'secondary', text: status };
        return `<span class="badge bg-${config.color}">${config.text}</span>`;
    }

    renderAudiences() {
        const container = document.getElementById('audiences-list');
        if (!container) return;

        if (this.audiences.length === 0) {
            container.innerHTML = `
                <div class="text-center py-3">
                    <p class="text-muted">No audiences created</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="campaignManager.showCreateAudienceModal()">
                        Create Audience
                    </button>
                </div>
            `;
            return;
        }

        const html = this.audiences.map(audience => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${audience.name}</strong>
                    <br>
                    <small class="text-muted">${audience.platform} • ${audience.estimated_size} contacts</small>
                </div>
                <div>
                    ${this.getStatusBadge(audience.status)}
                    <button class="btn btn-outline-primary btn-sm ms-2" 
                            onclick="campaignManager.editAudience('${audience.id}')">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    populateAudienceSelectors() {
        const selectors = document.querySelectorAll('select[name="audience"]');
        selectors.forEach(select => {
            select.innerHTML = '<option value="">Select an audience...</option>';
            this.audiences.forEach(audience => {
                if (audience.status === 'active') {
                    select.innerHTML += `<option value="${audience.id}">${audience.name} (${audience.platform})</option>`;
                }
            });
        });
    }

    showCreateCampaignModal() {
        const modal = document.getElementById('campaign-modal');
        const form = document.getElementById('campaign-form');
        const title = document.getElementById('campaign-modal-title');
        
        if (title) title.textContent = 'Create New Campaign';
        if (form) form.reset();
        
        this.currentCampaign = null;
        
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    showCreateAudienceModal() {
        const modal = document.getElementById('audience-modal');
        const form = document.getElementById('audience-form');
        const title = document.getElementById('audience-modal-title');
        
        if (title) title.textContent = 'Create New Audience';
        if (form) form.reset();
        
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    async handleCampaignSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const campaignData = {
            name: formData.get('name'),
            campaign_type: formData.get('campaign_type'),
            audience: formData.get('audience'),
            message_template: formData.get('message_template'),
            scheduled_send: formData.get('scheduled_send') || null,
            budget: formData.get('budget') || null
        };

        const isEdit = this.currentCampaign !== null;
        const url = isEdit ? `/api/campaigns/api/campaigns/${this.currentCampaign}/` : '/api/campaigns/api/campaigns/';
        const method = isEdit ? 'PUT' : 'POST';

        this.showLoading('Saving campaign...');

        try {
            const response = await fetch('/api/campaigns/api/campaigns/', {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${this.getAuthToken()}`,
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify(campaignData)
            });

            if (response.ok) {
                const savedCampaign = await response.json();
                this.showSuccess(`Campaign ${isEdit ? 'updated' : 'created'} successfully!`);
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('campaign-modal'));
                modal.hide();
                
                // Reload campaigns
                await this.loadCampaigns();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save campaign');
            }
        } catch (error) {
            this.showError('Error saving campaign: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handleAudienceSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const audienceData = {
            name: formData.get('name'),
            platform: formData.get('platform'),
            filters: JSON.parse(formData.get('filters') || '{}')
        };

        this.showLoading('Saving audience...');

        try {
            const response = await fetch('/api/campaigns/api/audiences/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${this.getAuthToken()}`,
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify(audienceData)
            });

            if (response.ok) {
                const savedAudience = await response.json();
                this.showSuccess('Audience created successfully!');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('audience-modal'));
                modal.hide();
                
                // Reload audiences
                await this.loadAudiences();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save audience');
            }
        } catch (error) {
            this.showError('Error saving audience: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async startCampaign(campaignId) {
        if (!confirm('Are you sure you want to start this campaign?')) {
            return;
        }

        this.showLoading('Starting campaign...');

        try {
            const response = await fetch(`/api/campaigns/api/campaigns/${campaignId}/start/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.getAuthToken()}`,
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (response.ok) {
                this.showSuccess('Campaign started successfully!');
                await this.loadCampaigns();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to start campaign');
            }
        } catch (error) {
            this.showError('Error starting campaign: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async pauseCampaign(campaignId) {
        if (!confirm('Are you sure you want to pause this campaign?')) {
            return;
        }

        this.showLoading('Pausing campaign...');

        try {
            const response = await fetch(`/api/campaigns/api/campaigns/${campaignId}/pause/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.getAuthToken()}`,
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (response.ok) {
                this.showSuccess('Campaign paused successfully!');
                await this.loadCampaigns();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to pause campaign');
            }
        } catch (error) {
            this.showError('Error pausing campaign: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async editCampaign(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return;

        this.currentCampaign = campaignId;

        // Populate form
        const form = document.getElementById('campaign-form');
        if (form) {
            form.querySelector('[name="name"]').value = campaign.name;
            form.querySelector('[name="campaign_type"]').value = campaign.campaign_type;
            form.querySelector('[name="audience"]').value = campaign.audience;
            form.querySelector('[name="message_template"]').value = campaign.message_template;
            if (campaign.scheduled_send) {
                form.querySelector('[name="scheduled_send"]').value = 
                    new Date(campaign.scheduled_send).toISOString().slice(0, 16);
            }
            if (campaign.budget) {
                form.querySelector('[name="budget"]').value = campaign.budget;
            }
        }

        // Update modal title
        const title = document.getElementById('campaign-modal-title');
        if (title) title.textContent = 'Edit Campaign';

        // Show modal
        const modal = document.getElementById('campaign-modal');
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    async viewCampaignDetails(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return;

        // Load detailed campaign metrics
        this.showLoading('Loading campaign details...');

        try {
            const response = await fetch(`/api/campaigns/api/campaigns/${campaignId}/metrics/`, {
                headers: {
                    'Authorization': `Token ${this.getAuthToken()}`,
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (response.ok) {
                const metrics = await response.json();
                this.showCampaignDetailsModal(campaign, metrics);
            } else {
                throw new Error('Failed to load campaign metrics');
            }
        } catch (error) {
            this.showError('Error loading campaign details: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    showCampaignDetailsModal(campaign, metrics) {
        const modal = document.getElementById('campaign-details-modal');
        const content = document.getElementById('campaign-details-content');
        
        if (content) {
            content.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Campaign Information</h6>
                        <p><strong>Name:</strong> ${campaign.name}</p>
                        <p><strong>Type:</strong> ${campaign.campaign_type.replace('_', ' ')}</p>
                        <p><strong>Status:</strong> ${this.getStatusBadge(campaign.status)}</p>
                        <p><strong>Created:</strong> ${new Date(campaign.created_at).toLocaleDateString()}</p>
                        ${campaign.scheduled_send ? `<p><strong>Scheduled:</strong> ${new Date(campaign.scheduled_send).toLocaleString()}</p>` : ''}
                        ${campaign.budget ? `<p><strong>Budget:</strong> $${campaign.budget}</p>` : ''}
                    </div>
                    <div class="col-md-6">
                        <h6>Performance Metrics</h6>
                        <div class="row">
                            <div class="col-6">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h5 class="card-title">${campaign.sent_count}</h5>
                                        <p class="card-text small">Messages Sent</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h5 class="card-title">${campaign.delivered_count}</h5>
                                        <p class="card-text small">Delivered</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6 mt-2">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h5 class="card-title">${campaign.opened_count}</h5>
                                        <p class="card-text small">Opened</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6 mt-2">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h5 class="card-title">${campaign.clicked_count}</h5>
                                        <p class="card-text small">Clicked</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                <div>
                    <h6>Message Template</h6>
                    <div class="border p-3 bg-light rounded">
                        ${campaign.message_template}
                    </div>
                </div>
            `;
        }

        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    filterCampaigns() {
        const filters = document.getElementById('campaign-filters');
        if (!filters) return;

        const statusFilter = filters.querySelector('[name="status_filter"]')?.value;
        const typeFilter = filters.querySelector('[name="type_filter"]')?.value;

        let filteredCampaigns = this.campaigns;

        if (statusFilter) {
            filteredCampaigns = filteredCampaigns.filter(c => c.status === statusFilter);
        }

        if (typeFilter) {
            filteredCampaigns = filteredCampaigns.filter(c => c.campaign_type === typeFilter);
        }

        // Temporarily store original campaigns and render filtered
        const originalCampaigns = this.campaigns;
        this.campaigns = filteredCampaigns;
        this.renderCampaigns();
        this.campaigns = originalCampaigns;
    }

    getAuthToken() {
        // Try to get token from localStorage or sessionStorage
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
    }

    showLoading(message = 'Loading...') {
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.querySelector('.loading-message').textContent = message;
            loadingEl.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type = 'info') {
        // Create and show Bootstrap alert
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        const alertContainer = document.getElementById('alert-container') || 
                             document.querySelector('.container').firstElementChild;
        
        if (alertContainer) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = alertHtml;
            alertContainer.insertBefore(tempDiv.firstElementChild, alertContainer.firstElementChild);
        } else {
            // Fallback to simple alert
            alert(message);
        }
    }
}

// Initialize campaign manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make it globally available
    window.campaignManager = new PoliticalCampaignManager();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PoliticalCampaignManager;
}