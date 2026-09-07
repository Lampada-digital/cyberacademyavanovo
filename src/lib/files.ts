import { insert, where, find, update, remove, uid, now, audit, notify, type Row } from "./db";

/* ================= FILE STORAGE ================= */
const FILE_KEY = "cyberacademy_files";

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 data URL
  uploadedBy: string;
  uploadedAt: string;
  context: string; // "lesson", "material", "project", "submission", etc.
  contextId: string; // ID do contexto (lessonId, projectId, etc.)
}

// Salvar arquivo no storage
export function saveFile(
  file: File,
  dataUrl: string,
  uploadedBy: string,
  context: string,
  contextId: string
): StoredFile {
  const storedFile: StoredFile = {
    id: uid(),
    name: file.name,
    type: file.type,
    size: file.size,
    data: dataUrl,
    uploadedBy,
    uploadedAt: now(),
    context,
    contextId,
  };

  // Salvar no localStorage
  const files = getFiles();
  files.push(storedFile);
  localStorage.setItem(FILE_KEY, JSON.stringify(files));

  // Registrar no banco
  insert("files", {
    id: storedFile.id,
    name: storedFile.name,
    type: storedFile.type,
    size: storedFile.size,
    uploadedBy: storedFile.uploadedBy,
    uploadedAt: storedFile.uploadedAt,
    context: storedFile.context,
    contextId: storedFile.contextId,
  });

  audit({ id: uploadedBy } as Row, "FILE_UPLOAD", "files", storedFile.id, `Arquivo enviado: ${storedFile.name}`);

  return storedFile;
}

// Recuperar arquivo por ID
export function getFile(fileId: string): StoredFile | undefined {
  const files = getFiles();
  return files.find((f) => f.id === fileId);
}

// Listar arquivos por contexto
export function getFilesByContext(context: string, contextId: string): StoredFile[] {
  const files = getFiles();
  return files.filter((f) => f.context === context && f.contextId === contextId);
}

// Listar arquivos por usuário
export function getFilesByUser(userId: string): StoredFile[] {
  const files = getFiles();
  return files.filter((f) => f.uploadedBy === userId);
}

// Deletar arquivo
export function deleteFile(fileId: string, userId: string): boolean {
  const files = getFiles();
  const index = files.findIndex((f) => f.id === fileId);
  
  if (index === -1) return false;
  
  const file = files[index];
  
  // Verificar permissão (apenas quem enviou ou admin pode deletar)
  if (file.uploadedBy !== userId) {
    const user = find("users", userId);
    if (!user || user.role !== "admin") {
      return false;
    }
  }
  
  files.splice(index, 1);
  localStorage.setItem(FILE_KEY, JSON.stringify(files));
  
  remove("files", fileId);
  audit({ id: userId } as Row, "FILE_DELETE", "files", fileId, `Arquivo deletado: ${file.name}`);
  
  return true;
}

// Helper para pegar todos os arquivos do localStorage
function getFiles(): StoredFile[] {
  try {
    const data = localStorage.getItem(FILE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Converter File para base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Download de arquivo
export function downloadFile(file: StoredFile) {
  const link = document.createElement("a");
  link.href = file.data;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Formatar tamanho de arquivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

// Validar tipo de arquivo
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  if (allowedTypes.length === 0) return true;
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const baseType = type.replace("/*", "");
      return file.type.startsWith(baseType);
    }
    return file.type === type;
  });
}

// Validar tamanho de arquivo
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}
