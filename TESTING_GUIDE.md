# Kubernetes GUI Manager - Testing Guide

This comprehensive guide covers all aspects of testing the Kubernetes GUI Manager application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Testing Options](#testing-options)
3. [Mock Mode Testing](#mock-mode-testing)
4. [Real Kubernetes Testing](#real-kubernetes-testing)
5. [Feature Testing Checklist](#feature-testing-checklist)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Testing Scenarios](#advanced-testing-scenarios)

## Prerequisites

### Basic Requirements
- Node.js (version 14 or higher)
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Git (for cloning/downloading)

### For Real Kubernetes Testing
- kubectl installed and configured
- Access to a Kubernetes cluster (local or cloud)

## Testing Options

### Option 1: Mock Mode (Recommended for Initial Testing)
**Best for**: Quick testing without Kubernetes setup
- **Pros**: No dependencies, instant setup, realistic mock data
- **Cons**: No real cluster operations
- **Command**: `npm run mock`

### Option 2: Real Kubernetes Mode
**Best for**: Production testing and real cluster operations
- **Pros**: Real Kubernetes operations, actual cluster data
- **Cons**: Requires kubectl and cluster access
- **Command**: `npm start`

## Mock Mode Testing

### Step 1: Start Mock Server
```bash
cd e:\WIndsurf_projects\KUBERNETIES
npm run mock
```

**Expected Output:**
```
Mock Kubernetes GUI Manager running on port 3000
Open http://localhost:3000 to access the GUI
NOTE: This is MOCK MODE - no real Kubernetes operations will be performed
```

### Step 2: Access the GUI
- Open browser to: http://localhost:3000
- Or use the IDE preview button

### Step 3: Test Mock Data Features

#### Mock Data Included:
- **Pods**: 4 sample pods with different states (Running, CrashLoopBackOff, Pending)
- **Deployments**: 3 deployments with varying replica counts
- **Services**: 3 services (ClusterIP, LoadBalancer types)
- **Namespaces**: 6 namespaces (default, kube-system, development, production, etc.)

#### Test Scenarios:

**1. Pod Management**
- Navigate to "Pods" tab
- Verify all 4 pods are displayed with correct status indicators
- Test namespace filtering (select different namespaces)
- Click "Describe" on any pod - should show detailed mock description
- Click "Restart" on a pod - should simulate restart (console log)
- Click "Delete" on a pod - should remove from list

**2. Deployment Management**
- Navigate to "Deployments" tab
- Verify 3 deployments with replica counts
- Click "Scale" on nginx-deployment, enter "5"
- Verify replica count updates after 2 seconds
- Test "Restart" deployment functionality
- Test "Delete" deployment

**3. Service Management**
- Navigate to "Services" tab
- Verify 3 services with different types
- Click "Describe" on any service
- Test "Delete" service functionality

**4. Log Streaming**
- Navigate to "Logs" tab
- Select a pod from dropdown (e.g., default/nginx-deployment-abc123)
- Click "Follow" button
- Should see 10 mock log entries over 10 seconds
- Click "Pause" to stop streaming

**5. Cluster Monitoring**
- Navigate to "Monitor" tab
- Verify cluster statistics:
  - Total Pods: 4
  - Running: 2
  - Pending: 1
  - Failed: 1

## Real Kubernetes Testing

### Step 1: Install kubectl

#### Windows Installation Options:

**Option A: Chocolatey**
```bash
choco install kubernetes-cli
```

**Option B: Winget**
```bash
winget install -e --id Kubernetes.kubectl
```

**Option C: Direct Download**
```powershell
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/windows/amd64/kubectl.exe"
```

**Option D: Download from Website**
Visit: https://kubernetes.io/docs/tasks/tools/install-kubectl/

### Step 2: Verify kubectl Installation
```bash
kubectl version --client
```

### Step 3: Set Up Kubernetes Cluster

#### Option A: Local Minikube
```bash
# Install Minikube
choco install minikube

# Start Minikube
minikube start

# Verify cluster access
kubectl get nodes
```

#### Option B: Docker Desktop Kubernetes
1. Open Docker Desktop
2. Go to Settings > Kubernetes
3. Enable Kubernetes
4. Wait for installation to complete
5. Verify: `kubectl get nodes`

#### Option C: Cloud Provider Cluster

**AWS EKS:**
```bash
aws eks update-kubeconfig --region us-west-2 --name my-cluster
kubectl get nodes
```

**Google GKE:**
```bash
gcloud container clusters get-credentials my-cluster --zone us-central1-a
kubectl get nodes
```

**Azure AKS:**
```bash
az aks get-credentials --resource-group myResourceGroup --name myAKSCluster
kubectl get nodes
```

### Step 4: Start Real Server
```bash
npm start
```

### Step 5: Test Real Cluster Operations

**1. Create Test Resources**
```bash
# Create test namespace
kubectl create namespace test-gui

# Create test deployment
kubectl create deployment nginx-test --image=nginx --port=80 -n test-gui

# Create test service
kubectl expose deployment nginx-test --type=ClusterIP --port=80 -n test-gui

# Scale deployment
kubectl scale deployment nginx-test --replicas=3 -n test-gui
```

**2. Test GUI with Real Data**
- Open http://localhost:3000
- Select "test-gui" namespace
- Verify nginx-test deployment appears
- Verify nginx-test service appears
- Test scaling operations
- Test pod restart operations
- Test log streaming

**3. Cleanup Test Resources**
```bash
kubectl delete namespace test-gui
```

## Feature Testing Checklist

### Core Functionality Tests

#### [ ] Pod Management
- [ ] List pods across all namespaces
- [ ] Filter pods by namespace
- [ ] Display pod status correctly (Running, Pending, Failed, etc.)
- [ ] Show pod age calculation
- [ ] Display restart counts
- [ ] Describe pod functionality
- [ ] Restart pod operation
- [ ] Delete pod operation
- [ ] Real-time pod status updates

#### [ ] Deployment Management
- [ ] List deployments
- [ ] Show replica counts
- [ ] Scale deployment functionality
- [ ] Restart deployment operation
- [ ] Delete deployment operation
- [ ] Display deployment age
- [ ] Show ready/updated/available replicas

#### [ ] Service Management
- [ ] List services
- [ ] Show service types (ClusterIP, LoadBalancer, NodePort)
- [ ] Display cluster IP and external IPs
- [ ] Show port configurations
- [ ] Describe service functionality
- [ ] Delete service operation

#### [ ] Log Viewer
- [ ] Select pods for log viewing
- [ ] Start log streaming
- [ ] Stop/pause log streaming
- [ ] Display real-time log updates
- [ ] Handle log stream errors gracefully
- [ ] Auto-scroll to latest logs

#### [ ] Cluster Monitoring
- [ ] Display total pod count
- [ ] Show running pods count
- [ ] Show pending pods count
- [ ] Show failed pods count
- [ ] Real-time statistics updates
- [ ] Auto-refresh monitoring data

### UI/UX Tests

#### [ ] Navigation
- [ ] Tab switching works smoothly
- [ ] Active tab highlighting
- [ ] Responsive design on different screen sizes
- [ ] Loading states during operations

#### [ ] Interactive Elements
- [ ] Buttons are responsive
- [ ] Modals open/close correctly
- [ ] Dropdown selections work
- [ ] Form inputs validate correctly
- [ ] Hover states and tooltips

#### [ ] Visual Feedback
- [ ] Status color coding (green=running, yellow=pending, red=failed)
- [ ] Loading indicators
- [ ] Success/error messages
- [ ] Confirmation dialogs for destructive actions

### Performance Tests

#### [ ] Response Times
- [ ] Page loads within 3 seconds
- [ ] Tab switches within 1 second
- [ ] API responses within 2 seconds
- [ ] Real-time updates appear promptly

#### [ ] Resource Usage
- [ ] Memory usage remains reasonable
- [ ] CPU usage stays low during idle
- [ ] No memory leaks during extended use

## Troubleshooting

### Common Issues and Solutions

#### 1. Server Won't Start
**Problem**: Port 3000 already in use
**Solution**: 
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm start
```

#### 2. kubectl Command Not Found
**Problem**: kubectl not in PATH
**Solution**: 
- Reinstall kubectl
- Add kubectl to system PATH
- Use full path to kubectl executable

#### 3. Kubernetes Connection Failed
**Problem**: Cannot connect to cluster
**Solution**:
```bash
# Check kubeconfig
kubectl config view

# Test cluster access
kubectl get nodes

# Reconfigure kubeconfig if needed
```

#### 4. Browser Console Errors
**Problem**: JavaScript errors in browser
**Solution**:
- Open browser developer tools (F12)
- Check Console tab for errors
- Verify all dependencies loaded
- Clear browser cache and reload

#### 5. WebSocket Connection Issues
**Problem**: Real-time updates not working
**Solution**:
- Check if port is blocked by firewall
- Verify server is running
- Check browser console for WebSocket errors
- Try different browser

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* npm start
```

### Test Logs Location

- Server logs: Console output
- Browser logs: Developer Tools > Console
- Network requests: Developer Tools > Network

## Advanced Testing Scenarios

### 1. Load Testing
Test with multiple concurrent users:
```bash
# Use tools like Apache Bench or JMeter
ab -n 100 -c 10 http://localhost:3000/
```

### 2. Error Handling Tests
Test error scenarios:
- Invalid kubectl configuration
- Network connectivity issues
- Insufficient permissions
- Resource not found errors

### 3. Security Tests
Verify security aspects:
- Input validation
- XSS protection
- CSRF protection
- Authentication (if implemented)

### 4. Integration Tests
Test with different cluster types:
- Minikube
- Docker Desktop
- Cloud providers (AWS, GCP, Azure)
- On-premise clusters

### 5. Browser Compatibility
Test across browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Test Data Reference

### Mock Data Structure

**Pods:**
- nginx-deployment-abc123 (Running)
- redis-pod-def456 (Running, 1 restart)
- failing-app-ghi789 (CrashLoopBackOff, 5 restarts)
- pending-deployment-jkl012 (Pending)

**Deployments:**
- nginx-deployment (3/3 replicas)
- redis-deployment (1/1 replica)
- failing-app (0/2 replicas)

**Services:**
- nginx-service (ClusterIP)
- redis-service (ClusterIP)
- web-app-service (LoadBalancer)

## Automated Testing

### Unit Tests (Future Enhancement)
```bash
npm test  # When test suite is implemented
```

### Integration Tests (Future Enhancement)
```bash
npm run test:integration  # When implemented
```

### End-to-End Tests (Future Enhancement)
```bash
npm run test:e2e  # When implemented
```

---

## Quick Start Summary

### For Immediate Testing (No Kubernetes Required)
```bash
cd e:\WIndsurf_projects\KUBERNETIES
npm run mock
# Open http://localhost:3000
```

### For Real Kubernetes Testing
```bash
# 1. Install kubectl
choco install kubernetes-cli

# 2. Set up cluster (Minikube example)
choco install minikube
minikube start

# 3. Start application
npm start

# 4. Open http://localhost:3000
```

## Support

For issues during testing:
1. Check this troubleshooting guide
2. Review server console logs
3. Check browser developer tools
4. Verify kubectl cluster access
5. Ensure all dependencies are installed

---

**Note**: This testing guide covers both mock and real Kubernetes scenarios. Start with mock mode to familiarize yourself with the interface, then progress to real Kubernetes testing for production validation.
