"use client";

import {
  Camera,
  Image as ImageIcon,
  Mic,
  MicOff,
  Play,
  Pause,
  Trash2,
  Check,
  Sparkles,
  Wand2,
  Loader2,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

interface EvidenciasVistoriaProps {
  requisitoId: string;

  observacao: string;

  onObservacaoChange: (value: string) => void;

  fotos: File[];

  onFotosChange: (files: File[]) => void;

  audio?: Blob | null;

  onAudioChange?: (audio: Blob | null) => void;

  transcricao?: string;

  onTranscricaoChange?: (texto: string) => void;
}

type SpeechRecognitionEventLike = Event & {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start: () => void;
  stop: () => void;

  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  onresult:
    | ((event: SpeechRecognitionEventLike) => void)
    | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function EvidenciasVistoria({
  requisitoId,
  observacao,
  onObservacaoChange,
  fotos,
  onFotosChange,
  audio,
  onAudioChange,
  transcricao = "",
  onTranscricaoChange,
}: EvidenciasVistoriaProps) {
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);

  const [duracao, setDuracao] = useState(0);

  const [previewFotos, setPreviewFotos] = useState<
    { file: File; url: string }[]
  >([]);

  const [audioUrl, setAudioUrl] = useState<string | null>(
    null
  );

  const [reproduzindo, setReproduzindo] = useState(false);

  const [transcricaoTemporaria, setTranscricaoTemporaria] =
    useState("");

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);

  const audioElementRef =
    useRef<HTMLAudioElement | null>(null);

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null);

  const timerRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Gera previews das fotos.
   */
  useEffect(() => {
    const previews = fotos.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviewFotos(previews);

    return () => {
      previews.forEach((preview) =>
        URL.revokeObjectURL(preview.url)
      );
    };
  }, [fotos]);

  /**
   * Cria URL temporária do áudio.
   */
  useEffect(() => {
    if (!audio) {
      setAudioUrl(null);
      return;
    }

    const url = URL.createObjectURL(audio);

    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audio]);

  /**
   * Limpa timer.
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      recognitionRef.current?.stop();
    };
  }, []);

  /**
   * Fotos.
   */
  const handleFotos = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files) return;

    const novasFotos = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    onFotosChange([...fotos, ...novasFotos]);

    event.target.value = "";
  };

  const removerFoto = (index: number) => {
    const novasFotos = fotos.filter(
      (_, fotoIndex) => fotoIndex !== index
    );

    onFotosChange(novasFotos);
  };

  /**
   * Gravação de áudio.
   */
  const iniciarGravacao = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert(
          "Seu navegador não permite gravação de áudio."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(
          audioChunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        onAudioChange?.(blob);

        stream.getTracks().forEach((track) =>
          track.stop()
        );
      };

      recorder.start();

      mediaRecorderRef.current = recorder;

      setGravando(true);
      setDuracao(0);

      timerRef.current = setInterval(() => {
        setDuracao((valor) => valor + 1);
      }, 1000);
    } catch (error) {
      console.error(
        "Erro ao iniciar gravação:",
        error
      );

      alert(
        "Não foi possível acessar o microfone."
      );
    }
  };

  const pararGravacao = () => {
    mediaRecorderRef.current?.stop();

    setGravando(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /**
   * Speech-to-text.
   *
   * O navegador transforma a fala em texto.
   */
  const iniciarTranscricao = () => {
    if (transcrevendo) {
      recognitionRef.current?.stop();
      setTranscrevendo(false);
      return;
    }

    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      alert(
        "A transcrição de voz não está disponível neste navegador. Use Chrome ou Edge."
      );

      return;
    }

    const recognition = new Recognition();

    recognition.lang = "pt-BR";

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.onstart = () => {
      setTranscrevendo(true);
      setTranscricaoTemporaria("");
    };

    recognition.onresult = (event) => {
      let textoFinal = "";
      let textoIntermediario = "";

      for (
        let i = 0;
        i < Object.keys(event.results).length;
        i++
      ) {
        const resultado = event.results[i];

        if (!resultado) continue;

        const texto =
          resultado[0]?.transcript || "";

        /**
         * O primeiro índice representa
         * o resultado principal.
         */
        if (texto) {
          textoIntermediario += `${texto} `;
        }
      }

      textoFinal = textoIntermediario.trim();

      setTranscricaoTemporaria(textoFinal);
    };

    recognition.onerror = (event) => {
      console.error(
        "Erro na transcrição:",
        event
      );

      setTranscrevendo(false);
    };

    recognition.onend = () => {
      setTranscrevendo(false);
    };

    recognitionRef.current = recognition;

    recognition.start();
  };

  /**
   * Insere texto reconhecido nas observações.
   */
  const inserirTranscricao = () => {
    const texto =
      transcricaoTemporaria || transcricao;

    if (!texto.trim()) return;

    const novaObservacao = observacao.trim()
      ? `${observacao.trim()}\n\n${texto.trim()}`
      : texto.trim();

    onObservacaoChange(novaObservacao);

    onTranscricaoChange?.(texto.trim());

    setTranscricaoTemporaria("");
  };

  const apagarAudio = () => {
    onAudioChange?.(null);
    setReproduzindo(false);
  };

  const toggleAudio = () => {
    const audioElement =
      audioElementRef.current;

    if (!audioElement) return;

    if (reproduzindo) {
      audioElement.pause();
      setReproduzindo(false);
    } else {
      audioElement.play();
      setReproduzindo(true);
    }
  };

  const formatarTempo = (segundos: number) => {
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

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-[#9AD3E1]/40
        bg-white/70
        backdrop-blur-xl
        shadow-[0_15px_50px_rgba(28,133,168,0.08)]
        p-4
        sm:p-5
      "
    >
      {/* AQUARELA DE FUNDO */}
      <div
        className="
          pointer-events-none
          absolute
          -top-24
          -right-24
          w-64
          h-64
          rounded-full
          bg-[#43C3BC]/10
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-24
          -left-24
          w-64
          h-64
          rounded-full
          bg-[#81CDEB]/15
          blur-3xl
        "
      />

      <div className="relative z-10">

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.18em]
                font-bold
                text-[#1C85A8]/70
              "
            >
              Evidências
            </p>

            <p className="text-sm font-semibold text-[#1C85A8]">
              Registro técnico
            </p>
          </div>

          <Sparkles
            size={18}
            className="text-[#43C3BC]"
          />
        </div>

        {/* OBSERVAÇÃO */}
        <textarea
          value={observacao}
          onChange={(event) =>
            onObservacaoChange(
              event.target.value
            )
          }
          placeholder="Descreva a situação encontrada..."
          className="
            w-full
            min-h-[100px]
            resize-none
            rounded-2xl
            border
            border-[#9AD3E1]/50
            bg-[#F7FCFD]/80
            px-4
            py-3
            text-sm
            text-[#1C85A8]
            placeholder:text-[#1C85A8]/40
            outline-none
            transition
            focus:border-[#43C3BC]
            focus:ring-4
            focus:ring-[#43C3BC]/10
          "
        />

        {/* LINHA DE AÇÕES */}
        <div className="
          grid
          grid-cols-3
          gap-2
          mt-3
        ">

          {/* CÂMERA */}
          <label
            className="
              group
              relative
              overflow-hidden
              cursor-pointer
              min-h-[64px]
              rounded-2xl
              border
              border-[#43C3BC]/30
              bg-gradient-to-br
              from-[#43C3BC]/20
              to-[#9AD3E1]/20
              flex
              flex-col
              items-center
              justify-center
              gap-1
              text-[#1C85A8]
              transition-all
              hover:-translate-y-0.5
              hover:shadow-lg
              hover:shadow-[#43C3BC]/10
              active:scale-[0.98]
            "
          >
            <Camera
              size={22}
              strokeWidth={2}
            />

            <span className="text-xs font-bold">
              Câmera
            </span>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFotos}
            />
          </label>

          {/* GALERIA */}
          <label
            className="
              group
              relative
              overflow-hidden
              cursor-pointer
              min-h-[64px]
              rounded-2xl
              border
              border-[#54B4E7]/30
              bg-gradient-to-br
              from-[#81CDEB]/20
              to-[#54B4E7]/10
              flex
              flex-col
              items-center
              justify-center
              gap-1
              text-[#1C85A8]
              transition-all
              hover:-translate-y-0.5
              hover:shadow-lg
              hover:shadow-[#54B4E7]/10
              active:scale-[0.98]
            "
          >
            <ImageIcon
              size={22}
              strokeWidth={2}
            />

            <span className="text-xs font-bold">
              Galeria
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFotos}
            />
          </label>

          {/* VOZ */}
          <button
            type="button"
            onClick={
              gravando
                ? pararGravacao
                : iniciarGravacao
            }
            className={`
              relative
              overflow-hidden
              min-h-[64px]
              rounded-2xl
              border
              flex
              flex-col
              items-center
              justify-center
              gap-1
              transition-all
              active:scale-[0.98]

              ${
                gravando
                  ? `
                    border-red-300
                    bg-red-50
                    text-red-600
                  `
                  : `
                    border-[#1C85A8]/20
                    bg-gradient-to-br
                    from-[#1C85A8]/10
                    to-[#43C3BC]/10
                    text-[#1C85A8]
                    hover:-translate-y-0.5
                    hover:shadow-lg
                  `
              }
            `}
          >
            {gravando ? (
              <>
                <MicOff size={22} />

                <span className="text-xs font-bold">
                  Parar
                </span>
              </>
            ) : (
              <>
                <Mic size={22} />

                <span className="text-xs font-bold">
                  Gravar voz
                </span>
              </>
            )}
          </button>
        </div>

        {/* INDICADOR DE GRAVAÇÃO */}
        {gravando && (
          <div
            className="
              mt-3
              rounded-2xl
              border
              border-red-200
              bg-red-50/70
              px-4
              py-3
              flex
              items-center
              justify-between
            "
          >
            <div className="flex items-center gap-3">
              <span
                className="
                  w-3
                  h-3
                  rounded-full
                  bg-red-500
                  animate-pulse
                "
              />

              <div>
                <p className="text-xs font-bold text-red-600">
                  GRAVANDO ÁUDIO
                </p>

                <p className="text-[11px] text-red-500/70">
                  Fale normalmente para registrar
                  a evidência.
                </p>
              </div>
            </div>

            <span className="font-mono text-sm font-bold text-red-600">
              {formatarTempo(duracao)}
            </span>
          </div>
        )}

        {/* PREVIEW DAS FOTOS */}
        {previewFotos.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1C85A8]">
                FOTOS REGISTRADAS
              </span>

              <span className="text-[10px] text-[#1C85A8]/50">
                {previewFotos.length} arquivo(s)
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {previewFotos.map(
                (preview, index) => (
                  <div
                    key={`${preview.file.name}-${index}`}
                    className="
                      relative
                      shrink-0
                      w-20
                      h-20
                      rounded-xl
                      overflow-hidden
                      border
                      border-[#9AD3E1]/50
                      shadow-sm
                    "
                  >
                    <img
                      src={preview.url}
                      alt={`Evidência ${index + 1}`}
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removerFoto(index)
                      }
                      className="
                        absolute
                        top-1
                        right-1
                        w-6
                        h-6
                        rounded-full
                        bg-white/90
                        text-red-500
                        flex
                        items-center
                        justify-center
                        shadow
                      "
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ÁUDIO */}
        {audio && audioUrl && (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-[#43C3BC]/25
              bg-[#43C3BC]/5
              p-3
              flex
              items-center
              gap-3
            "
          >
            <button
              type="button"
              onClick={toggleAudio}
              className="
                w-11
                h-11
                rounded-full
                bg-[#43C3BC]
                text-white
                flex
                items-center
                justify-center
                shadow-lg
                shadow-[#43C3BC]/20
              "
            >
              {reproduzindo ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}
            </button>

            <audio
              ref={audioElementRef}
              src={audioUrl}
              onEnded={() =>
                setReproduzindo(false)
              }
              className="hidden"
            />

            <div className="flex-1">
              <p className="text-xs font-bold text-[#1C85A8]">
                Áudio da vistoria
              </p>

              <p className="text-[10px] text-[#1C85A8]/50">
                Evidência sonora registrada
              </p>
            </div>

            <button
              type="button"
              onClick={apagarAudio}
              className="
                p-2
                rounded-xl
                text-red-400
                hover:bg-red-50
              "
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        {/* TRANSCRIÇÃO */}
        <div
          className="
            mt-4
            rounded-2xl
            border
            border-[#84CAD8]/40
            bg-gradient-to-br
            from-white/80
            to-[#9AD3E1]/10
            p-4
          "
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="
                  w-8
                  h-8
                  rounded-xl
                  bg-[#43C3BC]/15
                  text-[#1C85A8]
                  flex
                  items-center
                  justify-center
                "
              >
                <Wand2 size={16} />
              </div>

              <div>
                <p className="text-xs font-bold text-[#1C85A8]">
                  Transcrição inteligente
                </p>

                <p className="text-[10px] text-[#1C85A8]/50">
                  Fale e transforme em observação
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={iniciarTranscricao}
              className={`
                px-3
                py-2
                rounded-xl
                text-xs
                font-bold
                flex
                items-center
                gap-2
                transition

                ${
                  transcrevendo
                    ? `
                      bg-[#1C85A8]
                      text-white
                    `
                    : `
                      bg-[#43C3BC]/10
                      text-[#1C85A8]
                      hover:bg-[#43C3BC]/20
                    `
                }
              `}
            >
              {transcrevendo ? (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />

                  Ouvindo...
                </>
              ) : (
                <>
                  <Mic size={14} />

                  Transcrever
                </>
              )}
            </button>
          </div>

          {/* TEXTO DA TRANSCRIÇÃO */}
          {(transcricaoTemporaria ||
            transcricao) && (
            <div className="mt-3">
              <div
                className="
                  rounded-xl
                  bg-white/70
                  border
                  border-[#9AD3E1]/40
                  p-3
                "
              >
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#43C3BC] mb-1">
                  Texto convertido
                </p>

                <p className="text-sm text-[#1C85A8] leading-relaxed">
                  {transcricaoTemporaria ||
                    transcricao}
                </p>
              </div>

              <button
                type="button"
                onClick={inserirTranscricao}
                className="
                  mt-2
                  w-full
                  py-2.5
                  rounded-xl
                  bg-[#43C3BC]/10
                  border
                  border-[#43C3BC]/20
                  text-[#1C85A8]
                  text-xs
                  font-bold
                  flex
                  items-center
                  justify-center
                  gap-2
                  hover:bg-[#43C3BC]/20
                  transition
                "
              >
                <Check size={15} />

                Inserir nas observações
              </button>
            </div>
          )}

          {!transcrevendo &&
            !transcricaoTemporaria &&
            !transcricao && (
              <p className="mt-3 text-[10px] text-[#1C85A8]/40 text-center">
                Exemplo: "Foi identificada
                ausência de aterramento na tomada
                da bancada."
              </p>
            )}
        </div>

        {/* STATUS */}
        {fotos.length === 0 &&
          !audio &&
          !transcricao && (
            <div
              className="
                mt-3
                rounded-xl
                bg-[#9AD3E1]/10
                py-3
                text-center
                text-xs
                text-[#1C85A8]/50
              "
            >
              Nenhuma evidência adicional
              neste item.
            </div>
          )}
      </div>
    </section>
  );
}