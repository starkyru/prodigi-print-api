interface Props {
  data?: unknown;
  error?: string;
  loading: boolean;
}

export default function ResultPanel({ data, error, loading }: Props) {
  if (loading) {
    return <div className="result-panel loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="result-panel error">
        <h3>Error</h3>
        <pre>{error}</pre>
      </div>
    );
  }

  if (data !== undefined) {
    return (
      <div className="result-panel success">
        <h3>Response</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="result-panel empty">
      Select a method and click Execute to see results.
    </div>
  );
}
