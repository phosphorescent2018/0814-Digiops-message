/**
 * 列设置：点击图标弹出面板，勾选控制表格列显隐；固定列（操作）不可取消
 */
import React, { useEffect, useRef, useState } from 'react';
import { ListFilter } from 'lucide-react';

export interface ColumnDef {
    key: string;
    label: string;
    fixed?: boolean;
}

interface ColumnSettingsProps {
    columns: ColumnDef[];
    visible: string[];
    onChange: (key: string, checked: boolean) => void;
}

export default function ColumnSettings({ columns, visible, onChange }: ColumnSettingsProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    return (
        <div className="column-settings" ref={ref}>
            <button
                type="button"
                className={`sms-btn sms-btn-icon${open ? ' active' : ''}`}
                title="列设置"
                aria-label="列设置"
                onClick={() => setOpen((v) => !v)}
            >
                <ListFilter size={15} />
            </button>
            {open && (
                <div className="column-settings-panel">
                    <div className="column-settings-head">列设置</div>
                    {columns.map((col) => (
                        <label key={col.key} className={`column-settings-item${col.fixed ? ' fixed' : ''}`}>
                            <input
                                type="checkbox"
                                checked={visible.includes(col.key)}
                                disabled={col.fixed}
                                onChange={(e) => onChange(col.key, e.target.checked)}
                            />
                            <span>{col.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
