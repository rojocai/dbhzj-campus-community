#!/usr/bin/env bash
# =============================================================================
# 东白湖之家校园论坛社区 - 数据库每日重置脚本
# 每天凌晨 00:00 自动将数据库重置为初始状态
# =============================================================================
set -euo pipefail

PROJECT_DIR="/opt/dbhzj-campus-community"
DB_PATH="${PROJECT_DIR}/prisma/dev.db"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 开始重置数据库..."

# 1. 检查项目目录
if [ ! -d "${PROJECT_DIR}" ]; then
  echo "[ERROR] 项目目录不存在: ${PROJECT_DIR}"
  exit 1
fi

cd "${PROJECT_DIR}"

# 2. 停止服务
echo "  ⏹ 停止服务..."
systemctl stop campus-life.service 2>/dev/null || true
sleep 2

# 3. 删除旧数据库
if [ -f "${DB_PATH}" ]; then
  echo "  🗑 删除旧数据库..."
  rm -f "${DB_PATH}" "${DB_PATH}-journal" "${DB_PATH}-wal" "${DB_PATH}-shm"
fi

# 4. 重建数据库
echo "  🏗 重建数据库..."
npx prisma db push --skip-generate 2>&1 | tail -2

# 5. 重新写入种子数据
echo "  🌱 写入种子数据..."
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts 2>&1 | tail -5 || true

# 6. 清理上传文件（可选 — 重置每日测试数据）
echo "  🧹 清理上传文件..."
rm -rf public/uploads/*
mkdir -p public/uploads

# 7. 重启服务
echo "  ▶️ 重启服务..."
systemctl daemon-reload
systemctl restart campus-life.service
sleep 3

# 8. 验证
if systemctl is-active --quiet campus-life.service; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 数据库重置完成，服务正常运行"
else
  echo "[ERROR] 服务启动失败，检查日志: journalctl -u campus-life -n 30"
  exit 1
fi
