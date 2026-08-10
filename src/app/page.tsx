"use client";

import { useState, useEffect } from "react";
import { Check, AlertTriangle, X, Camera, ClipboardCheck, BarChart2, UserPlus, Users, Menu, FileText, Home, ChevronRight } from "lucide-react";
import { checklist } from "@/data/checklist";
import { StatusAvaliacao, VistoriaState, Vistoriador } from "@/types/vistoria";
import { supabase } from "./supabaseClient";

type ViewState = "dashboard" | "vistoria" | "relatorio";
type ModalState = "ressalva" | "nao_possui" | "novo_usuario" | null;
type FiltroRelatorio = "todos" | "conforme" | "ressalva" | "nao_possui";

export default function PreImplantacaoApp() {
  const [view, setView] = useState<ViewState>("dashboard");
  const [activeVistoriaId, setActiveVistoriaId] = useState<string | null>(null);
  const [vistoria, setVistoria] = useState<VistoriaState>({
    local: "Hospital Base",
    vistoriador: null,
    respostas: {},
  });

  const [vistoriadores, setVistoriadores] = useState<Vistoriador[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filtroRelatorio, setFiltroRelatorio] = useState<FiltroRelatorio>("todos");

  // Estados temporários para modais
  const [modalAberto, setModalAberto] = useState<ModalState>(null);
  const [obsTemp, setObsTemp] = useState("");
  const [novoVistoriador, setNovoVistoriador] = useState({ nome: "", funcao: "" });

  // Carregamento inicial
  useEffect(() => {
    const loadInitialData = async () => {
      // Busca os vistoriadores do Supabase
      const { data: vistoriadoresData, error: vistoriadoresError } = await supabase
        .from('vistoriadores')
        .select('id, nome, funcao');

      if (vistoriadoresError) {
        console.error("Erro ao buscar vistoriadores:", vistoriadoresError);
      } else {
        setVistoriadores(vistoriadoresData || []);
      }

      // Tenta carregar a última vistoria em andamento
      const lastVistoriaId = localStorage.getItem('@active-vistoria-id');
      if (lastVistoriaId) {
        const { data: vistoriaData, error: vistoriaError } = await supabase
          .from('vistorias')
          .select('*, vistoriador:vistoriadores(id, nome, funcao)')
          .eq('id', lastVistoriaId)
          .single();

        if (!vistoriaError && vistoriaData) {
          setActiveVistoriaId(vistoriaData.id);
          setVistoria({ local: vistoriaData.local, respostas: vistoriaData.respostas || {}, vistoriador: vistoriaData.vistoriador });
        }
      }
      setIsLoaded(true);
    };

    loadInitialData();
  }, []);

  const updateVistoriaInDb = async (updates: Partial<VistoriaState>) => {
    if (!activeVistoriaId) return;

    const dbUpdates: { [key: string]: any } = {};
    if (updates.local) dbUpdates.local = updates.local;
    if (updates.respostas) dbUpdates.respostas = updates.respostas;
    if (updates.vistoriador) dbUpdates.vistoriador_id = updates.vistoriador.id;

    // Não faz nada se não houver campos para atualizar no banco
    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase
      .from('vistorias')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', activeVistoriaId);

    if (error) console.error("Erro ao salvar vistoria:", error);
  };

  const handleSetVistoria = (updates: Partial<VistoriaState>) => {
    const newState = { ...vistoria, ...updates };
    setVistoria(newState);
    updateVistoriaInDb(updates);
  };

  const handleSetVistoriador = (vistoriador: Vistoriador) => {
    handleSetVistoria({ vistoriador });
  };

  const handleAddVistoriador = async () => {
    if (novoVistoriador.nome.trim() && novoVistoriador.funcao.trim()) {
      const { data, error } = await supabase
        .from('vistoriadores')
        .insert([
          { nome: novoVistoriador.nome, funcao: novoVistoriador.funcao },
        ])
        .select('id, nome, funcao')
        .single();

      if (error) {
        console.error("Erro ao adicionar vistoriador:", error);
      } else if (data) {
        setVistoriadores(prev => [...prev, data]);
        handleSetVistoriador(data);
        setModalAberto(null);
        setNovoVistoriador({ nome: "", funcao: "" });
      }
    }
  };

  const handleStartVistoria = async (startIndex?: number) => {
    if (!vistoria.vistoriador) return;

    if (!activeVistoriaId) {
      // Cria uma nova vistoria no banco
      const { data, error } = await supabase
        .from('vistorias')
        .insert({
          local: vistoria.local,
          vistoriador_id: vistoria.vistoriador.id,
          respostas: {},
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao iniciar nova vistoria:", error);
        return;
      }
      setActiveVistoriaId(data.id);
      localStorage.setItem('@active-vistoria-id', data.id);
    }

    if (startIndex !== undefined) setCurrentIndex(startIndex);
    setView("vistoria");
  };

  // Abre a vistoria direto no primeiro item pendente da categoria
  const abrirCategoria = (categoria: string) => {
    const pendente = checklist.findIndex(r => r.categoria === categoria && !vistoria.respostas[r.id]);
    const primeiro = checklist.findIndex(r => r.categoria === categoria);
    handleStartVistoria(pendente !== -1 ? pendente : primeiro);
  };

  // Cálculos dinâmicos
  const totalAvaliados = Object.keys(vistoria.respostas).length;
  const progressoTotal = Math.round((totalAvaliados / checklist.length) * 100) || 0;

  const contagem = {
    conforme: Object.values(vistoria.respostas).filter(r => r.status === "conforme").length,
    ressalva: Object.values(vistoria.respostas).filter(r => r.status === "ressalva").length,
    naopossui: Object.values(vistoria.respostas).filter(r => r.status === "nao_possui").length,
  };

  const todasAsRespostas = Object.values(vistoria.respostas);

  const categorias = [...new Set(checklist.map(item => item.categoria))];

  const resumoCategorias = categorias.map(cat => {
    const itens = checklist.filter(i => i.categoria === cat);
    const status = (s: StatusAvaliacao) => itens.filter(i => vistoria.respostas[i.id]?.status === s).length;
    return {
      cat,
      total: itens.length,
      feitos: itens.filter(i => vistoria.respostas[i.id]).length,
      conforme: status("conforme"),
      ressalva: status("ressalva"),
      naoPossui: status("nao_possui"),
    };
  });

  const navigateToRequisito = (id: string) => { const index = checklist.findIndex(r => r.id === id); if (index !== -1) { setCurrentIndex(index); setIsMenuOpen(false); } };

  const handleTabChange = (tab: ViewState) => {
    if (tab === "vistoria") { handleStartVistoria(); return; }
    setView(tab);
  };

  // Ação principal de Vistoria
  const registrarAvaliacao = (status: StatusAvaliacao, observacao: string = "") => {
    const requisitoAtual = checklist[currentIndex];

    const novaResposta = {
      requisitoId: requisitoAtual.id,
      status,
      observacao,
      timestamp: new Date().toISOString()
    };

    const novasRespostas = {
      ...vistoria.respostas,
      [requisitoAtual.id]: novaResposta
    };

    handleSetVistoria({ respostas: novasRespostas });

    setModalAberto(null);
    setObsTemp("");

    if (currentIndex < checklist.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setTimeout(() => setView("dashboard"), 150);
    }
  };

  if (!isLoaded) return null; // Evita hidratação incorreta

  // ==========================================
  // BARRA DE ABAS (NAVEGAÇÃO PRINCIPAL)
  // ==========================================
  const tabs: { id: ViewState; label: string; icon: typeof Home; disabled?: boolean }[] = [
    { id: "dashboard", label: "Início", icon: Home },
    { id: "vistoria", label: "Checklist", icon: ClipboardCheck, disabled: !vistoria.vistoriador },
    { id: "relatorio", label: "Relatório", icon: FileText },
  ];

  const tabBar = (
    <nav className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-gray-200 grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(tab => {
        const ativo = view === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={`py-2.5 flex flex-col items-center gap-0.5 text-[11px] font-bold transition-colors disabled:opacity-40 ${ativo ? "text-vistoria-dark" : "text-gray-400 active:text-gray-600"}`}
          >
            <span className={`px-4 py-1 rounded-full transition-colors ${ativo ? "bg-vistoria-sky/25" : ""}`}>
              <Icon size={22} strokeWidth={ativo ? 2.5 : 2} />
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );

  // ==========================================
  // VIEW: DASHBOARD INICIAL
  // ==========================================
  if (view === "dashboard") {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-gray-light flex flex-col relative shadow-2xl">
        <div className="bg-vistoria-dark text-white p-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
          {/* Polígonos decorativos */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rotate-45 transform translate-x-10 -translate-y-10"></div>

          <h2 className="text-sm font-bold tracking-widest text-vistoria-sky mb-1">PRÉ-IMPLANTAÇÃO</h2>
          <input
            className="text-3xl font-bold mb-6 bg-transparent outline-none w-full placeholder:text-white"
            value={vistoria.local}
            onChange={(e) => setVistoria(v => ({ ...v, local: e.target.value }))}
            onBlur={() => updateVistoriaInDb({ local: vistoria.local })}
            disabled={!!activeVistoriaId}
          />

          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-vistoria-sky relative">
              <span className="text-lg font-bold">{progressoTotal}%</span>
            </div>
            <div>
              <p className="font-medium text-white">{totalAvaliados} de {checklist.length} itens</p>
              <p className="text-sm text-vistoria-lightest">{totalAvaliados > 0 ? "Vistoria em andamento" : "Vistoria não iniciada"}</p>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
          {/* SELETOR DE VISTORIADOR */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Users size={16}/> Vistoriador Responsável</label>
            <div className="flex gap-2">
              <select
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800"
                value={vistoria.vistoriador?.id || ""}
                onChange={(e) => {
                  const vistoriadorSelecionado = vistoriadores.find(v => v.id === Number(e.target.value));
                  if (vistoriadorSelecionado) handleSetVistoriador(vistoriadorSelecionado);
                }}
              >
                <option value="" disabled>Selecione...</option>
                {vistoriadores.map(v => <option key={v.id} value={v.id}>{v.nome} ({v.funcao})</option>)}
              </select>
              <button onClick={() => setModalAberto("novo_usuario")} className="p-3 bg-vistoria-teal text-white rounded-lg">
                <UserPlus size={20} />
              </button>
            </div>
            {!vistoria.vistoriador && isLoaded && <p className="text-xs text-red-500">Selecione ou cadastre um vistoriador.</p>}
          </div>

          {/* MÉTRICAS */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
              <span className="block text-2xl font-bold text-acao-conforme">{contagem.conforme}</span>
              <span className="text-xs font-bold text-gray-500">Conformes</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
              <span className="block text-2xl font-bold text-acao-ressalva">{contagem.ressalva}</span>
              <span className="text-xs font-bold text-gray-500">Ressalvas</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
              <span className="block text-2xl font-bold text-acao-naopossui">{contagem.naopossui}</span>
              <span className="text-xs font-bold text-gray-500">Não Possui</span>
            </div>
          </div>

          {/* PROGRESSO POR TÓPICO */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Progresso por Tópico</h3>
            <div className="flex flex-col gap-2">
              {resumoCategorias.map(({ cat, total, feitos, conforme, ressalva, naoPossui }) => {
                const completo = feitos === total;
                return (
                  <button
                    key={cat}
                    onClick={() => abrirCategoria(cat)}
                    disabled={!vistoria.vistoriador}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-left active:bg-gray-50 transition-colors disabled:opacity-60 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2 mb-2">
                        <span className="font-bold text-sm text-slate-800 truncate">{cat}</span>
                        <span className={`text-xs font-bold shrink-0 ${completo ? "text-acao-conforme" : "text-gray-400"}`}>{feitos}/{total}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex">
                        <div className="bg-acao-conforme h-full" style={{ width: `${(conforme / total) * 100}%` }} />
                        <div className="bg-acao-ressalva h-full" style={{ width: `${(ressalva / total) * 100}%` }} />
                        <div className="bg-acao-naopossui h-full" style={{ width: `${(naoPossui / total) * 100}%` }} />
                      </div>
                      {(ressalva > 0 || naoPossui > 0) && (
                        <div className="flex gap-3 mt-2 text-[11px] font-bold">
                          {ressalva > 0 && <span className="text-acao-ressalva">{ressalva} ressalva{ressalva > 1 ? "s" : ""}</span>}
                          {naoPossui > 0 && <span className="text-acao-naopossui">{naoPossui} não possui</span>}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => handleStartVistoria()}
            disabled={!vistoria.vistoriador}
            className="w-full py-4 bg-vistoria-blue text-white rounded-2xl font-bold text-lg shadow-[0_4px_0_0_#3e9fbc] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-60"
          >
            <ClipboardCheck size={24} />
            {totalAvaliados > 0 ? "CONTINUAR VISTORIA" : "INICIAR VISTORIA"}
          </button>
        </div>

        {tabBar}
      </main>
    );
  }

  // ==========================================
  // VIEW: RELATÓRIO DA VISTORIA
  // ==========================================
  if (view === "relatorio") {
    const filtros: { id: FiltroRelatorio; label: string; cor: string }[] = [
      { id: "todos", label: `Todos (${todasAsRespostas.length})`, cor: "bg-vistoria-dark text-white" },
      { id: "conforme", label: `Conformes (${contagem.conforme})`, cor: "bg-acao-conforme text-white" },
      { id: "ressalva", label: `Ressalvas (${contagem.ressalva})`, cor: "bg-acao-ressalva text-white" },
      { id: "nao_possui", label: `Não Possui (${contagem.naopossui})`, cor: "bg-acao-naopossui text-white" },
    ];

    const respostasFiltradas = todasAsRespostas.filter(r => filtroRelatorio === "todos" || r.status === filtroRelatorio);

    const statusColors: Record<string, string> = {
      conforme: 'border-acao-conforme',
      ressalva: 'border-acao-ressalva',
      nao_possui: 'border-acao-naopossui',
      nao_avaliado: 'border-gray-200',
    };

    return (
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
        <header className="p-4 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10 flex flex-col gap-3">
          <div>
            <h1 className="text-xl font-bold text-vistoria-dark">Relatório da Vistoria</h1>
            <p className="text-xs text-gray-500">{vistoria.local}{vistoria.vistoriador ? ` • ${vistoria.vistoriador.nome}` : ""}</p>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {filtros.map(f => (
              <button
                key={f.id}
                onClick={() => setFiltroRelatorio(f.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filtroRelatorio === f.id ? f.cor : "bg-gray-100 text-gray-500 active:bg-gray-200"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 flex-1 overflow-y-auto bg-gray-light">
          {respostasFiltradas.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">Nenhum item avaliado {filtroRelatorio !== "todos" ? "com este status" : "ainda"}.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {categorias.map(cat => {
                const itensDaCategoria = checklist.filter(req => req.categoria === cat && respostasFiltradas.some(r => r.requisitoId === req.id));
                if (itensDaCategoria.length === 0) return null;
                return (
                  <section key={cat}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{cat}</h3>
                    <div className="flex flex-col gap-3">
                      {itensDaCategoria.map(req => {
                        const resposta = vistoria.respostas[req.id];
                        return (
                          <div key={req.id} className={`bg-white p-4 rounded-xl shadow-sm border ${statusColors[resposta.status] || 'border-gray-200'} border-l-4`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{req.codigo}</span>
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{req.criticidade}</span>
                            </div>
                            <p className="font-bold text-gray-800 mb-2">{req.pergunta}</p>
                            {resposta.observacao && <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                              <p className="text-sm text-gray-700 italic">&ldquo;{resposta.observacao}&rdquo;</p>
                            </div>}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {tabBar}
      </main>
    );
  }

  // ==========================================
  // VIEW: VISTORIA (FERRAMENTA DE CAMPO)
  // ==========================================
  const requisitoAtual = checklist[currentIndex];

  // Se não houver mais requisitos, volta para o dashboard.
  if (!requisitoAtual) {
    setView("dashboard");
    return null;
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col relative overflow-hidden">
      {/* CABEÇALHO DA VISTORIA */}
      <header className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-gray-500 hover:text-gray-700">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold text-vistoria-dark">{vistoria.local}</h1>
          <span className="text-sm font-bold text-vistoria-dark bg-vistoria-lightest/30 px-3 py-1 rounded-full">
            {currentIndex + 1} / {checklist.length}
          </span>
        </div>

        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-vistoria-teal h-full transition-all duration-300"
            style={{ width: `${((currentIndex) / checklist.length) * 100}%` }}
          />
        </div>
      </header>

      {/* CORPO DA VISTORIA */}
      <section className="flex-1 px-6 pt-4 pb-6 flex flex-col">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          {requisitoAtual.categoria} • {requisitoAtual.codigo}
        </span>
        <h2 className="text-2xl font-bold text-slate-800 leading-snug">
          {requisitoAtual.pergunta}
        </h2>

        {/* CONTROLES DE CAMPO (3 BOTÕES GIGANTES) */}
        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={() => registrarAvaliacao("conforme")}
            className="w-full py-6 bg-acao-conforme text-white text-xl font-bold rounded-2xl shadow-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            <Check size={28} /> CONFORME
          </button>

          <button
            onClick={() => setModalAberto("ressalva")}
            className="w-full py-5 bg-white text-acao-ressalva border-2 border-acao-ressalva text-lg font-bold rounded-2xl active:bg-yellow-50 transition-colors flex items-center justify-center gap-3"
          >
            <AlertTriangle size={24} /> RESSALVA
          </button>

          <button
            onClick={() => setModalAberto("nao_possui")}
            className="w-full py-5 bg-white text-acao-naopossui border-2 border-acao-naopossui text-lg font-bold rounded-2xl active:bg-red-50 transition-colors flex items-center justify-center gap-3"
          >
            <X size={24} /> NÃO POSSUI
          </button>
        </div>
      </section>

      {tabBar}

      {/* MENU LATERAL DE NAVEGAÇÃO */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <nav className="w-4/5 max-w-sm h-full bg-gray-light flex flex-col animate-in slide-in-from-left-12 duration-300 shadow-2xl">
            <header className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-vistoria-dark">Navegar por Tópicos</h2>
            </header>
            <ul className="flex-1 overflow-y-auto">
              {categorias.map(cat => (
                <li key={cat}>
                  <h3 className="px-4 py-2 text-sm font-bold text-gray-500 bg-gray-100 border-b border-t border-gray-200">{cat}</h3>
                  <ul>
                    {checklist.filter(r => r.categoria === cat).map(req => {
                      const resposta = vistoria.respostas[req.id];
                      const isCurrent = req.id === requisitoAtual.id;
                      return (
                        <li key={req.id}>
                          <button onClick={() => navigateToRequisito(req.id)} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isCurrent ? 'bg-vistoria-sky/20' : 'hover:bg-gray-200'}`}>
                            {resposta ? <Check size={16} className="text-acao-conforme flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                            <span className="flex-1">{req.pergunta}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* BOTTOM SHEET: OBSERVAÇÃO */}
      {(modalAberto === 'ressalva' || modalAberto === 'nao_possui') && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalAberto(null)} />
          <div className="bg-white rounded-t-[2rem] p-6 pb-10 z-10 flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100">

            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2" />

            <h3 className={`font-bold text-lg flex items-center gap-2 ${modalAberto === 'ressalva' ? 'text-acao-ressalva' : 'text-acao-naopossui'}`}>
              {modalAberto === 'ressalva' ? <><AlertTriangle/> REGISTRAR RESSALVA</> : <><X/> NÃO POSSUI</>}
            </h3>

            <textarea
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-vistoria-blue resize-none h-28 text-slate-700"
              placeholder="Descreva a situação encontrada..."
              value={obsTemp}
              onChange={(e) => setObsTemp(e.target.value)}
            />

            <div className="flex gap-3 mt-2">
              <label className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl active:bg-gray-200 transition-colors flex justify-center items-center gap-2 cursor-pointer text-sm">
                <Camera size={18} /> CÂMERA
                <input type="file" accept="image/*" capture="environment" className="hidden" />
              </label>
              <label className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl active:bg-gray-200 transition-colors flex justify-center items-center gap-2 cursor-pointer text-sm">
                <BarChart2 size={18} /> GALERIA
                <input type="file" accept="image/*" className="hidden" />
              </label>

              <button
                onClick={() => registrarAvaliacao(modalAberto, obsTemp)}
                disabled={!obsTemp.trim()}
                className="flex-[2] py-3 bg-vistoria-dark text-white font-bold rounded-xl active:bg-vistoria-blue transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Check size={20} /> CONCLUIR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO USUÁRIO */}
      {modalAberto === 'novo_usuario' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalAberto(null)} />
          <div className="bg-white rounded-2xl p-6 z-10 flex flex-col gap-4 w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-200 shadow-2xl">
            <h3 className="font-bold text-lg flex items-center gap-2 text-vistoria-dark">
              <UserPlus /> Novo Vistoriador
            </h3>

            <input
              type="text"
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg outline-none focus:ring-2 focus:ring-vistoria-blue text-slate-700"
              placeholder="Nome Completo"
              value={novoVistoriador.nome}
              onChange={(e) => setNovoVistoriador(v => ({ ...v, nome: e.target.value }))}
            />
            <input
              type="text"
              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg outline-none focus:ring-2 focus:ring-vistoria-blue text-slate-700"
              placeholder="Função (ex: Engenheiro, Técnico)"
              value={novoVistoriador.funcao}
              onChange={(e) => setNovoVistoriador(v => ({ ...v, funcao: e.target.value }))}
            />

            <div className="flex gap-3 mt-2">
              <button onClick={() => setModalAberto(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl active:bg-gray-200 transition-colors">CANCELAR</button>
              <button onClick={handleAddVistoriador} disabled={!novoVistoriador.nome.trim() || !novoVistoriador.funcao.trim()} className="flex-[2] py-3 bg-vistoria-dark text-white font-bold rounded-xl active:bg-vistoria-blue transition-colors disabled:opacity-50">
                SALVAR E USAR
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
