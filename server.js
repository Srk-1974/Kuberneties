const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

class KubernetesManager {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 3000;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });

        // API endpoints for REST API access
        this.app.get('/api/pods', async (req, res) => {
            try {
                const pods = await this.getPods(req.query.namespace);
                res.json(pods);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/deployments', async (req, res) => {
            try {
                const deployments = await this.getDeployments(req.query.namespace);
                res.json(deployments);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/services', async (req, res) => {
            try {
                const services = await this.getServices(req.query.namespace);
                res.json(services);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/namespaces', async (req, res) => {
            try {
                const namespaces = await this.getNamespaces();
                res.json(namespaces);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Pods handlers
            socket.on('get-pods', async (data) => {
                try {
                    const pods = await this.getPods(data.namespace);
                    socket.emit('pods-update', pods);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('describe-pod', async (data) => {
                try {
                    const description = await this.describePod(data.name, data.namespace);
                    socket.emit('pod-description', { description });
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('restart-pod', async (data) => {
                try {
                    await this.restartPod(data.name, data.namespace);
                    // Refresh pods after restart
                    setTimeout(async () => {
                        const pods = await this.getPods(data.namespace);
                        socket.emit('pods-update', pods);
                    }, 2000);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('delete-pod', async (data) => {
                try {
                    await this.deletePod(data.name, data.namespace);
                    // Refresh pods after deletion
                    setTimeout(async () => {
                        const pods = await this.getPods(data.namespace);
                        socket.emit('pods-update', pods);
                    }, 1000);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            // Deployments handlers
            socket.on('get-deployments', async (data) => {
                try {
                    const deployments = await this.getDeployments(data.namespace);
                    socket.emit('deployments-update', deployments);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('scale-deployment', async (data) => {
                try {
                    await this.scaleDeployment(data.name, data.namespace, data.replicas);
                    // Refresh deployments after scaling
                    setTimeout(async () => {
                        const deployments = await this.getDeployments(data.namespace);
                        socket.emit('deployments-update', deployments);
                    }, 2000);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('restart-deployment', async (data) => {
                try {
                    await this.restartDeployment(data.name, data.namespace);
                    // Refresh deployments after restart
                    setTimeout(async () => {
                        const deployments = await this.getDeployments(data.namespace);
                        socket.emit('deployments-update', deployments);
                    }, 3000);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('delete-deployment', async (data) => {
                try {
                    await this.deleteDeployment(data.name, data.namespace);
                    // Refresh deployments after deletion
                    setTimeout(async () => {
                        const deployments = await this.getDeployments(data.namespace);
                        socket.emit('deployments-update', deployments);
                    }, 1000);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            // Services handlers
            socket.on('get-services', async (data) => {
                try {
                    const services = await this.getServices(data.namespace);
                    socket.emit('services-update', services);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('describe-service', async (data) => {
                try {
                    const description = await this.describeService(data.name, data.namespace);
                    socket.emit('service-description', { description });
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('delete-service', async (data) => {
                try {
                    await this.deleteService(data.name, data.namespace);
                    // Refresh services after deletion
                    setTimeout(async () => {
                        const services = await this.getServices(data.namespace);
                        socket.emit('services-update', services);
                    }, 1000);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            // Namespaces handler
            socket.on('get-namespaces', async () => {
                try {
                    const namespaces = await this.getNamespaces();
                    socket.emit('namespaces-update', namespaces);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            // Logs handler
            socket.on('follow-logs', async (data) => {
                try {
                    await this.followLogs(socket, data.namespace, data.podName);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            // Cluster stats handler
            socket.on('get-cluster-stats', async () => {
                try {
                    const stats = await this.getClusterStats();
                    socket.emit('cluster-stats', stats);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    // Kubernetes API methods
    async kubectl(command, args = []) {
        return new Promise((resolve, reject) => {
            const cmd = spawn('kubectl', [command, ...args], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            cmd.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            cmd.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            cmd.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(`kubectl failed: ${stderr}`));
                }
            });

            cmd.on('error', (error) => {
                reject(new Error(`kubectl command failed: ${error.message}`));
            });
        });
    }

    async getPods(namespace = 'all') {
        try {
            const namespaceArg = namespace === 'all' ? '--all-namespaces' : `-n ${namespace}`;
            const output = await this.kubectl('get', ['pods', namespaceArg, '-o', 'json']);
            const data = JSON.parse(output);
            
            return data.items.map(pod => ({
                name: pod.metadata.name,
                namespace: pod.metadata.namespace,
                status: pod.status,
                ready: `${pod.status.containerStatuses?.filter(c => c.ready).length || 0}/${pod.status.containerStatuses?.length || 0}`,
                restartCount: pod.status.containerStatuses?.reduce((sum, c) => sum + c.restartCount, 0) || 0,
                age: this.calculateAge(pod.metadata.creationTimestamp),
                node: pod.spec.nodeName,
                ip: pod.status.podIP
            }));
        } catch (error) {
            console.error('Error getting pods:', error);
            throw error;
        }
    }

    async getDeployments(namespace = 'all') {
        try {
            const namespaceArg = namespace === 'all' ? '--all-namespaces' : `-n ${namespace}`;
            const output = await this.kubectl('get', ['deployments', namespaceArg, '-o', 'json']);
            const data = JSON.parse(output);
            
            return data.items.map(deployment => ({
                name: deployment.metadata.name,
                namespace: deployment.metadata.namespace,
                replicas: deployment.spec.replicas,
                readyReplicas: deployment.status.readyReplicas || 0,
                updatedReplicas: deployment.status.updatedReplicas || 0,
                availableReplicas: deployment.status.availableReplicas || 0,
                age: this.calculateAge(deployment.metadata.creationTimestamp),
                ready: `${deployment.status.readyReplicas || 0}/${deployment.spec.replicas || 0}`
            }));
        } catch (error) {
            console.error('Error getting deployments:', error);
            throw error;
        }
    }

    async getServices(namespace = 'all') {
        try {
            const namespaceArg = namespace === 'all' ? '--all-namespaces' : `-n ${namespace}`;
            const output = await this.kubectl('get', ['services', namespaceArg, '-o', 'json']);
            const data = JSON.parse(output);
            
            return data.items.map(service => ({
                name: service.metadata.name,
                namespace: service.metadata.namespace,
                type: service.spec.type,
                clusterIP: service.spec.clusterIP,
                externalIPs: service.spec.externalIPs || [],
                ports: service.spec.ports || [],
                age: this.calculateAge(service.metadata.creationTimestamp)
            }));
        } catch (error) {
            console.error('Error getting services:', error);
            throw error;
        }
    }

    async getNamespaces() {
        try {
            const output = await this.kubectl('get', ['namespaces', '-o', 'json']);
            const data = JSON.parse(output);
            
            return data.items.map(ns => ns.metadata.name);
        } catch (error) {
            console.error('Error getting namespaces:', error);
            throw error;
        }
    }

    async describePod(name, namespace) {
        try {
            const output = await this.kubectl('describe', ['pod', name, '-n', namespace]);
            return output;
        } catch (error) {
            console.error('Error describing pod:', error);
            throw error;
        }
    }

    async restartPod(name, namespace) {
        try {
            await this.kubectl('delete', ['pod', name, '-n', namespace]);
        } catch (error) {
            console.error('Error restarting pod:', error);
            throw error;
        }
    }

    async deletePod(name, namespace) {
        try {
            await this.kubectl('delete', ['pod', name, '-n', namespace]);
        } catch (error) {
            console.error('Error deleting pod:', error);
            throw error;
        }
    }

    async scaleDeployment(name, namespace, replicas) {
        try {
            await this.kubectl('scale', ['deployment', name, `--replicas=${replicas}`, '-n', namespace]);
        } catch (error) {
            console.error('Error scaling deployment:', error);
            throw error;
        }
    }

    async restartDeployment(name, namespace) {
        try {
            await this.kubectl('rollout', ['restart', 'deployment', name, '-n', namespace]);
        } catch (error) {
            console.error('Error restarting deployment:', error);
            throw error;
        }
    }

    async deleteDeployment(name, namespace) {
        try {
            await this.kubectl('delete', ['deployment', name, '-n', namespace]);
        } catch (error) {
            console.error('Error deleting deployment:', error);
            throw error;
        }
    }

    async describeService(name, namespace) {
        try {
            const output = await this.kubectl('describe', ['service', name, '-n', namespace]);
            return output;
        } catch (error) {
            console.error('Error describing service:', error);
            throw error;
        }
    }

    async deleteService(name, namespace) {
        try {
            await this.kubectl('delete', ['service', name, '-n', namespace]);
        } catch (error) {
            console.error('Error deleting service:', error);
            throw error;
        }
    }

    async followLogs(socket, namespace, podName) {
        try {
            const logs = spawn('kubectl', ['logs', '-f', podName, '-n', namespace]);
            
            logs.stdout.on('data', (data) => {
                socket.emit('log-data', { log: data.toString() });
            });

            logs.stderr.on('data', (data) => {
                socket.emit('log-data', { log: `ERROR: ${data.toString()}` });
            });

            logs.on('error', (error) => {
                socket.emit('error', { message: `Log stream error: ${error.message}` });
            });

            // Store the process reference to clean up on disconnect
            socket.logProcess = logs;

            socket.on('disconnect', () => {
                if (socket.logProcess) {
                    socket.logProcess.kill();
                }
            });

        } catch (error) {
            console.error('Error following logs:', error);
            throw error;
        }
    }

    async getClusterStats() {
        try {
            const pods = await this.getPods();
            
            const stats = {
                totalPods: pods.length,
                runningPods: pods.filter(p => p.status?.phase === 'Running').length,
                pendingPods: pods.filter(p => p.status?.phase === 'Pending').length,
                failedPods: pods.filter(p => ['Failed', 'CrashLoopBackOff'].includes(p.status?.phase)).length
            };

            return stats;
        } catch (error) {
            console.error('Error getting cluster stats:', error);
            throw error;
        }
    }

    calculateAge(creationTimestamp) {
        if (!creationTimestamp) return 'Unknown';
        
        const created = new Date(creationTimestamp);
        const now = new Date();
        const diff = now - created;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`Kubernetes GUI Manager running on port ${this.port}`);
            console.log(`Open http://localhost:${this.port} to access the GUI`);
        });
    }
}

// Start the server
const k8sManager = new KubernetesManager();
k8sManager.start();
