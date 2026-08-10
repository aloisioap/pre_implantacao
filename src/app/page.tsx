"use client";

import { useState, useEffect } from "react";
import { Check, AlertTriangle, X, Camera, ChevronLeft, ClipboardCheck, BarChart2, UserPlus, Users, Menu, FileText } from "lucide-react";
import { checklist } from "@/data/checklist";
import { Resposta, StatusAvaliacao, VistoriaState, Vistoriador } from "@/types/vistoria";
import { supabase } from "@/lib/supabaseClient";

type ViewState = "dashboard" | "vistoria" | "relatorio";
type ModalState = "ressalva" | "nao_possui" | "novo_usuario" | null;

export default function PreImplantacaoApp() {
  const [view, setView] = useState<ViewState>("dashboard");
  const [vistoria, setVistoria] = useState<VistoriaState>({
    local: "Hospital Base",
    vistoriador: null,
    respostas: {},
  });
  const [vistoriadores, setVistoriadores] = useState<Vistoriador[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estados temporários para modais
  const [modalAberto, setModalAberto] = useState<ModalState>(null);
  const [obsTemp, setObsTemp] = useState("");
  const [novoVistoriador, setNovoVistoriador] = useState({ nome: "", funcao: "" });

  // Autosave via LocalStorage
  useEffect(() => {
    // Carrega o estado da vistoria (respostas) do localStorage
    const savedState = localStorage.getItem("@vistoria-state");
    if (savedState) setVistoria(JSON.parse(savedState));

    // Busca os vistoriadores do Supabase
    const fetchVistoriadores = async () => {
      const { data, error } = await supabase
        .from('vistoriadores')
        .select('nome, funcao');
      
      if (error) {
        console.error("Erro ao buscar vistoriadores:", error);
      } else {
        setVistoriadores(data || []);
      }
    };

    fetchVistoriadores();
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Salva apenas o estado da vistoria, pois os vistoriadores estão no DB
      localStorage.setItem("@vistoria-state", JSON.stringify(vistoria));
    }
  }, [vistoria, isLoaded]);

  const handleSetVistoriador = (vistoriador: Vistoriador) => {
    setVistoria(prev => ({ ...prev, vistoriador }));
  };

  const handleAddVistoriador = async () => {
    if (novoVistoriador.nome.trim() && novoVistoriador.funcao.trim()) {
      const { data, error } = await supabase
        .from('vistoriadores')
        .insert([
          { nome: novoVistoriador.nome, funcao: novoVistoriador.funcao },
        ])
        .select()
        .single();

      if (error) {
        console.error("Erro ao adicionar vistoriador:", error);
        // Adicionar feedback para o usuário aqui, se desejar
      } else if (data) {
        const novoVistoriadorCompleto = { nome: data.nome, funcao: data.funcao };
        setVistoriadores(prev => [...prev, novoVistoriadorCompleto]);
        setVistoria(prev => ({ ...prev, vistoriador: novoVistoriadorCompleto }));
        setModalAberto(null);
        setNovoVistoriador({ nome: "", funcao: "" });
      }
    }
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

  const navigateToRequisito = (id: string) => { const index = checklist.findIndex(r => r.id === id); if (index !== -1) { setCurrentIndex(index); setIsMenuOpen(false); } };

  // Ação principal de Vistoria
  const registrarAvaliacao = (status: StatusAvaliacao, observacao: string = "") => {
    const requisitoAtual = checklist[currentIndex];
    
    setVistoria(prev => ({
      ...prev,
      respostas: {
        ...prev.respostas,
        [requisitoAtual.id]: {
          requisitoId: requisitoAtual.id,
          status,
          observacao,
          timestamp: new Date().toISOString()
        }
      }
    }));
    
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
          />
          
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-vistoria-sky relative">
              <span className="text-lg font-bold">{progressoTotal}%</span>
            </div>
            <div>
              <p className="font-medium text-white">{totalAvaliados} de {checklist.length} itens</p>
              <p className="text-sm text-vistoria-lightest">Vistoria em andamento</p>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1">
          {/* SELETOR DE VISTORIADOR */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Users size={16}/> Vistoriador Responsável</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800"
                value={vistoria.vistoriador?.nome || ""}
                onChange={(e) => {
                  const vistoriadorSelecionado = vistoriadores.find(v => v.nome === e.target.value);
                  if (vistoriadorSelecionado) handleSetVistoriador(vistoriadorSelecionado);
                }}
              >
                <option value="" disabled>Selecione...</option>
                {vistoriadores.map(v => <option key={v.nome} value={v.nome}>{v.nome} ({v.funcao})</option>)}
              </select>
              <button onClick={() => setModalAberto("novo_usuario")} className="p-3 bg-vistoria-teal text-white rounded-lg">
                <UserPlus size={20} />
              </button>
            </div>
            {!vistoria.vistoriador && isLoaded && <p className="text-xs text-red-500">Selecione ou cadastre um vistoriador.</p>}
          </div>


          {/* MÉTRICAS */}
          <div className="grid grid-cols-3 gap-3 mb-4">
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

          <button 
            onClick={() => setView("vistoria")}
            disabled={!vistoria.vistoriador}
            className="w-full py-4 bg-vistoria-blue text-white rounded-2xl font-bold text-lg shadow-[0_4px_0_0_#3e9fbc] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2"
          >
            <ClipboardCheck size={24} />
            {totalAvaliados > 0 ? "CONTINUAR VISTORIA" : "INICIAR VISTORIA"}
          </button>

          <button 
            onClick={() => setView("relatorio")}
            className="w-full py-4 bg-white text-vistoria-dark border-2 border-vistoria-teal rounded-2xl font-bold text-lg active:bg-gray-light transition-all flex justify-center items-center gap-2"
          >
            <FileText size={22} />
            RELATÓRIO ({todasAsRespostas.length})
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW: RELATÓRIO DA VISTORIA
  // ==========================================
  if (view === "relatorio") {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
        <header className="p-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <button onClick={() => setView("dashboard")} className="p-2 bg-gray-100 rounded-full active:bg-gray-200">
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-vistoria-dark">Relatório da Vistoria</h1>
            <p className="text-xs text-gray-500">{vistoria.local}</p>
          </div>
        </header>
        
        <div className="p-4 flex-1 overflow-y-auto bg-gray-light">
          {todasAsRespostas.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">Nenhum item foi avaliado ainda.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {todasAsRespostas.map(resposta => {
                const req = checklist.find(r => r.id === resposta.requisitoId);
                if (!req) return null;
                const statusColors = {
                  conforme: 'border-acao-conforme',
                  ressalva: 'border-acao-ressalva',
                  nao_possui: 'border-acao-naopossui',
                  nao_avaliado: 'border-gray-200', // Adicionado para cobrir todos os StatusAvaliacao
                };
                return (
                  <div key={resposta.requisitoId} className={`bg-white p-4 rounded-xl shadow-sm border ${statusColors[resposta.status] || 'border-gray-200'} border-l-4`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{req.codigo}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{req.criticidade}</span>
                    </div>
                    <p className="font-bold text-gray-800 mb-2">{req.pergunta}</p>
                    {resposta.observacao && <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                      <p className="text-sm text-gray-700 italic">"{resposta.observacao}"</p>
                    </div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
      <section className="flex-1 px-6 pt-4 pb-8 flex flex-col">
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