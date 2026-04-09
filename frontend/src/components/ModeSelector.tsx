type InterviewMode = "backend" | "oop" | "sql" | "behavioral" | "general";

interface Props {
  mode: InterviewMode;
  onModeChange: (mode: InterviewMode) => void;
}

const MODES: { value: InterviewMode; label: string }[] = [
  { value: "backend", label: "Backend" },
  { value: "oop", label: "OOP" },
  { value: "sql", label: "SQL / DB" },
  { value: "behavioral", label: "Behavioral" },
  { value: "general", label: "General" },
];

export default function ModeSelector({ mode, onModeChange }: Props) {
  return (
    <div className="mode-selector">
      {MODES.map((m) => (
        <button
          key={m.value}
          className={`mode-btn ${mode === m.value ? "active" : ""}`}
          onClick={() => onModeChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
