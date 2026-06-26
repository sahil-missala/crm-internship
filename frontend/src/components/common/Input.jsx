import React from 'react';

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder = '',
  required = false,
  options = [], // Used for select dropdowns
  rows = 3,     // Used for textareas
  className = '',
  ...props
}) {
  const inputClass = `w-full px-3 py-2 border font-sans text-sm text-textMain rounded-input focus:outline-none focus:ring-1 transition-colors duration-200 ${
    error
      ? 'border-danger focus:border-danger focus:ring-danger'
      : 'border-borderGray focus:border-primary focus:ring-primary'
  }`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[11px] font-semibold text-textMuted uppercase tracking-[0.08em] flex items-center gap-0.5">
          {label}
          {required && <span className="text-danger font-bold">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`${inputClass} bg-white`}
          required={required}
          {...props}
        >
          <option value="" disabled>{placeholder || `Select ${label}`}</option>
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value !== undefined ? opt.value : opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={inputClass}
          required={required}
          {...props}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClass}
          required={required}
          {...props}
        />
      )}

      {error && (
        <span className="text-xs text-danger font-medium animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
}
