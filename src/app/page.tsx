"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Home,
  Menu,
  Plus,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { checklist } from "@/data/checklist";
import {
  StatusAvaliacao,
  Vistoriador,
} from "@/types/vistoria";

import { supabase } from "./supabaseClient";

/* =========================================================
   TIPOS
========================================================= */

type ViewState = "dashboard" | "vistoria" | "relatorio";

type ModalState =
  | "ressalva"
  | "nao_possui"
  | "novo_usuario"
  | null;

type FiltroRelatorio =
  | "todos"
  | "conforme"
  | "ressalva"
  | "nao_possui";

type Resposta = {
  requisitoId: string;
  status: StatusAvaliacao;
  observacao: string;
  fotos: string[];
  timestamp: string;
};

type VistoriaLocal = {
  local: string;
  vistoriador: Vistoriador | null;
  respostas: Record<string, Resposta>;
};

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function PreImplantacaoApp() {
  /* =======================================================
     ESTADOS
  ======================================================= */

  const [view, setView] = useState<ViewState>("dashboard");

  const [activeVistoriaId, setActiveVistoriaId] =
    useState<string | null>(null);

  const [vistoria, setVistoria] =
    useState<VistoriaLocal>({
      local: "Hospital Base",
      vistoriador: null,
      respostas: {},
    });

  const [vistoriadores, setVistoriadores] =
    useState<Vistoriador[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [isLoaded, setIsLoaded] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [filtroRelatorio, setFiltroRelatorio] =
    useState<FiltroRelatorio>("todos");

  const [modalAberto, setModalAberto] =
    useState<ModalState>(null);

  const [obsTemp, setObsTemp] = useState("");

  const [fotosTemp, setFotosTemp] = useState<File[]>([]);

  const [novoVistoriador, setNovoVistoriador] =
    useState({
      nome: "",
      funcao: "",
    });

  const [isSaving, setIsSaving] = useState(false);

  /* =======================================================
     CARREGAMENTO INICIAL
  ======================================================= */

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const {
          data: vistoriadoresData,
          error: vistoriadoresError,
        } = await supabase
          .from("vistoriadores")
          .select("id, nome, funcao")
          .order("nome");

        if (vistoriadoresError) {
          console.error(
            "Erro ao buscar vistoriadores:",
            vistoriadoresError
          );
        } else {
          setVistoriadores(vistoriadoresData || []);
        }

        const lastVistoriaId = localStorage.getItem(
          "@active-vistoria-id"
        );

        if (lastVistoriaId) {
          const {
            data: vistoriaData,
            error: vistoriaError,
          } = await supabase
            .from("vistorias")
            .select(
              "*, vistoriador:vistoriadores(id, nome, funcao)"
            )
            .eq("id", lastVistoriaId)
            .single();

          if (!vistoriaError && vistoriaData) {
            setActiveVistoriaId(vistoriaData.id);

            setVistoria({
              local: vistoriaData.local || "Hospital Base",
              respostas: vistoriaData.respostas || {},
              vistoriador:
                vistoriaData.vistoriador || null,
            });

            const respostas =
              vistoriaData.respostas || {};

            const primeiroPendente = checklist.findIndex(
              (item) => !respostas[item.id]
            );

            if (primeiroPendente >= 0) {
              setCurrentIndex(primeiroPendente);
            }
          }
        }
      } catch (error) {
        console.error(
          "Erro ao carregar dados iniciais:",
          error
        );
      } finally {
        setIsLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  /* =======================================================
     SALVAR VISTORIA NO BANCO
  ======================================================= */

  const updateVistoriaInDb = async (
    updates: Partial<VistoriaLocal>
  ) => {
    if (!activeVistoriaId) return;

    const dbUpdates: Record<string, unknown> = {};

    if (updates.local !== undefined) {
      dbUpdates.local = updates.local;
    }

    if (updates.respostas !== undefined) {
      dbUpdates.respostas = updates.respostas;
    }

    if (updates.vistoriador !== undefined) {
      dbUpdates.vistoriador_id =
        updates.vistoriador?.id || null;
    }

    if (Object.keys(dbUpdates).length === 0) {
      return;
    }

    const { error } = await supabase
      .from("vistorias")
      .update({
        ...dbUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeVistoriaId);

    if (error) {
      console.error(
        "Erro ao salvar vistoria:",
        error
      );
    }
  };

  /* =======================================================
     ATUALIZAR VISTORIA
  ======================================================= */

  const handleSetVistoria = (
    updates: Partial<VistoriaLocal>
  ) => {
    setVistoria((prev) => ({
      ...prev,
      ...updates,
    }));

    void updateVistoriaInDb(updates);
  };

  /* =======================================================
     SELECIONAR VISTORIADOR
  ======================================================= */

  const handleSetVistoriador = (
    vistoriador: Vistoriador
  ) => {
    handleSetVistoria({
      vistoriador,
    });
  };

  /* =======================================================
     ADICIONAR VISTORIADOR
  ======================================================= */

  const handleAddVistoriador = async () => {
    if (
      !novoVistoriador.nome.trim() ||
      !novoVistoriador.funcao.trim()
    ) {
      return;
    }

    const { data, error } = await supabase
      .from("vistoriadores")
      .insert([
        {
          nome: novoVistoriador.nome.trim(),
          funcao: novoVistoriador.funcao.trim(),
        },
      ])
      .select("id, nome, funcao")
      .single();

    if (error) {
      console.error(
        "Erro ao adicionar vistoriador:",
        error
      );
      return;
    }

    if (data) {
      setVistoriadores((prev) => [
        ...prev,
        data,
      ]);

      handleSetVistoriador(data);

      setModalAberto(null);

      setNovoVistoriador({
        nome: "",
        funcao: "",
      });
    }
  };

  /* =======================================================
     ARQUIVOS
  ======================================================= */

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return;

    const files = Array.from(event.target.files);

    setFotosTemp((prev) => [
      ...prev,
      ...files,
    ]);

    event.target.value = "";
  };

  const handleRemoveFoto = (index: number) => {
    setFotosTemp((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  /* =======================================================
     INICIAR VISTORIA
  ======================================================= */

  const handleStartVistoria = async (
    startIndex?: number
  ) => {
    if (!vistoria.vistoriador) {
      return;
    }

    let vistoriaId = activeVistoriaId;

    if (!vistoriaId) {
      const {
        data,
        error,
      } = await supabase
        .from("vistorias")
        .insert({
          local: vistoria.local,
          vistoriador_id:
            vistoria.vistoriador.id,
          respostas: {},
        })
        .select()
        .single();

      if (error || !data) {
        console.error(
          "Erro ao iniciar nova vistoria:",
          error
        );
        return;
      }

      vistoriaId = data.id;

      setActiveVistoriaId(data.id);

      localStorage.setItem(
        "@active-vistoria-id",
        data.id
      );
    }

    if (startIndex !== undefined) {
      setCurrentIndex(startIndex);
    }

    setView("vistoria");
  };

  /* =======================================================
     ABRIR CATEGORIA
  ======================================================= */

  const abrirCategoria = (
    categoria: string
  ) => {
    if (!vistoria.vistoriador) return;

    const pendente = checklist.findIndex(
      (item) =>
        item.categoria === categoria &&
        !vistoria.respostas[item.id]
    );

    const primeiro = checklist.findIndex(
      (item) =>
        item.categoria === categoria
    );

    void handleStartVistoria(
      pendente !== -1
        ? pendente
        : primeiro
    );
  };

  /* =======================================================
     DADOS CALCULADOS
  ======================================================= */

  const totalAvaliados = Object.keys(
    vistoria.respostas
  ).length;

  const progressoTotal =
    checklist.length > 0
      ? Math.round(
          (totalAvaliados /
            checklist.length) *
            100
        )
      : 0;

  const contagem = {
    conforme: Object.values(
      vistoria.respostas
    ).filter(
      (r) => r.status === "conforme"
    ).length,

    ressalva: Object.values(
      vistoria.respostas
    ).filter(
      (r) => r.status === "ressalva"
    ).length,

    naopossui: Object.values(
      vistoria.respostas
    ).filter(
      (r) => r.status === "nao_possui"
    ).length,
  };

  const todasAsRespostas =
    Object.values(
      vistoria.respostas
    );

  const categorias = useMemo(
    () =>
      Array.from(
        new Set(
          checklist.map(
            (item) => item.categoria
          )
        )
      ),
    []
  );

  const resumoCategorias =
    categorias.map((cat) => {
      const itens = checklist.filter(
        (item) =>
          item.categoria === cat
      );

      const status = (
        s: StatusAvaliacao
      ) =>
        itens.filter(
          (item) =>
            vistoria.respostas[
              item.id
            ]?.status === s
        ).length;

      return {
        cat,
        total: itens.length,
        feitos: itens.filter(
          (item) =>
            vistoria.respostas[
              item.id
            ]
        ).length,
        conforme: status("conforme"),
        ressalva: status("ressalva"),
        naoPossui:
          status("nao_possui"),
      };
    });

  /* =======================================================
     REQUISITO ATUAL
  ======================================================= */

  const requisitoAtual =
    checklist[currentIndex];

  /* =======================================================
     NAVEGAÇÃO
  ======================================================= */

  const navigateToRequisito = (
    id: string
  ) => {
    const index =
      checklist.findIndex(
        (item) => item.id === id
      );

    if (index !== -1) {
      setCurrentIndex(index);
      setIsMenuOpen(false);
      setView("vistoria");
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(
        (prev) => prev - 1
      );
    }
  };

  const goNext = () => {
    if (
      currentIndex <
      checklist.length - 1
    ) {
      setCurrentIndex(
        (prev) => prev + 1
      );
    }
  };

  const handleTabChange = (
    tab: ViewState
  ) => {
    if (tab === "vistoria") {
      if (!vistoria.vistoriador) {
        return;
      }

      void handleStartVistoria();
      return;
    }

    setView(tab);
  };

  /* =======================================================
     AVALIAÇÃO
  ======================================================= */

  const registrarAvaliacao = async (
    status: StatusAvaliacao,
    observacao = ""
  ) => {
    if (!requisitoAtual) return;

    if (!activeVistoriaId) {
      console.error(
        "Não é possível registrar avaliação sem uma vistoria ativa."
      );
      return;
    }

    setIsSaving(true);

    try {
      const urlsFotos: string[] = [];

      /* -----------------------------------------------
         UPLOAD DAS FOTOS
      ------------------------------------------------ */

      if (fotosTemp.length > 0) {
        for (const file of fotosTemp) {
          const fileExt =
            file.name
              .split(".")
              .pop() || "jpg";

          const filePath =
            `${activeVistoriaId}/` +
            `${requisitoAtual.id}/` +
            `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}.${fileExt}`;

          const {
            error: uploadError,
          } = await supabase.storage
            .from("fotos_vistorias")
            .upload(
              filePath,
              file
            );

          if (uploadError) {
            console.error(
              "Erro no upload da foto:",
              uploadError
            );

            return;
          }

          const {
            data: urlData,
          } = supabase.storage
            .from(
              "fotos_vistorias"
            )
            .getPublicUrl(
              filePath
            );

          if (
            urlData?.publicUrl
          ) {
            urlsFotos.push(
              urlData.publicUrl
            );
          }
        }
      }

      /* -----------------------------------------------
         RESPOSTA
      ------------------------------------------------ */

      const novaResposta: Resposta = {
        requisitoId:
          requisitoAtual.id,

        status,

        observacao:
          observacao.trim(),

        fotos: urlsFotos,

        timestamp:
          new Date().toISOString(),
      };

      const novasRespostas = {
        ...vistoria.respostas,
        [requisitoAtual.id]:
          novaResposta,
      };

      setVistoria((prev) => ({
        ...prev,
        respostas:
          novasRespostas,
      }));

      await updateVistoriaInDb({
        respostas:
          novasRespostas,
      });

      /* -----------------------------------------------
         LIMPA MODAL
      ------------------------------------------------ */

      setModalAberto(null);
      setObsTemp("");
      setFotosTemp([]);

      /* -----------------------------------------------
         AVANÇA
      ------------------------------------------------ */

      if (
        currentIndex <
        checklist.length - 1
      ) {
        setCurrentIndex(
          (prev) => prev + 1
        );
      } else {
        setView("dashboard");
      }
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     TECLADO
  ======================================================= */

  useEffect(() => {
    if (view !== "vistoria") {
      return;
    }

    const handleKeyboard = (
      event: KeyboardEvent
    ) => {
      if (
        event.target instanceof
          HTMLInputElement ||
        event.target instanceof
          HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        goPrevious();
      }

      if (event.key === "ArrowRight") {
        goNext();
      }

      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setModalAberto(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [
    view,
    currentIndex,
  ]);

  /* =======================================================
     SIDEBAR
  ======================================================= */

  const topicListNav = (
    <aside className="h-full bg-slate-950 text-white border-r border-white/10 flex flex-col">
      {/* HEADER SIDEBAR */}

      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-cyan-400 font-bold">
              VISTORIA
            </p>

            <h2 className="text-lg font-black">
              Navegação
            </h2>
          </div>

          <button
            onClick={() =>
              setIsMenuOpen(false)
            }
            className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* PROGRESSO */}

      <div className="p-5 border-b border-white/10">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-xs text-slate-400">
              PROGRESSO
            </span>

            <div className="text-2xl font-black">
              {progressoTotal}%
            </div>
          </div>

          <span className="text-xs text-slate-500">
            {totalAvaliados}/
            {checklist.length}
          </span>
        </div>

        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
            style={{
              width: `${progressoTotal}%`,
            }}
          />
        </div>
      </div>

      {/* REQUISITOS */}

      <div className="flex-1 overflow-y-auto p-3">
        {categorias.map((cat) => (
          <div
            key={cat}
            className="mb-4"
          >
            <div className="px-3 py-2 text-[10px] font-black tracking-[0.18em] text-slate-500 uppercase">
              {cat}
            </div>

            <div className="space-y-1">
              {checklist
                .filter(
                  (item) =>
                    item.categoria === cat
                )
                .map((req) => {
                  const resposta =
                    vistoria
                      .respostas[
                      req.id
                    ];

                  const isCurrent =
                    req.id ===
                    requisitoAtual?.id;

                  return (
                    <button
                      key={req.id}
                      onClick={() =>
                        navigateToRequisito(
                          req.id
                        )
                      }
                      className={`
                        w-full text-left
                        px-3 py-3
                        rounded-xl
                        flex items-center gap-3
                        transition-all
                        border
                        ${
                          isCurrent
                            ? "bg-cyan-400/10 border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                            : "border-transparent hover:bg-white/5"
                        }
                      `}
                    >
                      <span className="shrink-0">
                        {!resposta ? (
                          <span className="w-5 h-5 rounded-full border border-slate-600 block" />
                        ) : resposta.status ===
                          "conforme" ? (
                          <CheckCircle2
                            size={19}
                            className="text-emerald-400"
                          />
                        ) : resposta.status ===
                          "ressalva" ? (
                          <AlertTriangle
                            size={19}
                            className="text-amber-400"
                          />
                        ) : (
                          <XCircle
                            size={19}
                            className="text-rose-400"
                          />
                        )}
                      </span>

                      <span className="flex-1 min-w-0">
                        <span className="block text-[10px] text-slate-500 mb-0.5">
                          {req.codigo}
                        </span>

                        <span
                          className={`
                            block text-xs font-medium
                            ${
                              isCurrent
                                ? "text-cyan-100"
                                : "text-slate-300"
                            }
                          `}
                        >
                          {req.pergunta}
                        </span>
                      </span>

                      {isCurrent && (
                        <ChevronRight
                          size={15}
                          className="text-cyan-400 shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER SIDEBAR */}

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() =>
            setView("dashboard")
          }
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold"
        >
          <Home size={18} />
          Voltar ao início
        </button>
      </div>
    </aside>
  );

  /* =======================================================
     TAB BAR
  ======================================================= */

  const tabs = [
    {
      id: "dashboard" as ViewState,
      label: "Início",
      icon: Home,
    },
    {
      id: "vistoria" as ViewState,
      label: "Vistoria",
      icon: ClipboardCheck,
    },
    {
      id: "relatorio" as ViewState,
      label: "Relatório",
      icon: FileText,
    },
  ];

  const tabBar = (
    <nav className="border-t border-slate-200 bg-white/95 backdrop-blur-xl flex justify-around p-2">
      {tabs.map((tab) => {
        const ativo =
          view === tab.id;

        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() =>
              handleTabChange(
                tab.id
              )
            }
            className={`
              flex-1 py-2.5
              flex flex-col
              items-center
              gap-1
              text-[10px]
              font-black
              transition-all
              ${
                ativo
                  ? "text-cyan-600"
                  : "text-slate-400"
              }
            `}
          >
            <span
              className={`
                p-2 rounded-xl
                ${
                  ativo
                    ? "bg-cyan-50"
                    : ""
                }
              `}
            >
              <Icon
                size={21}
                strokeWidth={
                  ativo ? 2.5 : 2
                }
              />
            </span>

            {tab.label}
          </button>
        );
      })}
    </nav>
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-xs tracking-[0.25em] text-cyan-400 font-bold">
            INICIALIZANDO
          </p>

          <p className="text-sm text-slate-500 mt-2">
            Sistema de pré-implantação
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  if (view === "dashboard") {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <div className="max-w-7xl mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
          {/* HEADER */}

          <header className="relative overflow-hidden bg-slate-950 text-white px-6 py-8 lg:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_20%_100%,rgba(59,130,246,0.15),transparent_35%)]" />

            <div className="relative">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-[10px] tracking-[0.3em] font-black text-cyan-400">
                    AUMED • AUDVISION
                  </p>

                  <h1 className="text-3xl lg:text-5xl font-black tracking-tight mt-2">
                    Pré-Implantação
                  </h1>

                  <p className="text-sm text-slate-400 mt-2">
                    Centro de comando da vistoria hospitalar
                  </p>
                </div>

                <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 items-center justify-center">
                  <ClipboardCheck
                    className="text-cyan-400"
                    size={28}
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 lg:p-10 grid lg:grid-cols-5 gap-8">
            {/* COLUNA ESQUERDA */}

            <div className="lg:col-span-2 space-y-5">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-cyan-600 font-black mb-2">
                  LOCAL DA VISTORIA
                </p>

                <input
                  className="text-2xl font-black bg-transparent outline-none w-full border-b border-slate-200 focus:border-cyan-400 pb-2"
                  value={vistoria.local}
                  onChange={(event) =>
                    setVistoria(
                      (prev) => ({
                        ...prev,
                        local: event.target.value,
                      })
                    )
                  }
                  onBlur={() =>
                    void updateVistoriaInDb(
                      {
                        local: vistoria.local,
                      }
                    )
                  }
                  disabled={
                    !!activeVistoriaId
                  }
                />
              </div>

              {/* PROGRESSO */}

              <div className="bg-slate-950 text-white rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full border border-cyan-400/20" />

                <p className="text-[10px] tracking-[0.2em] text-cyan-400 font-black">
                  STATUS DA VISTORIA
                </p>

                <div className="flex items-center gap-5 mt-5">
                  <div className="relative w-24 h-24">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full -rotate-90"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="8"
                      />

                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="264"
                        strokeDashoffset={
                          264 -
                          (264 *
                            progressoTotal) /
                            100
                        }
                      />
                    </svg>

                    <span className="absolute inset-0 flex items-center justify-center font-black text-xl">
                      {progressoTotal}%
                    </span>
                  </div>

                  <div>
                    <p className="font-bold">
                      {totalAvaliados} de{" "}
                      {checklist.length}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      itens avaliados
                    </p>
                  </div>
                </div>
              </div>

              {/* VISTORIADOR */}

              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-black tracking-wider text-slate-500 flex items-center gap-2">
                    <Users size={16} />
                    VISTORIADOR
                  </label>

                  <button
                    onClick={() =>
                      setModalAberto(
                        "novo_usuario"
                      )
                    }
                    className="p-2 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                  >
                    <Plus size={17} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-medium outline-none focus:border-cyan-400"
                    value={
                      vistoria.vistoriador?.id ||
                      ""
                    }
                    onChange={(event) => {
                      const selected =
                        vistoriadores.find(
                          (v) =>
                            String(v.id) ===
                            event.target.value
                        );

                      if (selected) {
                        handleSetVistoriador(
                          selected
                        );
                      }
                    }}
                  >
                    <option value="" disabled>
                      Selecione...
                    </option>

                    {vistoriadores.map(
                      (v) => (
                        <option
                          key={v.id}
                          value={v.id}
                        >
                          {v.nome} —{" "}
                          {v.funcao}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {!vistoria.vistoriador && (
                  <p className="text-[11px] text-rose-500 mt-3 font-bold">
                    Selecione um vistoriador para iniciar.
                  </p>
                )}
              </div>

              {/* MÉTRICAS */}

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <Check
                    size={18}
                    className="text-emerald-600"
                  />

                  <p className="text-2xl font-black text-emerald-700 mt-3">
                    {contagem.conforme}
                  </p>

                  <p className="text-[10px] font-black text-emerald-700/60 uppercase">
                    Conforme
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <AlertTriangle
                    size={18}
                    className="text-amber-600"
                  />

                  <p className="text-2xl font-black text-amber-700 mt-3">
                    {contagem.ressalva}
                  </p>

                  <p className="text-[10px] font-black text-amber-700/60 uppercase">
                    Ressalva
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                  <X
                    size={18}
                    className="text-rose-600"
                  />

                  <p className="text-2xl font-black text-rose-700 mt-3">
                    {contagem.naopossui}
                  </p>

                  <p className="text-[10px] font-black text-rose-700/60 uppercase">
                    Não possui
                  </p>
                </div>
              </div>
            </div>

            {/* TÓPICOS */}

            <div className="lg:col-span-3">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-cyan-600 font-black">
                    MATRIZ DE VERIFICAÇÃO
                  </p>

                  <h2 className="text-xl font-black mt-1">
                    Progresso por tópico
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {resumoCategorias.map(
                  ({
                    cat,
                    total,
                    feitos,
                    conforme,
                    ressalva,
                    naoPossui,
                  }) => {
                    const completo =
                      feitos === total;

                    return (
                      <button
                        key={cat}
                        onClick={() =>
                          abrirCategoria(
                            cat
                          )
                        }
                        disabled={
                          !vistoria.vistoriador
                        }
                        className="w-full text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-cyan-200 transition-all disabled:opacity-50"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="font-black text-sm">
                              {cat}
                            </p>

                            <p className="text-[11px] text-slate-400 mt-1">
                              {feitos} de{" "}
                              {total} avaliados
                            </p>
                          </div>

                          <div
                            className={`
                              text-xs font-black px-3 py-1.5 rounded-full
                              ${
                                completo
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-500"
                              }
                            `}
                          >
                            {feitos}/
                            {total}
                          </div>
                        </div>

                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-400"
                            style={{
                              width: `${
                                (conforme /
                                  total) *
                                100
                              }%`,
                            }}
                          />

                          <div
                            className="bg-amber-400"
                            style={{
                              width: `${
                                (ressalva /
                                  total) *
                                100
                              }%`,
                            }}
                          />

                          <div
                            className="bg-rose-400"
                            style={{
                              width: `${
                                (naoPossui /
                                  total) *
                                100
                              }%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between mt-4">
                          <div className="flex gap-4 text-[10px] font-bold">
                            {ressalva > 0 && (
                              <span className="text-amber-600">
                                {ressalva} ressalva
                                {ressalva >
                                1
                                  ? "s"
                                  : ""}
                              </span>
                            )}

                            {naoPossui >
                              0 && (
                              <span className="text-rose-600">
                                {naoPossui} não possui
                              </span>
                            )}
                          </div>

                          <ChevronRight
                            size={18}
                            className="text-slate-300"
                          />
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* CTA */}

          <div className="p-6 lg:p-10 pt-0">
            <button
              onClick={() =>
                void handleStartVistoria()
              }
              disabled={
                !vistoria.vistoriador
              }
              className="w-full rounded-2xl bg-slate-950 text-white py-5 font-black flex items-center justify-center gap-3 hover:bg-slate-900 disabled:opacity-40 transition-all shadow-xl"
            >
              <ClipboardCheck
                size={22}
              />

              {totalAvaliados > 0
                ? "CONTINUAR VISTORIA"
                : "INICIAR VISTORIA"}

              <ArrowRight
                size={20}
              />
            </button>
          </div>

          <div className="lg:hidden">
            {tabBar}
          </div>
        </div>

        {/* MODAL NOVO VISTORIADOR */}

        {modalAberto ===
          "novo_usuario" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() =>
                setModalAberto(null)
              }
            />

            <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600">
                  <UserPlus size={22} />
                </div>

                <div>
                  <h3 className="font-black text-lg">
                    Novo vistoriador
                  </h3>

                  <p className="text-xs text-slate-400">
                    Cadastre um responsável pela vistoria.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nome completo"
                  value={
                    novoVistoriador.nome
                  }
                  onChange={(event) =>
                    setNovoVistoriador(
                      (prev) => ({
                        ...prev,
                        nome: event.target.value,
                      })
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                />

                <input
                  type="text"
                  placeholder="Função"
                  value={
                    novoVistoriador.funcao
                  }
                  onChange={(event) =>
                    setNovoVistoriador(
                      (prev) => ({
                        ...prev,
                        funcao: event.target.value,
                      })
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() =>
                    setModalAberto(null)
                  }
                  className="flex-1 py-3 rounded-xl bg-slate-100 font-bold"
                >
                  Cancelar
                </button>

                <button
                  onClick={() =>
                    void handleAddVistoriador()
                  }
                  disabled={
                    !novoVistoriador.nome.trim() ||
                    !novoVistoriador.funcao.trim()
                  }
                  className="flex-[2] py-3 rounded-xl bg-slate-950 text-white font-bold disabled:opacity-40"
                >
                  Salvar e usar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  /* =======================================================
     RELATÓRIO
  ======================================================= */

  if (view === "relatorio") {
    const filtros: {
      id: FiltroRelatorio;
      label: string;
    }[] = [
      {
        id: "todos",
        label: `Todos (${todasAsRespostas.length})`,
      },
      {
        id: "conforme",
        label: `Conformes (${contagem.conforme})`,
      },
      {
        id: "ressalva",
        label: `Ressalvas (${contagem.ressalva})`,
      },
      {
        id: "nao_possui",
        label: `Não Possui (${contagem.naopossui})`,
      },
    ];

    const respostasFiltradas =
      todasAsRespostas.filter(
        (resposta) =>
          filtroRelatorio ===
            "todos" ||
          resposta.status ===
            filtroRelatorio
      );

    const statusColors: Record<
      string,
      string
    > = {
      conforme:
        "border-emerald-400",
      ressalva:
        "border-amber-400",
      nao_possui:
        "border-rose-400",
    };

    return (
      <main className="min-h-screen bg-slate-100">
        <div className="max-w-4xl mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
          <header className="p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xl z-20">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() =>
                  setView("dashboard")
                }
                className="p-2 rounded-xl bg-slate-100"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <p className="text-[10px] text-cyan-600 font-black tracking-widest">
                  AUDITORIA
                </p>

                <h1 className="text-xl font-black">
                  Relatório da Vistoria
                </h1>

                <p className="text-xs text-slate-400">
                  {vistoria.local}
                  {vistoria.vistoriador
                    ? ` • ${vistoria.vistoriador.nome}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {filtros.map(
                (filtro) => (
                  <button
                    key={filtro.id}
                    onClick={() =>
                      setFiltroRelatorio(
                        filtro.id
                      )
                    }
                    className={`
                      shrink-0
                      px-4 py-2
                      rounded-full
                      text-xs
                      font-black
                      transition-all
                      ${
                        filtroRelatorio ===
                        filtro.id
                          ? "bg-slate-950 text-white"
                          : "bg-slate-100 text-slate-500"
                      }
                    `}
                  >
                    {filtro.label}
                  </button>
                )
              )}
            </div>
          </header>

          <div className="p-5 flex-1 overflow-y-auto bg-slate-50">
            {respostasFiltradas.length ===
            0 ? (
              <div className="text-center py-20">
                <ClipboardCheck
                  size={40}
                  className="mx-auto text-slate-300"
                />

                <p className="text-sm font-bold text-slate-500 mt-4">
                  Nenhum item encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {categorias.map(
                  (cat) => {
                    const itens =
                      checklist.filter(
                        (req) =>
                          req.categoria ===
                            cat &&
                          respostasFiltradas.some(
                            (resposta) =>
                              resposta.requisitoId ===
                              req.id
                          )
                      );

                    if (
                      itens.length === 0
                    ) {
                      return null;
                    }

                    return (
                      <section
                        key={cat}
                      >
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                          {cat}
                        </h3>

                        <div className="space-y-3">
                          {itens.map(
                            (req) => {
                              const resposta =
                                vistoria
                                  .respostas[
                                  req.id
                                ];

                              return (
                                <div
                                  key={
                                    req.id
                                  }
                                  className={`
                                    bg-white
                                    p-5
                                    rounded-2xl
                                    border
                                    border-l-4
                                    shadow-sm
                                    ${
                                      statusColors[
                                        resposta.status
                                      ] ||
                                      "border-slate-200"
                                    }
                                  `}
                                >
                                  <div className="flex justify-between gap-3 mb-3">
                                    <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-lg">
                                      {
                                        req.codigo
                                      }
                                    </span>

                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                      {
                                        req.criticidade
                                      }
                                    </span>
                                  </div>

                                  <p className="font-bold text-slate-800">
                                    {
                                      req.pergunta
                                    }
                                  </p>

                                  {resposta.observacao && (
                                    <div className="mt-3 p-4 bg-slate-50 rounded-xl">
                                      <p className="text-sm text-slate-600 italic">
                                        “
                                        {
                                          resposta.observacao
                                        }
                                        ”
                                      </p>
                                    </div>
                                  )}

                                  {resposta.fotos.length >
                                    0 && (
                                    <div className="mt-4 flex gap-2 flex-wrap">
                                      {resposta.fotos.map(
                                        (
                                          foto,
                                          index
                                        ) => (
                                          <a
                                            key={
                                              index
                                            }
                                            href={
                                              foto
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <img
                                              src={
                                                foto
                                              }
                                              alt={`Evidência ${
                                                index +
                                                1
                                              }`}
                                              className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                                            />
                                          </a>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </section>
                    );
                  }
                )}
              </div>
            )}
          </div>

          <div className="lg:hidden">
            {tabBar}
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     VISTORIA
  ======================================================= */

  if (!requisitoAtual) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <button
          onClick={() =>
            setView("dashboard")
          }
          className="px-6 py-3 bg-cyan-500 rounded-xl font-bold"
        >
          Voltar ao início
        </button>
      </main>
    );
  }

  const respostaAtual =
    vistoria.respostas[
      requisitoAtual.id
    ];

  const progressoItem =
    ((currentIndex + 1) /
      checklist.length) *
    100;

  /* =======================================================
     INTERFACE FUTURISTA DA VISTORIA
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#050b14] text-white overflow-hidden">
      <div className="min-h-screen relative flex">
        {/* GLOW DE FUNDO */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] -top-40 -right-40" />

          <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] bottom-0 left-1/3" />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        {/* SIDEBAR DESKTOP */}

        <div className="hidden lg:block relative z-30 w-[330px] shrink-0">
          {topicListNav}
        </div>

        {/* SIDEBAR MOBILE */}

        {isMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() =>
                setIsMenuOpen(false)
              }
            />

            <div className="relative w-[88%] max-w-[360px] h-full">
              {topicListNav}
            </div>
          </div>
        )}

        {/* ÁREA PRINCIPAL */}

        <section className="relative z-10 flex-1 min-w-0 flex flex-col">
          {/* HEADER */}

          <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() =>
                      setIsMenuOpen(
                        true
                      )
                    }
                    className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10"
                  >
                    <Menu size={20} />
                  </button>

                  <button
                    onClick={() =>
                      setView(
                        "dashboard"
                      )
                    }
                    className="hidden lg:flex p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                  >
                    <Home size={18} />
                  </button>

                  <div className="min-w-0">
                    <p className="text-[9px] tracking-[0.25em] text-cyan-400 font-black">
                      PRÉ-IMPLANTAÇÃO
                    </p>

                    <h1 className="font-black truncate">
                      {vistoria.local}
                    </h1>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[9px] tracking-widest text-slate-500">
                    REQUISITO
                  </p>

                  <p className="font-black text-lg">
                    {String(
                      currentIndex + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                    <span className="text-slate-600">
                      {" "}
                      /{" "}
                      {
                        checklist.length
                      }
                    </span>
                  </p>
                </div>
              </div>

              {/* PROGRESS BAR */}

              <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 transition-all duration-500"
                  style={{
                    width: `${progressoItem}%`,
                  }}
                />
              </div>
            </div>
          </header>

          {/* CONTEÚDO */}

          <div className="flex-1 flex flex-col px-5 sm:px-8 lg:px-12 py-6 lg:py-10 overflow-y-auto">
            {/* IDENTIFICAÇÃO */}

            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-black tracking-wider">
                {requisitoAtual.codigo}
              </span>

              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold">
                {
                  requisitoAtual.categoria
                }
              </span>

              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-500 text-[10px] font-bold">
                {
                  requisitoAtual.criticidade
                }
              </span>

              {respostaAtual && (
                <span className="ml-auto px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-black">
                  ITEM AVALIADO
                </span>
              )}
            </div>

            {/* PERGUNTA */}

            <div className="max-w-4xl">
              <p className="text-[10px] tracking-[0.3em] uppercase text-cyan-400 font-black mb-4">
                PONTO DE CONTROLE
              </p>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] text-white">
                {
                  requisitoAtual.pergunta
                }
              </h2>

              <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />

                Selecione a condição encontrada em campo
              </div>
            </div>

            {/* ESPAÇO */}

            <div className="flex-1 min-h-[40px]" />

            {/* RESPOSTA ATUAL */}

            {respostaAtual && (
              <div className="mb-5 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-3">
                  {respostaAtual.status ===
                  "conforme" ? (
                    <CheckCircle2 className="text-emerald-400" />
                  ) : respostaAtual.status ===
                    "ressalva" ? (
                    <AlertTriangle className="text-amber-400" />
                  ) : (
                    <XCircle className="text-rose-400" />
                  )}

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">
                      Avaliação registrada
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Este item já possui uma resposta. Você pode alterar a avaliação.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* BOTÕES DE AVALIAÇÃO */}

            <div>
              <p className="text-[9px] tracking-[0.25em] text-slate-600 font-black mb-3">
                REGISTRAR CONDIÇÃO
              </p>

              <div className="grid grid-cols-3 gap-3">
                {/* CONFORME */}

                <button
                  onClick={() =>
                    void registrarAvaliacao(
                      "conforme"
                    )
                  }
                  disabled={isSaving}
                  className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-emerald-400/[0.06] border border-emerald-400/20 hover:border-emerald-400/60 hover:bg-emerald-400/10 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-4">
                      <Check
                        size={25}
                        className="text-emerald-400"
                        strokeWidth={3}
                      />
                    </div>

                    <p className="text-left text-sm sm:text-base font-black text-emerald-300">
                      CONFORME
                    </p>

                    <p className="hidden sm:block text-[10px] text-emerald-400/50 mt-1">
                      Requisito atendido
                    </p>
                  </div>
                </button>

                {/* RESSALVA */}

                <button
                  onClick={() =>
                    setModalAberto(
                      "ressalva"
                    )
                  }
                  disabled={isSaving}
                  className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-amber-400/[0.06] border border-amber-400/20 hover:border-amber-400/60 hover:bg-amber-400/10 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4">
                      <AlertTriangle
                        size={25}
                        className="text-amber-400"
                        strokeWidth={2.5}
                      />
                    </div>

                    <p className="text-left text-sm sm:text-base font-black text-amber-300">
                      RESSALVA
                    </p>

                    <p className="hidden sm:block text-[10px] text-amber-400/50 mt-1">
                      Registrar não conformidade
                    </p>
                  </div>
                </button>

                {/* NÃO POSSUI */}

                <button
                  onClick={() =>
                    setModalAberto(
                      "nao_possui"
                    )
                  }
                  disabled={isSaving}
                  className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-rose-400/[0.06] border border-rose-400/20 hover:border-rose-400/60 hover:bg-rose-400/10 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-rose-400/10 border border-rose-400/20 flex items-center justify-center mb-4">
                      <X
                        size={25}
                        className="text-rose-400"
                        strokeWidth={3}
                      />
                    </div>

                    <p className="text-left text-sm sm:text-base font-black text-rose-300">
                      NÃO POSSUI
                    </p>

                    <p className="hidden sm:block text-[10px] text-rose-400/50 mt-1">
                      Recurso inexistente
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* NAVEGAÇÃO */}

            <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={goPrevious}
                disabled={
                  currentIndex ===
                    0 ||
                  isSaving
                }
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft
                  size={18}
                />

                <span className="hidden sm:inline">
                  VOLTAR
                </span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({
                  length: Math.min(
                    checklist.length,
                    7
                  ),
                }).map(
                  (_, index) => {
                    const offset =
                      Math.max(
                        0,
                        Math.min(
                          currentIndex -
                            3,
                          checklist.length -
                            7
                        )
                      );

                    const realIndex =
                      offset +
                      index;

                    return (
                      <button
                        key={
                          realIndex
                        }
                        onClick={() =>
                          setCurrentIndex(
                            realIndex
                          )
                        }
                        className={`
                          w-1.5 h-1.5 rounded-full transition-all
                          ${
                            realIndex ===
                            currentIndex
                              ? "w-5 bg-cyan-400"
                              : vistoria
                                    .respostas[
                                    checklist[
                                      realIndex
                                    ]
                                      ?.id
                                  ]
                                ? "bg-emerald-400"
                                : "bg-white/20"
                          }
                        `}
                      />
                    );
                  }
                )}
              </div>

              <button
                onClick={goNext}
                disabled={
                  currentIndex ===
                    checklist.length -
                      1 ||
                  isSaving
                }
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-400 text-slate-950 text-sm font-black hover:bg-cyan-300 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-[0_0_25px_rgba(34,211,238,0.15)]"
              >
                <span className="hidden sm:inline">
                  AVANÇAR
                </span>

                <ArrowRight
                  size={18}
                />
              </button>
            </div>
          </div>

          {/* MOBILE TAB BAR */}

          <div className="lg:hidden">
            {tabBar}
          </div>
        </section>

        {/* =================================================
            MODAL DE RESSALVA / NÃO POSSUI
        ================================================= */}

        {(modalAberto ===
          "ressalva" ||
          modalAberto ===
            "nao_possui") && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() =>
                setModalAberto(null)
              }
            />

            <div className="relative w-full sm:max-w-xl bg-slate-950 border border-white/10 rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl">
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      p-3 rounded-2xl
                      ${
                        modalAberto ===
                        "ressalva"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-rose-400/10 text-rose-400"
                      }
                    `}
                  >
                    {modalAberto ===
                    "ressalva" ? (
                      <AlertTriangle
                        size={22}
                      />
                    ) : (
                      <X size={22} />
                    )}
                  </div>

                  <div>
                    <p className="text-[9px] tracking-[0.2em] text-slate-500 font-black">
                      REGISTRO DE CAMPO
                    </p>

                    <h3 className="font-black text-lg">
                      {modalAberto ===
                      "ressalva"
                        ? "Registrar ressalva"
                        : "Não possui"}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setModalAberto(null)
                  }
                  className="p-2 rounded-xl bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <textarea
                autoFocus
                className="w-full bg-white/[0.04] border border-white/10 p-4 rounded-2xl outline-none focus:border-cyan-400 resize-none h-32 text-white placeholder:text-slate-600"
                placeholder="Descreva a situação encontrada em campo..."
                value={obsTemp}
                onChange={(event) =>
                  setObsTemp(
                    event.target.value
                  )
                }
              />

              {/* FOTOS */}

              {fotosTemp.length >
                0 && (
                <div className="mt-4">
                  <p className="text-[9px] tracking-widest text-slate-500 font-black mb-2">
                    EVIDÊNCIAS
                  </p>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {fotosTemp.map(
                      (
                        file,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="relative shrink-0"
                        >
                          <img
                            src={URL.createObjectURL(
                              file
                            )}
                            alt={`Preview ${
                              index +
                              1
                            }`}
                            className="w-20 h-20 rounded-xl object-cover border border-white/10"
                          />

                          <button
                            onClick={() =>
                              handleRemoveFoto(
                                index
                              )
                            }
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1"
                          >
                            <X
                              size={
                                13
                              }
                            />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* AÇÕES */}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <label className="cursor-pointer py-3 rounded-xl bg-white/5 border border-white/10 flex justify-center items-center gap-2 text-xs font-black hover:bg-white/10">
                  <Camera
                    size={17}
                  />
                  CÂMERA

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={
                      handleFileSelect
                    }
                  />
                </label>

                <label className="cursor-pointer py-3 rounded-xl bg-white/5 border border-white/10 flex justify-center items-center gap-2 text-xs font-black hover:bg-white/10">
                  <BarChart2
                    size={17}
                  />
                  GALERIA

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={
                      handleFileSelect
                    }
                  />
                </label>
              </div>

              <button
                onClick={() =>
                  void registrarAvaliacao(
                    modalAberto,
                    obsTemp
                  )
                }
                disabled={
                  isSaving ||
                  (!obsTemp.trim() &&
                    fotosTemp.length ===
                      0)
                }
                className="w-full mt-3 py-4 rounded-xl bg-cyan-400 text-slate-950 font-black disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    SALVANDO...
                  </>
                ) : (
                  <>
                    <Check size={19} />
                    REGISTRAR AVALIAÇÃO
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}