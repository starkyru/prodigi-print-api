import type { MethodDef } from "../types";
import ParamForm from "./ParamForm";

interface Props {
  method: MethodDef;
  paramValues: Record<string, string>;
  onParamChange: (name: string, value: string) => void;
  onExecute: () => void;
  loading: boolean;
}

export default function MethodDetail({
  method,
  paramValues,
  onParamChange,
  onExecute,
  loading,
}: Props) {
  return (
    <div className="method-detail">
      <h2>{method.id}</h2>
      <p className="method-description">{method.description}</p>
      <ParamForm
        params={method.params}
        values={paramValues}
        onChange={onParamChange}
      />
      <button className="execute-btn" onClick={onExecute} disabled={loading}>
        {loading ? "Executing..." : "Execute"}
      </button>
    </div>
  );
}
