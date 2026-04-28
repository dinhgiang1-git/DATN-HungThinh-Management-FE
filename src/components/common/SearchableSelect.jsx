import { useState, useRef, useEffect } from 'react';

/**
 * SearchableSelect — Custom dropdown với ô tìm kiếm
 * Props:
 *   - options: [{ value, label, sub? }]
 *   - value: giá trị đang chọn
 *   - onChange: callback(value)
 *   - placeholder: text hiển thị khi chưa chọn
 *   - searchPlaceholder: placeholder cho ô search
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = '-- Chọn --',
  searchPlaceholder = 'Tìm kiếm...',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search khi mở
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    const q = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sub && opt.sub.toLowerCase().includes(q))
    );
  });

  const selectedOption = options.find((o) => String(o.value) === String(value));

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="ss" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        className={`ss__trigger ${isOpen ? 'ss__trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`ss__trigger-text ${!selectedOption ? 'ss__trigger-text--placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="ss__trigger-actions">
          {selectedOption && (
            <span className="ss__clear" onClick={handleClear} title="Xóa chọn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          )}
          <svg className={`ss__chevron ${isOpen ? 'ss__chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="ss__dropdown">
          <div className="ss__search-wrap">
            <svg className="ss__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="ss__search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul className="ss__list">
            {filteredOptions.length === 0 ? (
              <li className="ss__empty">Không tìm thấy kết quả</li>
            ) : (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  className={`ss__option ${String(opt.value) === String(value) ? 'ss__option--selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <div className="ss__option-content">
                    <span className="ss__option-label">{opt.label}</span>
                    {opt.sub && <span className="ss__option-sub">{opt.sub}</span>}
                  </div>
                  {String(opt.value) === String(value) && (
                    <svg className="ss__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
