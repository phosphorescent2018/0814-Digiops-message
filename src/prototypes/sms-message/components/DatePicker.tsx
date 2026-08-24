/**
 * 轻量日期选择：点击弹日历弹层，仅用于原型演示
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DatePicker({
    value,
    onChange,
    placeholder = '选择日期',
}: {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const [view, setView] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const triggerRef = useRef<HTMLDivElement>(null);

    const openPicker = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ top: Math.round(rect.bottom + 4), left: Math.round(rect.left) });
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const onDocMouseDown = (e: MouseEvent) => {
            const pop = document.querySelector('.blacklist-date-pop');
            if (pop && !pop.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [open]);

    const today = new Date();
    const firstDay = new Date(view.year, view.month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array.from({ length: startWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const selectDate = (day: number) => {
        onChange(`${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        setOpen(false);
    };

    return (
        <div className="blacklist-date-picker">
            <div
                ref={triggerRef}
                className={`sms-date-range blacklist-expire-date${value ? ' has-value' : ''}`}
                onClick={openPicker}
                role="button"
                tabIndex={0}
            >
                <Calendar size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                {value || placeholder}
            </div>
            {open &&
                pos &&
                createPortal(
                    <div className="blacklist-date-pop" style={{ top: pos.top, left: pos.left }}>
                        <div className="blacklist-date-pop-head">
                            <button type="button" onClick={() => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }))}>
                                <ChevronLeft size={14} />
                            </button>
                            <span>
                                {view.year} 年 {view.month + 1} 月
                            </span>
                            <button type="button" onClick={() => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }))}>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="blacklist-date-pop-week">
                            {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
                                <span key={w}>{w}</span>
                            ))}
                        </div>
                        <div className="blacklist-date-pop-grid">
                            {cells.map((day, i) => (
                                <button
                                    type="button"
                                    key={i}
                                    className={[
                                        'blacklist-date-cell',
                                        day === null ? ' empty' : '',
                                        day === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear() ? ' today' : '',
                                        value === `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day ?? '').padStart(2, '0')}` ? ' selected' : '',
                                    ].join('')}
                                    disabled={day === null}
                                    onClick={() => day !== null && selectDate(day)}
                                >
                                    {day ?? ''}
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
