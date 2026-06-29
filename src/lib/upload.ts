// 通用上传工具 — 支持进度、速度、并行上传

export interface UploadProgress {
  loaded: number    // 已上传字节数
  total: number     // 总字节数
  speed: string     // 当前速度 (KB/s or MB/s)
  percent: number   // 0-100
  fileName: string
}

export interface UploadResult {
  url: string
  fileName: string
  type: 'image' | 'video' | 'audio'
}

// 单文件上传（XHR 实现，支持进度回调）
function uploadFile(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    let startTime = Date.now()
    let lastLoaded = 0

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const elapsed = (Date.now() - startTime) / 1000 // seconds
        const loaded = e.loaded
        const deltaBytes = loaded - lastLoaded
        lastLoaded = loaded

        // 计算速度（滑动平均）
        let speed = ''
        const bytesPerSec = elapsed > 0 ? loaded / elapsed : 0
        if (bytesPerSec > 1024 * 1024) {
          speed = (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s'
        } else {
          speed = (bytesPerSec / 1024).toFixed(0) + ' KB/s'
        }

        onProgress({
          loaded,
          total: e.total,
          speed,
          percent: Math.round((e.loaded / e.total) * 100),
          fileName: file.name,
        })
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({
            url: data.url,
            fileName: data.filename || file.name,
            type: data.type || (file.type.startsWith('video/') ? 'video' : 'image'),
          })
        } catch {
          reject(new Error('解析上传响应失败'))
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error || '上传失败'))
        } catch {
          reject(new Error(`上传失败 (${xhr.status})`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('网络错误'))
    xhr.ontimeout = () => reject(new Error('上传超时'))
    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

// 批量并行上传（限制并发数）
export async function uploadFiles(
  files: FileList | File[],
  maxConcurrency = 3,
  onFileProgress?: (idx: number, p: UploadProgress) => void,
  onBatchProgress?: (done: number, total: number) => void,
): Promise<UploadResult[]> {
  const arr = Array.from(files)
  const results: UploadResult[] = []
  let completed = 0

  // 并发控制：每次运行最多 maxConcurrency 个
  const workers = Array.from({ length: Math.min(maxConcurrency, arr.length) }, async (_, workerIdx) => {
    let i = workerIdx
    while (i < arr.length) {
      const file = arr[i]
      const result = await uploadFile(file, (p) => onFileProgress?.(i, p))
      results[i] = result
      completed++
      onBatchProgress?.(completed, arr.length)
      i += maxConcurrency // 每个工人取第 N, N+concurrency, N+2*concurrency...
    }
  })

  await Promise.all(workers)
  return results.filter(Boolean)
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
