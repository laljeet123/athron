const isBrowser = typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
const synth = isBrowser ? window.speechSynthesis : null;
let currentVoice = null;
let currentRate = 1.0;
let currentVolume = 1.0;

export function getAvailableVoices() {
  if (!synth) {
    return [];
  }

  const voices = synth.getVoices();
  return voices || [];
}

export function selectVoice({ gender, name } = {}) {
  if (!synth) {
    return null;
  }

  const voices = getAvailableVoices();
  const lowerName = name?.toLowerCase();
  const preferred = voices.find((voice) => {
    const voiceName = voice.name.toLowerCase();
    if (lowerName && voiceName.includes(lowerName)) {
      return true;
    }
    if (gender === "female") {
      return /female|woman|girl|samantha|lucy|ivy|alloy/i.test(voiceName);
    }
    if (gender === "male") {
      return /male|man|boy|alex|daniel|matthew|jack/i.test(voiceName);
    }
    return false;
  });

  currentVoice = preferred || voices[0] || null;
  return currentVoice;
}

export function setSpeechRate(rate) {
  currentRate = Math.min(2.0, Math.max(0.5, rate));
}

export function setSpeechVolume(volume) {
  currentVolume = Math.min(1.0, Math.max(0.1, volume));
}

export function speak(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!synth) {
      reject(new Error("Text-to-speech is not supported in this browser."));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || currentRate;
    utterance.volume = options.volume || currentVolume;
    utterance.lang = options.lang || "en-US";

    if (options.voiceName) {
      const matching = getAvailableVoices().find((voice) => voice.name === options.voiceName);
      if (matching) {
        utterance.voice = matching;
      }
    }

    if (!utterance.voice && currentVoice) {
      utterance.voice = currentVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(event.error || new Error("Speech synthesis failed."));

    synth.cancel();
    synth.speak(utterance);
  });
}

export function stopSpeaking() {
  if (!synth) {
    return;
  }

  synth.cancel();
}

export function getSpeechSettings() {
  return {
    voice: currentVoice,
    rate: currentRate,
    volume: currentVolume,
  };
}
