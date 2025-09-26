# AutoHosts

AutoHosts is a modern, powerful NestJS-based web application for automatic DNS hosts management. It fetches hosts files from multiple sources, manages them with DNSMasq, and provides a beautiful web UI for control and monitoring.

## 🚀 Features

- **DNSMasq Service Management**: Start, stop, restart, and monitor DNSMasq with one click
- **URL-based Hosts Management**: Add, edit, delete, enable/disable hosts sources
- **Automatic Hosts Fetching**: Scheduled or manual fetching with configurable timeout and cron
- **Real-time Preview**: View generated hosts file and stats instantly
- **Modern Web UI**: Responsive, mobile-friendly, light/dark mode
- **Secure & Reliable**: Runs as non-root, input validation, health checks

## 🏁 Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/libzonda/AutoHosts.git
cd AutoHosts
cp config.example.json config.json
cp urls.example.json urls.json
# Edit config.json and urls.json as needed
docker-compose up -d
```

Access: [http://localhost:3000](http://localhost:3000)

### Manual

- Node.js 20+
- DNSMasq installed

```bash
npm install
npm run build
npm run start:prod
```

## ⚙️ Configuration

- `config.json`: Main app config (cron, hosts file path, fetch timeout)
- `urls.json`: List of hosts sources
- Environment variables:
  - `DNSMASQ_HOSTS` (default: `./extra_hosts.conf`)
  - `PORT` (default: `3000`)

## 🐧 DNSMasq Installation

| OS            | Command                      |
|---------------|-----------------------------|
| Alpine Linux  | `apk add dnsmasq`           |
| Ubuntu/Debian | `apt-get install dnsmasq`   |
| CentOS/RHEL   | `yum install dnsmasq`       |
| macOS         | `brew install dnsmasq`      |

## 🖥️ Web UI Usage

- **Service**: Start/stop/restart DNSMasq
- **URL Management**: Add/enable/disable/delete hosts sources
- **Preview**: View hosts file and stats
- **Manual Fetch**: Fetch all hosts now (with custom timeout)
- **Config**: Edit cron, hosts path, fetch timeout

## 📦 Project Structure

```
src/
├── config/    # Config management
├── dnsmasq/   # DNSMasq service
├── hosts/     # Hosts file logic
├── url/       # URL management
├── public/    # Static web files
```

## 📝 API Endpoints (Partial)

- `GET /api/dnsmasq/status` — Service status
- `POST /api/dnsmasq/start|stop|restart` — Control service
- `GET/POST /api/urls` — Manage sources
- `GET /api/hosts/content|stats` — Hosts file info
- `POST /api/hosts/fetch` — Manual fetch

## 🐳 Docker Deployment

```bash
docker build -t autohosts .
docker run -d -p 3000:3000 --privileged autohosts
```
Or use `docker-compose up -d`.

## 🛠️ Development

```bash
npm install
npm run start:dev
npm run lint
npm test
```

## 🤝 Contributing

1. Fork & branch
2. Commit & PR
3. Describe your change

## 📝 License

Apache License 2.0. See LICENSE for details.
