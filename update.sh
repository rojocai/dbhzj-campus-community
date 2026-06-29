#!/usr/bin/env bash
# =============================================================================
# 东白湖之家校园论坛社区 - 一键升级脚本
# 版本: v1.0.0
# 仓库: https://github.com/rojocai/dbhzj-campus-community
# =============================================================================
set -euo pipefail

# ── 颜色 ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }
step()  { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

# ── 配置 ──
PROJECT_NAME="dbhzj-campus-community"
GITHUB_REPO="https://github.com/rojocai/${PROJECT_NAME}.git"
GITHUB_BRANCH="main"
SERVICE_NAME="campus-life"
BACKUP_DIR="/opt/${PROJECT_NAME}-backup"

# 自动检测项目目录
if [ -f "/opt/${PROJECT_NAME}/package.json" ]; then
  PROJECT_DIR="/opt/${PROJECT_NAME}"
elif [ -f "/root/${PROJECT_NAME}/package.json" ]; then
  PROJECT_DIR="/root/${PROJECT_NAME}"
elif [ -f "./package.json" ]; then
  PROJECT_DIR="$(pwd)"
else
  step "未找到项目目录，请选择:"
  echo "  1) /opt/${PROJECT_NAME}"
  echo "  2) 手动输入路径"
  echo "  3) 退出"
  read -rp "请选择 [1]: " choice
  case "${choice:-1}" in
    1) PROJECT_DIR="/opt/${PROJECT_NAME}" ;;
    2) read -rp "输入项目路径: " PROJECT_DIR ;;
    *) exit 0 ;;
  esac
fi

step "东白湖之家 - 升级脚本"
echo ""
echo "  项目路径: ${PROJECT_DIR}"
echo "  服务名称: ${SERVICE_NAME}.service"
echo "  仓库: ${GITHUB_REPO}"
echo "  分支: ${GITHUB_BRANCH}"
echo ""

# 检查目录是否存在
if [ ! -d "${PROJECT_DIR}" ]; then
  error "项目目录不存在: ${PROJECT_DIR}"
  exit 1
fi

# 检查是否为 git 仓库
if [ ! -d "${PROJECT_DIR}/.git" ]; then
  warn "不是 git 仓库，将重新克隆..."
  read -rp "是否继续？(y/n) [y]: " confirm
  [[ "${confirm:-y}" =~ ^[Yy] ]] || exit 0
fi

# 备份
step "备份当前数据"
BACKUP_PATH="${BACKUP_DIR}-$(date +%Y%m%d%H%M%S)"
mkdir -p "${BACKUP_PATH}"

# 备份关键文件
cp -r "${PROJECT_DIR}/.env" "${BACKUP_PATH}/.env" 2>/dev/null || true
cp -r "${PROJECT_DIR}/prisma/dev.db" "${BACKUP_PATH}/dev.db" 2>/dev/null || true
cp -r "${PROJECT_DIR}/public/uploads" "${BACKUP_PATH}/uploads" 2>/dev/null || true
cp -r "${PROJECT_DIR}/node_modules" "${BACKUP_PATH}/node_modules" 2>/dev/null || true

info "✅ 备份完成: ${BACKUP_PATH}"
info "   包含: .env, 数据库, 上传文件, node_modules"

# 停止服务
step "停止服务"
if systemctl is-active --quiet "${SERVICE_NAME}.service" 2>/dev/null; then
  systemctl stop "${SERVICE_NAME}.service"
  info "✅ 服务已停止"
else
  warn "服务未运行"
fi

# 更新源码
step "更新源码"
cd "${PROJECT_DIR}"

if [ -d ".git" ]; then
  # git pull
  git stash 2>/dev/null || true
  git fetch origin "${GITHUB_BRANCH}"
  git reset --hard "origin/${GITHUB_BRANCH}"
  info "✅ 源码已更新 (git pull)"
else
  # 重新克隆
  cd /tmp
  rm -rf "${PROJECT_NAME}-temp"
  git clone --depth 1 -b "${GITHUB_BRANCH}" "${GITHUB_REPO}" "${PROJECT_NAME}-temp"
  
  # 保留关键文件
  cp "${BACKUP_PATH}/.env" "${PROJECT_DIR}/.env" 2>/dev/null || true
  cp "${BACKUP_PATH}/dev.db" "${PROJECT_DIR}/prisma/dev.db" 2>/dev/null || true
  
  # 替换源码（保留 node_modules）
  mv "${PROJECT_DIR}/node_modules" /tmp/dbhzj-node-modules 2>/dev/null || true
  rm -rf "${PROJECT_DIR}"/*
  cp -r /tmp/${PROJECT_NAME}-temp/* "${PROJECT_DIR}/"
  mv /tmp/dbhzj-node-modules "${PROJECT_DIR}/node_modules" 2>/dev/null || true
  rm -rf /tmp/${PROJECT_NAME}-temp
  info "✅ 源码已更新 (重新克隆)"
fi

# 安装依赖
step "安装 npm 依赖"
cd "${PROJECT_DIR}"
npm install --no-fund --no-audit 2>&1 | tail -3
info "✅ npm 依赖安装完成"

# 数据库迁移
step "更新数据库"
npx prisma generate 2>&1 | tail -2
npx prisma db push --skip-generate 2>&1 | tail -2
info "✅ 数据库已更新"

# 构建
step "构建项目"
npm run build 2>&1 | tail -5
info "✅ 构建完成"

# 启动服务
step "启动服务"
systemctl daemon-reload 2>/dev/null || true
systemctl restart "${SERVICE_NAME}.service" 2>/dev/null || true

sleep 3
if systemctl is-active --quiet "${SERVICE_NAME}.service" 2>/dev/null; then
  info "✅ 服务已启动并运行中"
else
  warn "⚠️ 服务启动可能异常，请检查日志: journalctl -u ${SERVICE_NAME} -n 30"
fi

# 完成
step "🎉 升级完成！"
echo ""
echo -e "  📂 ${BLUE}项目路径:${NC}   ${PROJECT_DIR}"
echo -e "  📦 ${BLUE}备份路径:${NC}   ${BACKUP_PATH}"
echo -e "  📜 ${BLUE}查看日志:${NC}   journalctl -u ${SERVICE_NAME} -n 50 -f"
echo ""
info "如果升级后出现问题，可以回滚备份:"
echo "  systemctl stop ${SERVICE_NAME}"
echo "  cp ${BACKUP_PATH}/dev.db ${PROJECT_DIR}/prisma/dev.db"
echo "  # 还原旧代码: git checkout <旧版本标签>"
echo "  npm run build && systemctl restart ${SERVICE_NAME}"
echo ""
