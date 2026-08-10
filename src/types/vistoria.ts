```ts
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
  | "audio"
  | "texto";

/**
 * Evidência individual vinculada a uma resposta.
 */
export interface Evidencia {
  /**
   * Identificador único da evidência.
   */
  id: string;

  /**
   * Tipo da evidência.
   */
  tipo: TipoEvidencia;

  /**
   * URL pública ou caminho do arquivo
   * no Supabase Storage.
   *
   * Opcional porque evidências de texto
   * podem não possuir arquivo.
   */
  url?: string;

  /**
   * Nome original do arquivo.
   */
  nome?: string;

  /**
   * MIME type.
   *
   * Exemplos:
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
   * Texto associado à evidência.
   *
   * Usado principalmente para evidências
   * do tipo "texto".
   */
  texto?: string;

  /**
   * Transcrição associada à evidência de áudio.
   */
  transcricao?: string;

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

/**
 * Usuário responsável pela vistoria.
 */
export interface Vistoriador {
  id: number;
  nome: string;
  funcao: string;
}

/**
 * Requisito do checklist.
 *
 * IMPORTANTE:
 * id = UUID interno do banco.
 * codigo = código funcional, como LAB-01, CME-01 etc.
 */
export interface Requisito {
  id: string;
  codigo: string;
  pergunta: string;
  categoria: string;
  criticidade: Criticidade;
  referencias: string[];
}

/**
 * Resposta de um requisito durante a vistoria.
 */
export interface Resposta {
  /**
   * UUID do requisito relacionado.
   */
  requisitoId: string;

  /**
   * Resultado da avaliação.
   */
  status: StatusAvaliacao;

  /**
   * Observação digitada manualmente.
   */
  observacao?: string;

  /**
   * Dados da transcrição de áudio.
   *
   * Mantido para compatibilidade
   * com o fluxo atual.
   */
  transcricao?: TranscricaoAudio;

  /**
   * Todas as evidências vinculadas
   * a este requisito.
   *
   * Um requisito pode possuir várias:
   * - fotos
   * - arquivos
   * - áudios
   * - textos
   */
  evidencias?: Evidencia[];

  /**
   * Mantido para compatibilidade
   * com a estrutura antiga.
   */
  fotos?: string[];

  /**
   * Mantido para compatibilidade
   * durante a migração da estrutura antiga.
   */
  audioUrl?: string;

  /**
   * Data/hora da resposta.
   */
  timestamp: string;
}

/**
 * Estado geral da vistoria.
 */
export interface VistoriaState {
  local: string;

  vistoriador: Vistoriador | null;

  /**
   * As respostas são indexadas pelo UUID
   * do requisito.
   */
  respostas: Record<string, Resposta>;
}
```
