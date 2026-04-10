# Kubernetes GUI Manager

A modern, web-based graphical user interface for managing and monitoring Kubernetes clusters. This tool provides an intuitive dashboard for performing common Kubernetes operations without needing to remember complex kubectl commands.

## Features

### Core Functionality
- **Pod Management**: View, describe, restart, and delete pods across all namespaces
- **Deployment Management**: Scale, restart, and delete deployments with real-time status updates
- **Service Management**: Monitor and manage Kubernetes services
- **Log Viewer**: Real-time log streaming from any pod
- **Cluster Monitoring**: Dashboard with pod status statistics and resource usage
- **Namespace Support**: Switch between namespaces or view all resources

### UI Features
- Modern, responsive web interface using Tailwind CSS
- Real-time updates via WebSocket connections
- Tabbed navigation for different resource types
- Color-coded status indicators
- Interactive modals for confirmations and descriptions
- Auto-refresh every 30 seconds

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- kubectl installed and configured
- Access to a Kubernetes cluster

## Installation

1. Clone or download this project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Starting the Application

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The application will start on `http://localhost:3000` by default.

### Accessing the GUI

Open your web browser and navigate to `http://localhost:3000`

### Configuration

You can configure the application using environment variables in the `.env` file:

- `PORT`: Server port (default: 3000)
- `KUBECONFIG`: Path to kubeconfig file (optional)
- `DEFAULT_NAMESPACE`: Default namespace to use (optional)

## API Reference

### REST Endpoints

- `GET /api/pods` - List pods
- `GET /api/deployments` - List deployments  
- `GET /api/services` - List services
- `GET /api/namespaces` - List namespaces

### WebSocket Events

The application uses WebSocket for real-time updates:

#### Client to Server:
- `get-pods` - Fetch pod information
- `get-deployments` - Fetch deployment information
- `get-services` - Fetch service information
- `get-namespaces` - Fetch namespace list
- `describe-pod` - Get detailed pod information
- `restart-pod` - Restart a pod
- `delete-pod` - Delete a pod
- `scale-deployment` - Scale a deployment
- `restart-deployment` - Restart a deployment
- `delete-deployment` - Delete a deployment
- `describe-service` - Get service details
- `delete-service` - Delete a service
- `follow-logs` - Stream logs from a pod
- `get-cluster-stats` - Get cluster statistics

#### Server to Client:
- `pods-update` - Pod data updates
- `deployments-update` - Deployment data updates
- `services-update` - Service data updates
- `namespaces-update` - Namespace list updates
- `pod-description` - Pod description data
- `service-description` - Service description data
- `log-data` - Real-time log data
- `cluster-stats` - Cluster statistics
- `error` - Error messages

## Security Considerations

- The application runs kubectl commands on the server
- Ensure the server is only accessible to trusted users
- Use RBAC to limit Kubernetes permissions
- Consider adding authentication for production use

## Troubleshooting

### Common Issues

1. **"kubectl command failed" error**
   - Ensure kubectl is installed and in your PATH
   - Verify your kubeconfig is properly configured
   - Check that you have cluster access

2. **"Connection refused" error**
   - Ensure the Kubernetes API server is accessible
   - Check your network connectivity
   - Verify firewall settings

3. **Permission errors**
   - Check your Kubernetes RBAC permissions
   - Ensure the service account has necessary permissions

### Debug Mode

Enable debug logging by setting the DEBUG environment variable:
```bash
DEBUG=* npm start
```

## Development

### Project Structure
```
kubernetes-gui-manager/
|-- public/
|   |-- index.html      # Main HTML interface
|   |-- app.js          # Frontend JavaScript
|-- server.js           # Backend server and API
|-- package.json        # Dependencies and scripts
|-- .env               # Environment variables
|-- README.md          # This file
```

### Adding New Features

1. Add new API endpoints in `server.js`
2. Update the frontend in `public/app.js`
3. Add UI components in `public/index.html`
4. Test with a real Kubernetes cluster

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Verify your Kubernetes cluster connectivity
4. Ensure proper permissions are set

---

**Note**: This tool requires proper Kubernetes cluster access. Always follow your organization's security policies when managing clusters.
