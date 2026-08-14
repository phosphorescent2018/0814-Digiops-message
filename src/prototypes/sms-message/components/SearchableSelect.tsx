/**
 * 可搜索下拉：输入关键字过滤选项，点击选择；用于运营计划等选项较多的筛选场景
 */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    width?: number;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = '请选择',
    width = 240,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [keyword, setKeyword] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);
    const kw = keyword.trim().toLowerCase();
    const filtered = kw ? options.filter((o) => o.label.toLowerCase().includes(kw)) : options;

    useEffect(() => {
        if (!open) return;
        const onDocMouseDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [open]);

    const choose = (v: string) => {
        onChange(v);
        setOpen(false);
        setKeyword('');
    };

    return (
        <div className="searchable-select" ref={rootRef} style={{ width }}>
            <div
                className={`searchable-select-control${open ? ' open' : ''}`}
                onClick={() => setOpen((prev) => !prev)}
            >
                {open ? (
                    <input
                        className="searchable-select-input"
                        autoFocus
                        value={keyword}
                        placeholder="搜索计划名称"
                        onChange={(e) => setKeyword(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && filtered.length > 0) choose(filtered[0].value);
                            if (e.key === 'Escape') setOpen(false);
                        }}
                    />
                ) : (
                    <span className={`searchable-select-value${selected ? '' : ' placeholder'}`}>
                        {selected?.label ?? placeholder}
                    </span>
                )}
                {open ? (
                    <Search size={14} className="searchable-select-icon" />
                ) : (
                    <ChevronDown size={14} className="searchable-select-icon" />
                )}
            </div>
            {open && (
                <div className="searchable-select-dropdown">
                    {filtered.length > 0 ? (
                        filtered.map((o) => (
                            <div
                                key={o.value}
                                className={`searchable-select-option${o.value === value ? ' selected' : ''}`}
                                title={o.label}
                                onClick={() => choose(o.value)}
                            >
                                {o.label}
                            </div>
                        ))
                    ) : (
                        <div className="searchable-select-empty">无匹配结果</div>
                    )}
                </div>
            )}
        </div>
    );
}
