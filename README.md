# AutoHosts

A powerful NestJS-based web application for automatic DNS hosts management. AutoHosts helps you maintain and update DNS entries automatically by fetching hosts files from multiple sources and managing them through DNSMasq, all with an intuitive web interface.

## 🌟 Features

- **DNSMasq Service Management**: 
  - Start, stop, restart DNSMasq with PID tracking
  - Real-time service status monitoring
  - Graceful shutdown handling
  
- **URL-based Hosts Management**: 
  - Add, edit, delete URLs that provide hosts files
  - Automatic validation of hosts file formats
  - Bulk import/export of URL configurations
  
- **Automatic Hosts Fetching**: 
  - Scheduled HTTP requests to fetch hosts from configured URLs
  - Configurable update intervals
  - Retry mechanism with exponential backoff
  
- **Real-time Preview**: 
  - Live view of the generated hosts file content
  - Detailed statistics and metrics
  - Syntax highlighting for hosts entries
  
- **Modern Web Interface**: 
  - Clean, responsive UI built with vanilla HTML/CSS/JS
  - Dark/Light theme support
  - Mobile-friendly design

## 🚀 Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/libzonda/AutoHosts.git
cd AutoHosts
```

2. Configure your settings (optional):
```bash
# Edit config.json and urls.json to customize your setup
cp config.example.json config.json
cp urls.example.json urls.json
```

3. Start with Docker Compose:
```bash
docker-compose up -d
```

4. Access the web interface:
```
http://localhost:3000
```

The Docker container runs with non-root privileges and includes health checks to ensure service reliability.

💡 **Tip**: You can use environment variables or mount a custom config file to override default settings.

### Manual Installation

1. Prerequisites:
   - Node.js 20 or later
   - DNSMasq installed on your system
   - Git (for cloning the repository)

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Start the application:
```bash
npm run start:prod
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DNSMASQ_HOSTS` | Path to the hosts file | `./extra_hosts.conf` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `3000` |
| `UPDATE_INTERVAL` | Hosts update interval (minutes) | `60` |

### DNSMasq Configuration

The application uses `dnsmasq --no-daemon` to start the service. Install DNSMasq based on your system:

| OS | Command |
|----|---------|
| Alpine Linux | `apk add dnsmasq` |
| Ubuntu/Debian | `apt-get install dnsmasq` |
| CentOS/RHEL | `yum install dnsmasq` |
| macOS | `brew install dnsmasq` |

### Security Considerations

- The Docker container runs as a non-root user
- All file operations are restricted to the `/app` directory
- Regular security updates are applied to the base image
- HTTPS support for secure web interface access
- Input validation for all URL sources

## 📦 Project Structure

```
.
├── src/                  # Source code
│   ├── config/          # Configuration management
│   ├── dnsmasq/         # DNSMasq service management
│   ├── hosts/           # Hosts file management
│   ├── url/            # URL management
│   └── public/         # Static web files
├── config.json         # Main configuration file
├── urls.json          # URL sources configuration
├── docker-compose.yml # Docker compose configuration
└── Dockerfile         # Docker build configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Usage

### Web Interface

1. **DNSMasq Service**: Use the control buttons to start, stop, or restart DNSMasq
2. **URL Management**: Add URLs that provide hosts files (e.g., `https://example.com/hosts.txt`)
3. **Hosts Preview**: View the generated hosts file content and statistics
4. **Manual Fetch**: Trigger immediate hosts fetching from all enabled URLs

### API Endpoints

- `GET /api/dnsmasq/status` - Get DNSMasq service status
- `POST /api/dnsmasq/start` - Start DNSMasq service
- `POST /api/dnsmasq/stop` - Stop DNSMasq service
- `POST /api/dnsmasq/restart` - Restart DNSMasq service
- `GET /api/urls` - Get all configured URLs
- `POST /api/urls` - Add new URL
- `PUT /api/urls/:id` - Update URL
- `DELETE /api/urls/:id` - Delete URL
- `POST /api/urls/:id/toggle` - Toggle URL enabled/disabled
- `GET /api/hosts/content` - Get hosts file content
- `GET /api/hosts/stats` - Get hosts file statistics
- `POST /api/hosts/fetch` - Trigger manual hosts fetch

## File Structure

```
src/
├── dnsmasq/           # DNSMasq service management
├── url/               # URL management
├── hosts/             # Hosts file management
├── public/            # Static web files
└── app.module.ts      # Main application module
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- dnsmasq (for testing)

### Development Commands

```bash
# Install dependencies
npm install

# Start in development mode
npm run start:dev

# Build for production
npm run build

# Start production build
npm run start:prod

# Run tests
npm test

# Lint code
npm run lint
```

## Docker Deployment

### Build Image

```bash
docker build -t dnsmasq-manager .
```

### Run Container

```bash
docker run -d \
  --name dnsmasq-manager \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --privileged \
  dnsmasq-manager
```

### Using Docker Compose

```bash
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **DNSMasq won't start**: Check if port 53 is available and if dnsmasq is installed
2. **Permission denied**: Ensure the application has necessary permissions to manage processes
3. **Hosts not updating**: Check URL accessibility and network connectivity

### Logs

- Application logs: Available in the web interface
- DNSMasq logs: Stored in `dnsmasq.log`
- Container logs: `docker logs dnsmasq-manager`

## License

MIT License - see LICENSE file for details.
