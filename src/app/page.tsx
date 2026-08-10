"use client";

import { useState, useEffect } from "react";
import { Check, AlertTriangle, X, Camera, ChevronLeft, ClipboardCheck, BarChart2 } from "lucide-react";
import { checklist } from "@/data/checklist";
import { Resposta, StatusAvaliacao } from "@/types/vistoria";

type ViewState = "dashboard" | "vistoria" | "matriz";

export default function PreImplantacaoApp() {
  const [view, setView] = useState<ViewState>("dashboard");
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Estados temporários para o modal de Ressalva/Não Possui
  const [modalAberto, setModalAberto] = useState<"ressalva" | "nao_possui" | null>(null);
  const [obsTemp, setObsTemp] = useState("");

  // Autosave via LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("@vistoria-respostas");
    if (saved) setRespostas(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("@vistoria-respostas", JSON.stringify(respostas));
    }
  }, [respostas, isLoaded]);

  // Cálculos dinâmicos
  const totalAvaliados = Object.keys(respostas).length;
  const progressoTotal = Math.round((totalAvaliados / checklist.length) * 100) || 0;
  
  const contagem = {
    conforme: Object.values(respostas).filter(r => r.status === "conforme").length,
    ressalva: Object.values(respostas).filter(r => r.status === "ressalva").length,
    naopossui: Object.values(respostas).filter(r => r.status === "nao_possui").length,
  };

  const pendencias = Object.values(respostas).filter(r => r.status !== "conforme");

  // Ação principal de Vistoria
  const registrarAvaliacao = (status: StatusAvaliacao, observacao: string = "") => {
    const requisitoAtual = checklist[currentIndex];
    
    setRespostas(prev => ({
      ...prev,
      [requisitoAtual.id]: {
        requisitoId: requisitoAtual.id,
        status,
        observacao,
        timestamp: new Date().toISOString()
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
          <h1 className="text-3xl font-bold mb-6">Hospital Base</h1>
          
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

        <div className="p-6 flex flex-col gap-4 flex-1">
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
            className="w-full py-4 bg-vistoria-blue text-white rounded-2xl font-bold text-lg shadow-[0_4px_0_0_#3e9fbc] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2"
          >
            <ClipboardCheck size={24} />
            {totalAvaliados > 0 ? "CONTINUAR VISTORIA" : "INICIAR VISTORIA"}
          </button>

          <button 
            onClick={() => setView("matriz")}
            className="w-full py-4 bg-white text-vistoria-dark border-2 border-vistoria-teal rounded-2xl font-bold text-lg active:bg-gray-light transition-all flex justify-center items-center gap-2"
          >
            <BarChart2 size={24} />
            VER MATRIZ ({pendencias.length})
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW: MATRIZ DE PENDÊNCIAS
  // ==========================================
  if (view === "matriz") {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
        <header className="p-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <button onClick={() => setView("dashboard")} className="p-2 bg-gray-100 rounded-full active:bg-gray-200">
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-vistoria-dark">Matriz de Pendências</h1>
        </header>
        
        <div className="p-4 flex-1 overflow-y-auto bg-gray-50">
          {pendencias.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">Nenhuma pendência registrada.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {pendencias.map(p => {
                const req = checklist.find(r => r.id === p.requisitoId);
                if (!req) return null;
                return (
                  <div key={p.requisitoId} className="bg-white p-4 rounded-xl shadow-sm border border-l-4" style={{ borderLeftColor: p.status === 'ressalva' ? '#F59E0B' : '#EF4444'}}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{req.codigo}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{req.criticidade}</span>
                    </div>
                    <p className="font-bold text-gray-800 mb-2">{req.pergunta}</p>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-sm text-gray-700 italic">"{p.observacao}"</p>
                    </div>
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
      <header className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <button onClick={() => setView("dashboard")} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
            <ChevronLeft size={24} />
          </button>
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

      {/* BOTTOM SHEET: OBSERVAÇÃO */}
      {modalAberto && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalAberto(null)} />
          <div className="bg-white rounded-t-[2rem] p-6 pb-10 z-10 flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100">
            
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2" />
            
            <h3 className={`font-bold text-lg flex items-center gap-2 ${modalAberto === 'ressalva' ? 'text-acao-ressalva' : 'text-acao-naopossui'}`}>
              {modalAberto === 'ressalva' ? <AlertTriangle/> : <X/>}
              {modalAberto === 'ressalva' ? 'REGISTRAR RESSALVA' : 'NÃO POSSUI'}
            </h3>
            
            <textarea 
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-vistoria-blue resize-none h-28 text-slate-700"
              placeholder="Descreva a situação encontrada..."
              value={obsTemp}
              onChange={(e) => setObsTemp(e.target.value)}
            />

            <div className="flex gap-3 mt-2">
              <label className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl active:bg-gray-200 transition-colors flex justify-center items-center gap-2 cursor-pointer">
                <Camera size={20} /> FOTO
                <input type="file" accept="image/*" capture="environment" className="hidden" />
              </label>
              
              <button 
                onClick={() => registrarAvaliacao(modalAberto, obsTemp)}
                disabled={!obsTemp.trim()}
                className="flex-[2] py-4 bg-vistoria-dark text-white font-bold rounded-xl active:bg-vistoria-blue transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Check size={20} /> CONCLUIR
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}