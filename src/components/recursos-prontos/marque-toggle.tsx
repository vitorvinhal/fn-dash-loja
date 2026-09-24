"use client";

interface MarqueToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  eyebrow?: string;
  title?: string;
}

export function MarqueToggle({
  checked,
  onChange,
  eyebrow = "Aparência",
  title = "Tema do sistema",
}: MarqueToggleProps) {
  return (
    <div className="marque-toggle">
      <span className="marque-toggle__meta">
        <span className="marque-toggle__eyebrow">{eyebrow}</span>
        <span className="marque-toggle__title">{title}</span>
      </span>
      <label className="marque-toggle__switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="marque-toggle__opt marque-toggle__opt--off" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
          </svg>
        </span>
        <span className="marque-toggle__track" aria-hidden="true">
          <span className="marque-toggle__thumb"></span>
        </span>
        <span className="marque-toggle__opt marque-toggle__opt--on" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path>
          </svg>
        </span>
      </label>
    </div>
  );
}
