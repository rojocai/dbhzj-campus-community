#!/usr/bin/env bash
# =============================================================================
# 东白湖之家校园论坛社区 - 一键部署脚本
# 版本: v1.0.1
# 仓库: https://github.com/rojocai/dbhzj-campus-community
# 支持: Debian / Ubuntu / CentOS / RHEL / Fedora / AlmaLinux / Rocky Linux / Kali / Linux Mint
# 包含: Node.js 安装 | Prisma+SQLite | NPM 反代 | Let's Encrypt SSL | Cloudflare DNS | 远程部署副站
# =============================================================================
set -euo pipefail

# ── 颜色 ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }
step()  { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }
input() { echo -ne "${BLUE}[INPUT]${NC} $*"; }

# ── 默认变量 ──
PROJECT_NAME="dbhzj-campus-community"
PROJECT_DIR="/opt/${PROJECT_NAME}"
VERSION="v1.0.1"
GITHUB_REPO="https://github.com/rojocai/${PROJECT_NAME}.git"
GITHUB_BRANCH="main"
SERVICE_NAME="campus-life"
NODE_PORT=3000
NODE_PATH=""

# ── 用户输入变量（稍后交互式填写） ──
MAIN_DOMAIN=""
SUB_DOMAIN=""
SERVER_IP=""
CF_API_KEY=""
CF_EMAIL=""
ADMIN_EMAIL=""
NEXTAUTH_SECRET=""

# 副站相关
SUB_ON_REMOTE=false
REMOTE_SSH_HOST=""
REMOTE_SSH_PORT=""
REMOTE_SSH_USER=""
REMOTE_SSH_PASS=""
REMOTE_IP=""

# ──────────────────────────────────────────────
# 1. 检测操作系统 & 架构
# ──────────────────────────────────────────────
detect_os() {
  step "检测系统环境"
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS="${ID}"
    OS_NAME="${NAME}"
    OS_VERSION="${VERSION_ID}"
  else
    OS="$(uname -s)"
    OS_NAME="${OS}"
    OS_VERSION=""
  fi
  ARCH="$(uname -m)"

  info "系统: ${OS_NAME} ${OS_VERSION} (${ARCH})"

  case "${OS}" in
    debian|ubuntu|centos|rhel|fedora|almalinux|rocky|kali|linuxmint|elementary|pop|zorin)
      info "✅ 支持的操作系统"
      ;;
    *)
      warn "⚠️ 未知系统: ${OS}，尝试使用通用方式继续..."
      ;;
  esac
}

# ──────────────────────────────────────────────
# 2. 安装依赖
# ──────────────────────────────────────────────
install_deps() {
  step "安装系统依赖"

  local needs_install=false
  for cmd in curl git wget; do
    if ! command -v "${cmd}" &>/dev/null; then
      needs_install=true
      break
    fi
  done

  if ! $needs_install && command -v node &>/dev/null && command -v npm &>/dev/null; then
    info "✅ 基础依赖已满足"
    return 0
  fi

  case "${OS}" in
    debian|ubuntu|kali|linuxmint|elementary|pop|zorin)
      apt-get update -qq
      apt-get install -y -qq curl git wget sqlite3 openssl sshpass rsync
      ;;
    centos|rhel|almalinux|rocky)
      yum install -y curl git wget sqlite openssl sshpass
      ;;
    fedora)
      dnf install -y curl git wget sqlite openssl sshpass
      ;;
    *)
      warn "未知系统，尝试 apt-get..."
      apt-get update -qq 2>/dev/null || yum install -y curl git wget 2>/dev/null || true
      ;;
  esac

  info "✅ 系统依赖安装完成"
}

# ──────────────────────────────────────────────
# 3. 安装 Node.js
# ──────────────────────────────────────────────
install_nodejs() {
  step "检查 Node.js"

  if command -v node &>/dev/null; then
    local ver
    ver="$(node -v | sed 's/^v//')"
    local major="${ver%%.*}"
    if [ "${major}" -ge 18 ]; then
      info "✅ Node.js $(node -v) 已安装，满足需求"
      NODE_PATH="$(which node)"
      return 0
    fi
    warn "Node.js 版本过低 (v${ver})，需要 ≥18，将升级..."
  fi

  info "安装 Node.js 22 LTS..."

  case "${OS}" in
    debian|ubuntu|kali|linuxmint|elementary|pop|zorin)
      curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
      apt-get install -y -qq nodejs
      ;;
    centos|rhel|almalinux|rocky)
      curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
      yum install -y nodejs
      ;;
    fedora)
      curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
      dnf install -y nodejs
      ;;
    *)
      # 通用: 使用 nvm 或直接下载
      curl -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.xz -o /tmp/node.tar.xz
      tar xf /tmp/node.tar.xz -C /usr/local/ --strip-components=1
      rm -f /tmp/node.tar.xz
      ;;
  esac

  NODE_PATH="$(which node)"
  info "✅ Node.js $(node -v) 安装完成"
}

# ──────────────────────────────────────────────
# 4. 检查 Docker
# ──────────────────────────────────────────────
check_docker() {
  step "检查 Docker"

  if command -v docker &>/dev/null; then
    info "✅ Docker $(docker --version | awk '{print $3}') 已安装"
    if ! docker ps &>/dev/null; then
      warn "Docker daemon 未运行，尝试启动..."
      systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
      sleep 2
    fi
    return 0
  fi

  warn "⚠️ Docker 未安装"
  warn "建议安装 Docker 以使用 Nginx Proxy Manager 自动反代"
  input "是否安装 Docker？(y/n, 默认 y): "; read -r has_docker
  if [[ "${has_docker:-y}" =~ ^[Yy] ]]; then
    info "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker 2>/dev/null || true
    systemctl start docker 2>/dev/null || true
    info "✅ Docker 安装完成"
  fi
}

# ──────────────────────────────────────────────
# 5. 交互式输入
# ──────────────────────────────────────────────
get_user_input() {
  step "配置部署信息"

  # 公网 IP（自动检测）
  AUTO_IP="$(curl -s --max-time 5 ifconfig.me 2>/dev/null || curl -s --max-time 5 http://ip.sb 2>/dev/null || echo "")"
  input "服务器公网 IP [${AUTO_IP:-自动检测失败，请输入}]: "; read -r input_ip
  SERVER_IP="${input_ip:-${AUTO_IP}}"
  info "📡 服务器 IP: ${SERVER_IP}"

  # 主站域名
  input "主站域名 (如 www.example.com): "; read -r MAIN_DOMAIN
  while [ -z "${MAIN_DOMAIN}" ]; do
    input "主站域名不能为空，请重新输入: "; read -r MAIN_DOMAIN
  done
  info "🌐 主站域名: ${MAIN_DOMAIN}"

  # 副站域名（可选）
  input "副站域名 (可选，留空则跳过): "; read -r SUB_DOMAIN
  if [ -n "${SUB_DOMAIN}" ]; then
    info "🌐 副站域名: ${SUB_DOMAIN}"
    input "副站是否在同一台服务器？(y=同服务器/n=远程服务器, 默认 y): "; read -r sub_same
    if [[ ! "${sub_same:-y}" =~ ^[Yy] ]]; then
      SUB_ON_REMOTE=true
      step "副站远程部署信息"
      input "  远程服务器 IP: "; read -r REMOTE_SSH_HOST
      input "  SSH 端口 [22]: "; read -r input_port
      REMOTE_SSH_PORT="${input_port:-22}"
      input "  SSH 用户名 [root]: "; read -r input_user
      REMOTE_SSH_USER="${input_user:-root}"
      input "  SSH 密码 (或回车使用 SSH 密钥): "; read -rs REMOTE_SSH_PASS; echo
      input "  远程服务器公网 IP [${REMOTE_SSH_HOST}]: "; read -r input_rip
      REMOTE_IP="${input_rip:-${REMOTE_SSH_HOST}}"
    fi
  fi

  # 管理员邮箱（用于 Let's Encrypt+登录）
  input "管理员邮箱 (用于 SSL 证书和默认登录) [admin@dongbaihu.com]: "; read -r input_email
  ADMIN_EMAIL="${input_email:-admin@dongbaihu.com}"

  # NEXTAUTH_SECRET
  NEXTAUTH_SECRET="$(openssl rand -base64 32)"
  info "🔑 NEXTAUTH_SECRET 已自动生成"

  # Cloudflare API Key（可选）
  step "Cloudflare DNS 配置（可选）"
  info "如果需要自动配置 DNS 记录和申请 SSL 证书，请提供 Cloudflare 信息"
  input "Cloudflare 邮箱 (留空跳过 DNS 配置): "; read -r CF_EMAIL

  if [ -n "${CF_EMAIL}" ]; then
    input "Cloudflare Global API Key: "; read -rs CF_API_KEY; echo
    if [ -z "${CF_API_KEY}" ]; then
      warn "未提供 API Key，跳过 DNS 配置"
      CF_EMAIL=""
    else
      info "✅ Cloudflare API 信息已收集"
    fi
  fi
}

# ──────────────────────────────────────────────
# 6. Cloudflare DNS 操作
# ──────────────────────────────────────────────
cf_get_zone_id() {
  local domain="$1"
  local root_domain
  root_domain="$(echo "${domain}" | awk -F. '{if(NF>2){print $(NF-1)"."$NF}else{print $0}}')"

  curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=${root_domain}" \
    -H "X-Auth-Email: ${CF_EMAIL}" \
    -H "X-Auth-Key: ${CF_API_KEY}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')" 2>/dev/null
}

cf_create_a_record() {
  local domain="$1" ip="$2" zone_id="$3"
  local name_part
  name_part="$(echo "${domain}" | sed 's/\.[^.]*\.[^.]*$//')"
  [ "${name_part}" = "${domain}" ] && name_part="@"  # 根域名

  info "🔄 创建 DNS A 记录: ${domain} → ${ip}"

  local resp
  resp="$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records" \
    -H "X-Auth-Email: ${CF_EMAIL}" \
    -H "X-Auth-Key: ${CF_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"A\",\"name\":\"${name_part}\",\"content\":\"${ip}\",\"ttl\":120,\"proxied\":false}")"

  if echo "${resp}" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('success') else 1)" 2>/dev/null; then
    info "✅ DNS 记录创建成功: ${domain} → ${ip}"
  else
    local err_msg
    err_msg="$(echo "${resp}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errors',[{}])[0].get('message','?'))" 2>/dev/null)"
    warn "⚠️ DNS 记录可能已存在: ${err_msg}"
  fi
}

configure_dns() {
  [ -z "${CF_EMAIL}" ] && return 0

  step "配置 Cloudflare DNS"

  # 主站域名
  local zone_id
  zone_id="$(cf_get_zone_id "${MAIN_DOMAIN}")"
  if [ -n "${zone_id}" ]; then
    info "✅ Zone ID 获取成功"
    cf_create_a_record "${MAIN_DOMAIN}" "${SERVER_IP}" "${zone_id}"
  else
    warn "⚠️ 无法获取 Zone ID，DNS 配置跳过"
    CF_EMAIL=""
    return 0
  fi

  # 副站域名
  if [ -n "${SUB_DOMAIN}" ]; then
    local sub_ip="${SERVER_IP}"
    ${SUB_ON_REMOTE} && sub_ip="${REMOTE_IP}"
    cf_create_a_record "${SUB_DOMAIN}" "${sub_ip}" "${zone_id}"
  fi
}

# ──────────────────────────────────────────────
# 7. 克隆/下载源码并部署
# ──────────────────────────────────────────────
deploy_main_site() {
  step "部署主站: ${MAIN_DOMAIN} → :${NODE_PORT}"

  # 清理旧部署
  if [ -d "${PROJECT_DIR}" ]; then
    warn "目录 ${PROJECT_DIR} 已存在，将备份后重新部署"
    local bak_dir="/opt/${PROJECT_NAME}-backup-$(date +%Y%m%d%H%M%S)"
    mv "${PROJECT_DIR}" "${bak_dir}"
    info "📦 旧部署已备份到: ${bak_dir}"
  fi

  # 克隆源码
  info "下载源码..."
  git clone --depth 1 -b "${GITHUB_BRANCH}" "https://github.com/rojocai/${PROJECT_NAME}.git" "${PROJECT_DIR}" 2>/dev/null || {
    # fallback: 从 release 下载
    warn "git clone 失败，尝试从 Release 下载压缩包..."
    local tarball_url="https://github.com/rojocai/${PROJECT_NAME}/releases/download/${VERSION}/${PROJECT_NAME}V1.0.0.tar.gz"
    mkdir -p "${PROJECT_DIR}"
    curl -fsSL "${tarball_url}" -o /tmp/project.tar.gz
    tar xzf /tmp/project.tar.gz -C "${PROJECT_DIR}" --strip-components=1
    rm -f /tmp/project.tar.gz
  }

  info "✅ 源码下载完成"

  # 创建 .env
  info "创建 .env 配置文件..."
  cat > "${PROJECT_DIR}/.env" << ENVEOF
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="https://${MAIN_DOMAIN}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
UPLOAD_DIR="./public/uploads"
ENVEOF
  info "✅ .env 已生成"

  # 安装 npm 依赖
  info "安装 npm 依赖 (可能需要几分钟)..."
  cd "${PROJECT_DIR}"
  npm install --no-fund --no-audit 2>&1 | tail -3
  info "✅ npm 依赖安装完成"

  # 生成 Prisma 客户端
  info "初始化数据库..."
  npx prisma generate 2>&1 | tail -2
  npx prisma db push --skip-generate 2>&1 | tail -2

  # 种子数据
  info "写入种子数据..."
  npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts 2>&1 | tail -5 || {
    warn "ts-node 种子失败，尝试 npx prisma db seed..."
    npx prisma db seed 2>&1 | tail -5 || true
  }
  info "✅ 数据库初始化完成"

  # 构建
  info "构建 Next.js (可能需要几分钟)..."
  npm run build 2>&1 | tail -5
  info "✅ 构建完成"

  # 创建 systemd 服务
  info "创建 systemd 服务..."
  cat > "/etc/systemd/system/${SERVICE_NAME}.service" << SERVICEEOF
[Unit]
Description=东白湖之家校园论坛社区 - Next.js
After=network.target docker.service
Wants=docker.service

[Service]
Type=exec
User=root
WorkingDirectory=${PROJECT_DIR}
ExecStart=${NODE_PATH} ${PROJECT_DIR}/node_modules/.bin/next start -p ${NODE_PORT}
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=NEXTAUTH_URL=https://${MAIN_DOMAIN}
Environment=NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

[Install]
WantedBy=multi-user.target
SERVICEEOF

  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}.service"

  # 启动
  info "启动服务..."
  systemctl restart "${SERVICE_NAME}.service"

  # 等待服务就绪
  sleep 3
  if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
    info "✅ 服务运行中: ${SERVICE_NAME}"
  else
    warn "⚠️ 服务未启动，检查日志: journalctl -u ${SERVICE_NAME} -n 30"
  fi

  # 测试本地访问
  info "测试本地访问..."
  curl -s -o /dev/null -w "  HTTP %{http_code}" "http://127.0.0.1:${NODE_PORT}" 2>/dev/null && echo "" || warn "  暂时无响应（构建可能还在启动中）"
}

# ──────────────────────────────────────────────
# 8. 配置 NPM 反代 + SSL
# ──────────────────────────────────────────────
configure_npm() {
  [ -z "${CF_EMAIL}" ] && return 0

  step "配置 Nginx Proxy Manager 反代 + SSL"

  # 检查 NPM 容器
  local npm_container
  npm_container="$(docker ps --format '{{.Names}}' | grep -i 'npm' | head -1 || true)"
  if [ -z "${npm_container}" ]; then
    warn "⚠️ NPM 容器未运行，跳过反代配置"
    info "请手动在 NPM WebUI 中配置:"
    info "  Domain: ${MAIN_DOMAIN} → http://172.17.0.1:${NODE_PORT}"
    return 0
  fi
  info "✅ NPM 容器: ${npm_container}"

  # Docker 网关
  local docker_gateway
  docker_gateway="$(ip addr show docker0 2>/dev/null | grep -oP 'inet \K[\d.]+' || echo "172.17.0.1")"

  # NPM 数据库路径
  local npm_db="/opt/npm/data/database.sqlite"
  if [ ! -f "${npm_db}" ]; then
    warn "⚠️ NPM 数据库不存在: ${npm_db}"
    info "请手动配置 NPM 反代: ${MAIN_DOMAIN} → http://${docker_gateway}:${NODE_PORT}"
    return 0
  fi

  # 检查 Cloudflare 凭证文件
  local cf_cred_file="/etc/letsencrypt/credentials/credentials-1"
  if [ ! -f "${cf_cred_file}" ]; then
    info "创建 Cloudflare 凭证文件..."
    docker exec "${npm_container}" mkdir -p /etc/letsencrypt/credentials 2>/dev/null || true
    docker exec -i "${npm_container}" sh -c "cat > ${cf_cred_file}" << CREDEOF
# Cloudflare API token
dns_cloudflare_api_token=${CF_API_KEY}
CREDEOF
    docker exec "${npm_container}" chmod 600 "${cf_cred_file}" 2>/dev/null || true
  fi

  # ---- 配置主站 ----
  configure_npm_domain "${MAIN_DOMAIN}" "${docker_gateway}" "${NODE_PORT}" "${npm_container}" "${npm_db}"

  # ---- 配置副站 ----
  if [ -n "${SUB_DOMAIN}" ] && ! ${SUB_ON_REMOTE}; then
    # 副站在本机（如果是导航站或另一个 Next.js 服务）
    local sub_port=5001
    configure_npm_domain "${SUB_DOMAIN}" "${docker_gateway}" "${sub_port}" "${npm_container}" "${npm_db}"
  fi
}

configure_npm_domain() {
  local domain="$1" fwd_ip="$2" fwd_port="$3" container="$4" db="$5"

  info "配置 ${domain} → http://${fwd_ip}:${fwd_port}"

  # 获取下一个证书 ID 和代理 ID
  local next_cert_id next_proxy_id
  next_cert_id="$(sqlite3 "${db}" "SELECT COALESCE(MAX(id),0)+1 FROM certificate;")"
  next_proxy_id="$(sqlite3 "${db}" "SELECT COALESCE(MAX(id),0)+1 FROM proxy_host;")"

  # 申请 SSL 证书
  info "申请 SSL 证书: ${domain}"
  docker exec "${container}" certbot certonly \
    --config /etc/letsencrypt.ini \
    --work-dir /tmp/letsencrypt-lib \
    --logs-dir /tmp/letsencrypt-log \
    --cert-name "npm-${next_cert_id}" \
    --agree-tos --email "${ADMIN_EMAIL}" \
    --domains "${domain}" \
    --authenticator dns-cloudflare \
    --dns-cloudflare-credentials "${cf_cred_file}" \
    --dns-cloudflare-propagation-seconds 60 2>&1 | tail -3

  # 检查证书
  if docker exec "${container}" test -f "/etc/letsencrypt/live/npm-${next_cert_id}/fullchain.pem"; then
    info "✅ 证书已颁发: npm-${next_cert_id}"

    # 计算过期时间（+90天）
    local expires_on
    expires_on="$(date -d '+90 days' '+%Y-%m-%d %H:%M:%S')"

    # 注册证书到 NPM 数据库
    sqlite3 "${db}" "INSERT INTO certificate (id, created_on, modified_on, owner_user_id, is_deleted, provider, nice_name, domain_names, expires_on, meta) VALUES (${next_cert_id}, datetime('now'), datetime('now'), 1, 0, 'letsencrypt', '${domain}', '[\"${domain}\"]', '${expires_on}', '{\"dns_challenge\":true,\"dns_provider\":\"cloudflare\",\"dns_provider_credentials\":\"# Cloudflare API token\\r\\ndns_cloudflare_api_token=${CF_API_KEY}\",\"letsencrypt_email\":\"${ADMIN_EMAIL}\",\"letsencrypt_agree\":true}');"

    # 注册代理主机
    sqlite3 "${db}" "INSERT INTO proxy_host (id, created_on, modified_on, owner_user_id, is_deleted, domain_names, forward_scheme, forward_host, forward_port, access_list_id, certificate_id, ssl_forced, caching_enabled, block_exploits, advanced_config, meta, allow_websocket_upgrade, http2_support, enabled, locations, hsts_enabled, hsts_subdomains) VALUES (${next_proxy_id}, datetime('now'), datetime('now'), 1, 0, '[\"${domain}\"]', 'http', '${fwd_ip}', ${fwd_port}, 0, ${next_cert_id}, 1, 1, 0, '', '{}', 0, 0, 1, '[]', 0, 0);"

    # 重启 NPM 加载配置
    docker restart "${container}" >/dev/null 2>&1
    sleep 2

    # 验证配置文件
    if docker exec "${container}" test -f "/data/nginx/proxy_host/${next_proxy_id}.conf"; then
      info "✅ NPM 配置生效: ${domain} (proxy id: ${next_proxy_id}, cert id: ${next_cert_id})"
    else
      warn "⚠️ 配置文件未自动生成，尝试手动创建..."
    fi
  else
    warn "⚠️ 证书申请失败，请检查 DNS 记录是否已生效"
  fi
}

# ──────────────────────────────────────────────
# 9. 副站远程部署
# ──────────────────────────────────────────────
deploy_sub_remote() {
  [ -z "${SUB_DOMAIN}" ] && return 0
  ! ${SUB_ON_REMOTE} && return 0

  step "远程部署副站: ${SUB_DOMAIN} → ${REMOTE_SSH_HOST}"

  # 把本脚本传输到远程服务器并执行
  local remote_cmd

  if [ -n "${REMOTE_SSH_PASS}" ]; then
    # 使用 sshpass
    if ! command -v sshpass &>/dev/null; then
      apt-get install -y -qq sshpass 2>/dev/null || yum install -y sshpass 2>/dev/null || true
    fi

    info "通过 SSH 连接到 ${REMOTE_SSH_USER}@${REMOTE_SSH_HOST}:${REMOTE_SSH_PORT}"

    # 传输脚本
    export SSHPASS="${REMOTE_SSH_PASS}"
    sshpass -e scp -P "${REMOTE_SSH_PORT}" -o StrictHostKeyChecking=no \
      "$0" "${REMOTE_SSH_USER}@${REMOTE_SSH_HOST}:/tmp/install-campus-remote.sh"

    # 在远程执行脚本（作为副站部署）
    sshpass -e ssh -p "${REMOTE_SSH_PORT}" -o StrictHostKeyChecking=no \
      "${REMOTE_SSH_USER}@${REMOTE_SSH_HOST}" \
      "bash /tmp/install-campus-remote.sh --mode=sub --domain=${SUB_DOMAIN} --server-ip=${REMOTE_IP} --admin-email=${ADMIN_EMAIL} --nextauth-secret=${NEXTAUTH_SECRET} 2>&1" | while IFS= read -r line; do echo "  [远程] ${line}"; done
  else
    # 使用 SSH 密钥
    info "使用 SSH 密钥连接..."
    scp -P "${REMOTE_SSH_PORT}" -o StrictHostKeyChecking=no \
      "$0" "${REMOTE_SSH_USER}@${REMOTE_SSH_HOST}:/tmp/install-campus-remote.sh"

    ssh -p "${REMOTE_SSH_PORT}" -o StrictHostKeyChecking=no \
      "${REMOTE_SSH_USER}@${REMOTE_SSH_HOST}" \
      "bash /tmp/install-campus-remote.sh --mode=sub --domain=${SUB_DOMAIN} --server-ip=${REMOTE_IP} --admin-email=${ADMIN_EMAIL} --nextauth-secret=${NEXTAUTH_SECRET} 2>&1" | while IFS= read -r line; do echo "  [远程] ${line}"; done
  fi

  info "✅ 远程部署完成"
}

# ──────────────────────────────────────────────
# 10. 输出部署信息
# ──────────────────────────────────────────────
print_summary() {
  step "🎉 部署完成！部署信息如下"

  echo ""
  echo -e "${CYAN}════════════════════════════════════════════════════${NC}"
  echo -e "  ${GREEN}🏠 东白湖之家校园论坛社区${NC}"
  echo -e "  ${GREEN}版本: ${VERSION}${NC}"
  echo -e "${CYAN}════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  📂 ${BLUE}项目路径:${NC}   ${PROJECT_DIR}"
  echo -e "  🖥 ${BLUE}服务器 IP:${NC}   ${SERVER_IP}"
  if [ -n "${SUB_DOMAIN}" ]; then
    echo -e "  🌐 ${BLUE}副站域名:${NC}   https://${SUB_DOMAIN}"
    if ${SUB_ON_REMOTE}; then
      echo -e "  🖥 ${BLUE}副站 IP:${NC}     ${REMOTE_IP} (${REMOTE_SSH_USER}@${REMOTE_SSH_HOST}:${REMOTE_SSH_PORT})"
    fi
  fi
  echo -e "  🔌 ${BLUE}Node 端口:${NC}   ${NODE_PORT}"
  echo -e "  📡 ${BLUE}服务名称:${NC}    ${SERVICE_NAME}.service"
  echo -e "  📁 ${BLUE}项目路径:${NC}    ${PROJECT_DIR}"
  echo ""
  echo -e "  ${YELLOW}━━━ NPM 反代配置表 ━━━${NC}"
  echo -e "  ${BLUE}主站:${NC} https://${MAIN_DOMAIN} → http://Docker网关:${NODE_PORT}"
  if [ -n "${SUB_DOMAIN}" ]; then
    local sub_ip_display="${SERVER_IP}"
    ${SUB_ON_REMOTE} && sub_ip_display="${REMOTE_IP}"
    echo -e "  ${BLUE}副站:${NC} https://${SUB_DOMAIN} → http://${sub_ip_display}:${SUB_PORT:-5001}"
  fi
  if [ -n "${CF_EMAIL}" ]; then
    echo -e "  📋 ${BLUE}DNS:${NC}         ✅ Cloudflare 自动配置"
    echo -e "  🔒 ${BLUE}SSL:${NC}         ✅ Let's Encrypt (DNS-01 Cloudflare)"
  fi
  echo ""
  echo -e "  ${YELLOW}━━━ 管理员登录 ━━━${NC}"
  echo -e "  📧 ${BLUE}邮箱:${NC}        admin@dongbaihu.com"
  echo -e "  🔑 ${BLUE}密码:${NC}        admin123"
  echo ""
  echo -e "  ${YELLOW}━━━ 数据库 ━━━${NC}"
  echo -e "  📁 ${BLUE}数据库:${NC}     SQLite (${PROJECT_DIR}/prisma/dev.db)"
  echo ""
  echo -e "  ${YELLOW}━━━ 常用管理命令 ━━━${NC}"
  echo -e "  📊 ${BLUE}查看服务状态:${NC}  systemctl status ${SERVICE_NAME}"
  echo -e "  🔄 ${BLUE}重启服务:${NC}      systemctl restart ${SERVICE_NAME}"
  echo -e "  📜 ${BLUE}查看日志:${NC}      journalctl -u ${SERVICE_NAME} -n 50 -f"
  echo -e "  🏗 ${BLUE}重新构建:${NC}      cd ${PROJECT_DIR} && npm run build && systemctl restart ${SERVICE_NAME}"
  echo ""
  echo -e "  ${YELLOW}━━━ 一键升级 ━━━${NC}"
  echo -e "  bash ${PROJECT_DIR}/update.sh"
  echo ""
  echo -e "${CYAN}════════════════════════════════════════════════════${NC}"
  echo ""

  # 保存部署信息到文件
  cat > "${PROJECT_DIR}/deployment-info.txt" << EOF
═══════════════════════════════════════════
东白湖之家校园论坛社区 - 部署信息
═══════════════════════════════════════════

项目路径: ${PROJECT_DIR}
主站域名: https://${MAIN_DOMAIN}
$( [ -n "${SUB_DOMAIN}" ] && echo "副站域名: https://${SUB_DOMAIN}" )
服务器 IP: ${SERVER_IP}
Node 端口: ${NODE_PORT}
服务名称: ${SERVICE_NAME}.service

管理员登录:
  邮箱: admin@dongbaihu.com
  密码: admin123

数据库: ${PROJECT_DIR}/prisma/dev.db

管理命令:
  查看状态:  systemctl status ${SERVICE_NAME}
  重启服务:  systemctl restart ${SERVICE_NAME}
  查看日志:  journalctl -u ${SERVICE_NAME} -n 50 -f
  重新构建:  cd ${PROJECT_DIR} && npm run build && systemctl restart ${SERVICE_NAME}
EOF

  info "📄 部署信息已保存到: ${PROJECT_DIR}/deployment-info.txt"
}

# ──────────────────────────────────────────────
# 11. 检查 NPM 子命令模式
# ──────────────────────────────────────────────
setup_sub_mode() {
  # 解析命令行参数（远程部署子站时使用）
  for arg in "$@"; do
    case "${arg}" in
      --mode=sub) SUB_MODE=true ;;
      --domain=*) SUB_DOMAIN="${arg#*=}" ;;
      --server-ip=*) SERVER_IP="${arg#*=}" ;;
      --admin-email=*) ADMIN_EMAIL="${arg#*=}" ;;
      --nextauth-secret=*) NEXTAUTH_SECRET="${arg#*=}" ;;
    esac
  done

  if [ "${SUB_MODE:-false}" = true ]; then
    PROJECT_DIR="/opt/dbhzj-campus-community-sub"
    SERVICE_NAME="campus-life-sub"
    NODE_PORT=3001
    deploy_main_site
    echo "SUB_DEPLOY_DONE"
    exit 0
  fi
}

# ──────────────────────────────────────────────
# 主流程
# ──────────────────────────────────────────────
main() {
  echo ""
  echo -e "${CYAN}════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  🏠 东白湖之家校园论坛社区 - 一键部署脚本${NC}"
  echo -e "${GREEN}  版本: ${VERSION}${NC}"
  echo -e "${GREEN}  仓库: https://github.com/rojocai/dbhzj-campus-community${NC}"
  echo -e "${CYAN}════════════════════════════════════════════════════${NC}"
  echo ""

  # 子模式检查
  setup_sub_mode "$@"

  # 检查 root
  if [ "$(id -u)" -ne 0 ]; then
    error "请以 root 用户运行此脚本 (sudo bash install-campus.sh)"
    exit 1
  fi

  detect_os
  install_deps
  install_nodejs
  check_docker
  get_user_input
  configure_dns
  deploy_main_site
  configure_npm
  deploy_sub_remote
  print_summary

  info "🎉 部署完成！"
  info "访问 https://${MAIN_DOMAIN} 查看你的东白湖之家校园论坛社区"
}

main "$@"
