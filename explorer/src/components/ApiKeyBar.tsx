import { useState } from "react";

interface Props {
  apiKey: string;
  environment: "sandbox" | "production";
  onApiKeyChange: (key: string) => void;
  onEnvironmentChange: (env: "sandbox" | "production") => void;
}

export default function ApiKeyBar({
  apiKey,
  environment,
  onApiKeyChange,
  onEnvironmentChange,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="api-key-bar">
      <label>
        API Key
        <div className="api-key-input-wrapper">
          <input
            type={visible ? "text" : "password"}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Enter your Prodigi API key"
          />
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setVisible(!visible)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
      </label>
      <label>
        Environment
        <select
          value={environment}
          onChange={(e) =>
            onEnvironmentChange(e.target.value as "sandbox" | "production")
          }
        >
          <option value="sandbox">Sandbox</option>
          <option value="production">Production</option>
        </select>
      </label>
    </div>
  );
}
