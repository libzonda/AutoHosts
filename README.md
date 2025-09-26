# DNSMasq Manager

A NestJS-based web application for managing DNSMasq service and hosts from URLs.

## Features

- **DNSMasq Service Management**: Start, stop, restart DNSMasq with PID tracking
- **URL-based Hosts Management**: Add, edit, delete URLs that provide hosts files
- **Automatic Hosts Fetching**: Scheduled HTTP requests to fetch hosts from configured URLs
- **Real-time Preview**: View the generated hosts file content and statistics
- **Modern Web Interface**: Clean, responsive UI built with vanilla HTML/CSS/JS

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd dnsmasq-manager
```

2. Create data directory:
```bash
mkdir -p data logs
```

3. Start with Docker Compose:
```bash
docker-compose up -d
```

4. Access the web interface at: http://localhost:3000

### Manual Installation

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

3. Start the application:
```bash
npm run start:prod
```

## Configuration

### Environment Variables

- `DNSMASQ_HOSTS`: Path to the hosts file (default: `./extra_hosts.conf`)
- `NODE_ENV`: Environment mode (development/production)

### DNSMasq Configuration

The application uses `dnsmasq --no-daemon` to start the service. Make sure dnsmasq is installed on your system:

- **Alpine Linux**: `apk add dnsmasq`
- **Ubuntu/Debian**: `apt-get install dnsmasq`
- **CentOS/RHEL**: `yum install dnsmasq`

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
