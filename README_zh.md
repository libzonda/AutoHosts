# AutoHosts

AutoHosts 是一个现代化、强大的基于 NestJS 的自动 DNS hosts 管理平台。它可从多个来源自动拉取 hosts 文件，结合 DNSMasq 管理，并提供美观易用的 Web 界面进行控制和监控。

## 🚀 功能亮点

- **DNSMasq 服务管理**：一键启动、停止、重启、监控 DNSMasq
- **URL 源管理**：添加、编辑、删除、启用/禁用 hosts 源
- **自动拉取 hosts**：支持定时任务和手动拉取，超时时间和 cron 可配置
- **实时预览**：即时查看生成的 hosts 文件和统计信息
- **现代 Web UI**：响应式设计，移动端友好，支持明暗主题
- **安全可靠**：非 root 用户运行，输入校验，健康检查

## 🏁 快速开始

### 推荐：Docker 部署

```bash
git clone https://github.com/libzonda/AutoHosts.git
cd AutoHosts
cp config.example.json config.json
cp urls.example.json urls.json
# 按需编辑 config.json 和 urls.json
docker-compose up -d
```

访问：[http://localhost:3000](http://localhost:3000)

### 手动部署

- Node.js 20+
- 已安装 DNSMasq

```bash
npm install
npm run build
npm run start:prod
```

## ⚙️ 配置说明

- `config.json`：主配置（定时 cron、hosts 路径、拉取超时）
- `urls.json`：hosts 源列表
- 环境变量：
  - `DNSMASQ_HOSTS`（默认：`./extra_hosts.conf`）
  - `PORT`（默认：`3000`）

## 🐧 DNSMasq 安装

| 系统         | 安装命令                  |
|--------------|---------------------------|
| Alpine Linux | `apk add dnsmasq`         |
| Ubuntu/Debian| `apt-get install dnsmasq` |
| CentOS/RHEL  | `yum install dnsmasq`     |
| macOS        | `brew install dnsmasq`    |

## 🖥️ Web 界面用法

- **服务管理**：启动/停止/重启 DNSMasq
- **URL 管理**：添加/启用/禁用/删除 hosts 源
- **预览**：查看 hosts 文件和统计
- **手动拉取**：一键拉取所有 hosts（可自定义超时）
- **配置**：编辑 cron、hosts 路径、拉取超时

## 📦 项目结构

```
src/
├── config/    # 配置管理
├── dnsmasq/   # DNSMasq 服务
├── hosts/     # hosts 文件逻辑
├── url/       # URL 管理
├── public/    # 前端静态文件
```

## 📝 API 接口（部分）

- `GET /api/dnsmasq/status` — 服务状态
- `POST /api/dnsmasq/start|stop|restart` — 控制服务
- `GET/POST /api/urls` — 管理 hosts 源
- `GET /api/hosts/content|stats` — hosts 文件信息
- `POST /api/hosts/fetch` — 手动拉取

## 🐳 Docker 部署

```bash
docker build -t autohosts .
docker run -d -p 3000:3000 --privileged autohosts
```
或直接使用 `docker-compose up -d`。

## 🛠️ 开发

```bash
npm install
npm run start:dev
npm run lint
npm test
```

## 🤝 贡献指南

1. Fork & 新建分支
2. Commit & PR
3. 详细描述你的更改

## 📝 许可证

Apache License 2.0，详见 LICENSE 文件。
