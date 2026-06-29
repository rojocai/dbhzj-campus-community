#!/bin/bash
# ============================================
# 校园社区 - 双向数据同步脚本
# 主站 ←→ 备份站，数据完全一致
# 使用 sqlite3 .backup 确保一致性快照
# ============================================
set -e

BACKUP_DIR="/root/backup-site"
LOG_FILE="/var/log/campus-sync.log"
SSH_CMD="ssh -p 28022 -i ~/.ssh/id_ed25519_new"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== 开始双向同步 =========="

# 1. 创建一致快照（不停服，.backup 保证一致性）
log "创建主站 DB 快照..."
$SSH_CMD root@157.254.234.92 \
    "sqlite3 /root/campus-community/prisma/dev.db '.backup /tmp/dev.db.snapshot'" \
    >> "$LOG_FILE" 2>&1

log "创建备份站 DB 快照..."
sqlite3 "$BACKUP_DIR/prisma/dev.db" '.backup /tmp/dev.db.backup-snapshot' \
    >> "$LOG_FILE" 2>&1

# ===== 2. 传输主站快照到本机 =====
log "[主→备] 传输 DB 快照..."
rsync -avz -e "$SSH_CMD" \
    root@157.254.234.92:/tmp/dev.db.snapshot \
    /tmp/dev.db.primary-snapshot >> "$LOG_FILE" 2>&1

# ===== 3. 比较时间戳，选最新的 =====
PRI_MTIME=$(stat -c %Y /tmp/dev.db.primary-snapshot 2>/dev/null || echo 0)
BAK_MTIME=$(stat -c %Y /tmp/dev.db.backup-snapshot 2>/dev/null || echo 0)

if [ "$PRI_MTIME" -ge "$BAK_MTIME" ]; then
    log "→ 主站数据较新，以此为基准同步"
    WINNER="/tmp/dev.db.primary-snapshot"
else
    log "→ 备份站数据较新，以此为基准同步"
    WINNER="/tmp/dev.db.backup-snapshot"
fi

# ===== 4. 用选中的版本更新两台服务器 =====

# 4a. 更新备份站
log "更新备份站..."
pm2 stop campus-community >> "$LOG_FILE" 2>&1
cp "$WINNER" "$BACKUP_DIR/prisma/dev.db"
pm2 restart campus-community >> "$LOG_FILE" 2>&1

# 4b. 传输选中版本到主站并更新
log "更新主站..."
rsync -avz -e "$SSH_CMD" \
    "$WINNER" \
    root@157.254.234.92:/tmp/dev.db.final >> "$LOG_FILE" 2>&1

$SSH_CMD root@157.254.234.92 \
    "systemctl stop campus-life && \
     cp /tmp/dev.db.final /root/campus-community/prisma/dev.db && \
     systemctl restart campus-life" >> "$LOG_FILE" 2>&1

# ===== 5. 上传文件双向同步 =====
log "[主→备] 同步上传文件..."
rsync -avz --update --delete -e "$SSH_CMD" \
    root@157.254.234.92:/root/campus-community/public/uploads/ \
    "$BACKUP_DIR/public/uploads/" >> "$LOG_FILE" 2>&1

log "[备→主] 同步上传文件..."
rsync -avz --update --delete -e "$SSH_CMD" \
    "$BACKUP_DIR/public/uploads/" \
    root@157.254.234.92:/root/campus-community/public/uploads/ >> "$LOG_FILE" 2>&1

# ===== 清理临时文件 =====
rm -f /tmp/dev.db.snapshot /tmp/dev.db.primary-snapshot /tmp/dev.db.backup-snapshot /tmp/dev.db.final
$SSH_CMD root@157.254.234.92 "rm -f /tmp/dev.db.snapshot /tmp/dev.db.backup-snapshot /tmp/dev.db.final" \
    >> "$LOG_FILE" 2>&1 || true

log "========== 双向同步完成 =========="
