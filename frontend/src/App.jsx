import { useState, useRef } from 'react';
import './App.css';

const SIZES = [
  { label: '3×4 cm', value: '3x4', width: 3, height: 4 },
  { label: '4×6 cm', value: '4x6', width: 4, height: 6 },
];

const BACKGROUNDS = [
  { label: 'Nền Xanh', value: 'blue', color: '#4A90D9' },
  { label: 'Nền Trắng', value: 'white', color: '#FFFFFF' },
];

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [size, setSize] = useState('3x4');
  const [background, setBackground] = useState('blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ.');
      return;
    }
    setError('');
    setSelectedFile(file);
    setResultUrl(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn ảnh trước.');
      return;
    }
    setLoading(true);
    setError('');
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('size', size);
      formData.append('background', background);

      const res = await fetch('/api/generate-id-photo', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi từ server.');
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `idsnap-${size}-${background}.jpg`;
    a.click();
  };

  const selectedSize = SIZES.find((s) => s.value === size);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">IDSnap <span className="logo-ai">AI</span></span>
        </div>
        <p className="tagline">AI-Powered ID Photo Generator</p>
      </header>

      <main className="main">
        {/* Controls */}
        <div className="controls-bar">
          <div className="control-group">
            <label className="control-label">Kích thước ảnh</label>
            <div className="toggle-group">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  className={`toggle-btn ${size === s.value ? 'active' : ''}`}
                  onClick={() => setSize(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Màu nền</label>
            <div className="toggle-group">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.value}
                  className={`toggle-btn bg-btn ${background === bg.value ? 'active' : ''}`}
                  onClick={() => setBackground(bg.value)}
                >
                  <span
                    className="bg-swatch"
                    style={{
                      background: bg.color,
                      border: bg.value === 'white' ? '1px solid #444' : 'none',
                    }}
                  />
                  {bg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panels */}
        <div className="panels">
          {/* Upload Panel */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-num">01</span>
              <span className="panel-title">Ảnh gốc</span>
            </div>
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''} ${previewUrl ? 'has-image' : ''}`}
              onClick={() => !previewUrl && fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="preview-img" />
                  <button
                    className="change-btn"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                  >
                    Đổi ảnh
                  </button>
                </>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <p className="upload-text">Kéo thả hoặc <span className="upload-link">chọn ảnh</span></p>
                  <p className="upload-hint">JPG, PNG, WEBP · Tối đa 10MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
          </div>

          {/* Arrow */}
          <div className="arrow-col">
            <button
              className={`generate-btn ${loading ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  <span>Tạo ảnh</span>
                </>
              )}
            </button>
            <div className="arrow">→</div>
          </div>

          {/* Result Panel */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-num">02</span>
              <span className="panel-title">
                Ảnh CCCD · {selectedSize.label}
                {background === 'blue' ? ' · Nền xanh' : ' · Nền trắng'}
              </span>
            </div>
            <div className="result-zone">
              {loading ? (
                <div className="result-loading">
                  <div className="pulse-ring" />
                  <p>Đang xử lý ảnh...</p>
                </div>
              ) : resultUrl ? (
                <>
                  <img src={resultUrl} alt="Result" className="preview-img" />
                  <button className="download-btn" onClick={handleDownload}>
                    ⬇ Tải xuống
                  </button>
                </>
              ) : (
                <div className="result-placeholder">
                  <div className="result-icon">🪪</div>
                  <p>Ảnh đã xử lý sẽ hiện ở đây</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-bar">
            <span>⚠ {error}</span>
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Info */}
        <div className="info-bar">
          <span>🔒 Ảnh của bạn không được lưu trữ trên server</span>
          <span>·</span>
          <span>⚡ Xử lý bằng AI trong vài giây</span>
          <span>·</span>
          <span>📐 Chuẩn kích thước CCCD Việt Nam</span>
        </div>
      </main>
    </div>
  );
}
