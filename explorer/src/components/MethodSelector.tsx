import { getMethodGroups } from "../method-registry";

interface Props {
  selectedMethodId: string | null;
  onSelect: (id: string) => void;
}

export default function MethodSelector({ selectedMethodId, onSelect }: Props) {
  const groups = getMethodGroups();

  return (
    <div className="method-selector">
      <label>
        Method
        <select
          value={selectedMethodId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="" disabled>
            Select a method...
          </option>
          {[...groups.entries()].map(([resource, methods]) => (
            <optgroup key={resource} label={resource}>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}
