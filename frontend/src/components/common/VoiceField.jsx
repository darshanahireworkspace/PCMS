import { Mic, MicOff } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

function VoiceField({
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  textarea = false,
  lang = "mr-IN",
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const finalTextRef = useRef("");

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const stopVoice = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  };

  const startVoice = () => {
    if (isIOS) {
      toast.error("iPhone वर browser voice typing supported नाही. Keyboard mic वापरा.");
      return;
    }

    if (!window.isSecureContext) {
      toast.error("Voice typing HTTPS वरच नीट काम करते.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("This browser does not support voice typing");
      return;
    }

    if (listening) {
      stopVoice();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      finalTextRef.current = "";

      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
        toast.success("Listening...");
      };

      recognition.onresult = (event) => {
        let transcript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        finalTextRef.current = transcript.trim();
      };

      recognition.onerror = (event) => {
        const error = event.error;

        if (error === "not-allowed" || error === "service-not-allowed") {
          toast.error("Microphone permission blocked");
        } else if (error === "no-speech") {
          toast.error("Speech ऐकू आली नाही. पुन्हा बोला.");
        } else if (error === "audio-capture") {
          toast.error("Microphone not found");
        } else if (error === "network") {
          toast.error("Voice typing साठी internet required आहे");
        } else if (error === "aborted") {
          // ignore user stop
        } else {
          toast.error("Voice typing failed. Try again.");
        }

        setListening(false);
      };

      recognition.onend = () => {
        const spokenText = finalTextRef.current;

        if (spokenText) {
          onChange({
            target: {
              name,
              value: value ? `${value} ${spokenText}` : spokenText,
            },
          });
        }

        setListening(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch {
      toast.error("Voice typing already running. Try again.");
      setListening(false);
    }
  };

  return (
    <div className={`voice-field ${listening ? "voice-active" : ""}`}>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}

      <button type="button" className="voice-btn" onClick={startVoice}>
        {listening ? <MicOff size={17} /> : <Mic size={17} />}
      </button>
    </div>
  );
}

export default VoiceField;