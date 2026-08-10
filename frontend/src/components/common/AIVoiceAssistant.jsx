import { Mic, X } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function AIVoiceAssistant() {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const includesAny = (text, words) => {
    return words.some((word) => text.includes(word));
  };

  const cleanSearchText = (text) => {
    return normalize(text)
      .replaceAll("search", "")
      .replaceAll("find", "")
      .replaceAll("show", "")
      .replaceAll("open", "")
      .replaceAll("navigate", "")
      .replaceAll("go to", "")
      .replaceAll("where is", "")
      .replaceAll("mandal", "")
      .replaceAll("temple", "")
      .replaceAll("mandir", "")
      .replaceAll("masjid", "")
      .replaceAll("mosque", "")
      .replaceAll("place", "")
      .replaceAll("location", "")
      .replaceAll("शोध", "")
      .replaceAll("शोधा", "")
      .replaceAll("दाखव", "")
      .replaceAll("दाखवा", "")
      .replaceAll("उघड", "")
      .replaceAll("ओपन", "")
      .replaceAll("मंदिर", "")
      .replaceAll("मंडळ", "")
      .replaceAll("मस्जिद", "")
      .replaceAll("लोकेशन", "")
      .trim();
  };

  const goMapSearch = (text) => {
    const searchText = cleanSearchText(text);

    localStorage.setItem("mapSearch", searchText || normalize(text));
    navigate("/map-view");

    toast.success(searchText ? `Searching: ${searchText}` : "Opening map search");
  };

  const handleCommand = (rawText) => {
    const command = normalize(rawText);

    if (!command) {
      toast.error("Voice clear नाही. पुन्हा बोला.");
      return;
    }

    toast.success(`Heard: ${rawText}`);

    if (
      includesAny(command, [
        "high risk",
        "high-risk",
        "danger",
        "sensitive",
        "critical",
        "हाय रिस्क",
        "जास्त रिस्क",
        "धोकादायक",
        "संवेदनशील",
      ])
    ) {
      localStorage.setItem("mapCommand", "highRisk");
      navigate("/map-view");
      return;
    }

    if (
      includesAny(command, [
        "medium risk",
        "medium-risk",
        "मिडियम रिस्क",
        "मध्यम रिस्क",
      ])
    ) {
      localStorage.setItem("mapCommand", "mediumRisk");
      navigate("/map-view");
      return;
    }

    if (
      includesAny(command, [
        "low risk",
        "low-risk",
        "लो रिस्क",
        "कमी रिस्क",
      ])
    ) {
      localStorage.setItem("mapCommand", "lowRisk");
      navigate("/map-view");
      return;
    }

    if (
      includesAny(command, [
        "add religious",
        "add temple",
        "add mandir",
        "religious add",
        "मंदिर जोडा",
        "धार्मिक स्थळ जोडा",
      ])
    ) {
      navigate("/add-religious-place");
      return;
    }

    if (
      includesAny(command, [
        "add festival",
        "add permission",
        "add mandal",
        "festival add",
        "mandal add",
        "उत्सव परवानगी जोडा",
        "मंडळ जोडा",
        "गणेश मंडळ जोडा",
      ])
    ) {
      navigate("/add-festival-permission");
      return;
    }

    if (
      includesAny(command, [
        "add other",
        "add shop",
        "add hotel",
        "add medical",
        "other place add",
        "दुकान जोडा",
        "हॉटेल जोडा",
        "मेडिकल जोडा",
        "इतर ठिकाण जोडा",
      ])
    ) {
      navigate("/other-places");
      return;
    }

    if (includesAny(command, ["dashboard", "home", "डॅशबोर्ड", "होम"])) {
      navigate("/dashboard");
      return;
    }

    if (
      includesAny(command, [
        "map",
        "location",
        "locations",
        "नकाशा",
        "लोकेशन",
        "ठिकाण",
      ])
    ) {
      goMapSearch(command);
      return;
    }

    if (includesAny(command, ["report", "reports", "रिपोर्ट", "अहवाल"])) {
      navigate("/reports");
      return;
    }

    if (
      includesAny(command, [
        "analytics",
        "analysis",
        "statistics",
        "अनॅलिटिक्स",
        "विश्लेषण",
      ])
    ) {
      navigate("/analytics");
      return;
    }

    if (
      includesAny(command, [
        "religious",
        "temple",
        "mandir",
        "masjid",
        "mosque",
        "dargah",
        "church",
        "मंदिर",
        "मस्जिद",
        "दर्गा",
        "धार्मिक",
      ])
    ) {
      goMapSearch(command);
      return;
    }

    if (
      includesAny(command, [
        "festival",
        "mandal",
        "ganesh",
        "utsav",
        "permission",
        "मंडळ",
        "गणेश",
        "उत्सव",
        "परवानगी",
      ])
    ) {
      goMapSearch(command);
      return;
    }

    if (
      includesAny(command, [
        "hotel",
        "medical",
        "shop",
        "mobile shop",
        "cloth",
        "garage",
        "other",
        "हॉटेल",
        "मेडिकल",
        "दुकान",
        "मोबाईल",
        "कपडे",
        "गॅरेज",
      ])
    ) {
      goMapSearch(command);
      return;
    }

    if (
      includesAny(command, [
        "search",
        "find",
        "show",
        "open",
        "शोध",
        "दाखव",
        "उघड",
        "ओपन",
      ])
    ) {
      goMapSearch(command);
      return;
    }

    goMapSearch(command);
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  };

  const startListening = () => {
    if (isIOS) {
      toast.error("iPhone वर browser voice assistant stable नाही. Keyboard mic वापरा.");
      return;
    }

    if (!window.isSecureContext) {
      toast.error("Voice assistant HTTPS वरच नीट काम करतो.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice assistant supported नाही. Chrome browser वापरा.");
      return;
    }

    if (listening) {
      stopListening();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = "mr-IN";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalTranscript = "";

      recognition.onstart = () => {
        setListening(true);
        toast.success("Listening...");
      };

      recognition.onresult = (event) => {
        let transcript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        finalTranscript = transcript.trim();
      };

      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          toast.error("Microphone permission blocked");
        } else if (event.error === "no-speech") {
          toast.error("Voice clear नाही. पुन्हा बोला.");
        } else if (event.error === "audio-capture") {
          toast.error("Microphone not found");
        } else if (event.error === "network") {
          toast.error("Voice assistant साठी internet required आहे");
        } else if (event.error !== "aborted") {
          toast.error("Voice command failed. Try again.");
        }

        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
        recognitionRef.current = null;

        if (finalTranscript) {
          handleCommand(finalTranscript);
        }
      };

      recognition.start();
    } catch {
      toast.error("Voice assistant already running. पुन्हा try करा.");
      setListening(false);
    }
  };

  return (
    <button
      className={`ai-voice-btn ${listening ? "listening" : ""}`}
      onClick={startListening}
      title="AI Voice Assistant"
      type="button"
    >
      {listening ? <X size={22} /> : <Mic size={22} />}
    </button>
  );
}

export default AIVoiceAssistant;