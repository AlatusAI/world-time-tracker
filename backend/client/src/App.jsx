import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("/api/city/Lisbon")
      .then(res => setData(res.data))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>🌍 World Time Tracker</h1>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {!data ? (
        <p>Loading...</p>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;