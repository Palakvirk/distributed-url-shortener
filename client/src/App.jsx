import { useState, useEffect, useRef } from 'react';
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

const API_BASE = 'http://localhost:3000';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first', icon: '🕐' },
  { id: 'clicks-desc', label: 'Most clicks', icon: '🔥' },
  { id: 'clicks-asc', label: 'Fewest clicks', icon: '🧊' },
  { id: 'az', label: 'A → Z', icon: '🔤' },
  { id: 'za', label: 'Z → A', icon: '🔡' },
];

function App() {
  const [urls, setUrls] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const [longUrl, setLongUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shortenError, setShortenError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [copiedCode, setCopiedCode] = useState(null);

const handleCopyLink = (shortCode) => {
  const link = `${API_BASE}/${shortCode}`;
  navigator.clipboard.writeText(link).then(() => {
    setCopiedCode(shortCode);
    setTimeout(() => setCopiedCode(null), 1500);
  });
};

  const [sortBy, setSortBy] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  const fetchUrls = () => {
    fetch(`${API_BASE}/api/urls`)
      .then((res) => res.json())
      .then((data) => setUrls(data))
      .catch((err) => setFetchError(err.message));
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShortenError(null);
    setCopied(false);

    if (!longUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: longUrl.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setShortenError(data.error || 'Something went wrong');
        setResult(null);
      } else {
        setResult(data);
        setLongUrl('');
        fetchUrls();
      }
    } catch (err) {
      setShortenError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.shortUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const totalLinks = urls.length;
  const totalClicks = urls.reduce((sum, u) => sum + u.click_count, 0);
  const maxClicks = urls.reduce((max, u) => Math.max(max, u.click_count), 0);
  const topLink = urls.find((u) => u.click_count === maxClicks && maxClicks > 0);

  const topUrls = [...urls].sort((a, b) => b.click_count - a.click_count).slice(0, 12);

  const currentSort = SORT_OPTIONS.find((o) => o.id === sortBy);

  const sortedUrls = [...urls].sort((a, b) => {
    switch (sortBy) {
      case 'clicks-desc':
        return b.click_count - a.click_count;
      case 'clicks-asc':
        return a.click_count - b.click_count;
      case 'az':
        return a.short_code.localeCompare(b.short_code);
      case 'za':
        return b.short_code.localeCompare(a.short_code);
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const chartData = {
    labels: topUrls.map((u) => u.short_code),
    datasets: [
      {
        label: 'Clicks',
        data: topUrls.map((u) => u.click_count),
        backgroundColor: topUrls.map((u) =>
  u.click_count === maxClicks && maxClicks > 0 ? '#C75D3C' : '#2E8C86'
),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#ffffff', titleColor: '#21413F', bodyColor: '#21413F', borderColor: '#dcefec', borderWidth: 1 },
    },

    scales: {
      x: { ticks: { color: '#5B7390', font: { family: 'Space Mono', size: 10 } }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { color: '#5B7390', stepSize: 1 }, grid: { color: 'rgba(11,37,69,0.06)' } },
    },
  };

  return (
    <div className="App">
      <div className="logo-row">
  <span className="logo">
    Link<span className="logo-dot">.</span>ly
  </span>
</div>

<div className="header-statement">
  <h2 className="header-title">Where Long Links Go Lightweight</h2>
  <p className="tagline">
    Built like real infrastructure, not just a redirect.
    <br />
    Every link is <span className="tagline-accent">cached, queued, and tracked</span>, so
    it's fast whether one person clicks it or one million do.
  </p>
</div>

      <section className="shorten-panel">
        <h1 className="shorten-title">Shorten a long link</h1>
        <p className="shorten-subtitle">Paste a URL below — get a short one back instantly.</p>

        <form className="shorten-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="shorten-input"
            placeholder="https://example.com/your-very-long-link"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
          />
          <button type="submit" className="shorten-button" disabled={isSubmitting}>
            {isSubmitting ? 'Shortening…' : 'Shorten it →'}
          </button>
        </form>

        {shortenError && <p className="shorten-error">{shortenError}</p>}

        {result && (
          <div className="result-card">
            <div className="result-info">
              <span className="result-label">Your short link</span>
              <a href={result.shortUrl} target="_blank" rel="noreferrer" className="result-link">
                {result.shortUrl}
              </a>
            </div>
            <button className="copy-button" onClick={handleCopy}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        )}
      </section>

      {fetchError && <div className="error-banner">Error loading dashboard: {fetchError}</div>}

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value stat-blue">{totalLinks}</span>
          <span className="stat-label">links shortened</span>
        </div>
        <div className="stat-card">
          <span className="stat-value stat-coral">{totalClicks}</span>
          <span className="stat-label">total clicks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value stat-mono">{topLink ? topLink.short_code : '—'}</span>
          <span className="stat-label">top performer</span>
        </div>
      </div>

      <div className="chart-card">
        <p className="chart-card-title">Clicks by link (top 12)</p>
        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <span className="table-toolbar-title">All links</span>

          <div className="sort-control" ref={sortRef}>
            <button className="sort-trigger" onClick={() => setSortOpen((o) => !o)}>
              <span className="sort-trigger-icon">{currentSort.icon}</span>
              <span className="sort-trigger-text">{currentSort.label}</span>
              <span className={`sort-caret ${sortOpen ? 'sort-caret--open' : ''}`}>⌄</span>
            </button>

            {sortOpen && (
              <div className="sort-menu">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`sort-option ${opt.id === sortBy ? 'sort-option--active' : ''}`}
                    onClick={() => {
                      setSortBy(opt.id);
                      setSortOpen(false);
                    }}
                  >
                    <span className="sort-option-icon">{opt.icon}</span>
                    <span className="sort-option-label">{opt.label}</span>
                    {opt.id === sortBy && <span className="sort-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {urls.length === 0 ? (
          <div className="empty-state">No links yet — shorten one above to see it here.</div>
        ) : (
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Destination</th>
                <th>Clicks</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            
            <tbody>
              
            
              {sortedUrls.map((url) => (
                <tr key={url.short_code}>
                  <td><span className="code-chip">{url.short_code}</span></td>
                  <td>
                    <div className="url-cell">
                      <span className="arrow">→</span>
                      <span className="url-text" title={url.original_url}>{url.original_url}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${url.click_count > 0 ? 'badge--active' : 'badge--zero'}`}>
                      {url.click_count > 0 ? '⚡' : ''} {url.click_count}
                    </span>
                  </td>
                  <td className="created-cell">{new Date(url.created_at).toLocaleString()}</td>
<td>
  <div className="row-actions">
    <button
      className="row-action-btn"
      onClick={() => handleCopyLink(url.short_code)}
      title="Copy link"
    >
      {copiedCode === url.short_code ? '✓' : '📋'}
    </button>
    
      <a className="row-action-btn"
      href={`${API_BASE}/${url.short_code}`}
      target="_blank"
      rel="noreferrer"
      title="Visit site"
    >
      ↗
    </a>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;