const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition || null);

export const isSpeechRecognitionSupported = Boolean(SpeechRecognition);

export class SpeechRecognitionManager {
  constructor({ onTranscript, onError, onStatus } = {}) {
    this.onTranscript = onTranscript;
    this.onError = onError;
    this.onStatus = onStatus;
    this.recognition = null;
    this.listening = false;
    this.initialize();
  }

  initialize() {
    if (!SpeechRecognition) {
      this.notifyError(new Error("Speech recognition is not supported in this browser."));
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => this.notifyStatus("started");
    this.recognition.onend = () => this.notifyStatus("stopped");
    this.recognition.onerror = (event) => this.notifyError(event.error || new Error(event.message || "Speech recognition error"));
    this.recognition.onresult = (event) => this.handleResult(event);
  }

  handleResult(event) {
    if (!event.results) {
      return;
    }

    const lastResult = event.results[event.results.length - 1];
    const transcript = Array.from(lastResult)
      .map((result) => result.transcript)
      .join(" ")
      .trim();

    if (!transcript) {
      return;
    }

    this.notifyTranscript({ transcript, isFinal: lastResult.isFinal });
  }

  notifyTranscript(payload) {
    if (typeof this.onTranscript === "function") {
      this.onTranscript(payload);
    }
  }

  notifyError(error) {
    if (typeof this.onError === "function") {
      this.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  notifyStatus(status) {
    if (typeof this.onStatus === "function") {
      this.onStatus(status);
    }
  }

  start() {
    if (!this.recognition) {
      this.initialize();
    }

    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.start();
      this.listening = true;
      this.notifyStatus("listening");
    } catch (error) {
      this.notifyError(error);
    }
  }

  stop() {
    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.stop();
      this.listening = false;
      this.notifyStatus("stopped");
    } catch (error) {
      this.notifyError(error);
    }
  }

  destroy() {
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onstart = null;
      this.recognition.onend = null;
      this.recognition = null;
    }
    this.listening = false;
  }
}
