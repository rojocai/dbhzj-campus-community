'use client'
import { useRef, useState, useCallback } from 'react'
import { uploadFiles, UploadProgress, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '@/lib/upload'

interface UploadZoneProps {
  accept: 'image/*' | 'video/*'
  maxSizeMB: number
  label: string
  hint: string
  fileList: string[]
  onAdd: (urls: string[]) => void
  onRemove: (index: number) => void
}

interface FileProgress {
  uploading: boolean
  fileName: string
  percent: number
  speed: string
}

export default function UploadZone({
  accept,
  maxSizeMB,
  label,
  hint,
  fileList,
  onAdd,
  onRemove,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progresses, setProgresses] = useState<Record<number, FileProgress>>({})
  const [batchDone, setBatchDone] = useState(0)
  const [batchTotal, setBatchTotal] = useState(0)
  const [error, setError] = useState('')
  const isVideo = accept === 'video/*'

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return
    setError('')

    const arr = Array.from(files)
    const maxBytes = maxSizeMB * 1024 * 1024

    // Filter valid files
    const valid: File[] = []
    for (const f of arr) {
      const ok = isVideo
        ? ALLOWED_VIDEO_TYPES.includes(f.type)
        : ALLOWED_IMAGE_TYPES.includes(f.type)
      if (!ok) {
        setError(`不支持的文件格式: ${f.name}`)
        continue
      }
      if (f.size > maxBytes) {
        setError(`${f.name} 超过 ${maxSizeMB}MB 限制`)
        continue
      }
      valid.push(f)
    }
    if (!valid.length) return

    setBatchTotal(valid.length)
    setBatchDone(0)

    // Init progress
    const init: Record<number, FileProgress> = {}
    valid.forEach((f, i) => {
      init[i] = { uploading: true, fileName: f.name, percent: 0, speed: '' }
    })
    setProgresses(init)

    try {
      const results = await uploadFiles(
        valid,
        3,
        (idx, p) => {
          setProgresses(prev => ({
            ...prev,
            [idx]: { uploading: true, fileName: p.fileName, percent: p.percent, speed: p.speed },
          }))
        },
        (done, total) => setBatchDone(done),
      )

      const urls = results.map(r => r.url).filter(Boolean)
      if (urls.length) onAdd(urls)
    } catch (e: any) {
      setError(e.message || '上传失败')
    }

    // Clear progress after a moment
    setTimeout(() => {
      setProgresses({})
      setBatchDone(0)
      setBatchTotal(0)
    }, 2000)

    // Reset input
    if (inputRef.current) inputRef.current.value = ''
  }, [isVideo, maxSizeMB, onAdd])

  const totalFiles = Object.keys(progresses).length
  const allDone = totalFiles > 0 && batchDone >= batchTotal && batchTotal > 0

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{hint}</p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50') }}
        onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50') }}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50') }}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-gray-50 transition-all border-gray-200"
      >
        <p className="text-sm text-gray-500 mb-1">{isVideo ? '🎥' : '🖼️'} 点击或拖拽选择文件</p>
        <p className="text-xs text-gray-400">可多选</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {/* Batch progress */}
      {totalFiles > 0 && (
        <div className="mt-3 space-y-2">
          {/* Overall bar */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>上传进度</span>
            <span className="font-medium">{batchDone}/{batchTotal}</span>
            {allDone && <span className="text-green-600">✅ 完成</span>}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${allDone ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${batchTotal > 0 ? (batchDone / batchTotal) * 100 : 0}%` }}
            />
          </div>

          {/* Per-file progress */}
          {Object.entries(progresses).map(([idx, p]) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="truncate text-gray-600 max-w-[200px]">{p.fileName}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {p.speed && <span className="text-gray-400">{p.speed}</span>}
                  <span className="font-medium text-indigo-600">{p.percent}%</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${p.percent >= 100 ? 'bg-green-400' : 'bg-indigo-400'}`}
                  style={{ width: `${p.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {fileList.length > 0 && (
        <div className={`mt-3 ${isVideo ? 'space-y-2' : 'grid grid-cols-4 gap-3'}`}>
          {fileList.map((url, i) => (
            <div key={i} className={isVideo ? 'flex items-center justify-between bg-gray-50 rounded-lg p-3' : 'relative group'}>
              {isVideo ? (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <span>🎬</span>
                    <span className="text-sm text-gray-600 truncate">{url.split('/').pop()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="shrink-0 ml-2 text-xs text-red-500 hover:text-red-700"
                  >
                    删除
                  </button>
                </>
              ) : (
                <>
                  <img src={url} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
