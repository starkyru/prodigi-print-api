import { useState } from "react";
import { ProdigiClient, ProdigiApiError } from "prodigi-print-api";
import methods from "./method-registry";
import ApiKeyBar from "./components/ApiKeyBar";
import MethodSelector from "./components/MethodSelector";
import MethodDetail from "./components/MethodDetail";
import ResultPanel from "./components/ResultPanel";
import "./App.css";

interface Result {
  data?: unknown;
  error?: string;
  loading: boolean;
}

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">(
    "sandbox",
  );
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result>({ loading: false });

  const selectedMethod = methods.find((m) => m.id === selectedMethodId) ?? null;

  function handleSelectMethod(id: string) {
    setSelectedMethodId(id);
    setResult({ loading: false });

    const method = methods.find((m) => m.id === id);
    if (method) {
      const defaults: Record<string, string> = {};
      for (const p of method.params) {
        defaults[p.name] = p.defaultValue ?? "";
      }
      setParamValues(defaults);
    }
  }

  function handleParamChange(name: string, value: string) {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleExecute() {
    if (!selectedMethod) return;

    if (!apiKey.trim()) {
      setResult({ error: "Please enter an API key.", loading: false });
      return;
    }

    setResult({ loading: true });

    try {
      const client = new ProdigiClient({ apiKey: apiKey.trim(), environment });
      const data = await selectedMethod.execute(client, paramValues);
      setResult({ data, loading: false });
    } catch (err) {
      if (err instanceof ProdigiApiError) {
        const detail = {
          name: err.name,
          message: err.message,
          statusCode: err.statusCode,
          traceParent: err.traceParent,
          data: err.data,
        };
        setResult({
          error: JSON.stringify(detail, null, 2),
          loading: false,
        });
      } else if (err instanceof Error) {
        setResult({ error: err.message, loading: false });
      } else {
        setResult({ error: String(err), loading: false });
      }
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Prodigi API Explorer</h1>
      </header>
      <ApiKeyBar
        apiKey={apiKey}
        environment={environment}
        onApiKeyChange={setApiKey}
        onEnvironmentChange={setEnvironment}
      />
      <div className="main-layout">
        <aside>
          <MethodSelector
            selectedMethodId={selectedMethodId}
            onSelect={handleSelectMethod}
          />
        </aside>
        <main>
          {selectedMethod ? (
            <MethodDetail
              method={selectedMethod}
              paramValues={paramValues}
              onParamChange={handleParamChange}
              onExecute={handleExecute}
              loading={result.loading}
            />
          ) : (
            <p className="placeholder">Select a method to get started.</p>
          )}
          <ResultPanel
            data={result.data}
            error={result.error}
            loading={result.loading}
          />
        </main>
      </div>
    </div>
  );
}
