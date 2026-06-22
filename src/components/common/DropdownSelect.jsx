import { useEffect, useMemo, useRef, useState } from 'react';

export default function DropdownSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Chọn',
  className = '',
  style,
  disabled = false,
  renderValue,
  renderOption,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value],
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (option) => {
    if (option.disabled) return;
    onChange?.(option.value, option);
    setOpen(false);
  };

  const valueContent = selectedOption
    ? (renderValue ? renderValue(selectedOption) : selectedOption.label)
    : placeholder;

  return (
    <div
      ref={wrapRef}
      className={`ds ${open ? 'ds--open' : ''} ${disabled ? 'ds--disabled' : ''} ${className}`}
      style={style}
    >
      <button
        type="button"
        className="ds__trigger"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`ds__value ${selectedOption ? '' : 'ds__value--placeholder'}`}>
          {valueContent}
        </span>
        <svg className="ds__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="ds__menu" role="listbox">
          {options.length === 0 ? (
            <div className="ds__empty">Không có lựa chọn</div>
          ) : (
            options.map((option) => {
              const selected = String(option.value) === String(value);
              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  className={`ds__option ${selected ? 'ds__option--selected' : ''} ${option.disabled ? 'ds__option--disabled' : ''}`}
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  role="option"
                  aria-selected={selected}
                >
                  <span className="ds__option-content">
                    {renderOption ? (
                      renderOption(option, selected)
                    ) : (
                      <span className="ds__option-text">
                        <span className="ds__option-label">{option.label}</span>
                        {option.sub && <span className="ds__option-sub">{option.sub}</span>}
                      </span>
                    )}
                  </span>
                  {selected && (
                    <svg className="ds__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
