import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { FileText, Trash2, Upload, X, Check, Layers } from 'lucide-react'
import { documentsAPI, spacesAPI } from '@/lib/api'
import { cn, formatBytes, formatDate } from '@/lib/utils'
import type { Document, Space } from '@/types/api'

export function Documents() {
  const [selectedSpace, setSelectedSpace] = useState<number | null>(null)
  const [uploadSpaces, setUploadSpaces] = useState<number[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const queryClient = useQueryClient()

  const { data: spaces } = useQuery({
    queryKey: ['spaces'],
    queryFn: spacesAPI.list,
  })

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', selectedSpace],
    queryFn: () => documentsAPI.list(selectedSpace ?? undefined),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => documentsAPI.upload(file, uploadSpaces),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: documentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadingFiles(acceptedFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
  })

  const handleUpload = async () => {
    if (uploadSpaces.length === 0) return
    for (const file of uploadingFiles) {
      await uploadMutation.mutateAsync(file)
    }
    setUploadingFiles([])
    setUploadSpaces([])
  }

  const toggleUploadSpace = (id: number) => {
    setUploadSpaces((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-8">
      <header className="animate-in">
        <h1 className="font-display text-4xl italic text-slate-100 mb-2">Documents</h1>
        <p className="text-slate-400">Upload and manage your knowledge base files</p>
      </header>

      <div
        {...getRootProps()}
        className={cn(
          'glass-panel rounded-2xl p-8 border-2 border-dashed transition-all cursor-pointer animate-in stagger-1',
          isDragActive
            ? 'border-amber-500 bg-amber-500/5'
            : 'border-slate-700 hover:border-slate-600'
        )}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload
            size={40}
            className={cn(
              'mx-auto mb-4 transition-colors',
              isDragActive ? 'text-amber-400' : 'text-slate-500'
            )}
          />
          <p className="text-slate-300 mb-2">
            {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}
          </p>
          <p className="text-sm text-slate-500">Supports PDF, DOCX, TXT, MD</p>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 animate-in">
          <h3 className="font-medium text-slate-100 mb-4">Ready to Upload</h3>

          <div className="space-y-3 mb-6">
            {uploadingFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-200">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-3">Select Spaces</label>
            <div className="flex flex-wrap gap-2">
              {spaces?.spaces.map((space: Space) => (
                <button
                  key={space.id}
                  onClick={() => toggleUploadSpace(space.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    uploadSpaces.includes(space.id)
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                  )}
                >
                  {uploadSpaces.includes(space.id) && <Check size={14} />}
                  {space.name}
                </button>
              ))}
            </div>
            {spaces?.spaces.length === 0 && (
              <p className="text-sm text-slate-500">No spaces available. Create one first.</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploadSpaces.length === 0 || uploadMutation.isPending}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Files'}
            </button>
            <button
              onClick={() => {
                setUploadingFiles([])
                setUploadSpaces([])
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 animate-in stagger-2">
        <span className="text-sm text-slate-500">Filter by space:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSpace(null)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-all',
              selectedSpace === null
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            )}
          >
            All
          </button>
          {spaces?.spaces.map((space: Space) => (
            <button
              key={space.id}
              onClick={() => setSelectedSpace(space.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-all',
                selectedSpace === space.id
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              )}
            >
              {space.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : documents?.documents.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center animate-in stagger-3">
          <FileText size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No documents yet</h3>
          <p className="text-slate-500">Upload files to build your knowledge base</p>
        </div>
      ) : (
        <div className="space-y-3 animate-in stagger-3">
          {documents?.documents.map((doc: Document) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onDelete={() => deleteMutation.mutate(doc.id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentRow({
  document,
  onDelete,
  isDeleting,
}: {
  document: Document
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-center justify-between hover-lift">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400">
          <FileText size={20} />
        </div>
        <div>
          <p className="text-slate-200 font-medium">{document.filename}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{formatBytes(document.file_size)}</span>
            <span>•</span>
            <span>{document.chunk_count} chunks</span>
            <span>•</span>
            <span>{formatDate(document.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {document.spaces.map((space) => (
            <span
              key={space.id}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400"
            >
              <Layers size={12} />
              {space.name}
            </span>
          ))}
        </div>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
