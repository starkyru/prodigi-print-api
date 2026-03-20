import type { ParamDef } from "../types";

interface Props {
  params: ParamDef[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

export default function ParamForm({ params, values, onChange }: Props) {
  if (params.length === 0) return null;

  return (
    <div className="param-form">
      {params.map((p) => (
        <label key={p.name}>
          <span>
            {p.label}
            {!p.required && <span className="optional"> (optional)</span>}
          </span>
          {p.kind === "json" ? (
            <textarea
              rows={10}
              value={values[p.name] ?? ""}
              onChange={(e) => onChange(p.name, e.target.value)}
              spellCheck={false}
            />
          ) : (
            <input
              type={p.kind === "number" ? "number" : "text"}
              value={values[p.name] ?? ""}
              onChange={(e) => onChange(p.name, e.target.value)}
            />
          )}
        </label>
      ))}
    </div>
  );
}
