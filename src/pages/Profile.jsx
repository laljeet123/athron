import { useEffect, useState } from "react";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import GradientButton from "../components/UI/GradientButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const GOALS = ["Muscle Gain", "Fat Loss", "Maintenance", "Recomposition"];
const ACTIVITY_LEVELS = ["Sedentary", "Light", "Moderate", "Very Active", "Athlete"];
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const DIET_PREFERENCES = ["Omnivore", "Vegetarian", "Vegan", "Pescatarian"];

function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    goal: "Maintenance",
    activity_level: "Moderate",
    training_days: 3,
    experience: "",
    diet: "",
  });

  const renderOptionGroup = (label, description, value, options, field) => (
    <div style={{ display: "grid", gap: "12px" }}>
      <div>
        <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>{label}</p>
        {description && <p style={{ margin: "8px 0 0", color: "#c4c8d4", lineHeight: 1.6 }}>{description}</p>}
      </div>
      <div className="profile-option-grid">
        {options.map((option) => {
          const selected = String(value) === String(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => updateField(field, option)}
              className={selected ? "profile-option profile-option--selected" : "profile-option"}
              aria-pressed={selected}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span className="profile-option__badge">✓</span>
                <span style={{ fontWeight: 700, color: selected ? "#f8fafc" : "#d2d8e4" }}>{option}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const { refreshUserProfile, updateUserProfile, uploadAvatarLocal } = useAuth();

  useEffect(() => {
    // load from local profile store
    setLoading(true);
    try {
      const stored = refreshUserProfile();
      if (stored) {
        setProfile((p) => ({ ...p, ...stored }));
        if (stored.avatarUrl) setAvatarUrl(stored.avatarUrl);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = updateUserProfile({
        ...profile,
        age: profile.age ? Number(profile.age) : undefined,
        height_cm: profile.height_cm ? Number(profile.height_cm) : undefined,
        weight_kg: profile.weight_kg ? Number(profile.weight_kg) : undefined,
        training_days: profile.training_days ? Number(profile.training_days) : undefined,
      });
      setProfile((current) => ({ ...current, ...updated }));
      setMessage({ type: "success", text: "Profile saved successfully." });
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setMessage(null);
    setError(null);
    try {
      const url = await uploadAvatarLocal(file);
      setAvatarUrl(url);
      setMessage({ type: "success", text: "Avatar saved locally." });
    } catch (err) {
      setError(err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="page-shell">
      <SectionTitle title="Profile" subtitle="Your athlete details" />

      {loading && (
        <GlassCard>
          <p>Loading your profile...</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <p style={{ color: "#ff8a80" }}>Unable to load profile.</p>
          <p>{error.message || JSON.stringify(error)}</p>
        </GlassCard>
      )}

      {!loading && !error && (
        <GlassCard style={{ padding: "24px", display: "grid", gap: "24px" }}>
          <div>
            <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Athlete profile</p>
            <h2 style={{ margin: "12px 0 0", color: "#f8fafc" }}>Build your nutrition profile</h2>
          </div>

          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: "#9fa8c9", fontSize: "0.75rem" }}>Avatar</p>
              <p style={{ margin: "8px 0 0", color: "#f8fafc" }}>Upload a profile avatar for a more personal experience.</p>
            </div>
            <div style={{ display: "grid", gap: "12px", justifyItems: "end" }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{ width: "84px", height: "84px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(57,255,171,0.4)" }}
                />
              ) : (
                <div
                  style={{
                    width: "84px",
                    height: "84px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    display: "grid",
                    placeItems: "center",
                    color: "#96a0b8",
                    fontSize: "0.85rem",
                  }}
                >
                  Avatar
                </div>
              )}
              <label
                style={{
                  cursor: "pointer",
                  color: "#39ffab",
                  background: "rgba(57,255,171,0.12)",
                  padding: "10px 14px",
                  borderRadius: "16px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                }}
              >
                {avatarUploading ? "Uploading…" : "Change avatar"}
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </label>
            </div>
          </div>

          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label style={{ display: "grid", gap: "8px" }}>
              Name
              <input
                value={profile.name}
                onChange={(event) => updateField("name", event.target.value)}
                style={{ padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
              />
            </label>
            <label style={{ display: "grid", gap: "8px" }}>
              Age
              <input
                type="number"
                value={profile.age}
                onChange={(event) => updateField("age", event.target.value)}
                style={{ padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
              />
            </label>
            <label style={{ display: "grid", gap: "8px" }}>
              Gender
              <select
                value={profile.gender}
                onChange={(event) => updateField("gender", event.target.value)}
                style={{ padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "8px" }}>
              Height (cm)
              <input
                type="number"
                value={profile.height_cm}
                onChange={(event) => updateField("height_cm", event.target.value)}
                style={{ padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
              />
            </label>
            <label style={{ display: "grid", gap: "8px" }}>
              Weight (kg)
              <input
                type="number"
                value={profile.weight_kg}
                onChange={(event) => updateField("weight_kg", event.target.value)}
                style={{ padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
              />
            </label>
          </div>

          <div style={{ display: "grid", gap: "24px" }}>
            {renderOptionGroup("Goal", "Select the primary result you want from your training.", profile.goal, GOALS, "goal")}
            {renderOptionGroup("Fitness experience", "Choose the level that best matches your current training history.", profile.experience, EXPERIENCE_LEVELS, "experience")}
            {renderOptionGroup("Dietary preference", "Pick the eating style you follow most often.", profile.diet, DIET_PREFERENCES, "diet")}
            {renderOptionGroup("Activity level", "How active are you outside of workouts?", profile.activity_level, ACTIVITY_LEVELS, "activity_level")}
          </div>
          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label style={{ display: "grid", gap: "8px" }}>
              Training days per week
              <input
                type="number"
                min="1"
                max="7"
                value={profile.training_days}
                onChange={(event) => updateField("training_days", event.target.value)}
                style={{ padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
              />
            </label>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <GradientButton onClick={handleSave} disabled={saving}>
              {saving ? "Saving profile..." : "Save profile"}
            </GradientButton>
            {message && <p style={{ color: message.type === "error" ? "#ff8a80" : "#39ffab" }}>{message.text}</p>}
          </div>

          {/* Account/connect removed — profile is local and optional */}
        </GlassCard>
      )}
    </div>
  );
}

export default ProfilePage;
