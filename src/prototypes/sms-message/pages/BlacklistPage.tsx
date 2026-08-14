/**
 * 黑名单：名单库资产管理
 * 供人工补发（提交前可选手动过滤）、自动补发（默认强制校验）、运营计划前置校验（可选配置）使用
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Download,
    Upload,
    Plus,
    RotateCcw,
    Search,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ArrowRight,
    Info,
    CheckCircle2,
    FileSpreadsheet,
} from 'lucide-react';
import { blacklistRows, type BlacklistRow } from '../mockData';
import ExportModal from '../components/ExportModal';

const PAGE_SIZE = 10;

interface BlacklistFilter {
    phone: string;
    businessId: string;
    status: string;
    startDate: string;
    endDate: string;
}

const EMPTY_FILTER: BlacklistFilter = { phone: '', businessId: '', status: '', startDate: '', endDate: '' };

/** 轻量下拉：无「请选择」占位选项，未选时仅显示灰色提示 */
function BlacklistSelect({
    value,
    onChange,
    placeholder,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    options: string[];
}) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const toggle = () => {
        if (open) {
            setOpen(false);
            return;
        }
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ top: Math.round(rect.bottom + 4), left: Math.round(rect.left) });
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const onDocMouseDown = (e: MouseEvent) => {
            const pop = document.querySelector('.blacklist-select-pop');
            const trigger = triggerRef.current;
            if (pop && !pop.contains(e.target as Node) && trigger && !trigger.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [open]);

    return (
        <div className="blacklist-select-wrap">
            <div
                ref={triggerRef}
                className={`blacklist-select${value ? ' has-value' : ''}`}
                onClick={toggle}
                role="button"
                tabIndex={0}
            >
                <span>{value || placeholder}</span>
                <ChevronDown size={13} />
            </div>
            {open &&
                pos &&
                createPortal(
                    <div className="blacklist-select-pop" style={{ top: pos.top, left: pos.left }}>
                        {options.map((opt) => (
                            <div
                                key={opt}
                                className={`blacklist-select-option${opt === value ? ' selected' : ''}`}
                                onClick={() => {
                                    onChange(opt);
                                    setOpen(false);
                                }}
                            >
                                {opt}
                            </div>
                        ))}
                    </div>,
                    document.body
                )}
        </div>
    );
}

/** 状态 hover 提示 */
function BlacklistTooltip({ text, children }: { text: string; children: React.ReactNode }) {
    return (
        <span className="sms-tooltip-wrap">
            {children}
            <span className="sms-tooltip">{text}</span>
        </span>
    );
}

function SearchForm({
    draft,
    onDraftChange,
    onQuery,
    onReset,
}: {
    draft: BlacklistFilter;
    onDraftChange: (patch: Partial<BlacklistFilter>) => void;
    onQuery: () => void;
    onReset: () => void;
}) {
    return (
        <div className="sms-card sms-search blacklist-search">
            <div className="sms-search-grid">
                <div className="sms-form-item">
                    <label className="sms-form-label">手机号码</label>
                    <div className="sms-form-control">
                        <input
                            className="sms-input"
                            placeholder="请输入"
                            value={draft.phone}
                            onChange={(e) => onDraftChange({ phone: e.target.value })}
                        />
                    </div>
                </div>
                <div className="sms-form-item">
                    <label className="sms-form-label">BusinessID</label>
                    <div className="sms-form-control">
                        <BlacklistSelect
                            value={draft.businessId}
                            onChange={(v) => onDraftChange({ businessId: v })}
                            placeholder="请选择"
                            options={['MTN_UG_Account_id', 'MTN_UG_Product_id']}
                        />
                    </div>
                </div>
                <div className="sms-form-item">
                    <label className="sms-form-label">状态</label>
                    <div className="sms-form-control">
                        <BlacklistSelect
                            value={draft.status}
                            onChange={(v) => onDraftChange({ status: v })}
                            placeholder="请选择"
                            options={['生效中', '已失效']}
                        />
                    </div>
                </div>
                <div className="sms-form-item">
                    <label className="sms-form-label">添加日期</label>
                    <div className="sms-form-control">
                        <div className="blacklist-filter-date">
                            <ExpireDatePicker
                                value={draft.startDate}
                                onChange={(v) => onDraftChange({ startDate: v })}
                                placeholder="起始日期"
                            />
                            <span className="blacklist-filter-date-arrow">
                                <ArrowRight size={12} />
                            </span>
                            <ExpireDatePicker
                                value={draft.endDate}
                                onChange={(v) => onDraftChange({ endDate: v })}
                                placeholder="结束日期"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="sms-search-actions blacklist-search-actions">
                <div className="blacklist-actions-left">
                    <button type="button" className="sms-btn" onClick={onReset}>
                        <RotateCcw size={14} />
                        重置
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary" onClick={onQuery}>
                        <Search size={14} />
                        查询
                    </button>
                </div>
            </div>
        </div>
    );
}

/** 日期选择：轻量日历弹层，仅用于原型演示 */
function ExpireDatePicker({
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

function BlacklistTable({
    filters,
    onAdd,
    onImport,
    onDetail,
    onExport,
    onToast,
    onExportSelected,
}: {
    filters: BlacklistFilter | null;
    onAdd: () => void;
    onImport: () => void;
    onDetail: (row: BlacklistRow) => void;
    onExport: () => void;
    onToast: (text: string, warn?: boolean) => void;
    onExportSelected: (count: number) => void;
}) {
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<BlacklistRow[]>(blacklistRows);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [removeTarget, setRemoveTarget] = useState<BlacklistRow | null>(null);
    const [toggleTarget, setToggleTarget] = useState<BlacklistRow | null>(null);
    const [batchAction, setBatchAction] = useState<null | 'enable' | 'disable' | 'remove'>(null);
    const filteredRows = useMemo(() => {
        if (!filters) return rows;
        const phone = filters.phone.trim().toLowerCase();
        const startDate = filters.startDate;
        const endDate = filters.endDate;
        return rows.filter((row) => {
            if (phone && !row.phone.toLowerCase().includes(phone)) return false;
            if (filters.businessId && row.businessId !== filters.businessId) return false;
            if (filters.status === '生效中' && row.status !== 'active') return false;
            if (filters.status === '已失效' && row.status !== 'expired') return false;
            const date = row.addTime.slice(0, 10);
            if (startDate && date < startDate) return false;
            if (endDate && date > endDate) return false;
            return true;
        });
    }, [filters, rows]);

    useEffect(() => {
        setPage(1);
    }, [filteredRows]);

    const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

    const pageRowIndexes = pageRows.map((r) => r.index);
    const pageAllChecked = pageRowIndexes.length > 0 && pageRowIndexes.every((i) => selected.has(i));

    const togglePageSelect = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (pageAllChecked) {
                pageRowIndexes.forEach((i) => next.delete(i));
            } else {
                pageRowIndexes.forEach((i) => next.add(i));
            }
            return next;
        });
    };

    const toggleRowSelect = (index: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const handleToggleConfirm = () => {
        if (!toggleTarget) return;
        setRows((prev) =>
            prev.map((r) => (r.index === toggleTarget.index ? { ...r, status: r.status === 'active' ? 'expired' : 'active' } : r))
        );
        onToast(toggleTarget.status === 'active' ? '已失效，该号码暂停拦截' : '已生效，恢复拦截');
        setToggleTarget(null);
    };

    const handleRemoveConfirm = () => {
        if (!removeTarget) return;
        setRows((prev) => prev.filter((r) => r.index !== removeTarget.index));
        setSelected((prev) => {
            const next = new Set(prev);
            next.delete(removeTarget.index);
            return next;
        });
        onToast('已移除');
        setRemoveTarget(null);
    };

    const handleBatchConfirm = () => {
        if (!batchAction) return;
        const count = selected.size;
        if (batchAction === 'remove') {
            setRows((prev) => prev.filter((r) => !selected.has(r.index)));
            onToast(`已移除 ${count} 条`);
        } else {
            setRows((prev) =>
                prev.map((r) =>
                    selected.has(r.index)
                        ? { ...r, status: batchAction === 'enable' ? 'active' : 'expired' }
                        : r
                )
            );
            onToast(batchAction === 'enable' ? `已生效 ${count} 条` : `已失效 ${count} 条`);
        }
        setSelected(new Set());
        setBatchAction(null);
    };

    return (
        <div className="sms-card sms-table-card blacklist-card">
            <div className="sms-toolbar">
                <span className="blacklist-table-title">黑名单列表</span>
                <div className="sms-toolbar-right">
                    <button type="button" className="sms-btn" onClick={onImport}>
                        <Upload size={14} />
                        批量导入
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary" onClick={onAdd}>
                        <Plus size={14} />
                        新增黑名单
                    </button>
                    {selected.size > 0 && (
                        <button type="button" className="sms-btn" onClick={() => onExportSelected(selected.size)}>
                            <Download size={14} />
                            导出选中 {selected.size} 条
                        </button>
                    )}
                    <button type="button" className="sms-btn sms-btn-primary" onClick={onExport}>
                        <Download size={14} />
                        导出
                    </button>
                </div>
            </div>
            {selected.size > 0 && (
                <div className="blacklist-batch-bar">
                    <span className="blacklist-batch-count">已选 {selected.size} 条</span>
                    <button type="button" className="sms-btn" onClick={() => setBatchAction('enable')}>
                        批量生效
                    </button>
                    <button type="button" className="sms-btn" onClick={() => setBatchAction('disable')}>
                        批量失效
                    </button>
                    <button type="button" className="sms-btn resend-danger-btn" onClick={() => setBatchAction('remove')}>
                        批量移除
                    </button>
                    <button type="button" className="sms-action-link" onClick={() => setSelected(new Set())}>
                        清空选择
                    </button>
                </div>
            )}
            <div className="sms-table-wrap">
                <table className="sms-table blacklist-table">
                    <thead>
                        <tr>
                            <th className="blacklist-col-check">
                                <input
                                    type="checkbox"
                                    className="blacklist-checkbox"
                                    checked={pageAllChecked}
                                    onChange={togglePageSelect}
                                />
                            </th>
                            <th className="blacklist-col-index">序号</th>
                            <th className="blacklist-col-phone">手机号码</th>
                            <th className="blacklist-col-business">BusinessID</th>
                            <th className="blacklist-col-time">添加时间</th>
                            <th className="blacklist-col-time">生效时间</th>
                            <th className="blacklist-col-time">失效时间</th>
                            <th className="blacklist-col-status">状态</th>
                            <th className="blacklist-col-remark">备注</th>
                            <th className="blacklist-col-actions">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 ? (
                            <tr>
                                <td className="blacklist-empty" colSpan={10}>
                                    暂无数据
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((row) => (
                                <tr key={row.index}>
                                <td className="blacklist-col-check">
                                    <input
                                        type="checkbox"
                                        className="blacklist-checkbox"
                                        checked={selected.has(row.index)}
                                        onChange={() => toggleRowSelect(row.index)}
                                    />
                                </td>
                                <td className="blacklist-col-index">{row.index}</td>
                                <td className="blacklist-col-phone">
                                    <span className="blacklist-phone">{row.phone}</span>
                                </td>
                                <td className="blacklist-col-business">
                                    <span className="blacklist-cell" title={row.businessId}>
                                        {row.businessId}
                                    </span>
                                </td>
                                <td className="blacklist-col-time">{row.addTime}</td>
                                <td className="blacklist-col-time">{row.effectiveTime}</td>
                                <td className="blacklist-col-time">
                                    {row.expireTime === '永久' ? (
                                        <span className="sms-dash">永久</span>
                                    ) : (
                                        row.expireTime
                                    )}
                                </td>
                                <td className="blacklist-col-status">
                                    {row.status === 'active' ? (
                                        <BlacklistTooltip text="参与补发 / 发送拦截">
                                            <span className="sms-status sms-status-success">生效中</span>
                                        </BlacklistTooltip>
                                    ) : (
                                        <BlacklistTooltip text="不再参与拦截">
                                            <span className="sms-status sms-status-unknown">已失效</span>
                                        </BlacklistTooltip>
                                    )}
                                </td>
                                <td className="blacklist-col-remark">
                                    <span className="blacklist-remark" title={row.remark}>
                                        {row.remark}
                                    </span>
                                </td>
                                <td className="blacklist-col-actions">
                                    <button type="button" className="sms-action-link" onClick={() => onDetail(row)}>
                                        查看
                                    </button>
                                    {row.status === 'active' ? (
                                        <button
                                            type="button"
                                            className="sms-action-link sms-action-danger"
                                            onClick={() => setToggleTarget(row)}
                                        >
                                            失效
                                        </button>
                                    ) : (
                                        <button type="button" className="sms-action-link" onClick={() => setToggleTarget(row)}>
                                            生效
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="sms-action-link sms-action-danger"
                                        onClick={() => setRemoveTarget(row)}
                                    >
                                        移除
                                    </button>
                                </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="sms-pagination">
                <span className="sms-pagination-total">共 {filteredRows.length} 条</span>
                <button
                    type="button"
                    className="sms-page-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                >
                    ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                        type="button"
                        key={p}
                        className={`sms-page-btn${p === page ? ' active' : ''}`}
                        onClick={() => setPage(p)}
                    >
                        {p}
                    </button>
                ))}
                <button
                    type="button"
                    className="sms-page-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    ›
                </button>
                <select className="sms-page-size" defaultValue={PAGE_SIZE}>
                    <option value={10}>10 条/页</option>
                    <option value={20}>20 条/页</option>
                    <option value={50}>50 条/页</option>
                </select>
            </div>
            {removeTarget && (
                <RemoveModal row={removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemoveConfirm} />
            )}
            {toggleTarget && (
                <ToggleModal row={toggleTarget} onClose={() => setToggleTarget(null)} onConfirm={handleToggleConfirm} />
            )}
            {batchAction && (
                <BatchModal
                    action={batchAction}
                    count={selected.size}
                    onClose={() => setBatchAction(null)}
                    onConfirm={handleBatchConfirm}
                />
            )}
        </div>
    );
}

function AddModal({ onClose }: { onClose: () => void }) {
    const [expireType, setExpireType] = useState<'forever' | 'expire'>('forever');
    const [expireDate, setExpireDate] = useState('');
    const [phones, setPhones] = useState('');
    const [businessId, setBusinessId] = useState('');

    const canSubmit = phones.trim() !== '' && businessId.trim() !== '' && (expireType === 'forever' || expireDate !== '');

    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal blacklist-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">新增黑名单</div>
                <div className="sms-modal-body">
                    <div className="sms-form-item">
                        <label className="sms-form-label">
                            <span className="blacklist-required">*</span>手机号码
                        </label>
                        <div className="sms-form-control">
                            <textarea
                                className="blacklist-textarea"
                                placeholder={'每行一个手机号码\n支持批量添加'}
                                rows={4}
                                value={phones}
                                onChange={(e) => setPhones(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">
                            <span className="blacklist-required">*</span>BusinessID
                        </label>
                        <div className="sms-form-control">
                            <input
                                className="sms-input"
                                placeholder="请输入 BusinessID"
                                value={businessId}
                                onChange={(e) => setBusinessId(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">
                            <span className="blacklist-required">*</span>有效期
                        </label>
                        <div className="sms-form-control">
                            <div className="blacklist-radio-group">
                                <label className="blacklist-radio">
                                    <input
                                        type="radio"
                                        name="expireType"
                                        checked={expireType === 'forever'}
                                        onChange={() => setExpireType('forever')}
                                    />
                                    永久
                                </label>
                                <label className="blacklist-radio">
                                    <input
                                        type="radio"
                                        name="expireType"
                                        checked={expireType === 'expire'}
                                        onChange={() => setExpireType('expire')}
                                    />
                                    指定时间
                                </label>
                                {expireType === 'expire' && (
                                    <div className="blacklist-expire-inline">
                                        <ExpireDatePicker value={expireDate} onChange={setExpireDate} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">备注</label>
                        <div className="sms-form-control">
                            <input className="sms-input" placeholder="请输入备注" />
                        </div>
                    </div>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取消
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary" disabled={!canSubmit} onClick={onClose}>
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
}

function ImportModal({ onClose }: { onClose: () => void }) {
    const [templateTip, setTemplateTip] = useState('');

    const downloadTemplate = () => {
        setTemplateTip('黑名单导入模板下载成功');
        window.setTimeout(() => setTemplateTip(''), 2500);
    };

    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal blacklist-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">批量导入黑名单</div>
                <div className="sms-modal-body">
                    <div className="blacklist-file-drop">
                        <FileSpreadsheet size={28} />
                        <span>点击选择或拖拽文件到此处</span>
                        <span className="blacklist-file-hint">支持 .xlsx / .csv，首列为手机号码；每次仅允许上传 1 万条</span>
                        <button type="button" className="sms-btn">
                            选择文件
                        </button>
                    </div>
                    <div className="blacklist-import-tip">
                        导入前请确认号码格式正确，导入后立即生效；已有号码将自动跳过。
                    </div>
                    <button
                        type="button"
                        className="sms-action-link blacklist-import-template"
                        onClick={downloadTemplate}
                    >
                        下载导入模板
                    </button>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取消
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary" onClick={onClose}>
                        确定
                    </button>
                </div>
            </div>
            {templateTip && (
                <div className="resend-toast">
                    <CheckCircle2 size={15} />
                    {templateTip}
                </div>
            )}
        </div>
    );
}

function RemoveModal({ row, onClose, onConfirm }: { row: BlacklistRow; onClose: () => void; onConfirm: () => void }) {
    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">移除黑名单</div>
                <div className="sms-modal-body">
                    <div className="resend-danger-text">
                        确认移除 <b>{row.phone}</b> 吗？
                    </div>
                    <div className="blacklist-remove-tip">
                        移除后该号码将不再被黑名单拦截，人工补发、自动补发及运营计划将可能向其发送短信。
                    </div>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取消
                    </button>
                    <button type="button" className="sms-btn resend-danger-btn" onClick={onConfirm}>
                        确认移除
                    </button>
                </div>
            </div>
        </div>
    );
}

function ToggleModal({ row, onClose, onConfirm }: { row: BlacklistRow; onClose: () => void; onConfirm: () => void }) {
    const isDisable = row.status === 'active';
    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">{isDisable ? '失效黑名单' : '恢复生效'}</div>
                <div className="sms-modal-body">
                    <div className="resend-danger-text">
                        确认将 <b>{row.phone}</b> {isDisable ? '失效' : '恢复生效'} 吗？
                    </div>
                    <div className="blacklist-remove-tip">
                        {isDisable
                            ? '失效后该号码将暂停参与拦截，名单保留，可随时恢复生效。'
                            : '生效后将参与人工补发、自动补发及运营计划的拦截校验。'}
                    </div>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取消
                    </button>
                    <button
                        type="button"
                        className={`sms-btn ${isDisable ? 'resend-danger-btn' : 'sms-btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {isDisable ? '确认失效' : '确认生效'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function BatchModal({
    action,
    count,
    onClose,
    onConfirm,
}: {
    action: 'enable' | 'disable' | 'remove';
    count: number;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const config = {
        enable: { title: '批量生效', tip: '恢复后将参与人工补发、自动补发及运营计划的拦截校验。' },
        disable: { title: '批量失效', tip: '失效后暂停拦截，名单保留，可随时恢复生效。' },
        remove: {
            title: '批量移除',
            tip: '移除后需重新导入才能恢复，历史拦截记录仍保留。',
        },
    }[action];
    const isRemove = action === 'remove';
    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">{config.title}</div>
                <div className="sms-modal-body">
                    <div className="resend-danger-text">
                        确认对选中的 <b>{count}</b> 条黑名单执行{isRemove ? '移除' : action === 'enable' ? '生效' : '失效'}吗？
                    </div>
                    <div className="blacklist-remove-tip">{config.tip}</div>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取消
                    </button>
                    <button
                        type="button"
                        className={`sms-btn ${isRemove ? 'resend-danger-btn' : 'sms-btn-primary'}`}
                        onClick={onConfirm}
                    >
                        确认{config.title.slice(2)}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailModal({ row, onClose }: { row: BlacklistRow; onClose: () => void }) {
    const hits = [
        { time: '2026-08-13 09:32:18', source: '自动补发校验', result: '已拦截' },
        { time: '2026-08-13 08:15:47', source: '运营计划 · 运营计划名称', result: '已拦截' },
        { time: '2026-08-12 19:04:22', source: '人工补发校验', result: '已拦截' },
    ];

    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal blacklist-modal blacklist-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">黑名单详情</div>
                <div className="sms-modal-body">
                    <div className="blacklist-detail-grid">
                        <div>
                            <span className="blacklist-detail-label">手机号码</span>
                            <span className="blacklist-detail-value">{row.phone}</span>
                        </div>
                        <div>
                            <span className="blacklist-detail-label">BusinessID</span>
                            <span className="blacklist-detail-value">{row.businessId}</span>
                        </div>
                        <div>
                            <span className="blacklist-detail-label">添加时间</span>
                            <span className="blacklist-detail-value">{row.addTime}</span>
                        </div>
                        <div>
                            <span className="blacklist-detail-label">生效时间</span>
                            <span className="blacklist-detail-value">{row.effectiveTime}</span>
                        </div>
                        <div>
                            <span className="blacklist-detail-label">失效时间</span>
                            <span className="blacklist-detail-value">{row.expireTime}</span>
                        </div>
                        <div>
                            <span className="blacklist-detail-label">状态</span>
                            <span className="blacklist-detail-value">
                                {row.status === 'active' ? '生效中' : '已失效'}
                            </span>
                        </div>
                        <div className="blacklist-detail-full">
                            <span className="blacklist-detail-label">备注</span>
                            <span className="blacklist-detail-value">{row.remark}</span>
                        </div>
                    </div>
                    <div className="blacklist-hit-title">最近拦截记录</div>
                    <div className="blacklist-hit-list">
                        {hits.map((hit, i) => (
                            <div className="blacklist-hit-item" key={i}>
                                <span className="blacklist-hit-time">{hit.time}</span>
                                <span className="blacklist-hit-source">{hit.source}</span>
                                <span className="sms-status sms-status-fail">{hit.result}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn sms-btn-primary" onClick={onClose}>
                        知道了
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BlacklistPage() {
    const [exportVisible, setExportVisible] = useState(false);
    const [addVisible, setAddVisible] = useState(false);
    const [importVisible, setImportVisible] = useState(false);
    const [detailTarget, setDetailTarget] = useState<BlacklistRow | null>(null);
    const [draft, setDraft] = useState<BlacklistFilter>(EMPTY_FILTER);
    const [applied, setApplied] = useState<BlacklistFilter | null>(null);
    const [toast, setToast] = useState<{ text: string; warn?: boolean } | null>(null);

    const showToast = (text: string, warn = false) => {
        setToast({ text, warn });
        window.setTimeout(() => setToast(null), 2200);
    };

    const handleQuery = () => {
        const isEmpty =
            !draft.phone.trim() &&
            !draft.businessId &&
            !draft.status &&
            !draft.startDate &&
            !draft.endDate;
        if (isEmpty) {
            showToast('请至少输入一个查询条件', true);
            return;
        }
        setApplied({ ...draft });
        showToast('查询完成');
    };

    const handleReset = () => {
        setDraft({ ...EMPTY_FILTER });
        setApplied(null);
        showToast('筛选条件已重置');
    };

    const stats = [
        { label: '名单总数', value: '12,847', tone: '' },
        { label: '生效中', value: '11,203', tone: 'success' },
        { label: '已失效', value: '1,644', tone: 'unknown' },
        { label: '今日拦截', value: '236', tone: 'danger' },
    ];

    return (
        <div className="blacklist-page">
            <div className="blacklist-tip">
                <Info size={14} />
                <span>
                    人工补发可选手动过滤，自动补发默认强制校验，支持在运营计划画布中配置。
                </span>
            </div>

            <div className="blacklist-stat-row">
                {stats.map((s) => (
                    <div className="resend-stat-card" key={s.label}>
                        <div className="resend-stat-main">
                            <div className={`resend-stat-num resend-stat-${s.tone || 'normal'}`}>{s.value}</div>
                            <div className="resend-stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="blacklist-section">
                <SearchForm
                    draft={draft}
                    onDraftChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
                    onQuery={handleQuery}
                    onReset={handleReset}
                />
                <BlacklistTable
                    filters={applied}
                    onAdd={() => setAddVisible(true)}
                    onImport={() => setImportVisible(true)}
                    onDetail={(row) => setDetailTarget(row)}
                    onExport={() => setExportVisible(true)}
                    onToast={showToast}
                    onExportSelected={(count) => {
                        setExportVisible(true);
                    }}
                />
            </div>

            {exportVisible && (
                <ExportModal
                    visible
                    hideFormat
                    requireName
                    defaultName="黑名单_20260813"
                    onClose={() => setExportVisible(false)}
                    onConfirm={() => showToast('导出成功')}
                />
            )}
            {addVisible && <AddModal onClose={() => setAddVisible(false)} />}
            {importVisible && <ImportModal onClose={() => setImportVisible(false)} />}
            {detailTarget && <DetailModal row={detailTarget} onClose={() => setDetailTarget(null)} />}
            {toast && (
                <div className={`resend-toast${toast.warn ? ' warn' : ''}`}>
                    {toast.warn ? <Info size={15} /> : <CheckCircle2 size={15} />}
                    {toast.text}
                </div>
            )}
        </div>
    );
}
