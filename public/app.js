class KubernetesGUI {
    constructor() {
        this.socket = io();
        this.currentTab = 'pods';
        this.followingLogs = false;
        this.currentNamespace = 'all';
        this.init();
    }

    init() {
        // Initialize Lucide icons
        lucide.createIcons();
        
        // Setup socket listeners
        this.setupSocketListeners();
        
        // Load initial data
        this.loadInitialData();
        
        // Setup periodic refresh
        setInterval(() => this.refreshCurrentTab(), 30000);
    }

    setupSocketListeners() {
        this.socket.on('pods-update', (data) => {
            this.updatePodsTable(data);
        });

        this.socket.on('deployments-update', (data) => {
            this.updateDeploymentsTable(data);
        });

        this.socket.on('services-update', (data) => {
            this.updateServicesTable(data);
        });

        this.socket.on('log-data', (data) => {
            this.appendLog(data);
        });

        this.socket.on('namespaces-update', (data) => {
            this.updateNamespaceSelect(data);
        });

        this.socket.on('cluster-stats', (data) => {
            this.updateMonitoringStats(data);
        });
    }

    async loadInitialData() {
        try {
            await this.loadNamespaces();
            await this.loadPods();
            await this.loadDeployments();
            await this.loadServices();
            await this.loadClusterStats();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load initial data');
        }
    }

    async loadNamespaces() {
        return new Promise((resolve) => {
            this.socket.emit('get-namespaces');
            this.socket.once('namespaces-update', resolve);
        });
    }

    async loadPods() {
        return new Promise((resolve) => {
            this.socket.emit('get-pods', { namespace: this.currentNamespace });
            this.socket.once('pods-update', resolve);
        });
    }

    async loadDeployments() {
        return new Promise((resolve) => {
            this.socket.emit('get-deployments', { namespace: this.currentNamespace });
            this.socket.once('deployments-update', resolve);
        });
    }

    async loadServices() {
        return new Promise((resolve) => {
            this.socket.emit('get-services', { namespace: this.currentNamespace });
            this.socket.once('services-update', resolve);
        });
    }

    async loadClusterStats() {
        return new Promise((resolve) => {
            this.socket.emit('get-cluster-stats');
            this.socket.once('cluster-stats', resolve);
        });
    }

    updateNamespaceSelect(namespaces) {
        const select = document.getElementById('namespace-select');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="all">All Namespaces</option>';
        namespaces.forEach(ns => {
            const option = document.createElement('option');
            option.value = ns;
            option.textContent = ns;
            select.appendChild(option);
        });
        
        select.value = currentValue;
        
        // Also update log pod select
        this.updateLogPodSelect();
    }

    updatePodsTable(pods) {
        const container = document.getElementById('pods-table');
        
        if (!pods || pods.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-8">No pods found</p>';
            return;
        }

        const table = `
            <table class="w-full text-sm">
                <thead class="bg-gray-700">
                    <tr>
                        <th class="px-4 py-3 text-left">Name</th>
                        <th class="px-4 py-3 text-left">Namespace</th>
                        <th class="px-4 py-3 text-left">Status</th>
                        <th class="px-4 py-3 text-left">Ready</th>
                        <th class="px-4 py-3 text-left">Restarts</th>
                        <th class="px-4 py-3 text-left">Age</th>
                        <th class="px-4 py-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-600">
                    ${pods.map(pod => this.createPodRow(pod)).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = table;
        lucide.createIcons();
    }

    createPodRow(pod) {
        const status = this.getPodStatus(pod);
        const statusClass = this.getStatusClass(status);
        
        return `
            <tr class="hover:bg-gray-700 transition">
                <td class="px-4 py-3 font-medium">${pod.name}</td>
                <td class="px-4 py-3">${pod.namespace}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                        ${status}
                    </span>
                </td>
                <td class="px-4 py-3">${pod.ready || 'N/A'}</td>
                <td class="px-4 py-3">${pod.restartCount || 0}</td>
                <td class="px-4 py-3">${this.formatAge(pod.age)}</td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="k8sGUI.describePod('${pod.name}', '${pod.namespace}')" 
                                class="p-1 hover:bg-gray-600 rounded" title="Describe">
                            <i data-lucide="info" class="w-4 h-4"></i>
                        </button>
                        <button onclick="k8sGUI.restartPod('${pod.name}', '${pod.namespace}')" 
                                class="p-1 hover:bg-gray-600 rounded" title="Restart">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        </button>
                        <button onclick="k8sGUI.deletePod('${pod.name}', '${pod.namespace}')" 
                                class="p-1 hover:bg-gray-600 rounded text-red-400" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getPodStatus(pod) {
        if (pod.status?.phase === 'Running') {
            if (pod.status?.conditions?.some(c => c.type === 'Ready' && c.status === 'True')) {
                return 'Running';
            }
            return 'Not Ready';
        }
        return pod.status?.phase || 'Unknown';
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'running': return 'bg-green-500 text-white';
            case 'pending': return 'bg-yellow-500 text-white';
            case 'failed': case 'crashloopbackoff': return 'bg-red-500 text-white';
            case 'not ready': return 'bg-orange-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    }

    formatAge(age) {
        if (!age) return 'Unknown';
        return age;
    }

    updateDeploymentsTable(deployments) {
        const container = document.getElementById('deployments-table');
        
        if (!deployments || deployments.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-8">No deployments found</p>';
            return;
        }

        const table = `
            <table class="w-full text-sm">
                <thead class="bg-gray-700">
                    <tr>
                        <th class="px-4 py-3 text-left">Name</th>
                        <th class="px-4 py-3 text-left">Namespace</th>
                        <th class="px-4 py-3 text-left">Ready</th>
                        <th class="px-4 py-3 text-left">Up-to-date</th>
                        <th class="px-4 py-3 text-left">Available</th>
                        <th class="px-4 py-3 text-left">Age</th>
                        <th class="px-4 py-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-600">
                    ${deployments.map(dep => this.createDeploymentRow(dep)).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = table;
        lucide.createIcons();
    }

    createDeploymentRow(deployment) {
        return `
            <tr class="hover:bg-gray-700 transition">
                <td class="px-4 py-3 font-medium">${deployment.name}</td>
                <td class="px-4 py-3">${deployment.namespace}</td>
                <td class="px-4 py-3">${deployment.ready || 'N/A'}</td>
                <td class="px-4 py-3">${deployment.updatedReplicas || 0}/${deployment.replicas || 0}</td>
                <td class="px-4 py-3">${deployment.availableReplicas || 0}</td>
                <td class="px-4 py-3">${this.formatAge(deployment.age)}</td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="k8sGUI.scaleDeployment('${deployment.name}', '${deployment.namespace}')" 
                                class="p-1 hover:bg-gray-600 rounded" title="Scale">
                            <i data-lucide="maximize-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="k8sGUI.restartDeployment('${deployment.name}', '${deployment.namespace}')" 
                                class="p-1 hover:bg-gray-600 rounded" title="Restart">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        </button>
                        <button onclick="k8sGUI.deleteDeployment('${deployment.name}', '${deployment.namespace}')" 
                                class="p-1 hover:bg-gray-600 rounded text-red-400" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    updateServicesTable(services) {
        const container = document.getElementById('services-table');
        
        if (!services || services.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-8">No services found</p>';
            return;
        }

        const table = `
            <table class="w-full text-sm">
                <thead class="bg-gray-700">
                    <tr>
                        <th class="px-4 py-3 text-left">Name</th>
                        <th class="px-4 py-3 text-left">Namespace</th>
                        <th class="px-4 py-3 text-left">Type</th>
                        <th class="px-4 py-3 text-left">Cluster IP</th>
                        <th class="px-4 py-3 text-left">External IP</th>
                        <th class="px-4 py-3 text-left">Ports</th>
                        <th class="px-4 py-3 text-left">Age</th>
                        <th class="px-4 py-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-600">
                    ${services.map(svc => this.createServiceRow(svc)).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = table;
        lucide.createIcons();
    }

    createServiceRow(service) {
        const ports = service.ports?.map(p => `${p.port}/${p.protocol}`).join(', ') || 'N/A';
        
        return `
            <tr class="hover:bg-gray-700 transition">
                <td class="px-4 py-3 font-medium">${service.name}</td>
                <td class="px-4 py-3">${service.namespace}</td>
                <td class="px-4 py-3">${service.type || 'ClusterIP'}</td>
                <td class="px-4 py-3">${service.clusterIP || 'N/A'}</td>
                <td class="px-4 py-3">${service.externalIPs?.join(', ') || 'N/A'}</td>
                <td class="px-4 py-3">${ports}</td>
                <td class="px-4 py-3">${this.formatAge(service.age)}</td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="k8sGUI.describeService('${service.name}', '${service.namespace}')" 
                                class="p-1 hover:bg-gray-600 rounded" title="Describe">
                            <i data-lucide="info" class="w-4 h-4"></i>
                        </button>
                        <button onclick="k8sGUI.deleteService('${service.name}', '${service.namespace}')" 
                                class="p-1 hover:bg-gray-600 rounded text-red-400" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    updateMonitoringStats(stats) {
        document.getElementById('total-pods').textContent = stats.totalPods || 0;
        document.getElementById('running-pods').textContent = stats.runningPods || 0;
        document.getElementById('pending-pods').textContent = stats.pendingPods || 0;
        document.getElementById('failed-pods').textContent = stats.failedPods || 0;
    }

    updateLogPodSelect() {
        const select = document.getElementById('log-pod-select');
        this.socket.emit('get-pods', { namespace: this.currentNamespace });
        this.socket.once('pods-update', (pods) => {
            select.innerHTML = '<option value="">Select Pod</option>';
            pods.forEach(pod => {
                const option = document.createElement('option');
                option.value = `${pod.namespace}/${pod.name}`;
                option.textContent = `${pod.namespace}/${pod.name}`;
                select.appendChild(option);
            });
        });
    }

    appendLog(logData) {
        const container = document.getElementById('log-container');
        const timestamp = new Date().toISOString();
        container.innerHTML += `<div>[${timestamp}] ${logData.log}</div>`;
        container.scrollTop = container.scrollHeight;
    }

    // Action methods
    describePod(name, namespace) {
        this.socket.emit('describe-pod', { name, namespace });
        this.socket.once('pod-description', (data) => {
            this.showModal('Pod Description', `<pre class="text-xs bg-gray-900 p-4 rounded">${data.description}</pre>`);
        });
    }

    restartPod(name, namespace) {
        this.showConfirmModal(`Restart pod ${name}?`, () => {
            this.socket.emit('restart-pod', { name, namespace });
            this.showSuccess(`Restarting pod ${name}`);
        });
    }

    deletePod(name, namespace) {
        this.showConfirmModal(`Delete pod ${name}?`, () => {
            this.socket.emit('delete-pod', { name, namespace });
            this.showSuccess(`Deleting pod ${name}`);
        });
    }

    scaleDeployment(name, namespace) {
        const replicas = prompt('Enter number of replicas:', '1');
        if (replicas) {
            this.socket.emit('scale-deployment', { name, namespace, replicas: parseInt(replicas) });
            this.showSuccess(`Scaling deployment ${name} to ${replicas} replicas`);
        }
    }

    restartDeployment(name, namespace) {
        this.showConfirmModal(`Restart deployment ${name}?`, () => {
            this.socket.emit('restart-deployment', { name, namespace });
            this.showSuccess(`Restarting deployment ${name}`);
        });
    }

    deleteDeployment(name, namespace) {
        this.showConfirmModal(`Delete deployment ${name}?`, () => {
            this.socket.emit('delete-deployment', { name, namespace });
            this.showSuccess(`Deleting deployment ${name}`);
        });
    }

    describeService(name, namespace) {
        this.socket.emit('describe-service', { name, namespace });
        this.socket.once('service-description', (data) => {
            this.showModal('Service Description', `<pre class="text-xs bg-gray-900 p-4 rounded">${data.description}</pre>`);
        });
    }

    deleteService(name, namespace) {
        this.showConfirmModal(`Delete service ${name}?`, () => {
            this.socket.emit('delete-service', { name, namespace });
            this.showSuccess(`Deleting service ${name}`);
        });
    }

    // UI Helper methods
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Remove active state from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('text-gray-300', 'hover:bg-gray-700');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-content`).classList.remove('hidden');
        
        // Add active state to selected tab button
        const activeBtn = document.getElementById(`${tabName}-tab`);
        activeBtn.classList.add('bg-blue-600', 'text-white');
        activeBtn.classList.remove('text-gray-300', 'hover:bg-gray-700');
        
        this.currentTab = tabName;
        this.refreshCurrentTab();
    }

    refreshCurrentTab() {
        switch (this.currentTab) {
            case 'pods':
                this.loadPods();
                break;
            case 'deployments':
                this.loadDeployments();
                break;
            case 'services':
                this.loadServices();
                break;
            case 'logs':
                this.updateLogPodSelect();
                break;
            case 'monitoring':
                this.loadClusterStats();
                break;
        }
    }

    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-content').innerHTML = content;
        document.getElementById('action-modal').classList.remove('hidden');
    }

    showConfirmModal(message, onConfirm) {
        document.getElementById('modal-title').textContent = 'Confirm Action';
        document.getElementById('modal-content').innerHTML = `<p>${message}</p>`;
        document.getElementById('modal-confirm').onclick = () => {
            onConfirm();
            this.closeModal();
        };
        document.getElementById('action-modal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('action-modal').classList.add('hidden');
    }

    showSuccess(message) {
        // Simple success notification (you could enhance this)
        console.log('Success:', message);
    }

    showError(message) {
        // Simple error notification (you could enhance this)
        console.error('Error:', message);
    }
}

// Global functions for HTML onclick handlers
let k8sGUI;

function switchTab(tabName) {
    k8sGUI.switchTab(tabName);
}

function refreshAll() {
    k8sGUI.loadInitialData();
}

function createPod() {
    alert('DEBUG: createPod function called!');
    const modalContent = `
        <div class="space-y-4">
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Pod Name</label>
                <input type="text" id="pod-name" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="my-pod" required>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Container Image</label>
                <input type="text" id="pod-image" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="nginx:latest" required>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Namespace</label>
                <select id="pod-namespace" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="default">default</option>
                    <option value="development">development</option>
                    <option value="production">production</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Port</label>
                <input type="number" id="pod-port" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="80" value="80">
            </div>
        </div>
    `;
    
    k8sGUI.showModal('Create Pod', modalContent);
    
    // Update modal confirm button
    document.getElementById('modal-confirm').onclick = () => {
        const podName = document.getElementById('pod-name').value;
        const podImage = document.getElementById('pod-image').value;
        const podNamespace = document.getElementById('pod-namespace').value;
        const podPort = document.getElementById('pod-port').value;
        
        if (!podName || !podImage) {
            k8sGUI.showError('Pod name and image are required');
            return;
        }
        
        // Create pod via socket (works with both mock and real backend)
        k8sGUI.socket.emit('create-pod', {
            name: podName,
            image: podImage,
            namespace: podNamespace,
            port: parseInt(podPort) || 80
        });
        
        k8sGUI.showSuccess(`Creating pod ${podName}...`);
        k8sGUI.closeModal();
        
        // Refresh pods after a delay
        setTimeout(() => {
            k8sGUI.loadPods();
        }, 2000);
    };
}

function createDeployment() {
    const modalContent = `
        <div class="space-y-4">
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Deployment Name</label>
                <input type="text" id="deployment-name" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="my-deployment" required>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Container Image</label>
                <input type="text" id="deployment-image" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="nginx:latest" required>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Namespace</label>
                <select id="deployment-namespace" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="default">default</option>
                    <option value="development">development</option>
                    <option value="production">production</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Replicas</label>
                <input type="number" id="deployment-replicas" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="3" value="3" min="1" max="10">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Port</label>
                <input type="number" id="deployment-port" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="80" value="80">
            </div>
        </div>
    `;
    
    k8sGUI.showModal('Create Deployment', modalContent);
    
    // Update modal confirm button
    document.getElementById('modal-confirm').onclick = () => {
        const deploymentName = document.getElementById('deployment-name').value;
        const deploymentImage = document.getElementById('deployment-image').value;
        const deploymentNamespace = document.getElementById('deployment-namespace').value;
        const deploymentReplicas = document.getElementById('deployment-replicas').value;
        const deploymentPort = document.getElementById('deployment-port').value;
        
        if (!deploymentName || !deploymentImage) {
            k8sGUI.showError('Deployment name and image are required');
            return;
        }
        
        // Create deployment via socket
        k8sGUI.socket.emit('create-deployment', {
            name: deploymentName,
            image: deploymentImage,
            namespace: deploymentNamespace,
            replicas: parseInt(deploymentReplicas) || 3,
            port: parseInt(deploymentPort) || 80
        });
        
        k8sGUI.showSuccess(`Creating deployment ${deploymentName}...`);
        k8sGUI.closeModal();
        
        // Refresh deployments after a delay
        setTimeout(() => {
            k8sGUI.loadDeployments();
        }, 2000);
    };
}

function createService() {
    const modalContent = `
        <div class="space-y-4">
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Service Name</label>
                <input type="text" id="service-name" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="my-service" required>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Namespace</label>
                <select id="service-namespace" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="default">default</option>
                    <option value="development">development</option>
                    <option value="production">production</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Service Type</label>
                <select id="service-type" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="ClusterIP">ClusterIP</option>
                    <option value="NodePort">NodePort</option>
                    <option value="LoadBalancer">LoadBalancer</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Target Port</label>
                <input type="number" id="service-port" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="80" value="80">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Container Port</label>
                <input type="number" id="service-target-port" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="80" value="80">
            </div>
        </div>
    `;
    
    k8sGUI.showModal('Create Service', modalContent);
    
    // Update modal confirm button
    document.getElementById('modal-confirm').onclick = () => {
        const serviceName = document.getElementById('service-name').value;
        const serviceNamespace = document.getElementById('service-namespace').value;
        const serviceType = document.getElementById('service-type').value;
        const servicePort = document.getElementById('service-port').value;
        const serviceTargetPort = document.getElementById('service-target-port').value;
        
        if (!serviceName) {
            k8sGUI.showError('Service name is required');
            return;
        }
        
        // Create service via socket
        k8sGUI.socket.emit('create-service', {
            name: serviceName,
            namespace: serviceNamespace,
            type: serviceType,
            port: parseInt(servicePort) || 80,
            targetPort: parseInt(serviceTargetPort) || 80
        });
        
        k8sGUI.showSuccess(`Creating service ${serviceName}...`);
        k8sGUI.closeModal();
        
        // Refresh services after a delay
        setTimeout(() => {
            k8sGUI.loadServices();
        }, 2000);
    };
}

function followLogs() {
    const podSelect = document.getElementById('log-pod-select');
    const followBtn = document.getElementById('follow-btn');
    
    if (!podSelect.value) {
        alert('Please select a pod first');
        return;
    }

    if (k8sGUI.followingLogs) {
        // Stop following
        k8sGUI.followingLogs = false;
        followBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4"></i><span>Follow</span>';
        lucide.createIcons();
    } else {
        // Start following
        k8sGUI.followingLogs = true;
        followBtn.innerHTML = '<i data-lucide="pause" class="w-4 h-4"></i><span>Pause</span>';
        lucide.createIcons();
        
        const [namespace, podName] = podSelect.value.split('/');
        k8sGUI.socket.emit('follow-logs', { namespace, podName });
    }
}

// Initialize the GUI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    k8sGUI = new KubernetesGUI();
    
    // Setup namespace change listener
    document.getElementById('namespace-select').addEventListener('change', (e) => {
        k8sGUI.currentNamespace = e.target.value;
        k8sGUI.refreshCurrentTab();
    });
});
