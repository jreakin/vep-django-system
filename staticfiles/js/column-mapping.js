// Column Mapping JavaScript
class ColumnMappingApp {
    constructor() {
        this.fileId = null;
        this.columns = [];
        this.previewData = [];
        this.mappings = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCSRF();
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
        document.getElementById('upload-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadFile();
        });

        document.getElementById('validate-btn').addEventListener('click', () => {
            this.validateData();
        });

        document.getElementById('process-btn').addEventListener('click', () => {
            this.processData();
        });
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    async uploadFile() {
        const form = document.getElementById('upload-form');
        const formData = new FormData(form);

        this.showLoading();

        try {
            const response = await fetch('/api/voter-data/upload/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.csrfToken
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.handleUploadSuccess(result.data);
            } else {
                this.showError('Upload failed: ' + result.message);
            }
        } catch (error) {
            this.showError('Upload error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    handleUploadSuccess(data) {
        this.fileId = data.file_id;
        this.columns = data.columns;
        this.previewData = data.preview_data;

        // Update UI
        document.getElementById('filename').textContent = data.filename;
        document.getElementById('row-count').textContent = data.total_rows;

        // Show mapping section
        document.getElementById('mapping-section').style.display = 'block';

        // Create mapping controls
        this.createMappingControls(data.suggested_mappings);

        // Show preview table
        this.createPreviewTable();
    }

    createMappingControls(suggestedMappings) {
        const container = document.getElementById('mapping-controls');
        container.innerHTML = '';

        const fields = [
            { key: 'voter_id', label: 'Voter ID *', required: true },
            { key: 'name', label: 'Full Name *', required: true },
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
            { key: 'address', label: 'Address *', required: true },
            { key: 'city', label: 'City' },
            { key: 'state', label: 'State' },
            { key: 'zip_code', label: 'ZIP Code' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'date_of_birth', label: 'Date of Birth' },
            { key: 'party_affiliation', label: 'Party Affiliation' }
        ];

        fields.forEach(field => {
            const div = document.createElement('div');
            div.className = 'mb-3';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = field.label;
            if (field.required) {
                label.classList.add('text-danger');
            }

            const select = document.createElement('select');
            select.className = 'form-select';
            select.id = `mapping-${field.key}`;

            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '-- Select Column --';
            select.appendChild(emptyOption);

            // Add column options
            this.columns.forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                if (suggestedMappings[field.key] === column) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            select.addEventListener('change', () => {
                this.updateMapping(field.key, select.value);
            });

            div.appendChild(label);
            div.appendChild(select);
            container.appendChild(div);

            // Initialize mapping
            if (suggestedMappings[field.key]) {
                this.mappings[field.key] = suggestedMappings[field.key];
            }
        });
    }

    updateMapping(field, column) {
        if (column) {
            this.mappings[field] = column;
        } else {
            delete this.mappings[field];
        }
    }

    createPreviewTable() {
        const container = document.getElementById('preview-table');
        
        if (this.previewData.length === 0) {
            container.innerHTML = '<p>No preview data available</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'table table-sm table-striped';

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        this.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        
        this.previewData.slice(0, 10).forEach(row => {  // Show first 10 rows
            const tr = document.createElement('tr');
            
            this.columns.forEach(column => {
                const td = document.createElement('td');
                td.textContent = row[column] || '';
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(table);
    }

    async validateData() {
        if (!this.fileId) {
            this.showError('No file uploaded');
            return;
        }

        // Check required mappings
        const requiredFields = ['voter_id', 'name', 'address'];
        const missingFields = requiredFields.filter(field => !this.mappings[field]);
        
        if (missingFields.length > 0) {
            this.showError(`Required fields not mapped: ${missingFields.join(', ')}`);
            return;
        }

        this.showLoading();

        try {
            const response = await fetch('/api/voter-data/upload/mapping/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({
                    file_id: this.fileId,
                    mappings: this.mappings,
                    data_type: document.getElementById('data_type').value
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showValidationResults(result.data);
            } else {
                this.showError('Validation failed: ' + result.message);
            }
        } catch (error) {
            this.showError('Validation error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    showValidationResults(data) {
        const container = document.getElementById('validation-results');
        
        const html = `
            <div class="alert alert-info">
                <h6>Validation Summary</h6>
                <ul class="mb-0">
                    <li>Total Rows: ${data.total_rows}</li>
                    <li>Valid Rows: ${data.valid_rows}</li>
                    <li>Invalid Rows: ${data.invalid_rows}</li>
                </ul>
            </div>
        `;

        let errorsHtml = '';
        if (data.errors.length > 0) {
            errorsHtml = `
                <div class="alert alert-warning">
                    <h6>Errors Found (showing first 10):</h6>
                    <ul>
                        ${data.errors.slice(0, 10).map(error => 
                            `<li>Row ${error.row}: ${error.errors.join(', ')}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }

        container.innerHTML = html + errorsHtml;

        // Show validation section
        document.getElementById('validation-section').style.display = 'block';

        // Show process button if there are valid rows
        if (data.valid_rows > 0) {
            document.getElementById('process-btn').style.display = 'block';
        }
    }

    async processData() {
        this.showLoading();

        try {
            const response = await fetch('/api/voter-data/upload/process/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({
                    file_id: this.fileId,
                    mappings: this.mappings
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showProcessingResults(result.data);
            } else {
                this.showError('Processing failed: ' + result.message);
            }
        } catch (error) {
            this.showError('Processing error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    showProcessingResults(data) {
        const container = document.getElementById('processing-results');
        
        const html = `
            <div class="alert alert-success">
                <h6>Processing Complete!</h6>
                <ul class="mb-0">
                    <li>Records Saved: ${data.saved_count}</li>
                    <li>Errors: ${data.error_count}</li>
                    <li>Total Processed: ${data.total_processed}</li>
                </ul>
            </div>
        `;

        container.innerHTML = html;
        document.getElementById('processing-section').style.display = 'block';
    }

    showError(message) {
        alert('Error: ' + message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColumnMappingApp();
});