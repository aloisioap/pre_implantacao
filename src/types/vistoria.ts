// src/types/vistoria.ts

export type StatusAvaliacao =
  | "nao_avaliado"
  | "conforme"
  | "parcial"
  | "nao_conforme"
  | "nao_possui"
  | "na";

export type Criticidade =
  | "critica"
  | "alta"
  | "media"
  | "baixa";

export type TipoEvidencia =
  | "foto"
  | "audio";

export interface Vistoriador {
  id: number;
  nome: string;
  funcao: string;
  ativo?: boolean;
}

export interface Hospital {
  id: string;
  codigo?: string;
  nome: string;
  sigla?: string;
  cidade?: string;
  estado?: string;
  ativo?: boolean;
}

export interface EscopoVistoria {
  id: string;
  hospitalId: string;
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export interface Requisito {
  id: string;
  codigo: string;
  pergunta: string;

  /**
   * Categoria técnica.
   * Ex:
   * - Instalações Elétricas
   * - Gases Medicinais
   * - Hidrossanitária
   * - Climatização
   */
  categoria: string;

  /**
   * Setor físico onde o requisito será verificado.
   */
  setor?: string;

  criticidade: Criticidade;

  /**
   * Normas e referências técnicas.
   */
  referencias: string[];

  /**
   * Identifica a qual escopo este requisito pertence.
   */
  escopoId?: string;

  /**
   * Permite controlar se o item é obrigatório.
   */
  obrigatorio?: boolean;

  /**
   * Ordem de apresentação no checklist.
   */
  ordem?: number;
}

export interface Evidencia {
  id?: string;

  /**
   * Tipo da evidência.
   */
  tipo: TipoEvidencia;

  /**
   * URL do arquivo no Supabase Storage.
   */
  url: string;

  /**
   * Nome original do arquivo.
   */
  nomeArquivo?: string;

  /**
   * Tipo MIME.
   */
  mimeType?: string;

  /**
   * Tamanho em bytes.
   */
  tamanho?: number;

  /**
   * Texto transcrito de um áudio.
   */
  transcricao?: string;

  /**
   * Data/hora em que a evidência foi registrada.
   */
  timestamp: string;
}

export interface Resposta {
  requisitoId: string;

  status: StatusAvaliacao;

  observacao?: string;

  /**
   * Evidências associadas ao requisito.
   */
  evidencias?: Evidencia[];

  timestamp: string;
}

export interface VistoriaState {
  id?: string;

  hospitalId?: string;

  hospital?: Hospital | null;

  escopoId?: string;

  escopo?: EscopoVistoria | null;

  local: string;

  vistoriador: Vistoriador | null;

  respostas: Record<string, Resposta>;

  /**
   * Status geral da vistoria.
   */
  status?: "rascunho" | "em_andamento" | "concluida";

  createdAt?: string;

  updatedAt?: string;
}