import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/routes.js";
import GlassCard from "../components/UI/GlassCard.jsx";
import GradientButton from "../components/UI/GradientButton.jsx";
import VoiceButton from "../components/VoiceButton.jsx";
import ListeningAnimation from "../components/ListeningAnimation.jsx";
import ConversationBox from "../components/ConversationBox.jsx";
import { SpeechRecognitionManager, isSpeechRecognitionSupported } from "../voice/speechRecognition.js";
import { speak, stopSpeaking, selectVoice, setSpeechRate, setSpeechVolume, getSpeechSettings } from "../voice/textToSpeech.js";
import { askAthron } from "../ai/AthronAI.js";
import { executeAthronActions } from "../ai/actionHandler.js";
import { loadStoredProfile } from "../services/localProfile.js";
import { loadNutritionSummary } from "../services/nutrition.js";
import { addMemory } from "../ai/memory.js";
import { saveAiMemory } from "../services/aiMemory.js";
import { saveConversation } from "../services/aiConversations.js";
import { useWorkout } from "../context/WorkoutContext.jsx";

function AITrainer() {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState({ text: "", isFinal: false });
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [speechSettings, setLocalSpeechSettings] = useState(getSpeechSettings());
  const workout = useWorkout();
  const workoutState = useMemo(
    () => ({
      workoutName: workout.session?.workoutName || workout.session?.name || "fitness",
      currentExercise:
        workout.currentExercise || {
          name: "shoulder press",
          reps: 10,
          description: "Press the weight overhead with controlled motion.",
        },
      nextExercise:
        workout.nextExercise || {
          name: "lateral raises",
          reps: 12,
        },
      timerSeconds: workout.timerSeconds || workout.currentExercise?.restSeconds || 60,
      paused: workout.paused,
      sessionExists: workout.hasSession,
    }),
    [
      workout.session,
      workout.currentExercise,
      workout.nextExercise,
      workout.timerSeconds,
      workout.paused,
      workout.hasSession,
    ]
  );

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      setError(new Error("Speech recognition is not supported in this browser."));
      return;
    }

    recognitionRef.current = new SpeechRecognitionManager({
      onTranscript: ({ transcript: text, isFinal }) => setTranscript({ text, isFinal }),
      onError: (recognitionError) => setError(recognitionError),
      onStatus: (statusEvent) => setStatus(statusEvent),
    });

    selectVoice({ gender: "female" });
    setSpeechRate(1.05);
    setSpeechVolume(0.95);
    setLocalSpeechSettings(getSpeechSettings());

    return () => {
      recognitionRef.current?.destroy();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (!transcript.text || !transcript.isFinal) {
      return;
    }

    // route the voice transcript through central AthronAI
    (async () => {
      try {
        const userId = loadStoredProfile()?.id ?? null;
        const res = await askAthron(transcript.text, userId);

        // save and show assistant response
        const assistantMessage = res?.message || "";
        setHistory((currentHistory) => [
          { id: `assistant-${Date.now()}`, type: "assistant", message: assistantMessage },
          { id: `user-${Date.now()}`, type: "user", message: transcript.text },
          ...currentHistory,
        ].slice(0, 12));

        addMemory(`Voice command received: ${transcript.text}`, { type: "voice_command" });
        addMemory(`Athron response: ${assistantMessage}`, { type: "assistant_response" });

        try {
          await saveAiMemory(`Voice command received: ${transcript.text}`, { type: "voice_command" });
          await saveAiMemory(`Athron response: ${assistantMessage}`, { type: "assistant_response" });
        } catch (memoryError) {
          console.warn("AI memory persistence failed", memoryError);
        }

        saveConversation({ message: transcript.text, response: assistantMessage, type: "voice" });

        // execute structured actions (if any)
        const actionResults = await executeAthronActions(res.actions || [], { navigate, workout, speak });

        // speak assistant message or action results summary
        let speakText = assistantMessage;
        if ((!speakText || speakText.length === 0) && Array.isArray(actionResults) && actionResults.length > 0) {
          speakText = actionResults.map((r) => r.message).filter(Boolean).join(" ");
        }

        if (speakText) await speak(speakText).catch((speechError) => setError(speechError));
      } catch (err) {
        setError(err);
      } finally {
        setTranscript({ text: "", isFinal: false });
      }
    })();
  }, [transcript, navigate, workoutState]);

  const onToggleListening = () => {
    if (!recognitionRef.current) {
      setError(new Error("Speech recognition manager is not initialized."));
      return;
    }

    if (status === "listening") {
      recognitionRef.current.stop();
      return;
    }

    recognitionRef.current.start();
  };

  const onStopSpeaking = () => {
    stopSpeaking();
    setStatus("idle");
  };

  const onIncreaseRate = () => {
    setSpeechRate(Math.min(2.0, speechSettings.rate + 0.1));
    setLocalSpeechSettings(getSpeechSettings());
  };

  const onDecreaseRate = () => {
    setSpeechRate(Math.max(0.5, speechSettings.rate - 0.1));
    setLocalSpeechSettings(getSpeechSettings());
  };

  const quickActions = useMemo(
    () => [
      { label: "Start workout", command: "start workout" },
      { label: "Complete set", command: "complete set" },
      { label: "Next exercise", command: "next exercise" },
      { label: "Check form", command: "check my form" },
      { label: "How many reps", command: "how many reps" },
    ],
    []
  );

  return (
    <div className="page-shell">
      <div style={{ display: "grid", gap: "24px" }}>
        <GlassCard>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <p style={{ margin: 0, color: "#39ffab", textTransform: "uppercase", letterSpacing: "0.22em", fontSize: "0.75rem" }}>
                ATHRON VOICE COACH
              </p>
              <h1 style={{ margin: "12px 0 0", color: "#f8fafc" }}>Jarvis-style fitness guidance</h1>
              <p style={{ margin: "12px 0 0", color: "#96a0b8", maxWidth: "720px" }}>
                Talk to Athron naturally during workouts. Start sessions, track sets, check form, and get verbal coaching whenever you need it.
              </p>
            </div>

            <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "1.2fr 0.8fr" }}>
              <div style={{ display: "grid", gap: "18px" }}>
                <GlassCard style={{ padding: "24px", background: "rgba(10,14,24,0.9)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
                    <VoiceButton onClick={onToggleListening} active={status === "listening"} label={status === "listening" ? "Stop listening" : "Start listening"} />
                    <ListeningAnimation active={status === "listening"} />
                  </div>
                  <div style={{ marginTop: "18px", background: "rgba(255,255,255,0.04)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", padding: "18px" }}>
                    <p style={{ margin: 0, color: "#9fa8c9", fontSize: "0.85rem" }}>Live transcript</p>
                    <p style={{ margin: "10px 0 0", color: "#f8fafc", minHeight: "56px" }}>
                      {status === "listening" ? transcript.text || "Waiting for your command..." : "Voice assistant is idle."}
                    </p>
                  </div>
                </GlassCard>

                <GlassCard style={{ padding: "24px", background: "rgba(10,14,24,0.9)" }}>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Speech controls</p>
                    <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
                      <VoiceButton onClick={onStopSpeaking} label="Stop voice" />
                      <VoiceButton onClick={onDecreaseRate} label="Slower voice" />
                      <VoiceButton onClick={onIncreaseRate} label="Faster voice" />
                    </div>
                    <p style={{ margin: 0, color: "#c4c8d4", fontSize: "0.92rem" }}>
                      Rate: {speechSettings.rate.toFixed(1)} · Volume: {speechSettings.volume.toFixed(1)}
                    </p>
                  </div>
                </GlassCard>
              </div>

              <GlassCard style={{ padding: "24px", background: "rgba(10,14,24,0.9)" }}>
                <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Quick actions</p>
                <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                  {quickActions.map((action) => (
                    <VoiceButton key={action.label} onClick={() => setTranscript({ text: action.command, isFinal: true })} label={action.label} />
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </GlassCard>

        <div style={{ display: "grid", gap: "22px", gridTemplateColumns: "1.6fr 1fr" }}>
          <GlassCard style={{ minHeight: "420px" }}>
            <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Conversation</p>
            <ConversationBox history={history} />
          </GlassCard>

          <GlassCard style={{ display: "grid", gap: "18px", padding: "24px", background: "rgba(10,14,24,0.9)" }}>
            <div>
              <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Workout preview</p>
              <h3 style={{ margin: "14px 0 0", color: "#f8fafc" }}>{workoutState.currentExercise.name}</h3>
              <p style={{ margin: "8px 0 0", color: "#96a0b8" }}>{workoutState.currentExercise.description}</p>
              <p style={{ margin: "10px 0 0", color: "#c4c8d4" }}>
                Reps: {workoutState.currentExercise.reps} · Next: {workoutState.nextExercise.name}
              </p>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <VoiceButton onClick={() => navigate(ROUTES.FORM_CHECKER())} label="Open form checker" />
              <VoiceButton onClick={() => navigate(ROUTES.WORKOUT_ACTIVE)} label="Open active workout" />
            </div>
          </GlassCard>
        </div>

        {error && (
          <GlassCard>
            <p style={{ margin: 0, color: "#ff8080" }}>{error.message || String(error)}</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

export default AITrainer;
