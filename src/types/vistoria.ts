export type StatusAvaliacao =
  | "nao_avaliado"
  | "conforme"
  | "ressalva"
  | "nao_possui";

export type Criticidade =
  | "critica"
  | "alta"
  | "media"
  | "baixa";

/**
 * Tipos de evidência que podem ser anexados
 * durante a vistoria.
 */
export type TipoEvidencia =
  | "foto"
  | "arquivo"
  | "audio";

/**
 * Evidência individual vinculada a uma resposta.
 */
export interface Evidencia {
  id: string;

  tipo: TipoEvidencia;

  /**
   * URL pública ou caminho do arquivo no Supabase Storage.
   */
  url: string;

  /**
   * Nome original do arquivo.
   */
  nome?: string;

  /**
   * MIME type.
   * Ex:
   * image/jpeg
   * audio/webm
   * application/pdf
   */
  mimeType?: string;

  /**
   * Tamanho do arquivo em bytes.
   */
  tamanho?: number;

  /**
   * Duração do áudio em segundos.
   */
  duracao?: number;

  /**
   * Data/hora em que a evidência foi registrada.
   */
  timestamp: string;
}

/**
 * Dados relacionados à transcrição de áudio.
 */
export interface TranscricaoAudio {
  /**
   * Texto produzido pela engine de transcrição.
   */
  texto: string;

  /**
   * Status da transcrição.
   */
  status:
    | "pendente"
    | "processando"
    | "concluida"
    | "erro";

  /**
   * Identificador da evidência de áudio.
   */
  evidenciaId?: string;

  /**
   * Mensagem de erro, caso exista.
   */
  erro?: string;

  /**
   * Data/hora da transcrição.
   */
  timestamp?: string;
}

export interface Vistoriador {
  id: number;
  nome: string;
  funcao: string;
}

export interface Requisito {
  id: string;
  codigo: string;
  pergunta: string;
  categoria: string;
  criticidade: Criticidade;
  referencias: string[];
}

export interface Resposta {
  requisitoId: string;

  status: StatusAvaliacao;

  /**
   * Observação digitada manualmente.
   */
  observacao?: string;

  /**
   * Texto produzido pela transcrição de áudio.
   */
  transcricao?: TranscricaoAudio;

  /**
   * Evidências anexadas ao requisito.
   */
  evidencias?: Evidencia[];

  /**
   * Mantemos fotos para compatibilidade
   * com a estrutura atual do sistema.
   */
  fotos?: string[];

  /**
   * Mantemos áudio separado para compatibilidade
   * durante a migração da estrutura antiga.
   */
  audioUrl?: string;

  timestamp: string;
}

export interface VistoriaState {
  local: string;

  vistoriador: Vistoriador | null;

  respostas: Record<string, Resposta>;
}