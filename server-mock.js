const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

class MockKubernetesManager {
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
        this.generateMockData();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });

        // Mock API endpoints
        this.app.get('/api/pods', (req, res) => {
            res.json(this.mockPods);
        });

        this.app.get('/api/deployments', (req, res) => {
            res.json(this.mockDeployments);
        });

        this.app.get('/api/services', (req, res) => {
            res.json(this.mockServices);
        });

        this.app.get('/api/namespaces', (req, res) => {
            res.json(this.mockNamespaces);
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Mock data handlers
            socket.on('get-pods', (data) => {
                socket.emit('pods-update', this.mockPods);
            });

            socket.on('get-deployments', (data) => {
                socket.emit('deployments-update', this.mockDeployments);
            });

            socket.on('get-services', (data) => {
                socket.emit('services-update', this.mockServices);
            });

            socket.on('get-namespaces', () => {
                socket.emit('namespaces-update', this.mockNamespaces);
            });

            socket.on('describe-pod', (data) => {
                const description = this.generateMockPodDescription(data.name);
                socket.emit('pod-description', { description });
            });

            socket.on('describe-service', (data) => {
                const description = this.generateMockServiceDescription(data.name);
                socket.emit('service-description', { description });
            });

            socket.on('restart-pod', (data) => {
                console.log(`Mock restart pod: ${data.name}`);
                setTimeout(() => {
                    socket.emit('pods-update', this.mockPods);
                }, 2000);
            });

            socket.on('delete-pod', (data) => {
                console.log(`Mock delete pod: ${data.name}`);
                this.mockPods = this.mockPods.filter(p => p.name !== data.name);
                setTimeout(() => {
                    socket.emit('pods-update', this.mockPods);
                }, 1000);
            });

            socket.on('scale-deployment', (data) => {
                console.log(`Mock scale deployment: ${data.name} to ${data.replicas}`);
                const deployment = this.mockDeployments.find(d => d.name === data.name);
                if (deployment) {
                    deployment.replicas = data.replicas;
                    deployment.readyReplicas = data.replicas;
                }
                setTimeout(() => {
                    socket.emit('deployments-update', this.mockDeployments);
                }, 2000);
            });

            socket.on('restart-deployment', (data) => {
                console.log(`Mock restart deployment: ${data.name}`);
                setTimeout(() => {
                    socket.emit('deployments-update', this.mockDeployments);
                }, 3000);
            });

            socket.on('delete-deployment', (data) => {
                console.log(`Mock delete deployment: ${data.name}`);
                this.mockDeployments = this.mockDeployments.filter(d => d.name !== data.name);
                setTimeout(() => {
                    socket.emit('deployments-update', this.mockDeployments);
                }, 1000);
            });

            socket.on('delete-service', (data) => {
                console.log(`Mock delete service: ${data.name}`);
                this.mockServices = this.mockServices.filter(s => s.name !== data.name);
                setTimeout(() => {
                    socket.emit('services-update', this.mockServices);
                }, 1000);
            });

            socket.on('follow-logs', (data) => {
                console.log(`Mock follow logs: ${data.podName}`);
                // Simulate log streaming
                let logCount = 0;
                const logInterval = setInterval(() => {
                    logCount++;
                    socket.emit('log-data', { 
                        log: `[${new Date().toISOString()}] Mock log entry #${logCount} from ${data.podName}\n` 
                    });
                    
                    if (logCount >= 10) {
                        clearInterval(logInterval);
                    }
                }, 1000);
            });

            socket.on('create-pod', (data) => {
                console.log(`Mock create pod: ${data.name}`);
                
                // Create new pod object
                const newPod = {
                    name: data.name,
                    namespace: data.namespace || 'default',
                    status: { phase: 'Running' },
                    ready: '1/1',
                    restartCount: 0,
                    age: '0s',
                    node: 'minikube',
                    ip: '172.17.0.' + Math.floor(Math.random() * 255)
                };
                
                // Add to mock pods array
                this.mockPods.push(newPod);
                
                // Send updated pods list
                setTimeout(() => {
                    socket.emit('pods-update', this.mockPods);
                }, 1500);
                
                // Also update cluster stats
                setTimeout(() => {
                    const stats = {
                        totalPods: this.mockPods.length,
                        runningPods: this.mockPods.filter(p => p.status?.phase === 'Running').length,
                        pendingPods: this.mockPods.filter(p => p.status?.phase === 'Pending').length,
                        failedPods: this.mockPods.filter(p => ['Failed', 'CrashLoopBackOff'].includes(p.status?.phase)).length
                    };
                    socket.emit('cluster-stats', stats);
                }, 2000);
            });

                socket.on('disconnect', () => {
                    clearInterval(logInterval);
                });
            });

            socket.on('create-deployment', (data) => {
                console.log(`Mock create deployment: ${data.name}`);
                
                // Create new deployment object
                const newDeployment = {
                    name: data.name,
                    namespace: data.namespace || 'default',
                    replicas: data.replicas || 3,
                    readyReplicas: data.replicas || 3,
                    updatedReplicas: data.replicas || 3,
                    availableReplicas: data.replicas || 3,
                    age: '0s',
                    ready: `${data.replicas || 3}/${data.replicas || 3}`
                };
                
                // Add to mock deployments array
                this.mockDeployments.push(newDeployment);
                
                // Send updated deployments list
                setTimeout(() => {
                    socket.emit('deployments-update', this.mockDeployments);
                }, 1500);
            });

            socket.on('create-service', (data) => {
                console.log(`Mock create service: ${data.name}`);
                
                // Create new service object
                const newService = {
                    name: data.name,
                    namespace: data.namespace || 'default',
                    type: data.type || 'ClusterIP',
                    clusterIP: '10.96.0.' + Math.floor(Math.random() * 255),
                    externalIPs: data.type === 'LoadBalancer' ? ['192.168.1.' + Math.floor(Math.random() * 255)] : [],
                    ports: [{
                        port: data.port || 80,
                        protocol: 'TCP'
                    }],
                    age: '0s'
                };
                
                // Add to mock services array
                this.mockServices.push(newService);
                
                // Send updated services list
                setTimeout(() => {
                    socket.emit('services-update', this.mockServices);
                }, 1500);
            });

            socket.on('get-cluster-stats', () => {
                const stats = {
                    totalPods: this.mockPods.length,
                    runningPods: this.mockPods.filter(p => p.status?.phase === 'Running').length,
                    pendingPods: this.mockPods.filter(p => p.status?.phase === 'Pending').length,
                    failedPods: this.mockPods.filter(p => ['Failed', 'CrashLoopBackOff'].includes(p.status?.phase)).length
                };
                socket.emit('cluster-stats', stats);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    generateMockData() {
        this.mockNamespaces = ['default', 'kube-system', 'kube-public', 'kube-node-lease', 'development', 'production'];

        this.mockPods = [
            {
                name: 'nginx-deployment-abc123',
                namespace: 'default',
                status: { phase: 'Running' },
                ready: '1/1',
                restartCount: 0,
                age: '2h',
                node: 'minikube',
                ip: '172.17.0.5'
            },
            {
                name: 'redis-pod-def456',
                namespace: 'default',
                status: { phase: 'Running' },
                ready: '1/1',
                restartCount: 1,
                age: '1h',
                node: 'minikube',
                ip: '172.17.0.6'
            },
            {
                name: 'failing-app-ghi789',
                namespace: 'development',
                status: { phase: 'CrashLoopBackOff' },
                ready: '0/1',
                restartCount: 5,
                age: '30m',
                node: 'minikube',
                ip: '172.17.0.7'
            },
            {
                name: 'pending-deployment-jkl012',
                namespace: 'production',
                status: { phase: 'Pending' },
                ready: '0/1',
                restartCount: 0,
                age: '5m',
                node: null,
                ip: null
            }
        ];

        this.mockDeployments = [
            {
                name: 'nginx-deployment',
                namespace: 'default',
                replicas: 3,
                readyReplicas: 3,
                updatedReplicas: 3,
                availableReplicas: 3,
                age: '2h',
                ready: '3/3'
            },
            {
                name: 'redis-deployment',
                namespace: 'default',
                replicas: 1,
                readyReplicas: 1,
                updatedReplicas: 1,
                availableReplicas: 1,
                age: '1h',
                ready: '1/1'
            },
            {
                name: 'failing-app',
                namespace: 'development',
                replicas: 2,
                readyReplicas: 0,
                updatedReplicas: 2,
                availableReplicas: 0,
                age: '30m',
                ready: '0/2'
            }
        ];

        this.mockServices = [
            {
                name: 'nginx-service',
                namespace: 'default',
                type: 'ClusterIP',
                clusterIP: '10.96.0.100',
                externalIPs: [],
                ports: [{ port: 80, protocol: 'TCP' }],
                age: '2h'
            },
            {
                name: 'redis-service',
                namespace: 'default',
                type: 'ClusterIP',
                clusterIP: '10.96.0.101',
                externalIPs: [],
                ports: [{ port: 6379, protocol: 'TCP' }],
                age: '1h'
            },
            {
                name: 'web-app-service',
                namespace: 'production',
                type: 'LoadBalancer',
                clusterIP: '10.96.0.102',
                externalIPs: ['192.168.1.100'],
                ports: [{ port: 80, protocol: 'TCP' }, { port: 443, protocol: 'TCP' }],
                age: '30m'
            }
        ];
    }

    generateMockPodDescription(podName) {
        return `Name:         ${podName}
Namespace:    default
Priority:     0
Node:         minikube/192.168.99.100
Start Time:   ${new Date().toISOString()}
Labels:       app=nginx
Annotations:  <none>
Status:       Running
IP:           172.17.0.5
IPs:
  IP:  172.17.0.5
Containers:
  nginx:
    Container ID:   docker://abc123def456
    Image:          nginx:1.21
    Image ID:       docker-pullable://nginx@sha256:abc123
    Port:           80/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      ${new Date().toISOString()}
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-xyz (ro)
Conditions:
  Type              Status
  Initialized       True 
  Ready             True 
  ContainersReady   True 
  PodScheduled      True 
Volumes:
  kube-api-access-xyz:
    Type:                    Projected (a volume that contains injected data files with multiple data sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:          kube-root-ca.crt
    ConfigMapOptional:      <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  2h    default-scheduler  Successfully assigned default/${podName} to minikube
  Normal  Pulling    2h    kubelet            Pulling image "nginx:1.21"
  Normal  Pulled     2h    kubelet            Successfully pulled image "nginx:1.21"
  Normal  Created    2h    kubelet            Created container nginx
  Normal  Started    2h    kubelet            Started container nginx`;
    }

    generateMockServiceDescription(serviceName) {
        return `Name:              ${serviceName}
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=nginx
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.96.0.100
IPs:               10.96.0.100
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         172.17.0.5:80
Session Affinity:  None
Events:            <none>`;
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`Mock Kubernetes GUI Manager running on port ${this.port}`);
            console.log(`Open http://localhost:${this.port} to access the GUI`);
            console.log('NOTE: This is MOCK MODE - no real Kubernetes operations will be performed');
        });
    }
}

// Start the mock server
const mockK8sManager = new MockKubernetesManager();
mockK8sManager.start();
