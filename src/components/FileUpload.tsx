import React, { useState, useRef } from "react";
import { I } from "./icons";
import { Btn } from "./ui";

interface FileUploadProps {
  onUpload: (file: File, dataUrl: string) => void;
  accept?: string;
  maxSize?: number; // em MB
  label?: string;
  hint?: string;
  multiple?: boolean;
}

export function FileUpload({ onUpload, accept = "*", maxSize = 10, label = "Enviar arquivo", hint, multiple = false }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simula progresso de upload
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 10;
      });
    }, 100);

    const reader = new FileReader();
    reader.onload = (e) => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        onUpload(file, e.target?.result as string);
        setUploading(false);
        setProgress(0);
      }, 300);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
        dragging ? "border-cy-400 bg-cy-500/10" : "border-line hover:border-cy-600"
      }`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      
      {uploading ? (
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-cy-500 border-t-transparent animate-spin" />
          <div className="text-[13px] text-fog">Enviando... {progress}%</div>
          <div className="w-full h-2 bg-abyss rounded-full overflow-hidden">
            <div className="h-full bg-cy-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <I n="upload" s={32} c="text-cy-500 mx-auto" />
          <div className="text-[14px] text-mist font-semibold">{label}</div>
          {hint && <div className="text-[11px] text-dim">{hint}</div>}
          <div className="text-[10px] text-dim mt-2">
            Arraste e solte ou clique para selecionar · Máx. {maxSize}MB
          </div>
        </div>
      )}
    </div>
  );
}

interface FileDownloadProps {
  fileName: string;
  fileData: string;
  label?: string;
  icon?: string;
}

export function FileDownload({ fileName, fileData, label, icon = "download" }: FileDownloadProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Btn v="g" sm onClick={handleDownload}>
      <I n={icon} s={14} /> {label || fileName}
    </Btn>
  );
}

interface FilePreviewProps {
  fileData: string;
  fileName: string;
  fileType: string;
}

export function FilePreview({ fileData, fileName, fileType }: FilePreviewProps) {
  const isImage = fileType.startsWith("image/");
  const isVideo = fileType.startsWith("video/");
  const isPdf = fileType === "application/pdf";

  return (
    <div className="border border-line rounded-lg overflow-hidden">
      {isImage && (
        <img src={fileData} alt={fileName} className="w-full h-auto max-h-[400px] object-contain bg-abyss" />
      )}
      {isVideo && (
        <video src={fileData} controls className="w-full max-h-[400px] bg-black">
          Seu navegador não suporta vídeo.
        </video>
      )}
      {isPdf && (
        <div className="p-8 text-center bg-abyss">
          <I n="file" s={48} c="text-cy-500 mx-auto mb-3" />
          <div className="text-[14px] text-mist font-semibold">{fileName}</div>
          <div className="text-[11px] text-dim mt-1">PDF Document</div>
          <a href={fileData} download={fileName} className="cy-btn cy-btn-g px-4 py-2 text-[12px] mt-4 inline-flex">
            <I n="download" s={14} /> Baixar PDF
          </a>
        </div>
      )}
      {!isImage && !isVideo && !isPdf && (
        <div className="p-8 text-center bg-abyss">
          <I n="file" s={48} c="text-cy-500 mx-auto mb-3" />
          <div className="text-[14px] text-mist font-semibold">{fileName}</div>
          <div className="text-[11px] text-dim mt-1">{fileType}</div>
          <a href={fileData} download={fileName} className="cy-btn cy-btn-g px-4 py-2 text-[12px] mt-4 inline-flex">
            <I n="download" s={14} /> Baixar Arquivo
          </a>
        </div>
      )}
    </div>
  );
}
