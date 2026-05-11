import React, { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, FileText, Download } from 'lucide-react'

// Worker bundled with pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function PdfViewer({ pdfUrl, title = 'Document', downloadUrl }) {
  const [numPages,   setNumPages]   = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale,      setScale]      = useState(1.0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const onLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages)
    setLoading(false)
  }, [])

  const onLoadError = useCallback((err) => {
    setError(err.message)
    setLoading(false)
  }, [])

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 glass-card p-8 text-center">
      <FileText className="w-12 h-12 text-white/20 mb-3" />
      <p className="text-white/40 text-sm">Impossible d'afficher le PDF</p>
      <p className="text-white/20 text-xs mt-1 font-mono">{error}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 glass-card px-4 py-3">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-white/60 min-w-[90px] text-center">
            {loading ? '…' : `Page ${pageNumber} / ${numPages}`}
          </span>
          <button
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={!numPages || pageNumber >= numPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))}
            disabled={scale <= 0.5}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 disabled:opacity-30 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/40 w-12 text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(2.5, +(s + 0.2).toFixed(1)))}
            disabled={scale >= 2.5}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 disabled:opacity-30 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Download */}
        {downloadUrl && (
          <a
            href={`${downloadUrl}?download=1`}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-500/10"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger PDF
          </a>
        )}
      </div>

      {/* ── PDF Canvas ── */}
      <div className="glass-card overflow-auto flex justify-center p-4 min-h-[600px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-800/50 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-9 h-9 text-brand-400 animate-spin" />
              <p className="text-white/40 text-sm">Chargement du PDF…</p>
            </div>
          </div>
        )}
        <Document
          file={pdfUrl}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={null}
          options={{
            cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
            cMapPacked: true,
          }}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            loading={null}
            className="shadow-2xl"
          />
        </Document>
      </div>

      {/* ── Page quick-jump ── */}
      {numPages > 1 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {Array.from({ length: Math.min(numPages, 20) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPageNumber(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                p === pageNumber
                  ? 'bg-brand-gradient text-white shadow-brand'
                  : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              {p}
            </button>
          ))}
          {numPages > 20 && (
            <span className="text-white/30 text-xs self-center ml-1">
              +{numPages - 20} pages
            </span>
          )}
        </div>
      )}
    </div>
  )
}
