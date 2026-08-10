/**
 * ============================================================
 * TIPOS DA VISTORIA
 * ============================================================
 *
 * Tipos compartilhados entre:
 * - Checklist
 * - Evidências
 * - Áudio
 * - Transcrição
 * - Respostas
 * - Vistoriador
 *
 * IMPORTANTE:
 * Os IDs das entidades do banco são UUIDs.
 */

/**
 * Status possível da avaliação de um requisito.
 */
export type StatusAvaliacao =
  | "nao_avaliado"
  | "conforme"
  | "ressalva"
  | "nao_possui";

/**
 * Nível de criticidade do requisito.
 */
export type Criticidade =
  | "critica"
  | "alta"
  | "media"
  | "baixa";

/**
 * Tipos de evidência aceitos pela vistoria.
 */
export type TipoEvidencia =
  | "foto"
  | "arquivo"
  | "audio"
  | "texto";

/**
 * Status do processamento de uma transcrição.
 */
export type StatusTranscricao =
  | "pendente"
  | "processando"
  | "concluida"
  | "erro";

/**
 * ============================================================
 * EVIDÊNCIA
 * ============================================================
 *
 * Uma evidência pode representar:
 * - Foto
 * - Documento/arquivo
 * - Áudio
 * - Texto
 *
 * O campo "url" pode representar:
 * - blob:...                -> arquivo local temporário
 * - URL do Supabase Storage -> arquivo persistido
 * - caminho interno         -> dependendo do fluxo
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
   * URL ou caminho do arquivo.
   */
  url?: string;

  /**
   * Nome original do arquivo.
   */
  nome?: string;

  /**
   * MIME type do arquivo.
   *
   * Exemplos:
   * - image/jpeg
   * - image/png
   * - audio/webm
   * - audio/mp4
   * - application/pdf
   */
  mimeType?: string;

  /**
   * Tamanho do arquivo em bytes.
   */
  tamanho?: number;

  /**
   * Texto associado à evidência.
   *
   * Utilizado principalmente quando:
   * tipo === "texto"
   */
  texto?: string;

  /**
   * Transcrição do áudio.
   *
   * Pode ser preenchida depois que o
   * processamento Speech-to-Text terminar.
   */
  transcricao?: string;

  /**
   * Duração do áudio em segundos.
   *
   * Utilizada quando:
   * tipo === "audio"
   */
  duracao?: number;

  /**
   * Data/hora em que a evidência foi criada.
   */
  timestamp: string;
}

/**
 * ============================================================
 * TRANSCRIÇÃO DE ÁUDIO
 * ============================================================
 *
 * Representa o estado do processamento
 * Speech-to-Text de uma evidência de áudio.
 */
export interface TranscricaoAudio {
  /**
   * Texto transcrito.
   *
   * Durante os estados "pendente" e
   * "processando", normalmente será vazio.
   */
  texto: string;

  /**
   * Estado atual da transcrição.
   */
  status: StatusTranscricao;

  /**
   * Evidência de áudio relacionada.
   */
  evidenciaId?: string;

  /**
   * Mensagem de erro do processamento.
   */
  erro?: string;

  /**
   * Data/hora da criação ou atualização
   * da transcrição.
   */
  timestamp?: string;
}

/**
 * ============================================================
 * VISTORIADOR
 * ============================================================
 *
 * IMPORTANTE:
 * O sistema utiliza UUID para identificação
 * dos usuários/vistoriadores.
 */
export interface Vistoriador {
  /**
   * UUID do vistoriador.
   */
  id: string;

  /**
   * Nome completo.
   */
  nome: string;

  /**
   * Função/cargo.
   */
  funcao: string;
}

/**
 * ============================================================
 * REQUISITO
 * ============================================================
 *
 * Requisito pertencente ao checklist.
 *
 * IMPORTANTE:
 *
 * id     = UUID interno do banco
 * codigo = código funcional
 *
 * Exemplos:
 * LAB-01
 * CME-01
 * ENG-05
 */
export interface Requisito {
  /**
   * UUID do requisito.
   */
  id: string;

  /**
   * Código funcional do requisito.
   */
  codigo: string;

  /**
   * Pergunta/descrição apresentada ao vistoriador.
   */
  pergunta: string;

  /**
   * Categoria do requisito.
   */
  categoria: string;

  /**
   * Criticidade.
   */
  criticidade: Criticidade;

  /**
   * Referências normativas/técnicas.
   */
  referencias: string[];
}

/**
 * ============================================================
 * RESPOSTA
 * ============================================================
 *
 * Resultado de um requisito durante uma vistoria.
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
   * Observação técnica digitada manualmente.
   */
  observacao?: string;

  /**
   * Transcrição do áudio relacionado
   * ao requisito.
   *
   * Mantido separadamente das evidências
   * para facilitar o fluxo da interface.
   */
  transcricao?: TranscricaoAudio;

  /**
   * Lista de evidências relacionadas
   * ao requisito.
   *
   * Pode conter:
   * - Fotos
   * - Arquivos
   * - Áudios
   * - Textos
   */
  evidencias?: Evidencia[];

  /**
   * Compatibilidade com estrutura antiga.
   *
   * Contém URLs de fotos.
   */
  fotos?: string[];

  /**
   * Compatibilidade com estrutura antiga.
   *
   * URL do áudio principal.
   */
  audioUrl?: string;

  /**
   * Data/hora da resposta.
   */
  timestamp: string;
}

/**
 * ============================================================
 * ESTADO DA VISTORIA
 * ============================================================
 */
export interface VistoriaState {
  /**
   * Local onde a vistoria está sendo realizada.
   */
  local: string;

  /**
   * Vistoriador atualmente selecionado.
   */
  vistoriador: Vistoriador | null;

  /**
   * Respostas indexadas pelo UUID do requisito.
   *
   * Exemplo:
   * respostas[requisito.id]
   */
  respostas: Record<string, Resposta>;
}