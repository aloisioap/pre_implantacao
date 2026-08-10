"use client";

import {
  Camera,
  Image as ImageIcon,
  Paperclip,
  Mic,
  Square,
  Trash2,
  Play,
  Pause,
  FileText,
  Loader2,
  CheckCircle2,
  X,
  Volume2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import type {
  Evidencia,
  TranscricaoAudio,
} from "@/types/vistoria";

interface EvidenciasVistoriaProps {
  requisitoId: string;

  evidencias?: Evidencia[];

  transcricao?: TranscricaoAudio;

  observacao?: string;

  onObservacaoChange?: (texto: string) => void;

  onEvidenciasChange?: (evidencias: Evidencia[]) => void;

  onTranscricaoChange?: (
    transcricao: TranscricaoAudio
  ) => void;

  disabled?: boolean;
}

type GravacaoEstado =
  | "parado"
  | "gravando"
  | "processando";

export default function EvidenciasVistoria({
  requisitoId,
  evidencias = [],
  transcricao,
  observacao = "",
  onObservacaoChange,
  onEvidenciasChange,
  onTranscricaoChange,
  disabled = false,
}: EvidenciasVistoriaProps) {
  const [gravacaoEstado, setGravacaoEstado] =
    useState<GravacaoEstado>("parado");

  const [duracaoGravacao, setDuracaoGravacao] =
    useState(0);

  const [audioPreview, setAudioPreview] =
    useState<string | null>(null);

  const [audioTocando, setAudioTocando] =
    useState(false);

  const [erro, setErro] =
    useState<string | null>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const audioElementRef =
    useRef<HTMLAudioElement | null>(null);

  const timerRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  /*
   * Limpa recursos quando o componente
   * é desmontado.
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
    };
  }, [audioPreview]);

  /*
   * Formata segundos para MM:SS.
   */
  const formatarDuracao = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);

    const segundosRestantes =
      segundos % 60;

    return `${String(minutos).padStart(
      2,
      "0"
    )}:${String(segundosRestantes).padStart(
      2,
      "0"
    )}`;
  };

  /*
   * Adiciona evidências ao estado
   * do componente pai.
   */
  const adicionarEvidencias = (
    novasEvidencias: Evidencia[]
  ) => {
    onEvidenciasChange?.([
      ...evidencias,
      ...novasEvidencias,
    ]);
  };

  /*
   * Remove uma evidência.
   */
  const removerEvidencia = (
    id: string
  ) => {
    const evidencia = evidencias.find(
      (item) => item.id === id
    );

    /*
     * Só revoga URLs blob locais.
     * URLs do Supabase não devem
     * ser revogadas.
     */
    if (
      evidencia?.url?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        evidencia.url
      );
    }

    onEvidenciasChange?.(
      evidencias.filter(
        (item) => item.id !== id
      )
    );

    /*
     * Se a evidência removida era o
     * áudio associado à transcrição,
     * limpa a transcrição.
     */
    if (
      transcricao?.evidenciaId === id
    ) {
      onTranscricaoChange?.({
        texto: "",
        status: "pendente",
      });
    }
  };

  /*
   * Processa fotos e arquivos selecionados.
   */
  const handleArquivos = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const arquivos =
      event.target.files;

    if (
      !arquivos ||
      arquivos.length === 0
    ) {
      return;
    }

    setErro(null);

    const novasEvidencias: Evidencia[] =
      Array.from(arquivos).map(
        (arquivo) => {
          const url =
            URL.createObjectURL(
              arquivo
            );

          const tipo: Evidencia["tipo"] =
            arquivo.type.startsWith(
              "image/"
            )
              ? "foto"
              : "arquivo";

          return {
            id: crypto.randomUUID(),
            tipo,
            url,
            nome: arquivo.name,
            mimeType: arquivo.type,
            tamanho: arquivo.size,
            timestamp:
              new Date().toISOString(),
          };
        }
      );

    adicionarEvidencias(
      novasEvidencias
    );

    /*
     * Permite selecionar novamente
     * o mesmo arquivo.
     */
    event.target.value = "";
  };

  /*
   * Inicia a gravação do áudio.
   */
  const iniciarGravacao =
    async () => {
      try {
        setErro(null);

        if (
          typeof navigator ===
            "undefined" ||
          !navigator.mediaDevices
            ?.getUserMedia
        ) {
          setErro(
            "Seu navegador não suporta gravação de áudio."
          );

          return;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        let mimeType = "";

        if (
          MediaRecorder.isTypeSupported(
            "audio/webm;codecs=opus"
          )
        ) {
          mimeType =
            "audio/webm;codecs=opus";
        } else if (
          MediaRecorder.isTypeSupported(
            "audio/webm"
          )
        ) {
          mimeType =
            "audio/webm";
        } else if (
          MediaRecorder.isTypeSupported(
            "audio/mp4"
          )
        ) {
          mimeType =
            "audio/mp4";
        }

        const recorder =
          new MediaRecorder(
            stream,
            mimeType
              ? { mimeType }
              : undefined
          );

        mediaRecorderRef.current =
          recorder;

        audioChunksRef.current =
          [];

        recorder.ondataavailable =
          (event) => {
            if (
              event.data.size > 0
            ) {
              audioChunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onstop = () => {
          const blob =
            new Blob(
              audioChunksRef.current,
              {
                type:
                  recorder.mimeType ||
                  "audio/webm",
              }
            );

          const url =
            URL.createObjectURL(
              blob
            );

          setAudioPreview(url);

          const novaEvidencia: Evidencia =
            {
              id: crypto.randomUUID(),

              tipo: "audio",

              url,

              nome: `vistoria-${requisitoId}-${Date.now()}.webm`,

              mimeType:
                recorder.mimeType ||
                "audio/webm",

              tamanho:
                blob.size,

              duracao:
                duracaoGravacao,

              timestamp:
                new Date().toISOString(),
            };

          adicionarEvidencias([
            novaEvidencia,
          ]);

          /*
           * A transcrição ainda não
           * é executada nesta etapa.
           *
           * Fluxo futuro:
           *
           * Áudio
           *   ↓
           * Supabase Storage
           *   ↓
           * Edge Function
           *   ↓
           * Speech-to-Text
           */
          onTranscricaoChange?.({
            texto: "",
            status: "pendente",
            evidenciaId:
              novaEvidencia.id,
            timestamp:
              new Date().toISOString(),
          });

          stream
            .getTracks()
            .forEach(
              (track) =>
                track.stop()
            );

          setGravacaoEstado(
            "parado"
          );
        };

        recorder.start();

        setDuracaoGravacao(0);

        setGravacaoEstado(
          "gravando"
        );

        timerRef.current =
          setInterval(() => {
            setDuracaoGravacao(
              (valor) =>
                valor + 1
            );
          }, 1000);
      } catch (error) {
        console.error(
          "Erro ao acessar microfone:",
          error
        );

        setErro(
          "Não foi possível acessar o microfone. Verifique a permissão do navegador."
        );

        setGravacaoEstado(
          "parado"
        );
      }
    };

  /*
   * Finaliza a gravação.
   */
  const pararGravacao = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current
        .state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }
  };

  /*
   * Alterna gravação.
   */
  const alternarGravacao = () => {
    if (disabled) {
      return;
    }

    if (
      gravacaoEstado ===
      "gravando"
    ) {
      pararGravacao();
    } else {
      iniciarGravacao();
    }
  };

  /*
   * Reproduz / pausa o áudio.
   */
  const alternarAudio = () => {
    if (
      !audioElementRef.current
    ) {
      return;
    }

    if (audioTocando) {
      audioElementRef.current.pause();

      setAudioTocando(false);
    } else {
      audioElementRef.current
        .play()
        .then(() => {
          setAudioTocando(true);
        })
        .catch((error) => {
          console.error(
            "Erro ao reproduzir áudio:",
            error
          );
        });
    }
  };

  /*
   * Cancela somente a prévia
   * local da última gravação.
   */
  const cancelarAudioPreview =
    () => {
      if (audioPreview) {
        URL.revokeObjectURL(
          audioPreview
        );
      }

      setAudioPreview(null);

      setAudioTocando(false);

      /*
       * Remove também a última
       * evidência de áudio local.
       */
      const ultimoAudio =
        [...evidencias]
          .reverse()
          .find(
            (item) =>
              item.tipo ===
                "audio" &&
              item.url.startsWith(
                "blob:"
              )
          );

      if (ultimoAudio) {
        onEvidenciasChange?.(
          evidencias.filter(
            (item) =>
              item.id !==
              ultimoAudio.id
          )
        );

        if (
          transcricao?.evidenciaId ===
          ultimoAudio.id
        ) {
          onTranscricaoChange?.({
            texto: "",
            status: "pendente",
          });
        }
      }
    };

  const imagens =
    evidencias.filter(
      (evidencia) =>
        evidencia.tipo === "foto"
    );

  const arquivos =
    evidencias.filter(
      (evidencia) =>
        evidencia.tipo ===
        "arquivo"
    );

  const audios =
    evidencias.filter(
      (evidencia) =>
        evidencia.tipo === "audio"
    );

  return (
    <div className="space-y-3">

      {/* ================================================= */}
      {/* ÁREA DE EVIDÊNCIAS */}
      {/* ================================================= */}

      <div
        className="
          rounded-3xl
          border border-white/60
          bg-white/55
          backdrop-blur-xl
          shadow-[0_10px_40px_rgba(28,133,168,0.08)]
          p-4
        "
      >

        <div className="flex items-center justify-between mb-3">

          <div>
            <p className="text-xs font-black tracking-[0.18em] uppercase text-[#1C85A8]">
              Evidências
            </p>

            <p className="text-[11px] text-slate-500 mt-0.5">
              Registre o que foi encontrado em campo
            </p>
          </div>

          {evidencias.length > 0 && (
            <span
              className="
                px-2.5 py-1
                rounded-full
                bg-[#9AD3E1]/25
                text-[#1C85A8]
                text-[10px]
                font-black
              "
            >
              {evidencias.length}
            </span>
          )}

        </div>

        {/* ============================================= */}
        {/* BOTÕES */}
        {/* ============================================= */}

        <div className="grid grid-cols-3 gap-2">

          {/* CÂMERA */}

          <label
            className={`
              relative
              cursor-pointer
              overflow-hidden
              rounded-2xl
              p-3
              min-h-[78px]
              flex
              flex-col
              items-center
              justify-center
              gap-1.5
              border
              border-[#81CDEB]/40
              bg-gradient-to-br
              from-[#9AD3E1]/30
              to-[#54B4E7]/10
              text-[#1C85A8]
              shadow-[inset_0_1px_0_rgba(255,255,255,.7)]
              transition-all
              hover:-translate-y-0.5
              hover:shadow-lg
              active:scale-95
              ${
                disabled
                  ? "opacity-50 pointer-events-none"
                  : ""
              }
            `}
          >

            <span
              className="
                absolute
                -right-4
                -top-5
                w-14
                h-14
                rounded-full
                bg-[#81CDEB]/20
                blur-xl
              "
            />

            <Camera size={22} />

            <span className="text-[10px] font-black tracking-wide">
              CÂMERA
            </span>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={
                handleArquivos
              }
              disabled={disabled}
            />

          </label>

          {/* GALERIA */}

          <label
            className={`
              relative
              cursor-pointer
              overflow-hidden
              rounded-2xl
              p-3
              min-h-[78px]
              flex
              flex-col
              items-center
              justify-center
              gap-1.5
              border
              border-[#43C3BC]/35
              bg-gradient-to-br
              from-[#43C3BC]/18
              to-[#84CAD8]/10
              text-[#1C85A8]
              transition-all
              hover:-translate-y-0.5
              hover:shadow-lg
              active:scale-95
              ${
                disabled
                  ? "opacity-50 pointer-events-none"
                  : ""
              }
            `}
          >

            <span
              className="
                absolute
                -left-4
                -bottom-5
                w-16
                h-16
                rounded-full
                bg-[#43C3BC]/15
                blur-xl
              "
            />

            <ImageIcon size={22} />

            <span className="text-[10px] font-black tracking-wide">
              GALERIA
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={
                handleArquivos
              }
              disabled={disabled}
            />

          </label>

          {/* ÁUDIO */}

          <button
            type="button"
            onClick={
              alternarGravacao
            }
            disabled={disabled}
            className={`
              relative
              overflow-hidden
              rounded-2xl
              p-3
              min-h-[78px]
              flex
              flex-col
              items-center
              justify-center
              gap-1.5
              border
              transition-all
              active:scale-95
              ${
                gravacaoEstado ===
                "gravando"
                  ? `
                    border-[#1C85A8]/50
                    bg-[#1C85A8]/10
                    text-[#1C85A8]
                    shadow-[0_0_25px_rgba(28,133,168,.18)]
                  `
                  : `
                    border-[#54B4E7]/35
                    bg-gradient-to-br
                    from-[#54B4E7]/15
                    to-[#43C3BC]/10
                    text-[#1C85A8]
                    hover:-translate-y-0.5
                    hover:shadow-lg
                  `
              }
              ${
                disabled
                  ? "opacity-50"
                  : ""
              }
            `}
          >

            {gravacaoEstado ===
            "gravando" ? (
              <>
                <span
                  className="
                    absolute
                    inset-2
                    rounded-xl
                    border
                    border-[#1C85A8]/20
                    animate-pulse
                  "
                />

                <Square
                  size={19}
                  fill="currentColor"
                />

                <span className="text-[10px] font-black tracking-wide">
                  PARAR
                </span>

                <span className="text-[9px] font-bold opacity-70">
                  {formatarDuracao(
                    duracaoGravacao
                  )}
                </span>
              </>
            ) : (
              <>
                <Mic size={22} />

                <span className="text-[10px] font-black tracking-wide">
                  ÁUDIO
                </span>

                <span className="text-[9px] opacity-60">
                  Gravar
                </span>
              </>
            )}

          </button>

        </div>

        {/* ============================================= */}
        {/* BOTÃO ARQUIVO */}
        {/* ============================================= */}

        <label
          className={`
            mt-2
            flex
            items-center
            justify-center
            gap-2
            py-2.5
            rounded-xl
            border
            border-dashed
            border-[#84CAD8]/50
            bg-white/40
            text-[#1C85A8]
            text-[10px]
            font-bold
            cursor-pointer
            transition-all
            hover:bg-white/70
            ${
              disabled
                ? "opacity-50 pointer-events-none"
                : ""
            }
          `}
        >

          <Paperclip size={15} />

          ANEXAR ARQUIVO / DOCUMENTO

          <input
            type="file"
            multiple
            className="hidden"
            onChange={
              handleArquivos
            }
            disabled={disabled}
          />

        </label>

        {/* ============================================= */}
        {/* ERRO */}
        {/* ============================================= */}

        {erro && (
          <div
            className="
              mt-3
              flex
              items-start
              gap-2
              p-3
              rounded-xl
              bg-red-50
              border
              border-red-100
              text-red-600
              text-xs
            "
          >

            <X
              size={15}
              className="shrink-0 mt-0.5"
            />

            <span>{erro}</span>

          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* ÁUDIO GRAVADO */}
      {/* ================================================= */}

      {audioPreview && (
        <div
          className="
            rounded-2xl
            border
            border-[#43C3BC]/25
            bg-gradient-to-r
            from-[#43C3BC]/10
            to-[#9AD3E1]/15
            p-3
          "
        >

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={
                alternarAudio
              }
              className="
                w-10
                h-10
                rounded-full
                flex
                items-center
                justify-center
                bg-[#1C85A8]
                text-white
                shadow-md
                active:scale-95
              "
            >
              {audioTocando ? (
                <Pause size={17} />
              ) : (
                <Play
                  size={17}
                  className="ml-0.5"
                />
              )}
            </button>

            <div className="flex-1 min-w-0">

              <p className="text-xs font-black text-[#1C85A8]">
                Áudio registrado
              </p>

              <p className="text-[10px] text-slate-500">
                {formatarDuracao(
                  duracaoGravacao
                )}
                {" • "}
                aguardando transcrição
              </p>

            </div>

            <button
              type="button"
              onClick={
                cancelarAudioPreview
              }
              className="
                p-2
                rounded-lg
                text-slate-400
                hover:text-red-500
              "
            >
              <Trash2 size={16} />
            </button>

          </div>

          <audio
            ref={audioElementRef}
            src={audioPreview}
            onEnded={() =>
              setAudioTocando(false)
            }
            className="hidden"
          />

        </div>
      )}

      {/* ================================================= */}
      {/* TRANSCRIÇÃO */}
      {/* ================================================= */}

      {transcricao && (
        <div
          className="
            rounded-2xl
            border
            border-[#81CDEB]/30
            bg-white/65
            backdrop-blur-xl
            p-4
          "
        >

          <div className="flex items-center gap-2 mb-3">

            {transcricao.status ===
            "processando" ? (
              <Loader2
                size={16}
                className="text-[#1C85A8] animate-spin"
              />
            ) : transcricao.status ===
              "concluida" ? (
              <CheckCircle2
                size={16}
                className="text-[#43C3BC]"
              />
            ) : (
              <Volume2
                size={16}
                className="text-[#54B4E7]"
              />
            )}

            <span className="text-xs font-black text-[#1C85A8]">
              TRANSCRIÇÃO
            </span>

            {transcricao.status ===
              "processando" && (
              <span className="text-[10px] text-slate-400">
                Processando...
              </span>
            )}

            {transcricao.status ===
              "pendente" && (
              <span className="text-[10px] text-slate-400">
                Aguardando processamento
              </span>
            )}

          </div>

          {transcricao.texto ? (
            <textarea
              value={
                transcricao.texto
              }
              onChange={(event) =>
                onTranscricaoChange?.({
                  ...transcricao,
                  texto:
                    event.target.value,
                })
              }
              disabled={disabled}
              className="
                w-full
                min-h-[90px]
                resize-none
                bg-[#9AD3E1]/8
                border
                border-[#84CAD8]/20
                rounded-xl
                p-3
                text-sm
                text-slate-700
                outline-none
                focus:ring-2
                focus:ring-[#54B4E7]/30
              "
              placeholder="A transcrição aparecerá aqui..."
            />
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">

              <Loader2
                size={14}
                className={
                  transcricao.status ===
                  "processando"
                    ? "animate-spin"
                    : ""
                }
              />

              Aguardando transcrição
              do áudio...

            </div>
          )}

          {transcricao.erro && (
            <p className="mt-2 text-xs text-red-500">
              {transcricao.erro}
            </p>
          )}

        </div>
      )}

      {/* ================================================= */}
      {/* OBSERVAÇÃO */}
      {/* ================================================= */}

      <div
        className="
          rounded-2xl
          border
          border-white/70
          bg-white/45
          backdrop-blur-lg
          p-4
        "
      >

        <div className="flex items-center gap-2 mb-2">

          <FileText
            size={16}
            className="text-[#1C85A8]"
          />

          <span className="text-xs font-black text-[#1C85A8]">
            OBSERVAÇÃO TÉCNICA
          </span>

        </div>

        <textarea
          value={observacao}
          onChange={(event) =>
            onObservacaoChange?.(
              event.target.value
            )
          }
          disabled={disabled}
          placeholder="Descreva a condição encontrada, medidas, valores, não conformidades ou observações relevantes..."
          className="
            w-full
            min-h-[90px]
            resize-none
            rounded-xl
            bg-white/60
            border
            border-[#84CAD8]/20
            p-3
            text-sm
            text-slate-700
            outline-none
            placeholder:text-slate-400
            focus:bg-white/80
            focus:ring-2
            focus:ring-[#54B4E7]/25
          "
        />

      </div>

      {/* ================================================= */}
      {/* GALERIA DE EVIDÊNCIAS */}
      {/* ================================================= */}

      {(
        imagens.length > 0 ||
        arquivos.length > 0 ||
        audios.length > 0
      ) && (
        <div
          className="
            rounded-2xl
            border
            border-[#9AD3E1]/30
            bg-white/45
            backdrop-blur-lg
            p-4
          "
        >

          <div className="flex items-center gap-2 mb-3">

            <ImageIcon
              size={15}
              className="text-[#1C85A8]"
            />

            <span className="text-xs font-black text-[#1C85A8]">
              REGISTROS
            </span>

          </div>

          <div className="flex flex-wrap gap-2">

            {/* FOTOS */}

            {imagens.map(
              (evidencia) => (
                <div
                  key={
                    evidencia.id
                  }
                  className="
                    relative
                    w-20
                    h-20
                    rounded-xl
                    overflow-hidden
                    border
                    border-white
                    shadow-sm
                    group
                  "
                >

                  <img
                    src={
                      evidencia.url
                    }
                    alt={
                      evidencia.nome ||
                      "Evidência da vistoria"
                    }
                    className="
                      w-full
                      h-full
                      object-cover
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removerEvidencia(
                        evidencia.id
                      )
                    }
                    className="
                      absolute
                      top-1
                      right-1
                      w-6
                      h-6
                      rounded-full
                      bg-black/50
                      text-white
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <X size={12} />
                  </button>

                </div>
              )
            )}

            {/* ARQUIVOS */}

            {arquivos.map(
              (evidencia) => (
                <div
                  key={
                    evidencia.id
                  }
                  className="
                    relative
                    w-20
                    h-20
                    rounded-xl
                    border
                    border-[#84CAD8]/30
                    bg-white/70
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1
                    p-2
                  "
                >

                  <FileText
                    size={22}
                    className="text-[#1C85A8]"
                  />

                  <span
                    className="
                      text-[8px]
                      text-slate-500
                      text-center
                      truncate
                      w-full
                    "
                  >
                    {evidencia.nome}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removerEvidencia(
                        evidencia.id
                      )
                    }
                    className="
                      absolute
                      top-1
                      right-1
                      text-slate-400
                      hover:text-red-500
                    "
                  >
                    <X size={12} />
                  </button>

                </div>
              )
            )}

            {/* ÁUDIOS */}

            {audios.map(
              (evidencia) => (
                <div
                  key={
                    evidencia.id
                  }
                  className="
                    relative
                    min-w-[180px]
                    rounded-xl
                    border
                    border-[#43C3BC]/25
                    bg-[#43C3BC]/8
                    p-3
                  "
                >

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={() => {
                        const audio =
                          new Audio(
                            evidencia.url
                          );

                        audio
                          .play()
                          .catch(
                            (error) => {
                              console.error(
                                "Erro ao reproduzir áudio:",
                                error
                              );
                            }
                          );
                      }}
                      className="
                        w-8
                        h-8
                        rounded-full
                        bg-[#1C85A8]
                        text-white
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <Play
                        size={13}
                        className="ml-0.5"
                      />
                    </button>

                    <div className="min-w-0">

                      <p className="text-[10px] font-black text-[#1C85A8]">
                        Áudio
                      </p>

                      <p className="text-[9px] text-slate-400 truncate">
                        {formatarDuracao(
                          evidencia.duracao ||
                            0
                        )}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removerEvidencia(
                          evidencia.id
                        )
                      }
                      className="
                        ml-auto
                        text-slate-400
                        hover:text-red-500
                      "
                    >
                      <Trash2
                        size={14}
                      />
                    </button>

                  </div>

                </div>
              )
            )}

          </div>

        </div>
      )}

    </div>
  );
}