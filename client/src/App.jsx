import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/urls')
      .then((res) => res.json())
      .then((data) => setUrls(data))
      .catch((err) => setError(err.message));
  }, []);

  const chartData = {
    labels: urls.map((url) => url.short_code),
    datasets: [
      {
        label: 'Clicks',
        data: urls.map((url) => url.click_count),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      },
    ],
  };

  return (
    <div className="App">
      <h1>URL Shortener Dashboard</h1>

      {error && <p>Error: {error}</p>}

      <div className="chart-container">
        <Bar data={chartData} />
      </div>

      <table>
        <thead>
          <tr>
            <th>Short Code</th>
            <th>Original URL</th>
            <th>Clicks</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {urls.map((url) => (
            <tr key={url.short_code}>
              <td>{url.short_code}</td>
              <td>{url.original_url}</td>
              <td>{url.click_count}</td>
              <td>{new Date(url.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;