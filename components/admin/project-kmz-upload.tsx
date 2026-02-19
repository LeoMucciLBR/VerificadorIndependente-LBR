"use client";

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ProjectKmzUploadProps {
  projectId: string;
  currentKmzUrl?: string | null;
  onUploadComplete?: () => void;
}

export default function ProjectKmzUpload({
  projectId,
  currentKmzUrl,
  onUploadComplete
}: ProjectKmzUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [processResult, setProcessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
      setProcessResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('kmz', file);

      const response = await fetch(`/api/projects/${projectId}/kmz/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data);
      setFile(null);
      
      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/kmz/process`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setProcessResult(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-400" />
          Upload KMZ do Projeto
        </h3>

        {currentKmzUrl && !uploadResult && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              KMZ já carregado: <a href={currentKmzUrl} className="underline" download>Download</a>
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Selecione o arquivo KMZ completo do projeto
            </label>
            <input
              type="file"
              accept=".kmz,.kml"
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-emerald-500 file:text-white
                hover:file:bg-emerald-600
                cursor-pointer"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <FileText className="w-4 h-4" />
              <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fazendo upload...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Fazer Upload
              </>
            )}
          </button>
        </div>

        {uploadResult && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-400 font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Upload concluído com sucesso!
            </p>
            <div className="text-xs text-zinc-400 space-y-1">
              <p>Comprimento total: {uploadResult.project?.lengthKm?.toFixed(2)} km</p>
              <p>Arquivo: <a href={uploadResult.project?.kmzUrl} className="text-emerald-400 underline" download>Download</a></p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Processing Section */}
      {(currentKmzUrl || uploadResult) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Processar e Dividir Traçado
          </h3>

          <p className="text-sm text-zinc-400 mb-4">
            Clique no botão abaixo para dividir automaticamente o traçado completo em:
          </p>

          <ul className="text-sm text-zinc-400 mb-4 space-y-1 list-disc list-inside">
            <li>Traçados individuais por rodovia</li>
            <li>Traçados recortados por segmento homogêneo</li>
          </ul>

          <button
            onClick={handleProcess}
            disabled={processing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Processar e Dividir'
            )}
          </button>

          {processResult && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400 font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Processamento concluído!
              </p>
              <div className="text-xs text-zinc-400 space-y-1">
                <p>Rodovias processadas: {processResult.results?.rodovias?.length || 0}</p>
                <p>Segmentos processados: {processResult.results?.segmentos?.length || 0}</p>
              </div>

              {processResult.results?.rodovias && processResult.results.rodovias.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-zinc-300 mb-1">Rodovias:</p>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    {processResult.results.rodovias.map((r: any) => (
                      <li key={r.id}>
                        {r.nome} (KM {r.kmInicial} - {r.kmFinal})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
