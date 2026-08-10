"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Home,
  Image as ImageIcon,
  Menu,
  Mic,
  Paperclip,
  Plus,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { checklist } from "@/data/checklist";
import { StatusAvaliacao, Vistoriador } from "@/types/vistoria";
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
  arquivos?: string[];
  audios?: string[];
  transcricao?: string;
  timestamp: string;
};

type Respostas = Record<string, Resposta>;

/* =========================================================
   PALETA
========================================================= */

const COLORS = {
  ice: "#9AD3E1",
  sky: "#81CDEB",
  metallic: "#84CAD8",
  cerulean: "#54B4E7",
  petrol: "#40ABC9",
  turquoise: "#43C3BC",
  dark: "#1C85A8",
};

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function PreImplantacaoApp() {
  /* -------------------------------------------------------
     NAVEGAÇÃO
  ------------------------------------------------------- */

  const [view, setView] = useState<ViewState>("dashboard");

  const [currentIndex, setCurrentIndex] = useState(0);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useState(false);

  /* -------------------------------------------------------
     VISTORIA
  ------------------------------------------------------- */

  const [activeVistoriaId, setActiveVistoriaId] =
    useState<string | null>(null);

  const [vistoria, setVistoria] = useState<{
    local: string;
    vistoriador: Vistoriador | null;
    respostas: Respostas;
  }>({
    local: "Hospital Base",
    vistoriador: null,
    respostas: {},
  });

  /* -------------------------------------------------------
     VISTORIADORES
  ------------------------------------------------------- */

  const [vistoriadores, setVistoriadores] = useState<
    Vistoriador[]
  >([]);

  /* -------------------------------------------------------
     MODAIS
  ------------------------------------------------------- */

  const [modalAberto, setModalAberto] =
    useState<ModalState>(null);

  const [obsTemp, setObsTemp] = useState("");

  const [fotosTemp, setFotosTemp] = useState<File[]>([]);

  // Evidências por requisito — a vistoria agora é contínua/rolável.
  const [evidenciasTemp, setEvidenciasTemp] = useState<Record<string, File[]>>({});
  const [observacoesTemp, setObservacoesTemp] = useState<Record<string, string>>({});
  const [gravandoAudio, setGravandoAudio] = useState<string | null>(null);
  const [audiosTemp, setAudiosTemp] = useState<Record<string, Blob | null>>({});
  const [transcricoesTemp, setTranscricoesTemp] = useState<Record<string, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const [novoVistoriador, setNovoVistoriador] = useState({
    nome: "",
    funcao: "",
  });

  /* -------------------------------------------------------
     RELATÓRIO
  ------------------------------------------------------- */

  const [filtroRelatorio, setFiltroRelatorio] =
    useState<FiltroRelatorio>("todos");

  /* -------------------------------------------------------
     ESTADO
  ------------------------------------------------------- */

  const [isLoaded, setIsLoaded] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  /* =======================================================
     CARREGAMENTO INICIAL
  ======================================================= */

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        /* -----------------------------------------------
           BUSCA VISTORIADORES
        ------------------------------------------------ */

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
          setVistoriadores(
            (vistoriadoresData || []) as Vistoriador[]
          );
        }

        /* -----------------------------------------------
           RECUPERA VISTORIA ATIVA
        ------------------------------------------------ */

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
              local:
                vistoriaData.local || "Hospital Base",
              respostas:
                vistoriaData.respostas || {},
              vistoriador:
                vistoriaData.vistoriador || null,
            });
          }
        }
      } catch (error) {
        console.error(
          "Erro no carregamento inicial:",
          error
        );
      } finally {
        setIsLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  /* =======================================================
     ATUALIZAÇÃO DA VISTORIA NO BANCO
  ======================================================= */

  const updateVistoriaInDb = async (
    updates: Partial<{
      local: string;
      respostas: Respostas;
      vistoriador: Vistoriador | null;
    }>
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
        updates.vistoriador?.id ?? null;
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
     ATUALIZA ESTADO DA VISTORIA
  ======================================================= */

  const handleSetVistoria = (
    updates: Partial<{
      local: string;
      respostas: Respostas;
      vistoriador: Vistoriador | null;
    }>
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
     NOVO VISTORIADOR
  ======================================================= */

  const handleAddVistoriador = async () => {
    const nome = novoVistoriador.nome.trim();
    const funcao = novoVistoriador.funcao.trim();

    if (!nome || !funcao) {
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from("vistoriadores")
        .insert([
          {
            nome,
            funcao,
          },
        ])
        .select("id, nome, funcao")
        .single();

      if (error) {
        console.error(
          "Erro ao adicionar vistoriador:",
          error
        );

        alert(
          `Não foi possível cadastrar o vistoriador.\n\n${error.message}`
        );

        return;
      }

      if (!data) {
        return;
      }

      const novo = data as Vistoriador;

      /* adiciona à lista */
      setVistoriadores((prev) =>
        [...prev, novo].sort((a, b) =>
          a.nome.localeCompare(b.nome)
        )
      );

      /* seleciona automaticamente */
      handleSetVistoriador(novo);

      /* limpa formulário */
      setNovoVistoriador({
        nome: "",
        funcao: "",
      });

      /* fecha modal */
      setModalAberto(null);
    } catch (error) {
      console.error(
        "Erro inesperado ao adicionar vistoriador:",
        error
      );

      alert(
        "Ocorreu um erro inesperado ao cadastrar o vistoriador."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     EVIDÊNCIAS — FOTO / ARQUIVO / ÁUDIO / TEXTO
  ======================================================= */

  const handleFileSelect = (
    event: ChangeEvent<HTMLInputElement>,
    requisitoId?: string
  ) => {
    if (!event.target.files) return;
    const files = Array.from(event.target.files);
    const id = requisitoId ?? checklist[currentIndex]?.id;
    if (!id) return;

    setEvidenciasTemp((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), ...files],
    }));

    event.target.value = "";
  };

  const handleRemoveEvidence = (requisitoId: string, index: number) => {
    setEvidenciasTemp((prev) => ({
      ...prev,
      [requisitoId]: (prev[requisitoId] || []).filter((_, i) => i !== index),
    }));
  };

  const startVoiceRecognition = (requisitoId: string) => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let textoFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        textoFinal += event.results[i][0].transcript;
      }

      if (textoFinal.trim()) {
        setTranscricoesTemp((prev) => ({
          ...prev,
          [requisitoId]: `${prev[requisitoId] ? `${prev[requisitoId]} ` : ""}${textoFinal.trim()}`.trim(),
        }));
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Reconhecimento de voz:", event?.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecognition = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // navegador pode lançar se o reconhecimento já estiver parado
    }
    recognitionRef.current = null;
  };

  const toggleAudioRecording = async (requisitoId: string) => {
    if (gravandoAudio === requisitoId) {
      mediaRecorderRef.current?.stop();
      stopVoiceRecognition();
      setGravandoAudio(null);
      return;
    }

    if (gravandoAudio) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Este navegador não oferece gravação de áudio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudiosTemp((prev) => ({ ...prev, [requisitoId]: blob }));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setGravandoAudio(requisitoId);
      startVoiceRecognition(requisitoId);
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      alert("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
    }
  };

  const limparEvidenciasTemporarias = (requisitoId: string) => {
    setEvidenciasTemp((prev) => {
      const next = { ...prev };
      delete next[requisitoId];
      return next;
    });
    setAudiosTemp((prev) => {
      const next = { ...prev };
      delete next[requisitoId];
      return next;
    });
    setTranscricoesTemp((prev) => {
      const next = { ...prev };
      delete next[requisitoId];
      return next;
    });
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
      setIsSaving(true);

      try {
        const { data, error } = await supabase
          .from("vistorias")
          .insert({
            local: vistoria.local,
            vistoriador_id:
              vistoria.vistoriador.id,
            respostas: {},
          })
          .select()
          .single();

        if (error) {
          console.error(
            "Erro ao iniciar nova vistoria:",
            error
          );

          alert(
            `Não foi possível iniciar a vistoria.\n\n${error.message}`
          );

          return;
        }

        if (!data) {
          return;
        }

        vistoriaId = data.id;

        setActiveVistoriaId(data.id);

        localStorage.setItem(
          "@active-vistoria-id",
          data.id
        );
      } finally {
        setIsSaving(false);
      }
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
    const primeiroPendente =
      checklist.findIndex(
        (item) =>
          item.categoria === categoria &&
          !vistoria.respostas[item.id]
      );

    const primeiroDaCategoria =
      checklist.findIndex(
        (item) =>
          item.categoria === categoria
      );

    const index =
      primeiroPendente !== -1
        ? primeiroPendente
        : primeiroDaCategoria;

    void handleStartVistoria(index);
  };

  /* =======================================================
     CÁLCULOS
  ======================================================= */

  const totalAvaliados =
    Object.keys(vistoria.respostas).length;

  const progressoTotal =
    checklist.length > 0
      ? Math.round(
          (totalAvaliados /
            checklist.length) *
            100
        )
      : 0;

  const contagem = useMemo(() => {
    const respostas = Object.values(
      vistoria.respostas
    );

    return {
      conforme: respostas.filter(
        (r) => r.status === "conforme"
      ).length,

      ressalva: respostas.filter(
        (r) => r.status === "ressalva"
      ).length,

      naopossui: respostas.filter(
        (r) => r.status === "nao_possui"
      ).length,
    };
  }, [vistoria.respostas]);

  const todasAsRespostas = Object.values(
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

  const resumoCategorias = useMemo(() => {
    return categorias.map((categoria) => {
      const itens = checklist.filter(
        (item) =>
          item.categoria === categoria
      );

      const feitos = itens.filter(
        (item) =>
          vistoria.respostas[item.id]
      ).length;

      const conforme = itens.filter(
        (item) =>
          vistoria.respostas[item.id]
            ?.status === "conforme"
      ).length;

      const ressalva = itens.filter(
        (item) =>
          vistoria.respostas[item.id]
            ?.status === "ressalva"
      ).length;

      const naoPossui = itens.filter(
        (item) =>
          vistoria.respostas[item.id]
            ?.status === "nao_possui"
      ).length;

      return {
        cat: categoria,
        total: itens.length,
        feitos,
        conforme,
        ressalva,
        naoPossui,
      };
    });
  }, [
    categorias,
    vistoria.respostas,
  ]);

  /* =======================================================
     NAVEGAÇÃO DO CHECKLIST
  ======================================================= */

  const navigateToRequisito = (id: string) => {
    const index = checklist.findIndex((item) => item.id === id);
    if (index === -1) return;
    setCurrentIndex(index);
    setIsMenuOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(`requisito-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const goPrevious = () => {
    if (currentIndex <= 0) return;
    const nextIndex = currentIndex - 1;
    setCurrentIndex(nextIndex);
    requestAnimationFrame(() => {
      document.getElementById(`requisito-${checklist[nextIndex].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const goNext = () => {
    if (currentIndex >= checklist.length - 1) return;
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    requestAnimationFrame(() => {
      document.getElementById(`requisito-${checklist[nextIndex].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleTabChange = (
    tab: ViewState
  ) => {
    if (tab === "vistoria") {
      void handleStartVistoria();
      return;
    }

    setView(tab);
  };

  /* =======================================================
     REGISTRAR / ATUALIZAR REQUISITO
  ======================================================= */

  const registrarAvaliacao = async (
    requisitoId: string,
    status: StatusAvaliacao
  ) => {
    if (!activeVistoriaId) {
      alert("Não existe uma vistoria ativa.");
      return;
    }

    const requisito = checklist.find((item) => item.id === requisitoId);
    if (!requisito) return;

    setIsSaving(true);

    try {
      const files = evidenciasTemp[requisitoId] || [];
      const urlsFotos: string[] = [];
      const urlsArquivos: string[] = [];
      const urlsAudios: string[] = [];

      for (const file of files) {
        const ext = file.name.split(".").pop() || "bin";
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = `${activeVistoriaId}/${requisitoId}/${safeName}`;

        const { error } = await supabase.storage
          .from("fotos_vistorias")
          .upload(filePath, file);

        if (error) throw error;

        const { data } = supabase.storage
          .from("fotos_vistorias")
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          if (file.type.startsWith("image/")) urlsFotos.push(data.publicUrl);
          else urlsArquivos.push(data.publicUrl);
        }
      }

      const audio = audiosTemp[requisitoId];
      if (audio) {
        const filePath = `${activeVistoriaId}/${requisitoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
        const { error } = await supabase.storage
          .from("fotos_vistorias")
          .upload(filePath, audio, { contentType: audio.type || "audio/webm" });
        if (error) throw error;

        const { data } = supabase.storage
          .from("fotos_vistorias")
          .getPublicUrl(filePath);
        if (data?.publicUrl) urlsAudios.push(data.publicUrl);
      }

      const observacao = (observacoesTemp[requisitoId] || "").trim();
      const transcricao = (transcricoesTemp[requisitoId] || "").trim();
      const respostaAnterior = vistoria.respostas[requisitoId];

      const novaResposta: Resposta = {
        requisitoId,
        status,
        observacao,
        fotos: [...(respostaAnterior?.fotos || []), ...urlsFotos],
        arquivos: [...(respostaAnterior?.arquivos || []), ...urlsArquivos],
        audios: [...(respostaAnterior?.audios || []), ...urlsAudios],
        transcricao: transcricao || respostaAnterior?.transcricao,
        timestamp: new Date().toISOString(),
      };

      const novasRespostas = {
        ...vistoria.respostas,
        [requisitoId]: novaResposta,
      };

      setVistoria((prev) => ({ ...prev, respostas: novasRespostas }));
      await updateVistoriaInDb({ respostas: novasRespostas });
      limparEvidenciasTemporarias(requisitoId);
    } catch (error: any) {
      console.error("Erro ao salvar avaliação:", error);
      alert(`Não foi possível salvar a avaliação.\n\n${error?.message || "Erro desconhecido."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const salvarObservacao = async (requisitoId: string) => {
    const respostaAnterior = vistoria.respostas[requisitoId];
    if (!respostaAnterior) return;
    await registrarAvaliacao(requisitoId, respostaAnterior.status);
  };

  const scrollToRequisito = (id: string) => {
    const index = checklist.findIndex((item) => item.id === id);
    if (index === -1) return;
    setCurrentIndex(index);
    setIsMenuOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(`requisito-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  /* =======================================================
     TOPIC SIDEBAR
  ======================================================= */

  const topicListNav = (
    <aside
      className={`
        h-full
        bg-white/65
        backdrop-blur-2xl
        border-r
        border-white/70
        shadow-[8px_0_40px_rgba(28,133,168,0.10)]
        overflow-hidden
        transition-all
        duration-300
        ${
          isSidebarCollapsed
            ? "w-[68px]"
            : "w-[290px]"
        }
      `}
    >
      {/* Cabeçalho */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-3
          p-4
          border-b
          border-white/70
        "
      >
        {!isSidebarCollapsed && (
          <div>
            <p
              className="text-[10px] font-black tracking-[0.2em]"
              style={{
                color: COLORS.dark,
              }}
            >
              NAVEGAÇÃO
            </p>

            <p className="text-sm font-bold text-slate-700">
              Tópicos da Vistoria
            </p>
          </div>
        )}

        <button
          onClick={() =>
            setIsSidebarCollapsed(
              (prev) => !prev
            )
          }
          className="
            w-9
            h-9
            rounded-xl
            flex
            items-center
            justify-center
            bg-white/80
            border
            border-white
            shadow-sm
            hover:scale-105
            transition-transform
          "
          style={{
            color: COLORS.dark,
          }}
          title={
            isSidebarCollapsed
              ? "Expandir menu"
              : "Recolher menu"
          }
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>
      </div>

      {/* Lista */}

      <div className="p-3 space-y-2 overflow-y-auto h-[calc(100%-73px)]">
        {categorias.map(
          (categoria) => {
            const itens =
              checklist.filter(
                (item) =>
                  item.categoria ===
                  categoria
              );

            const feitos =
              itens.filter(
                (item) =>
                  vistoria.respostas[
                    item.id
                  ]
              ).length;

            const percentual =
              itens.length > 0
                ? Math.round(
                    (feitos /
                      itens.length) *
                      100
                  )
                : 0;

            return (
              <div
                key={categoria}
                className="rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    abrirCategoria(
                      categoria
                    )
                  }
                  className="
                    w-full
                    text-left
                    p-3
                    bg-white/55
                    hover:bg-white/85
                    border
                    border-white/70
                    transition-all
                  "
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        w-9
                        h-9
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        shrink-0
                      "
                      style={{
                        background:
                          "rgba(67,195,188,0.16)",
                        color:
                          COLORS.dark,
                      }}
                    >
                      <ClipboardCheck
                        size={17}
                      />
                    </div>

                    {!isSidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 truncate">
                            {categoria}
                          </span>

                          <span
                            className="text-[10px] font-black"
                            style={{
                              color:
                                COLORS.dark,
                            }}
                          >
                            {feitos}/
                            {
                              itens.length
                            }
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentual}%`,
                              background:
                                `linear-gradient(90deg, ${COLORS.petrol}, ${COLORS.turquoise})`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </button>

                {!isSidebarCollapsed && (
                  <div className="px-1 pt-1 space-y-1">
                    {itens.map(
                      (req) => {
                        const resposta =
                          vistoria
                            .respostas[
                            req.id
                          ];

                        const isCurrent =
                          req.id ===
                          checklist[
                            currentIndex
                          ]?.id;

                        return (
                          <button
                            key={req.id}
                            onClick={() =>
                              navigateToRequisito(
                                req.id
                              )
                            }
                            className={`
                              w-full
                              text-left
                              flex
                              items-center
                              gap-2
                              px-3
                              py-2
                              rounded-xl
                              text-[11px]
                              transition-all
                              ${
                                isCurrent
                                  ? "bg-white shadow-sm"
                                  : "hover:bg-white/60"
                              }
                            `}
                          >
                            <span
                              className={`
                                w-2
                                h-2
                                rounded-full
                                shrink-0
                                ${
                                  resposta
                                    ? ""
                                    : "bg-slate-300"
                                }
                              `}
                              style={
                                resposta
                                  ? {
                                      background:
                                        resposta.status ===
                                        "conforme"
                                          ? COLORS.turquoise
                                          : resposta.status ===
                                            "ressalva"
                                          ? COLORS.cerulean
                                          : COLORS.dark,
                                    }
                                  : undefined
                              }
                            />

                            <span
                              className={`
                                truncate
                                ${
                                  isCurrent
                                    ? "font-bold text-slate-800"
                                    : "text-slate-500"
                                }
                              `}
                            >
                              {req.codigo}{" "}
                              •{" "}
                              {req.pergunta}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </aside>
  );

  /* =======================================================
     TABS
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
    <nav
      className="
        w-full
        bg-white/75
        backdrop-blur-2xl
        border-t
        border-white
        shadow-[0_-10px_40px_rgba(28,133,168,0.10)]
        flex
        justify-around
        px-2
        py-2
      "
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;

        const ativo =
          view === tab.id;

        const disabled =
          tab.id === "vistoria" &&
          !vistoria.vistoriador;

        return (
          <button
            key={tab.id}
            onClick={() =>
              handleTabChange(
                tab.id
              )
            }
            disabled={disabled}
            className="
              min-w-[80px]
              py-2
              px-3
              rounded-2xl
              flex
              flex-col
              items-center
              gap-1
              transition-all
              disabled:opacity-30
            "
            style={
              ativo
                ? {
                    background:
                      "rgba(84,180,231,0.16)",
                    color:
                      COLORS.dark,
                  }
                : {
                    color:
                      "#64748b",
                  }
            }
          >
            <Icon
              size={20}
              strokeWidth={
                ativo ? 2.7 : 2
              }
            />

            <span className="text-[10px] font-bold">
              {tab.label}
            </span>
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
      <main
        className="
          min-h-screen
          flex
          items-center
          justify-center
        "
        style={{
          background: `
            radial-gradient(
              circle at 20% 10%,
              rgba(129,205,235,0.8),
              transparent 35%
            ),
            linear-gradient(
              135deg,
              #f4fbfd,
              ${COLORS.ice}
            )
          `,
        }}
      >
        <div className="text-center">
          <div
            className="
              w-14
              h-14
              rounded-2xl
              mx-auto
              mb-4
              animate-pulse
              backdrop-blur-xl
              border
              border-white
              shadow-xl
            "
            style={{
              background:
                "rgba(255,255,255,0.55)",
            }}
          />

          <p
            className="font-bold"
            style={{
              color: COLORS.dark,
            }}
          >
            Carregando pré-implantação...
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
      <main
        className="
          min-h-screen
          text-slate-800
          relative
          overflow-hidden
        "
        style={{
          background: `
            radial-gradient(
              circle at 10% 0%,
              rgba(154,211,225,0.90),
              transparent 32%
            ),
            radial-gradient(
              circle at 90% 20%,
              rgba(129,205,235,0.70),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #f7fcfd 0%,
              #e9f7fa 45%,
              #d9f1f5 100%
            )
          `,
        }}
      >
        {/* elementos decorativos */}

        <div
          className="
            absolute
            -top-32
            -right-32
            w-96
            h-96
            rounded-full
            blur-3xl
            opacity-40
          "
          style={{
            background:
              COLORS.cerulean,
          }}
        />

        <div
          className="
            absolute
            -bottom-40
            -left-40
            w-96
            h-96
            rounded-full
            blur-3xl
            opacity-30
          "
          style={{
            background:
              COLORS.turquoise,
          }}
        />

        {/* Header */}

        <header
          className="
            relative
            z-10
            max-w-7xl
            mx-auto
            px-5
            lg:px-8
            pt-6
            pb-4
            flex
            items-center
            justify-between
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-black
                tracking-[0.28em]
                uppercase
              "
              style={{
                color: COLORS.dark,
              }}
            >
              ENGENHARIA CLÍNICA
            </p>

            <h1 className="text-2xl lg:text-4xl font-black tracking-tight mt-1">
              Pré-Implantação
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Centro de comando da vistoria
            </p>
          </div>

          <div
            className="
              hidden
              sm:flex
              items-center
              gap-2
              px-4
              py-2
              rounded-full
              bg-white/60
              backdrop-blur-xl
              border
              border-white
              shadow-sm
            "
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background:
                  COLORS.turquoise,
              }}
            />

            <span className="text-xs font-bold text-slate-600">
              Sistema operacional
            </span>
          </div>
        </header>

        <div
          className="
            relative
            z-10
            max-w-7xl
            mx-auto
            px-5
            lg:px-8
            pb-28
          "
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* -------------------------------------------
                CARD PRINCIPAL
            -------------------------------------------- */}

            <section
              className="
                lg:col-span-2
                rounded-[2rem]
                p-6
                lg:p-7
                bg-white/45
                backdrop-blur-2xl
                border
                border-white/80
                shadow-[0_20px_60px_rgba(28,133,168,0.12)]
                relative
                overflow-hidden
              "
            >
              <div
                className="
                  absolute
                  -right-20
                  -top-20
                  w-52
                  h-52
                  rounded-full
                  blur-2xl
                  opacity-40
                "
                style={{
                  background:
                    COLORS.sky,
                }}
              />

              <div className="relative z-10">
                <p
                  className="
                    text-xs
                    font-black
                    tracking-widest
                    uppercase
                  "
                  style={{
                    color: COLORS.dark,
                  }}
                >
                  LOCAL DA VISTORIA
                </p>

                <input
                  value={vistoria.local}
                  onChange={(event) =>
                    setVistoria(
                      (prev) => ({
                        ...prev,
                        local:
                          event.target
                            .value,
                      })
                    )
                  }
                  onBlur={() =>
                    void updateVistoriaInDb(
                      {
                        local:
                          vistoria.local,
                      }
                    )
                  }
                  disabled={
                    !!activeVistoriaId
                  }
                  className="
                    w-full
                    bg-transparent
                    outline-none
                    text-2xl
                    lg:text-3xl
                    font-black
                    mt-2
                    mb-7
                    placeholder:text-slate-400
                    disabled:opacity-80
                  "
                  placeholder="Nome do hospital"
                />

                {/* progresso */}

                <div
                  className="
                    rounded-[1.5rem]
                    p-5
                    bg-white/55
                    border
                    border-white
                    backdrop-blur-xl
                  "
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="
                        relative
                        w-20
                        h-20
                        rounded-full
                        flex
                        items-center
                        justify-center
                      "
                      style={{
                        background: `
                          conic-gradient(
                            ${COLORS.turquoise} ${progressoTotal}%,
                            rgba(132,202,216,0.20) ${progressoTotal}%
                          )
                        `,
                      }}
                    >
                      <div
                        className="
                          absolute
                          inset-[5px]
                          rounded-full
                          bg-white/85
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <span
                          className="text-xl font-black"
                          style={{
                            color:
                              COLORS.dark,
                          }}
                        >
                          {progressoTotal}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-slate-700">
                        {totalAvaliados} de{" "}
                        {checklist.length}{" "}
                        itens
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {totalAvaliados >
                        0
                          ? "Vistoria em andamento"
                          : "Vistoria não iniciada"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 h-2 rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progressoTotal}%`,
                        background: `
                          linear-gradient(
                            90deg,
                            ${COLORS.cerulean},
                            ${COLORS.turquoise}
                          )
                        `,
                      }}
                    />
                  </div>
                </div>

                {/* VISTORIADOR */}

                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="
                        text-xs
                        font-black
                        uppercase
                        tracking-wider
                        flex
                        items-center
                        gap-2
                      "
                      style={{
                        color:
                          COLORS.dark,
                      }}
                    >
                      <Users size={15} />
                      Vistoriador responsável
                    </label>

                    <button
                      onClick={() =>
                        setModalAberto(
                          "novo_usuario"
                        )
                      }
                      className="
                        text-[10px]
                        font-black
                        flex
                        items-center
                        gap-1
                        px-3
                        py-1.5
                        rounded-full
                        bg-white/80
                        border
                        border-white
                        hover:scale-105
                        transition-transform
                      "
                      style={{
                        color:
                          COLORS.dark,
                      }}
                    >
                      <Plus size={13} />
                      NOVO
                    </button>
                  </div>

                  <div
                    className="
                      flex
                      gap-2
                      bg-white/60
                      rounded-2xl
                      p-2
                      border
                      border-white
                    "
                  >
                    <select
                      className="
                        flex-1
                        min-w-0
                        bg-transparent
                        outline-none
                        px-2
                        py-2
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                      value={
                        vistoria.vistoriador
                          ?.id ?? ""
                      }
                      onChange={(event) => {
                        const id =
                          Number(
                            event.target
                              .value
                          );

                        const selecionado =
                          vistoriadores.find(
                            (v) =>
                              Number(
                                v.id
                              ) === id
                          );

                        if (
                          selecionado
                        ) {
                          handleSetVistoriador(
                            selecionado
                          );
                        }
                      }}
                    >
                      <option value="">
                        Selecione...
                      </option>

                      {vistoriadores.map(
                        (v) => (
                          <option
                            key={v.id}
                            value={v.id}
                          >
                            {v.nome} (
                            {v.funcao})
                          </option>
                        )
                      )}
                    </select>

                    <button
                      onClick={() =>
                        setModalAberto(
                          "novo_usuario"
                        )
                      }
                      className="
                        w-11
                        h-11
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        text-white
                        shadow-lg
                        hover:scale-105
                        active:scale-95
                        transition-transform
                      "
                      style={{
                        background:
                          `linear-gradient(135deg, ${COLORS.cerulean}, ${COLORS.petrol})`,
                      }}
                      title="Novo vistoriador"
                    >
                      <UserPlus
                        size={19}
                      />
                    </button>
                  </div>

                  {!vistoria.vistoriador && (
                    <p className="text-[11px] text-amber-700 mt-2">
                      Selecione um vistoriador
                      para iniciar.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* -------------------------------------------
                MÉTRICAS
            -------------------------------------------- */}

            <section className="lg:col-span-3 grid grid-cols-3 gap-3">
              {[
                {
                  label: "Conformes",
                  value:
                    contagem.conforme,
                  color:
                    COLORS.turquoise,
                  icon: Check,
                },
                {
                  label: "Ressalvas",
                  value:
                    contagem.ressalva,
                  color:
                    COLORS.cerulean,
                  icon: AlertTriangle,
                },
                {
                  label: "Não possui",
                  value:
                    contagem.naopossui,
                  color:
                    COLORS.dark,
                  icon: X,
                },
              ].map((metric) => {
                const Icon =
                  metric.icon;

                return (
                  <div
                    key={metric.label}
                    className="
                      rounded-[1.5rem]
                      p-4
                      bg-white/50
                      backdrop-blur-2xl
                      border
                      border-white/80
                      shadow-[0_15px_40px_rgba(28,133,168,0.08)]
                      flex
                      flex-col
                      justify-between
                      min-h-[130px]
                    "
                  >
                    <div
                      className="
                        w-9
                        h-9
                        rounded-xl
                        flex
                        items-center
                        justify-center
                      "
                      style={{
                        background:
                          `${metric.color}22`,
                        color:
                          metric.color,
                      }}
                    >
                      <Icon
                        size={17}
                      />
                    </div>

                    <div>
                      <span
                        className="block text-3xl font-black"
                        style={{
                          color:
                            metric.color,
                        }}
                      >
                        {metric.value}
                      </span>

                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {metric.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* -----------------------------------------
                  PROGRESSO POR TÓPICO
              ------------------------------------------ */}

              <div
                className="
                  col-span-3
                  rounded-[2rem]
                  p-5
                  bg-white/45
                  backdrop-blur-2xl
                  border
                  border-white/80
                  shadow-[0_20px_60px_rgba(28,133,168,0.10)]
                "
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p
                      className="text-[10px] font-black tracking-[0.2em] uppercase"
                      style={{
                        color:
                          COLORS.dark,
                      }}
                    >
                      CHECKLIST
                    </p>

                    <h2 className="text-lg font-black text-slate-700">
                      Progresso por tópico
                    </h2>
                  </div>

                  <BarChart3
                    size={22}
                    style={{
                      color:
                        COLORS.petrol,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  {resumoCategorias.map(
                    (item) => {
                      const completo =
                        item.feitos ===
                        item.total;

                      return (
                        <button
                          key={item.cat}
                          onClick={() =>
                            abrirCategoria(
                              item.cat
                            )
                          }
                          disabled={
                            !vistoria.vistoriador
                          }
                          className="
                            w-full
                            p-4
                            rounded-2xl
                            bg-white/50
                            hover:bg-white/80
                            border
                            border-white/70
                            text-left
                            transition-all
                            disabled:opacity-40
                            hover:shadow-sm
                            group
                          "
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center gap-3">
                                <span className="font-bold text-sm text-slate-700 truncate">
                                  {item.cat}
                                </span>

                                <span
                                  className="text-xs font-black"
                                  style={{
                                    color:
                                      completo
                                        ? COLORS.turquoise
                                        : COLORS.dark,
                                  }}
                                >
                                  {
                                    item.feitos
                                  }
                                  /
                                  {
                                    item.total
                                  }
                                </span>
                              </div>

                              <div className="mt-2 h-2 rounded-full bg-slate-200/70 overflow-hidden flex">
                                <div
                                  style={{
                                    width: `${
                                      (item.conforme /
                                        item.total) *
                                      100
                                    }%`,
                                    background:
                                      COLORS.turquoise,
                                  }}
                                />

                                <div
                                  style={{
                                    width: `${
                                      (item.ressalva /
                                        item.total) *
                                      100
                                    }%`,
                                    background:
                                      COLORS.cerulean,
                                  }}
                                />

                                <div
                                  style={{
                                    width: `${
                                      (item.naoPossui /
                                        item.total) *
                                      100
                                    }%`,
                                    background:
                                      COLORS.dark,
                                  }}
                                />
                              </div>
                            </div>

                            <ChevronRight
                              size={18}
                              className="text-slate-300 group-hover:translate-x-1 transition-transform"
                            />
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* CTA */}

          <button
            onClick={() =>
              void handleStartVistoria()
            }
            disabled={
              !vistoria.vistoriador ||
              isSaving
            }
            className="
              mt-5
              w-full
              lg:w-auto
              lg:min-w-[360px]
              lg:mx-auto
              py-4
              px-8
              rounded-2xl
              text-white
              font-black
              tracking-wide
              flex
              items-center
              justify-center
              gap-3
              shadow-[0_15px_35px_rgba(64,171,201,0.30)]
              hover:-translate-y-1
              active:translate-y-0
              transition-all
              disabled:opacity-40
            "
            style={{
              background: `
                linear-gradient(
                  135deg,
                  ${COLORS.cerulean},
                  ${COLORS.petrol}
                )
              `,
            }}
          >
            <ClipboardCheck
              size={23}
            />

            {isSaving
              ? "PREPARANDO..."
              : totalAvaliados > 0
              ? "CONTINUAR VISTORIA"
              : "INICIAR VISTORIA"}

            <ArrowRight size={20} />
          </button>
        </div>

        {/* Mobile nav */}

        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
          {tabBar}
        </div>

        {/* NOVO VISTORIADOR */}

        {modalAberto ===
          "novo_usuario" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="
                absolute
                inset-0
                bg-slate-900/20
                backdrop-blur-md
              "
              onClick={() =>
                setModalAberto(null)
              }
            />

            <div
              className="
                relative
                z-10
                w-full
                max-w-md
                rounded-[2rem]
                p-6
                bg-white/80
                backdrop-blur-2xl
                border
                border-white
                shadow-[0_30px_80px_rgba(28,133,168,0.25)]
              "
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      w-11
                      h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                    "
                    style={{
                      background:
                        "rgba(84,180,231,0.16)",
                      color:
                        COLORS.dark,
                    }}
                  >
                    <UserPlus
                      size={21}
                    />
                  </div>

                  <div>
                    <p
                      className="text-[10px] font-black tracking-widest"
                      style={{
                        color:
                          COLORS.dark,
                      }}
                    >
                      CADASTRO
                    </p>

                    <h3 className="text-lg font-black text-slate-700">
                      Novo Vistoriador
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setModalAberto(
                      null
                    )
                  }
                  className="
                    w-9
                    h-9
                    rounded-full
                    bg-white
                    border
                    border-slate-100
                    flex
                    items-center
                    justify-center
                    text-slate-400
                    hover:text-slate-700
                  "
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Nome completo
                  </label>

                  <input
                    autoFocus
                    value={
                      novoVistoriador.nome
                    }
                    onChange={(event) =>
                      setNovoVistoriador(
                        (prev) => ({
                          ...prev,
                          nome:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Ex.: João da Silva"
                    className="
                      w-full
                      px-4
                      py-3.5
                      rounded-xl
                      bg-white/70
                      border
                      border-slate-200
                      outline-none
                      text-slate-700
                      focus:ring-2
                    "
                    style={{
                      outlineColor:
                        COLORS.sky,
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Função
                  </label>

                  <input
                    value={
                      novoVistoriador.funcao
                    }
                    onChange={(event) =>
                      setNovoVistoriador(
                        (prev) => ({
                          ...prev,
                          funcao:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Ex.: Engenheiro Clínico"
                    className="
                      w-full
                      px-4
                      py-3.5
                      rounded-xl
                      bg-white/70
                      border
                      border-slate-200
                      outline-none
                      text-slate-700
                    "
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() =>
                    setModalAberto(
                      null
                    )
                  }
                  className="
                    flex-1
                    py-3.5
                    rounded-xl
                    font-bold
                    text-slate-500
                    bg-slate-100
                    hover:bg-slate-200
                  "
                >
                  CANCELAR
                </button>

                <button
                  onClick={() =>
                    void handleAddVistoriador()
                  }
                  disabled={
                    !novoVistoriador.nome.trim() ||
                    !novoVistoriador.funcao.trim() ||
                    isSaving
                  }
                  className="
                    flex-[1.7]
                    py-3.5
                    rounded-xl
                    font-black
                    text-white
                    disabled:opacity-40
                    transition-all
                    shadow-lg
                  "
                  style={{
                    background: `
                      linear-gradient(
                        135deg,
                        ${COLORS.cerulean},
                        ${COLORS.petrol}
                      )
                    `,
                  }}
                >
                  {isSaving
                    ? "SALVANDO..."
                    : "SALVAR E USAR"}
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
    const respostasFiltradas =
      todasAsRespostas.filter(
        (resposta) =>
          filtroRelatorio ===
            "todos" ||
          resposta.status ===
            filtroRelatorio
      );

    const filtros = [
      {
        id: "todos" as FiltroRelatorio,
        label: `Todos (${todasAsRespostas.length})`,
        color: COLORS.dark,
      },
      {
        id: "conforme" as FiltroRelatorio,
        label: `Conformes (${contagem.conforme})`,
        color: COLORS.turquoise,
      },
      {
        id: "ressalva" as FiltroRelatorio,
        label: `Ressalvas (${contagem.ressalva})`,
        color: COLORS.cerulean,
      },
      {
        id: "nao_possui" as FiltroRelatorio,
        label: `Não Possui (${contagem.naopossui})`,
        color: COLORS.dark,
      },
    ];

    return (
      <main
        className="
          min-h-screen
          relative
          overflow-hidden
        "
        style={{
          background: `
            radial-gradient(
              circle at 15% 0%,
              rgba(154,211,225,0.7),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #f7fcfd,
              #e3f5f8
            )
          `,
        }}
      >
        <div className="max-w-5xl mx-auto min-h-screen flex flex-col">
          {/* HEADER */}

          <header
            className="
              sticky
              top-0
              z-20
              p-5
              bg-white/65
              backdrop-blur-2xl
              border-b
              border-white
            "
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setView("dashboard")
                }
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-white/80
                  border
                  border-white
                  flex
                  items-center
                  justify-center
                  shadow-sm
                  hover:scale-105
                  transition-transform
                "
                style={{
                  color: COLORS.dark,
                }}
              >
                <ArrowLeft
                  size={19}
                />
              </button>

              <div className="flex-1">
                <p
                  className="text-[10px] font-black tracking-[0.2em]"
                  style={{
                    color:
                      COLORS.dark,
                  }}
                >
                  CHECKLIST DE PRÉ-IMPLANTAÇÃO
                </p>

                <h1 className="text-xl font-black text-slate-700">
                  Relatório da Vistoria
                </h1>

                <p className="text-xs text-slate-500">
                  {vistoria.local}

                  {vistoria.vistoriador
                    ? ` • ${vistoria.vistoriador.nome}`
                    : ""}
                </p>
              </div>
            </div>

            {/* filtros */}

            <div className="flex gap-2 overflow-x-auto mt-4 pb-1">
              {filtros.map(
                (filtro) => {
                  const ativo =
                    filtroRelatorio ===
                    filtro.id;

                  return (
                    <button
                      key={
                        filtro.id
                      }
                      onClick={() =>
                        setFiltroRelatorio(
                          filtro.id
                        )
                      }
                      className="
                        shrink-0
                        px-4
                        py-2
                        rounded-full
                        text-xs
                        font-black
                        transition-all
                      "
                      style={
                        ativo
                          ? {
                              background:
                                filtro.color,
                              color:
                                "#fff",
                              boxShadow:
                                `0 8px 20px ${filtro.color}33`,
                            }
                          : {
                              background:
                                "rgba(255,255,255,0.65)",
                              color:
                                "#64748b",
                            }
                      }
                    >
                      {filtro.label}
                    </button>
                  );
                }
              )}
            </div>
          </header>

          {/* CONTEÚDO */}

          <div className="flex-1 p-5 pb-24">
            {respostasFiltradas.length ===
            0 ? (
              <div
                className="
                  mt-10
                  rounded-[2rem]
                  p-10
                  text-center
                  bg-white/55
                  backdrop-blur-xl
                  border
                  border-white
                "
              >
                <ClipboardCheck
                  size={40}
                  className="mx-auto mb-4 opacity-40"
                  style={{
                    color:
                      COLORS.dark,
                  }}
                />

                <p className="font-bold text-slate-600">
                  Nenhum item encontrado.
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Inicie a vistoria para
                  gerar o relatório.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {categorias.map(
                  (categoria) => {
                    const itens =
                      checklist.filter(
                        (req) =>
                          req.categoria ===
                            categoria &&
                          respostasFiltradas.some(
                            (r) =>
                              r.requisitoId ===
                              req.id
                          )
                      );

                    if (
                      itens.length ===
                      0
                    ) {
                      return null;
                    }

                    return (
                      <section
                        key={
                          categoria
                        }
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background:
                                COLORS.turquoise,
                            }}
                          />

                          <h3
                            className="
                              text-xs
                              font-black
                              uppercase
                              tracking-[0.18em]
                            "
                            style={{
                              color:
                                COLORS.dark,
                            }}
                          >
                            {categoria}
                          </h3>
                        </div>

                        <div className="space-y-3">
                          {itens.map(
                            (req) => {
                              const resposta =
                                vistoria
                                  .respostas[
                                  req.id
                                ];

                              if (
                                !resposta
                              ) {
                                return null;
                              }

                              const statusColor =
                                resposta.status ===
                                "conforme"
                                  ? COLORS.turquoise
                                  : resposta.status ===
                                    "ressalva"
                                  ? COLORS.cerulean
                                  : COLORS.dark;

                              return (
                                <article
                                  key={
                                    req.id
                                  }
                                  className="
                                    rounded-[1.5rem]
                                    p-5
                                    bg-white/60
                                    backdrop-blur-xl
                                    border
                                    border-white
                                    shadow-sm
                                    relative
                                    overflow-hidden
                                  "
                                >
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-1"
                                    style={{
                                      background:
                                        statusColor,
                                    }}
                                  />

                                  <div className="flex justify-between gap-3">
                                    <span
                                      className="
                                        text-[10px]
                                        font-black
                                        px-2
                                        py-1
                                        rounded-lg
                                      "
                                      style={{
                                        color:
                                          COLORS.dark,
                                        background:
                                          "rgba(154,211,225,0.25)",
                                      }}
                                    >
                                      {
                                        req.codigo
                                      }
                                    </span>

                                    <span
                                      className="
                                        text-[10px]
                                        font-black
                                        uppercase
                                      "
                                      style={{
                                        color:
                                          statusColor,
                                      }}
                                    >
                                      {
                                        resposta.status
                                      }
                                    </span>
                                  </div>

                                  <h4 className="font-bold text-slate-700 mt-3">
                                    {
                                      req.pergunta
                                    }
                                  </h4>

                                  {resposta.observacao && (
                                    <div className="mt-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                      <p className="text-sm text-slate-600 italic">
                                        “
                                        {
                                          resposta.observacao
                                        }
                                        ”
                                      </p>
                                    </div>
                                  )}

                                  {resposta.fotos &&
                                    resposta
                                      .fotos
                                      .length >
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
                                                className="
                                                  w-20
                                                  h-20
                                                  rounded-xl
                                                  object-cover
                                                  border
                                                  border-white
                                                  shadow-sm
                                                  hover:scale-105
                                                  transition-transform
                                                "
                                              />
                                            </a>
                                          )
                                        )}
                                      </div>
                                    )}
                                </article>
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

          <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
            {tabBar}
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     VISTORIA — PAINEL CONTÍNUO / ROLÁVEL
  ======================================================= */

  const currentRequisito = checklist[currentIndex] || checklist[0];

  return (
    <main
      className="min-h-screen text-slate-800 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(154,211,225,0.78), transparent 30%),
          radial-gradient(circle at 100% 12%, rgba(129,205,235,0.52), transparent 28%),
          radial-gradient(circle at 50% 100%, rgba(67,195,188,0.18), transparent 34%),
          linear-gradient(135deg, #f8fdfe 0%, #eaf8fa 48%, #d9f2f5 100%)
        `,
      }}
    >
      <div className="min-h-screen flex">
        <div className="hidden lg:block shrink-0">
          {topicListNav}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-2xl border-b border-white/80 px-4 lg:px-7 py-3 shadow-[0_10px_35px_rgba(28,133,168,0.08)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("dashboard")}
                className="w-10 h-10 rounded-xl bg-white/75 border border-white flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0"
                style={{ color: COLORS.dark }}
                title="Voltar ao início"
              >
                <ArrowLeft size={19} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: COLORS.dark }}>VISTORIA CONTÍNUA</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-[10px] font-bold text-slate-500 truncate">{currentRequisito?.categoria}</span>
                </div>
                <h1 className="font-black text-sm lg:text-base text-slate-700 truncate">{vistoria.local}</h1>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/65 border border-white">
                <span className="text-sm font-black" style={{ color: COLORS.dark }}>{currentIndex + 1}</span>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xs font-bold text-slate-500">{checklist.length}</span>
              </div>

              <button
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden w-10 h-10 rounded-xl bg-white/75 border border-white flex items-center justify-center"
                style={{ color: COLORS.dark }}
              >
                <Menu size={19} />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/70 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressoTotal}%`, background: `linear-gradient(90deg, ${COLORS.cerulean}, ${COLORS.turquoise})` }} />
              </div>
              <span className="text-[10px] font-black" style={{ color: COLORS.dark }}>{progressoTotal}% concluído</span>
            </div>
          </header>

          <section className="flex-1 px-3 sm:px-5 lg:px-8 py-5 lg:py-7 pb-28">
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="rounded-[2rem] p-5 lg:p-6 bg-white/48 backdrop-blur-2xl border border-white/80 shadow-[0_20px_70px_rgba(28,133,168,0.10)]">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.24em] uppercase" style={{ color: COLORS.dark }}>ROTEIRO DE INSPEÇÃO</p>
                    <h2 className="text-xl lg:text-2xl font-black text-slate-700 mt-1">Todos os requisitos em uma única tela</h2>
                    <p className="text-xs text-slate-500 mt-1">Role a página, registre o status e anexe evidências sem trocar de tela.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {categorias.map((categoria) => {
                      const total = checklist.filter((item) => item.categoria === categoria).length;
                      const feitos = checklist.filter((item) => item.categoria === categoria && vistoria.respostas[item.id]).length;
                      return (
                        <button key={categoria} onClick={() => abrirCategoria(categoria)} className="px-3 py-2 rounded-full bg-white/65 border border-white text-[10px] font-black text-slate-500 hover:bg-white transition-colors">
                          {categoria.split("—")[1]?.trim() || categoria} · {feitos}/{total}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {checklist.map((req, index) => {
                const resposta = vistoria.respostas[req.id];
                const files = evidenciasTemp[req.id] || [];
                const audio = audiosTemp[req.id];
                const observacao = observacoesTemp[req.id] ?? resposta?.observacao ?? "";
                const transcricao = transcricoesTemp[req.id] ?? resposta?.transcricao ?? "";
                const isCurrent = index === currentIndex;
                const statusColor = resposta?.status === "conforme" ? COLORS.turquoise : resposta?.status === "ressalva" ? COLORS.cerulean : resposta?.status === "nao_possui" ? COLORS.dark : COLORS.metallic;

                return (
                  <article
                    id={`requisito-${req.id}`}
                    key={req.id}
                    onMouseEnter={() => setCurrentIndex(index)}
                    className={`relative rounded-[1.65rem] p-4 sm:p-5 bg-white/55 backdrop-blur-2xl border transition-all duration-300 ${isCurrent ? "border-white shadow-[0_18px_50px_rgba(28,133,168,0.13)]" : "border-white/70 shadow-sm"}`}
                    style={{ borderLeft: `4px solid ${statusColor}` }}
                  >
                    <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: isCurrent ? COLORS.sky : COLORS.ice }} />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black" style={{ color: COLORS.dark, background: "rgba(154,211,225,0.28)" }}>{req.codigo}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{req.criticidade}</span>
                          </div>
                          <h3 className="mt-3 text-base sm:text-lg font-black leading-snug text-slate-700">{req.pergunta}</h3>
                        </div>
                        <span className="shrink-0 text-[9px] font-black text-slate-400">{index + 1}/{checklist.length}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {([
                          { status: "conforme" as StatusAvaliacao, label: "Conforme", icon: Check, color: COLORS.turquoise },
                          { status: "ressalva" as StatusAvaliacao, label: "Ressalva", icon: AlertTriangle, color: COLORS.cerulean },
                          { status: "nao_possui" as StatusAvaliacao, label: "Não possui", icon: X, color: COLORS.dark },
                        ]).map((action) => {
                          const Icon = action.icon;
                          const active = resposta?.status === action.status;
                          return (
                            <button
                              key={action.status}
                              onClick={() => void registrarAvaliacao(req.id, action.status)}
                              disabled={isSaving}
                              className="min-h-[64px] sm:min-h-[70px] rounded-xl px-2 py-2 flex flex-col items-center justify-center gap-1 border transition-all active:scale-[0.98] disabled:opacity-40"
                              style={{
                                color: action.color,
                                background: active ? `${action.color}1F` : "rgba(255,255,255,0.58)",
                                borderColor: active ? `${action.color}66` : "rgba(255,255,255,0.9)",
                                boxShadow: active ? `0 8px 22px ${action.color}22` : undefined,
                              }}
                            >
                              <Icon size={19} strokeWidth={2.8} />
                              <span className="text-[10px] font-black uppercase">{action.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 rounded-2xl p-3 bg-white/38 border border-white/70">
                        <p className="text-[9px] font-black tracking-[0.18em] uppercase text-slate-400 mb-2">EVIDÊNCIAS</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <label className="cursor-pointer rounded-xl px-2 py-2.5 bg-white/65 border border-white flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 hover:bg-white transition-colors">
                            <Camera size={16} style={{ color: COLORS.cerulean }} /> CÂMERA
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleFileSelect(event, req.id)} />
                          </label>
                          <label className="cursor-pointer rounded-xl px-2 py-2.5 bg-white/65 border border-white flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 hover:bg-white transition-colors">
                            <ImageIcon size={16} style={{ color: COLORS.petrol }} /> GALERIA
                            <input type="file" accept="image/*,*/*" multiple className="hidden" onChange={(event) => handleFileSelect(event, req.id)} />
                          </label>
                          <button type="button" onClick={() => void toggleAudioRecording(req.id)} className="rounded-xl px-2 py-2.5 bg-white/65 border border-white flex items-center justify-center gap-2 text-[10px] font-black transition-colors" style={{ color: gravandoAudio === req.id ? COLORS.dark : COLORS.turquoise, background: gravandoAudio === req.id ? "rgba(28,133,168,0.12)" : undefined }}>
                            {gravandoAudio === req.id ? <X size={16} /> : <Mic size={16} />} {gravandoAudio === req.id ? "PARAR" : "ÁUDIO"}
                          </button>
                          <button type="button" onClick={() => document.getElementById(`obs-${req.id}`)?.focus()} className="rounded-xl px-2 py-2.5 bg-white/65 border border-white flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 hover:bg-white transition-colors">
                            <FileText size={16} style={{ color: COLORS.dark }} /> TEXTO
                          </button>
                        </div>

                        {(files.length > 0 || audio || observacao || transcricao || resposta?.fotos?.length || resposta?.arquivos?.length || resposta?.audios?.length) && (
                          <div className="mt-3 space-y-2">
                            {files.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {files.map((file, fileIndex) => (
                                  <div key={`${file.name}-${fileIndex}`} className="relative shrink-0">
                                    {file.type.startsWith("image/") ? (
                                      <img src={URL.createObjectURL(file)} alt={`Evidência ${fileIndex + 1}`} className="w-16 h-16 rounded-xl object-cover border border-white shadow-sm" />
                                    ) : (
                                      <div className="w-16 h-16 rounded-xl bg-white/75 border border-white flex items-center justify-center"><Paperclip size={19} style={{ color: COLORS.dark }} /></div>
                                    )}
                                    <button type="button" onClick={() => handleRemoveEvidence(req.id, fileIndex)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center" style={{ color: COLORS.dark }}><X size={12} /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {audio && <audio controls src={URL.createObjectURL(audio)} className="w-full h-9" />}
                          </div>
                        )}

                        <textarea
                          id={`obs-${req.id}`}
                          value={observacao}
                          onChange={(event) => setObservacoesTemp((prev) => ({ ...prev, [req.id]: event.target.value }))}
                          placeholder="Observação técnica, medição, condição encontrada ou evidência relevante..."
                          className="mt-3 w-full min-h-[70px] resize-y rounded-xl bg-white/55 border border-white p-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#81CDEB]/40"
                        />

                        {transcricao && (
                          <div className="mt-2 rounded-xl bg-[#9AD3E1]/15 border border-white p-3">
                            <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: COLORS.dark }}>TRANSCRIÇÃO DE VOZ</p>
                            <p className="text-xs text-slate-600 mt-1">{transcricao}</p>
                          </div>
                        )}

                        {(observacao || transcricao || files.length || audio) && (
                          <button type="button" onClick={() => void salvarObservacao(req.id)} disabled={isSaving} className="mt-2 px-3 py-2 rounded-xl text-[10px] font-black text-white disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${COLORS.cerulean}, ${COLORS.petrol})` }}>
                            SALVAR EVIDÊNCIAS / OBSERVAÇÃO
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Navegação anterior/próximo — sem trocar de página */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 lg:pb-4 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto rounded-2xl p-2 bg-white/75 backdrop-blur-2xl border border-white shadow-[0_12px_45px_rgba(28,133,168,0.16)] flex items-center gap-2">
          <button onClick={goPrevious} disabled={currentIndex === 0} className="flex-1 py-2.5 rounded-xl bg-white/75 border border-white text-[10px] font-black text-slate-500 flex items-center justify-center gap-1.5 disabled:opacity-30">
            <ChevronLeft size={16} /> ANTERIOR
          </button>
          <div className="px-3 text-center shrink-0">
            <p className="text-[9px] font-black" style={{ color: COLORS.dark }}>{currentIndex + 1} / {checklist.length}</p>
            <p className="text-[8px] text-slate-400 uppercase tracking-wider">requisito</p>
          </div>
          <button onClick={goNext} disabled={currentIndex >= checklist.length - 1} className="flex-1 py-2.5 rounded-xl text-white text-[10px] font-black flex items-center justify-center gap-1.5 disabled:opacity-30" style={{ background: `linear-gradient(135deg, ${COLORS.cerulean}, ${COLORS.petrol})` }}>
            PRÓXIMO <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Sidebar mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">{topicListNav}</div>
        </div>
      )}
    </main>
  );
}