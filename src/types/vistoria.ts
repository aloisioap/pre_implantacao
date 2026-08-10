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
  observacao?: string;
  fotos?: string[];
  audio?: string;
  transcricao?: string;
  timestamp: string;
}

export interface VistoriaState {
  local: string;
  vistoriador: Vistoriador | null;
  respostas: Record<string, Resposta>;
}