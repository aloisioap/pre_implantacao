import { Requisito } from "@/types/vistoria";

export const checklist: Requisito[] = [
  // 01 — DOCUMENTAÇÃO TÉCNICA
  { id: "DOC-01", codigo: "DOC-01", pergunta: "Projeto arquitetônico aprovado?", categoria: "01 — Documentação Técnica", criticidade: "alta", referencias: [] },
  { id: "DOC-02", codigo: "DOC-02", pergunta: "Projeto elétrico disponível?", categoria: "01 — Documentação Técnica", criticidade: "alta", referencias: [] },
  { id: "DOC-03", codigo: "DOC-03", pergunta: "Projeto de climatização disponível?", categoria: "01 — Documentação Técnica", criticidade: "alta", referencias: [] },
  
  // 02 — INFRAESTRUTURA / ARQUITETURA
  { id: "ARQ-01", codigo: "ARQ-01", pergunta: "As paredes e pisos onde os equipamentos serão instalados estão finalizados?", categoria: "02 — Infraestrutura / Arquitetura", criticidade: "alta", referencias: [] },
  { id: "ARQ-02", codigo: "ARQ-02", pergunta: "As bancadas de suporte para os equipamentos estão instaladas e niveladas?", categoria: "02 — Infraestrutura / Arquitetura", criticidade: "alta", referencias: [] },
  { id: "ARQ-03", codigo: "ARQ-03", pergunta: "Existe espaço de circulação adequado ao redor dos pontos de instalação dos equipamentos?", categoria: "02 — Infraestrutura / Arquitetura", criticidade: "media", referencias: [] },
  { id: "ARQ-04", codigo: "ARQ-04", pergunta: "A sala está limpa e livre de detritos de construção?", categoria: "02 — Infraestrutura / Arquitetura", criticidade: "alta", referencias: [] },
  
  // 03 — ELÉTRICA
  { id: "EL-01", codigo: "EL-01", pergunta: "Possui alimentação elétrica adequada?", categoria: "03 — Elétrica", criticidade: "critica", referencias: ["ABNT NBR 5410"] },
  { id: "EL-02", codigo: "EL-02", pergunta: "Possui aterramento?", categoria: "03 — Elétrica", criticidade: "critica", referencias: ["ABNT NBR 13534"] },
  { id: "EL-07", codigo: "EL-07", pergunta: "Possui circuitos exclusivos?", categoria: "03 — Elétrica", criticidade: "alta", referencias: [] },
  { id: "EL-08", codigo: "EL-08", pergunta: "Possui circuitos exclusivos para equipamentos críticos?", categoria: "03 — Elétrica", criticidade: "critica", referencias: [] },

  // 04 — ENERGIA DE EMERGÊNCIA
  { id: "ENE-01", codigo: "ENE-01", pergunta: "Possui gerador?", categoria: "04 — Energia de Emergência", criticidade: "critica", referencias: [] },
  { id: "ENE-06", codigo: "ENE-06", pergunta: "Equipamentos críticos estão ligados à emergência?", categoria: "04 — Energia de Emergência", criticidade: "critica", referencias: [] },
  
  // 06 — HVAC / CLIMATIZAÇÃO
  { id: "HVAC-01", codigo: "HVAC-01", pergunta: "Climatização instalada?", categoria: "06 — HVAC / Climatização", criticidade: "alta", referencias: [] },
  { id: "HVAC-07", codigo: "HVAC-07", pergunta: "Ambientes críticos possuem controle independente?", categoria: "06 — HVAC / Climatização", criticidade: "alta", referencias: [] },
];