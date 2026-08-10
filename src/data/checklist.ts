import { Requisito } from "@/types/vistoria";

export const checklist: Requisito[] = [

  // ============================================================
  // 01 — LABORATÓRIO DE ANÁLISES CLÍNICAS
  // ============================================================

  {
    id: "LAB-EL-01",
    codigo: "LAB-EL-01",
    pergunta:
      "Existe rede elétrica estabilizada (Nobreak/UPS central ou UPS local dimensionada) para os analisadores bioquímicos, imunológicos e hematológicos?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "critica",
    referencias: ["ABNT NBR 13534"],
  },

  {
    id: "LAB-EL-02",
    codigo: "LAB-EL-02",
    pergunta:
      "O quantitativo de tomadas elétricas nas bancadas é suficiente para os equipamentos previstos, evitando o uso de adaptadores ou extensões?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "alta",
    referencias: ["ABNT NBR 13534"],
  },

  {
    id: "LAB-EL-03",
    codigo: "LAB-EL-03",
    pergunta:
      "As tomadas disponíveis nas bancadas atendem às tensões necessárias (110V/220V) para os equipamentos previstos?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "alta",
    referencias: ["ABNT NBR 13534"],
  },

  {
    id: "LAB-HID-01",
    codigo: "LAB-HID-01",
    pergunta:
      "Existem pontos de água tratada por Osmose Reversa (Tipo I ou II) próximos às áreas de instalação dos equipamentos automatizados de bioquímica e imunologia?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 786/2023"],
  },

  {
    id: "LAB-HID-02",
    codigo: "LAB-HID-02",
    pergunta:
      "As pias destinadas ao descarte possuem infraestrutura adequada para os resíduos gerados no laboratório?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 786/2023"],
  },

  {
    id: "LAB-HID-03",
    codigo: "LAB-HID-03",
    pergunta:
      "A tubulação de esgoto destinada ao laboratório é compatível com reagentes químicos e fluidos biológicos?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 786/2023"],
  },

  {
    id: "LAB-HVAC-01",
    codigo: "LAB-HVAC-01",
    pergunta:
      "O sistema de refrigeração do laboratório está instalado e operacional?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 786/2023"],
  },

  {
    id: "LAB-HVAC-02",
    codigo: "LAB-HVAC-02",
    pergunta:
      "O ambiente possui condições de controle de temperatura e umidade compatíveis com os equipamentos e reagentes previstos?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 786/2023"],
  },

  {
    id: "LAB-HVAC-03",
    codigo: "LAB-HVAC-03",
    pergunta:
      "O sistema de exaustão previsto para o laboratório está instalado e funcionando adequadamente?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 786/2023"],
  },

  {
    id: "LAB-MOB-01",
    codigo: "LAB-MOB-01",
    pergunta:
      "As bancadas possuem profundidade adequada para os analisadores previstos, considerando referência de aproximadamente 80 cm ou conforme especificação do fabricante?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAB-MOB-02",
    codigo: "LAB-MOB-02",
    pergunta:
      "As bancadas destinadas a microscópios e balanças de precisão possuem características adequadas para minimizar vibrações?",
    categoria: "01 — Laboratório de Análises Clínicas",
    criticidade: "alta",
    referencias: [],
  },


  // ============================================================
  // 02 — SALA DE OBSERVAÇÃO OBSTÉTRICA DA URGÊNCIA
  // ============================================================

  {
    id: "OBS-GAS-01",
    codigo: "OBS-GAS-01",
    pergunta:
      "Cada leito possui ponto de Oxigênio (O₂) na régua de gases?",
    categoria: "02 — Sala de Observação Obstétrica da Urgência",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "OBS-GAS-02",
    codigo: "OBS-GAS-02",
    pergunta:
      "Cada leito possui ponto de Ar Comprimido Medicinal na régua de gases?",
    categoria: "02 — Sala de Observação Obstétrica da Urgência",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "OBS-GAS-03",
    codigo: "OBS-GAS-03",
    pergunta:
      "Cada leito possui ponto de Vácuo Clínico na régua de gases?",
    categoria: "02 — Sala de Observação Obstétrica da Urgência",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "OBS-GAS-04",
    codigo: "OBS-GAS-04",
    pergunta:
      "A pressão dos pontos de gases medicinais está adequada para utilização nos equipamentos previstos?",
    categoria: "02 — Sala de Observação Obstétrica da Urgência",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "OBS-EL-01",
    codigo: "OBS-EL-01",
    pergunta:
      "As tomadas elétricas das cabeceiras estão conectadas ao circuito de emergência alimentado pelo Grupo Gerador?",
    categoria: "02 — Sala de Observação Obstétrica da Urgência",
    criticidade: "critica",
    referencias: ["ABNT NBR 13534"],
  },

  {
    id: "OBS-EL-02",
    codigo: "OBS-EL-02",
    pergunta:
      "As tomadas conectadas à alimentação de emergência estão devidamente identificadas?",
    categoria: "02 — Sala de Observação Obstétrica da Urgência",
    criticidade: "alta",
    referencias: ["ABNT NBR 13534"],
  },

  {
    id: "OBS-EL-03",
    codigo: "OBS-EL-03",
    pergunta:
      "Existe malha de aterramento equipotencial adequada para os equipamentos eletromédicos previstos?",
    categoria: "02 — Sala de Observação Obstétrica da Urgência",
    criticidade: "critica",
    referencias: ["ABNT NBR 13534"],
  },

  {
    id: "OBS-LAY-01",
    codigo: "OBS-LAY-01",
    pergunta:
      "O espaçamento entre os leitos permite circulação segura de equipamentos móveis?",
    categoria: "02 — Sala de Observação Obstétrica da Urgência",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "OBS-LAY-02",
    codigo: "OBS-LAY-02",
    pergunta:
      "Existe espaço suficiente para movimentação e utilização de equipamentos como ultrassom com Doppler e incubadora de transporte, quando aplicável?",
    categoria: "02 — Sala de Observação Obstétrica da Urgência",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 50/2002"],
  },


  // ============================================================
  // 03 — SALA DE AMIU
  // ============================================================

  {
    id: "AMIU-GAS-01",
    codigo: "AMIU-GAS-01",
    pergunta:
      "O ponto de Vácuo Clínico está disponível e possui capacidade e pressão adequadas para a utilização prevista?",
    categoria: "03 — Sala de AMIU",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "AMIU-GAS-02",
    codigo: "AMIU-GAS-02",
    pergunta:
      "Existe ponto de Oxigênio (O₂) disponível para suporte ventilatório eventual?",
    categoria: "03 — Sala de AMIU",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "AMIU-GAS-03",
    codigo: "AMIU-GAS-03",
    pergunta:
      "Existe ponto de Ar Comprimido Medicinal disponível para suporte aos equipamentos e suporte ventilatório eventual?",
    categoria: "03 — Sala de AMIU",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "AMIU-EST-01",
    codigo: "AMIU-EST-01",
    pergunta:
      "Caso esteja previsto Foco Cirúrgico de Teto, existe reforço estrutural adequado no teto para sua instalação?",
    categoria: "03 — Sala de AMIU",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "AMIU-EL-01",
    codigo: "AMIU-EL-01",
    pergunta:
      "Caso seja utilizado foco clínico de pedestal, existem tomadas aterradas e desobstruídas próximas ao local de utilização?",
    categoria: "03 — Sala de AMIU",
    criticidade: "alta",
    referencias: ["ABNT NBR 13534"],
  },

  {
    id: "AMIU-EL-02",
    codigo: "AMIU-EL-02",
    pergunta:
      "Existem pontos de energia conectados ao sistema de emergência para o aspirador cirúrgico elétrico de backup?",
    categoria: "03 — Sala de AMIU",
    criticidade: "critica",
    referencias: ["ABNT NBR 13534"],
  },

  {
    id: "AMIU-EL-03",
    codigo: "AMIU-EL-03",
    pergunta:
      "Existe ponto de energia adequado e conectado à emergência para o monitor multiparamétrico?",
    categoria: "03 — Sala de AMIU",
    criticidade: "critica",
    referencias: ["ABNT NBR 13534"],
  },

  {
    id: "AMIU-HVAC-01",
    codigo: "AMIU-HVAC-01",
    pergunta:
      "O sistema de climatização da sala está instalado e operacional?",
    categoria: "03 — Sala de AMIU",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "AMIU-HVAC-02",
    codigo: "AMIU-HVAC-02",
    pergunta:
      "A sala possui renovação de ar compatível com a utilização como ambiente de procedimento invasivo?",
    categoria: "03 — Sala de AMIU",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 50/2002"],
  },

  {
    id: "AMIU-HVAC-03",
    codigo: "AMIU-HVAC-03",
    pergunta:
      "O fluxo de ar condicionado não está direcionado diretamente sobre a paciente?",
    categoria: "03 — Sala de AMIU",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 50/2002"],
  },


  // ============================================================
  // 04 — LAVANDERIA HOSPITALAR
  // ============================================================

  {
    id: "LAV-EL-01",
    codigo: "LAV-EL-01",
    pergunta:
      "Existem painéis elétricos adequados para alimentação das máquinas da lavanderia?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAV-EL-02",
    codigo: "LAV-EL-02",
    pergunta:
      "Os disjuntores e dispositivos de proteção são compatíveis com as cargas dos equipamentos instalados?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "critica",
    referencias: [],
  },

  {
    id: "LAV-EL-03",
    codigo: "LAV-EL-03",
    pergunta:
      "Existe alimentação elétrica trifásica adequada para as lavadoras/extratoras e secadoras industriais?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "critica",
    referencias: [],
  },

  {
    id: "LAV-HID-01",
    codigo: "LAV-HID-01",
    pergunta:
      "As tubulações de alimentação de água fria possuem dimensionamento adequado para o funcionamento das lavadoras?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAV-HID-02",
    codigo: "LAV-HID-02",
    pergunta:
      "As tubulações de alimentação de água quente possuem dimensionamento adequado para o funcionamento das lavadoras?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAV-VAP-01",
    codigo: "LAV-VAP-01",
    pergunta:
      "Caso exista alimentação por vapor externo, a rede de vapor está disponível e compatível com os equipamentos?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAV-VAP-02",
    codigo: "LAV-VAP-02",
    pergunta:
      "A rede de vapor possui válvulas de segurança adequadas?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAV-VAP-03",
    codigo: "LAV-VAP-03",
    pergunta:
      "A rede de vapor possui purgadores instalados e adequados?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "media",
    referencias: [],
  },

  {
    id: "LAV-VAP-04",
    codigo: "LAV-VAP-04",
    pergunta:
      "As tubulações de vapor possuem isolamento térmico adequado?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAV-ESG-01",
    codigo: "LAV-ESG-01",
    pergunta:
      "As canaletas de drenagem estão instaladas e dimensionadas para o escoamento dos equipamentos?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAV-ESG-02",
    codigo: "LAV-ESG-02",
    pergunta:
      "O sistema de esgoto é compatível com as temperaturas de descarte dos equipamentos?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "critica",
    referencias: [],
  },

  {
    id: "LAV-ESG-03",
    codigo: "LAV-ESG-03",
    pergunta:
      "Existem caixas ou dispositivos retentores de felpos para proteção da rede de esgoto?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAV-EXA-01",
    codigo: "LAV-EXA-01",
    pergunta:
      "O sistema de exaustão térmica está instalado e dimensionado para dissipar o calor gerado pelas secadoras e calandras?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },

  {
    id: "LAV-FLX-01",
    codigo: "LAV-FLX-01",
    pergunta:
      "Existe barreira física adequada separando a área suja da área limpa da lavanderia?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "critica",
    referencias: [],
  },

  {
    id: "LAV-FLX-02",
    codigo: "LAV-FLX-02",
    pergunta:
      "A barreira entre as áreas suja e limpa possui visores adequados quando previstos?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "media",
    referencias: [],
  },

  {
    id: "LAV-FLX-03",
    codigo: "LAV-FLX-03",
    pergunta:
      "As portas de serviço entre as áreas suja e limpa estão adequadamente isoladas?",
    categoria: "04 — Lavanderia Hospitalar",
    criticidade: "alta",
    referencias: [],
  },


  // ============================================================
  // 05 — CME — CENTRO DE MATERIAL E ESTERILIZAÇÃO
  // ============================================================

  {
    id: "CME-FLX-01",
    codigo: "CME-FLX-01",
    pergunta:
      "Existe separação física adequada entre a área suja (Expurgo), área limpa (Preparo) e área estéril (Armazenamento)?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-FLX-02",
    codigo: "CME-FLX-02",
    pergunta:
      "O fluxo físico entre Expurgo, Preparo e Armazenamento permite a manutenção do fluxo adequado dos materiais?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-EQP-01",
    codigo: "CME-EQP-01",
    pergunta:
      "As aberturas nas paredes destinadas às autoclaves de dupla porta possuem guarnição adequada para vedação?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-EQP-02",
    codigo: "CME-EQP-02",
    pergunta:
      "As aberturas nas paredes destinadas às termodesinfectoras de dupla porta possuem guarnição adequada para vedação?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-HID-01",
    codigo: "CME-HID-01",
    pergunta:
      "Existem pontos de água tratada por Osmose Reversa destinados às termodesinfectoras?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-HID-02",
    codigo: "CME-HID-02",
    pergunta:
      "Existem pontos de água tratada por Osmose Reversa destinados às lavadoras ultrassônicas?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-HID-03",
    codigo: "CME-HID-03",
    pergunta:
      "Existem pontos de água tratada adequados para alimentação das autoclaves?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-ESG-01",
    codigo: "CME-ESG-01",
    pergunta:
      "O esgoto conectado às lavadoras e autoclaves utiliza material compatível com as temperaturas de descarte dos equipamentos?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-AR-01",
    codigo: "CME-AR-01",
    pergunta:
      "Existem pontos de ar comprimido medicinal no Expurgo para utilização nas pistolas de limpeza de lúmens?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-AR-02",
    codigo: "CME-AR-02",
    pergunta:
      "Existe ar comprimido adequado para o acionamento pneumático das portas das autoclaves, quando aplicável?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-AR-03",
    codigo: "CME-AR-03",
    pergunta:
      "O ar comprimido disponível para o CME é isento de óleo e água, conforme necessidade dos equipamentos?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-HVAC-01",
    codigo: "CME-HVAC-01",
    pergunta:
      "O sistema de climatização do CME está instalado e operacional?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "alta",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-HVAC-02",
    codigo: "CME-HVAC-02",
    pergunta:
      "O Expurgo apresenta pressão negativa em relação às áreas adjacentes?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-HVAC-03",
    codigo: "CME-HVAC-03",
    pergunta:
      "A área Limpa apresenta pressão positiva adequada em relação às áreas adjacentes?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

  {
    id: "CME-HVAC-04",
    codigo: "CME-HVAC-04",
    pergunta:
      "A área Estéril/Armazenamento apresenta pressão positiva adequada para proteção dos materiais esterilizados?",
    categoria: "05 — CME — Centro de Material e Esterilização",
    criticidade: "critica",
    referencias: ["RDC ANVISA nº 15/2012"],
  },

];