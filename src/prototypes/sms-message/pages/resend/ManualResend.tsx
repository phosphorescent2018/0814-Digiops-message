/**
 * 人工补发：条件筛选 → 命中汇总（导出/定时/立即补发）→ 批次补发记录
 */
import React, { useState } from 'react';
import { Search, RotateCcw, Download, Clock, Send, Eye, Ban, Check, Calendar, ChevronUp } from 'lucide-react';
import BatchDetail from './BatchDetail';
import ColumnSettings, { type ColumnDef } from '../../components/ColumnSettings';
import ExportModal from '../../components/ExportModal';
import type { RecordFilter } from './BatchDetail';

interface ManualResendProps {
    onSwitchTab?: (tab: 'record', filter?: RecordFilter) => void;
}

const FIELD_LABELS = [
    '发送时间',
    'BusinessID',
    '计划名称',
    '用户分组',
    '手机号码',
    '内容类型',
    '发送名称',
    '发送状态',
    '送达状态',
    '补发批次 ID',
    '补发状态',
    '路径标记',
];

export interface BatchRow {
    id: string;
    scheduledTime: string;
    endTime: string;
    mode: '立即补发' | '定时补发';
    isTerminated: boolean;
    isFailed: boolean;
    /** 提交校验数量：提交时用户校验的补发数量 */
    userVerifiedCount: number;
    /** 实际发送数量：实际执行了发送动作的条数（含单条提交失败）；待执行时为 null */
    systemVerifiedCount: number | null;
}

const BATCHES: BatchRow[] = [
    {
        id: '20260812003',
        scheduledTime: '2026-08-12 14:35:12',
        endTime: '—',
        mode: '立即补发',
        isTerminated: false,
        isFailed: false,
        userVerifiedCount: 1284,
        systemVerifiedCount: 620,
    },
    {
        id: '20260812002',
        scheduledTime: '2026-08-12 13:00:00',
        endTime: '2026-08-12 13:04:52',
        mode: '定时补发',
        isTerminated: false,
        isFailed: false,
        userVerifiedCount: 860,
        systemVerifiedCount: 842,
    },
    {
        id: '20260812001',
        scheduledTime: '2026-08-12 09:26:33',
        endTime: '2026-08-12 09:31:18',
        mode: '立即补发',
        isTerminated: true,
        isFailed: false,
        userVerifiedCount: 512,
        systemVerifiedCount: 352,
    },
    {
        id: '20260811007',
        scheduledTime: '2026-08-11 20:15:40',
        endTime: '2026-08-11 20:22:03',
        mode: '定时补发',
        isTerminated: false,
        isFailed: false,
        userVerifiedCount: 2035,
        systemVerifiedCount: 2018,
    },
    {
        id: '20260823001',
        scheduledTime: '2026-08-23 18:00:00',
        endTime: '—',
        mode: '定时补发',
        isTerminated: false,
        isFailed: false,
        userVerifiedCount: 968,
        systemVerifiedCount: null,
    },
    {
        id: '20260812004',
        scheduledTime: '2026-08-12 15:01:00',
        endTime: '2026-08-12 15:01:20',
        mode: '立即补发',
        isTerminated: false,
        isFailed: true,
        userVerifiedCount: 300,
        systemVerifiedCount: 0,
    },
    {
        id: '20260812005',
        scheduledTime: '2026-08-12 15:30:00',
        endTime: '2026-08-12 15:31:12',
        mode: '立即补发',
        isTerminated: false,
        isFailed: true,
        userVerifiedCount: 1500,
        systemVerifiedCount: 620,
    },
];

export const STATUS_CLASS: Record<string, string> = {
    待执行: 'sms-status-pending',
    执行中: 'sms-status-delivering',
    已完成: 'sms-status-success',
    已终止: 'sms-status-unknown',
    失败: 'sms-status-fail',
    部分失败: 'sms-status-warning',
};

const pad = (n: number) => String(n).padStart(2, '0');
const nowStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 按计划时间与当前时间动态计算批次状态 */
export const computeStatus = (b: BatchRow): '待执行' | '执行中' | '已完成' | '已终止' | '失败' | '部分失败' => {
    if (b.isTerminated) return '已终止';
    if (b.isFailed) return (b.systemVerifiedCount ?? 0) > 0 ? '部分失败' : '失败';
    if (b.mode === '定时补发' && b.scheduledTime > nowStr()) return '待执行';
    if (b.endTime !== '—') return '已完成';
    return '执行中';
};

type ModalType = 'immediate' | 'scheduled' | null;
type IgnoreBlacklist = 'yes' | 'no' | 'unset';

const MANUAL_COLUMNS: ColumnDef[] = [
    { key: 'batchId', label: '补发批次 ID' },
    { key: 'startTime', label: '补发开始时间' },
    { key: 'endTime', label: '补发结束时间' },
    { key: 'mode', label: '补发方式' },
    { key: 'userVerified', label: '提交校验数量' },
    { key: 'systemVerified', label: '实际发送数量' },
    { key: 'status', label: '补发状态' },
    { key: 'action', label: '操作', fixed: true },
];

export default function ManualResend({ onSwitchTab }: ManualResendProps) {
    const formRef = React.useRef<HTMLFormElement>(null);
    const [filterCollapsed, setFilterCollapsed] = useState(false);
    const [querying, setQuerying] = useState(false);
    const [hitCount, setHitCount] = useState(1284);
    const [hitVisible, setHitVisible] = useState(false);
    const [queryCount, setQueryCount] = useState(0);
    const [modal, setModal] = useState<ModalType>(null);
    const [ignoreBlacklist, setIgnoreBlacklist] = useState<IgnoreBlacklist>('unset');
    const [scheduledTime, setScheduledTime] = useState('');
    const [validating, setValidating] = useState(false);
    const [validated, setValidated] = useState(false);
    const [verifiedCount, setVerifiedCount] = useState<number | null>(null);
    const [toast, setToast] = useState('');
    const [terminateTarget, setTerminateTarget] = useState<BatchRow | null>(null);
    const [terminating, setTerminating] = useState(false);
    const [batches, setBatches] = useState<BatchRow[]>(BATCHES);
    const [detailBatch, setDetailBatch] = useState<BatchRow | null>(null);
    const [visibleCols, setVisibleCols] = useState<string[]>(MANUAL_COLUMNS.map((c) => c.key));
    const [exportVisible, setExportVisible] = useState(false);
    const [hasFilter, setHasFilter] = useState(false);
    const [batchPage, setBatchPage] = useState(1);

    const toggleCol = (key: string, checked: boolean) => {
        setVisibleCols((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)));
    };

    const showToast = (text: string) => {
        setToast(text);
        setTimeout(() => setToast(''), 2200);
    };

    /** 判断筛选区是否至少填写了一项条件（排除空串与占位“请选择”） */
    const checkHasFilter = () => {
        const form = formRef.current;
        if (!form) return false;
        return Array.from(form.elements).some((el) => {
            if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
                return el.value.trim() !== '';
            }
            return false;
        });
    };

    const query = () => {
        if (querying || !hasFilter) return;
        setQuerying(true);
        setTimeout(() => {
            setQuerying(false);
            // 每两次查询触发一次 0 命中，便于演示空状态
            const next = queryCount + 1;
            const count = next % 2 === 0 ? 0 : Math.floor(800 + Math.random() * 800);
            setQueryCount(next);
            setHitCount(count);
            setHitVisible(true);
            showToast(count === 0 ? '查询完成，当前条件筛选下无命中' : '查询完成，已更新命中数量');
        }, 700);
    };

    const reset = () => {
        formRef.current?.reset();
        setHasFilter(false);
        setHitVisible(false);
        showToast('筛选条件已重置');
    };

    const actualHit = hitCount - Math.round(hitCount * 0.036);
    const timeFormatValid = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(scheduledTime);
    const scheduledTimeValid = timeFormatValid && scheduledTime > nowStr();
    const scheduledTimeEmpty = modal === 'scheduled' && scheduledTime.trim() === '';

    const closeModal = () => {
        setModal(null);
        setValidated(false);
        setVerifiedCount(null);
    };

    const verifyCount = () => {
        if (validating || ignoreBlacklist === 'unset' || (modal === 'scheduled' && !scheduledTimeValid)) return;
        setValidating(true);
        setTimeout(() => {
            setValidating(false);
            // 模拟后端校验后的最新数量（略低于实际可补）
            setVerifiedCount(Math.max(actualHit - Math.round(actualHit * 0.02), 1));
            setValidated(true);
            showToast('校验完成，已获取最新补发数量');
        }, 800);
    };

    const confirmFinal = () => {
        if (!validated || verifiedCount === null) return;
        const isImmediate = modal === 'immediate';
        setBatchPage(1);
        setModal(null);
        setValidated(false);
        setVerifiedCount(null);
        const newBatch: BatchRow = {
            id: `20260812${String(100 + batches.length + 1).slice(-3)}`,
            scheduledTime: isImmediate ? nowStr() : scheduledTime,
            endTime: '—',
            mode: isImmediate ? '立即补发' : '定时补发',
            isTerminated: false,
            isFailed: false,
            userVerifiedCount: verifiedCount,
            systemVerifiedCount: isImmediate ? verifiedCount : null,
        };
        setBatches((prev) => [newBatch, ...prev]);
        // 提交后清空筛选条件、隐藏命中面板，回到初始状态
        formRef.current?.reset();
        setHitVisible(false);
        showToast(`${isImmediate ? '立即补发' : '定时补发'}任务已创建（批次 ${newBatch.id}）`);
    };

    const confirmTerminate = () => {
        if (!terminateTarget || terminating) return;
        setTerminating(true);
        setTimeout(() => {
            setBatches((prev) =>
                prev.map((b) =>
                    b.id === terminateTarget.id ? { ...b, isTerminated: true, endTime: nowStr() } : b
                )
            );
            // 同步更新抽屉中的批次快照
            setDetailBatch((prev) =>
                prev && prev.id === terminateTarget.id ? { ...prev, isTerminated: true, endTime: nowStr() } : prev
            );
            setTerminating(false);
            setTerminateTarget(null);
            showToast(`补发批次 ${terminateTarget.id} 已终止`);
        }, 600);
    };

    return (
        <div className="resend-manual">
            {/* ============ 板块一：条件筛选区 ============ */}
            <div className="sms-card resend-section">
                <div className="resend-section-title">
                    <span>条件筛选</span>
                </div>
                <form ref={formRef} onChange={() => setHasFilter(checkHasFilter())}>
                    <div className="resend-filter-grid">
                        {FIELD_LABELS.slice(0, filterCollapsed ? 6 : FIELD_LABELS.length).map((label) => (
                            <div className="sms-form-item" key={label}>
                                <label className="sms-form-label">{label}</label>
                                <div className="sms-form-control">
                                    {label === '发送时间' ? (
                                        <div className="sms-date-range">
                                            <span>
                                                <Calendar size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                                                起始日期
                                            </span>
                                            <span className="arrow">→</span>
                                            <span>结束日期</span>
                                        </div>
                                    ) : label === '手机号码' || label === '路径标记' || label === '补发批次 ID' ? (
                                        <input className="sms-input" placeholder="请输入" name={label} />
                                    ) : (
                                        <select className="sms-select placeholder" name={label}>
                                            <option value="">请选择</option>
                                            {label === 'BusinessID' && <option value="MTN_UG_Account_id">MTN_UG_Account_id</option>}
                                            {label === '发送状态' && (
                                                <>
                                                    <option value="2">成功</option>
                                                    <option value="1">失败</option>
                                                    <option value="0">暂无数据</option>
                                                </>
                                            )}
                                            {label === '送达状态' && (
                                                <>
                                                    <option value="回执中">回执中</option>
                                                    <option value="已送达">已送达</option>
                                                    <option value="回执超时">回执超时</option>
                                                    <option value="--">--</option>
                                                </>
                                            )}
                                            {label === '内容类型' && (
                                                <>
                                                    <option value="营销类">营销类</option>
                                                    <option value="通知类">通知类</option>
                                                </>
                                            )}
                                        </select>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="resend-filter-last-row">
                        {!filterCollapsed && (
                            <div className="sms-form-item">
                                <label className="sms-form-label">补发状态</label>
                                <div className="sms-form-control">
                                    <select className="sms-select" name="补发状态">
                                        <option value="">全部</option>
                                        <option value="未补发过">未补发过</option>
                                        <option value="已补发过">已补发过</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        {!filterCollapsed && (
                            <div className="sms-form-item">
                                <label className="sms-form-label">路径标记</label>
                                <div className="sms-form-control">
                                    <input className="sms-input" placeholder="请输入" name="路径标记" />
                                </div>
                            </div>
                        )}
                        <div className="resend-filter-actions">
                            <button type="button" className="sms-btn" onClick={reset}>
                                <RotateCcw size={14} />
                                重置
                            </button>
                            <span className="sms-tooltip-wrap">
                                <button
                                    type="button"
                                    className="sms-btn sms-btn-primary"
                                    onClick={query}
                                    disabled={querying || !hasFilter}
                                >
                                    {querying ? '查询中…' : (
                                        <>
                                            <Search size={14} />
                                            查询
                                        </>
                                    )}
                                </button>
                                {!hasFilter && <span className="sms-tooltip">请至少选择一项筛选条件</span>}
                            </span>
                            <button
                                type="button"
                                className="sms-btn sms-btn-link"
                                onClick={() => setFilterCollapsed(!filterCollapsed)}
                            >
                                {filterCollapsed ? '展开' : '收起'}
                                <ChevronUp size={14} style={{ transform: filterCollapsed ? 'rotate(180deg)' : 'none' }} />
                            </button>
                        </div>
                    </div>
                </form>

                {/* 查询后展开：命中信息（与条件筛选同一卡片） */}
                {hitVisible && hitCount > 0 && (
                    <div className="resend-hit-panel">
                        <div className="resend-hit-summary-text">
                            <span className="resend-hit-text-main">
                                当前筛选项下命中 <b>{hitCount.toLocaleString()}</b> 条，其中黑名单命中{' '}
                                <b>{Math.round(hitCount * 0.036).toLocaleString()}</b> 条，任务执行时将重新校验
                            </span>
                        </div>
                        <div className="resend-hit-actions">
                            <button type="button" className="sms-btn" onClick={() => showToast('命中结果已导出（原型演示）')}>
                                <Download size={14} />
                                导出 Excel
                            </button>
                            <button
                                type="button"
                                className="sms-btn"
                                onClick={() => {
                                    setModal('scheduled');
                                    setScheduledTime('');
                                }}
                            >
                                <Clock size={14} />
                                定时补发
                            </button>
                            <button
                                type="button"
                                className="sms-btn sms-btn-primary"
                                onClick={() => {
                                    setModal('immediate');
                                }}
                            >
                                <Send size={14} />
                                立即补发
                            </button>
                        </div>
                    </div>
                )}
                {hitVisible && hitCount === 0 && (
                    <div className="resend-hit-empty">当前条件筛选下无命中</div>
                )}
            </div>

            {/* ============ 板块二：批次补发记录 ============ */}
            <div className="sms-card resend-section">
                <div className="resend-table-toolbar">
                    <div className="resend-section-title">
                        <span>人工补发记录</span>
                        <span className="resend-section-sub">共 {batches.length} 个批次</span>
                    </div>
                    <div className="resend-table-toolbar-actions">
                        <button type="button" className="sms-btn sms-btn-primary" onClick={() => setExportVisible(true)}>
                            <Download size={14} />
                            导出
                        </button>
                        <ColumnSettings columns={MANUAL_COLUMNS} visible={visibleCols} onChange={toggleCol} />
                    </div>
                </div>
                <div className="sms-table-wrap resend-batch-wrap">
                    <table className="sms-table resend-table resend-batch-table">
                        <thead>
                            <tr>
                                {visibleCols.includes('batchId') && <th>补发批次 ID</th>}
                                {visibleCols.includes('startTime') && <th>补发开始时间</th>}
                                {visibleCols.includes('endTime') && <th>补发结束时间</th>}
                                {visibleCols.includes('mode') && <th>补发方式</th>}
                                {visibleCols.includes('userVerified') && (
                                    <th className="resend-th-tooltip">
                                        <span className="sms-tooltip-wrap">
                                            提交校验数量
                                            <span className="sms-tooltip">提交前用户校验的补发数量</span>
                                        </span>
                                    </th>
                                )}
                                {visibleCols.includes('systemVerified') && (
                                    <th className="resend-th-tooltip">
                                        <span className="sms-tooltip-wrap">
                                            实际发送数量
                                            <span className="sms-tooltip">实际执行了发送动作的条数</span>
                                        </span>
                                    </th>
                                )}
                                {visibleCols.includes('status') && <th>补发状态</th>}
                                {visibleCols.includes('action') && <th style={{ width: 160 }}>操作</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {batches.slice((batchPage - 1) * 5, batchPage * 5).map((b) => {
                                const status = computeStatus(b);
                                const canTerminate = status === '待执行' || status === '执行中';
                                return (
                                    <tr key={b.id}>
                                        {visibleCols.includes('batchId') && (
                                            <td>
                                                <span className="resend-batch-id">B{b.id}</span>
                                            </td>
                                        )}
                                        {visibleCols.includes('startTime') && <td>{b.scheduledTime}</td>}
                                        {visibleCols.includes('endTime') && <td>{b.endTime}</td>}
                                        {visibleCols.includes('mode') && <td>{b.mode}</td>}
                                        {visibleCols.includes('userVerified') && <td>{b.userVerifiedCount.toLocaleString()}</td>}
                                        {visibleCols.includes('systemVerified') && (
                                            <td>{b.systemVerifiedCount === null ? '—' : b.systemVerifiedCount.toLocaleString()}</td>
                                        )}
                                        {visibleCols.includes('status') && (
                                            <td>
                                                <span className={`sms-status ${STATUS_CLASS[status]}`}>{status}</span>
                                            </td>
                                        )}
                                        {visibleCols.includes('action') && (
                                            <td>
                                                <button
                                                    type="button"
                                                    className="sms-action-link"
                                                    onClick={() => setDetailBatch(b)}
                                                >
                                                    <Eye size={13} style={{ verticalAlign: '-2px', marginRight: 3 }} />
                                                    详情
                                                </button>
                                                <button
                                                    type="button"
                                                    className="sms-action-link resend-terminate"
                                                    disabled={!canTerminate}
                                                    onClick={() => setTerminateTarget(b)}
                                                >
                                                    <Ban size={13} style={{ verticalAlign: '-2px', marginRight: 3 }} />
                                                    终止
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="sms-pagination">
                    <span className="sms-pagination-total">共 {batches.length} 个批次</span>
                    <button
                        type="button"
                        className="sms-page-btn"
                        disabled={batchPage === 1}
                        onClick={() => setBatchPage((p) => p - 1)}
                    >
                        上一页
                    </button>
                    {Array.from({ length: Math.max(1, Math.ceil(batches.length / 5)) }, (_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`sms-page-btn${batchPage === i + 1 ? ' active' : ''}`}
                            onClick={() => setBatchPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        type="button"
                        className="sms-page-btn"
                        disabled={batchPage >= Math.max(1, Math.ceil(batches.length / 5))}
                        onClick={() => setBatchPage((p) => p + 1)}
                    >
                        下一页
                    </button>
                </div>
            </div>

            {/* ============ 补发弹窗①（立即/定时共用）：方式/时间/黑名单 ============ */}
            {modal !== null && (
                <div className="sms-mask" onClick={closeModal}>
                    <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sms-modal-header">{modal === 'immediate' ? '立即补发' : '定时补发'}</div>
                        <div className="sms-modal-body">
                            <div className="resend-confirm-row">
                                <span className="resend-confirm-label">补发方式</span>
                                <span className="resend-confirm-value">
                                    {modal === 'immediate' ? '立即补发' : '定时补发'}
                                </span>
                            </div>
                            <div className="resend-confirm-row">
                                <span className="resend-confirm-label">预计补发时间</span>
                                {modal === 'immediate' ? (
                                    <span className="resend-confirm-value">立即执行</span>
                                ) : (
                                    <div className="resend-time-field">
                                        <input
                                            type="datetime-local"
                                            className={`sms-input resend-time-input${!scheduledTimeEmpty && !scheduledTimeValid ? ' error' : ''}`}
                                            value={scheduledTime.slice(0, 16)}
                                            min={nowStr().slice(0, 16)}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setScheduledTime(v ? `${v.slice(0, 10)} ${v.slice(11)}:00` : '');
                                                setValidated(false);
                                                setVerifiedCount(null);
                                            }}
                                        />
                                        {scheduledTimeEmpty && (
                                            <span className="resend-time-placeholder">请选择补发时间</span>
                                        )}
                                        {!scheduledTimeEmpty && !scheduledTimeValid && (
                                            <span className="resend-time-error">补发时间需晚于当前时间（格式：YYYY-MM-DD HH:mm:ss）</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="resend-confirm-row">
                                <span className="resend-confirm-label">黑名单用户是否发送</span>
                                <div className="resend-radio-group">
                                    <label className={`resend-radio-item${ignoreBlacklist === 'no' ? ' checked' : ''}`}>
                                        <input
                                            type="radio"
                                            name="ignoreBlacklist"
                                            checked={ignoreBlacklist === 'no'}
                                            onChange={() => {
                                                setIgnoreBlacklist('no');
                                                setValidated(false);
                                                setVerifiedCount(null);
                                            }}
                                        />
                                        否
                                    </label>
                                    <label className={`resend-radio-item${ignoreBlacklist === 'yes' ? ' checked' : ''}`}>
                                        <input
                                            type="radio"
                                            name="ignoreBlacklist"
                                            checked={ignoreBlacklist === 'yes'}
                                            onChange={() => {
                                                setIgnoreBlacklist('yes');
                                                setValidated(false);
                                                setVerifiedCount(null);
                                            }}
                                        />
                                        是
                                    </label>
                                </div>
                            </div>
                            {ignoreBlacklist !== 'unset' && (
                                <div className={`resend-blacklist-tip${ignoreBlacklist === 'yes' ? ' warn' : ''}`}>
                                    {ignoreBlacklist === 'yes'
                                        ? '所补发用户将含有黑名单用户'
                                        : '所补发用户将不含有黑名单用户'}
                                </div>
                            )}
                            <div className="resend-confirm-row">
                                <span className="resend-confirm-label">补发数量</span>
                                <div className="resend-verify-wrap">
                                    {validated && verifiedCount !== null ? (
                                        <span className="resend-confirm-value resend-count-strong">
                                            {verifiedCount.toLocaleString()} 条
                                        </span>
                                    ) : (
                                        <span className="sms-tooltip-wrap">
                                            <button
                                                type="button"
                                                className="sms-btn"
                                                onClick={verifyCount}
                                                disabled={
                                                    validating ||
                                                    ignoreBlacklist === 'unset' ||
                                                    (modal === 'scheduled' && !scheduledTimeValid)
                                                }
                                            >
                                                {validating ? '校验中…' : '点击校验'}
                                            </button>
                                            {(ignoreBlacklist === 'unset' || (modal === 'scheduled' && !scheduledTimeValid)) && (
                                                <span className="sms-tooltip">
                                                    {ignoreBlacklist === 'unset'
                                                        ? '请先选择黑名单用户是否发送'
                                                        : '请先选择晚于当前时间的补发时间'}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="sms-modal-actions">
                            <button type="button" className="sms-btn" onClick={closeModal}>
                                取消
                            </button>
                            <button
                                type="button"
                                className="sms-btn sms-btn-primary"
                                disabled={!validated || ignoreBlacklist === 'unset' || (modal === 'scheduled' && !scheduledTimeValid)}
                                onClick={confirmFinal}
                            >
                                确认补发
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ============ 终止二次确认弹窗 ============ */}
            {terminateTarget && (
                <div className="sms-mask resend-modal-top" onClick={() => setTerminateTarget(null)}>
                    <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sms-modal-header">终止补发</div>
                        <div className="sms-modal-body">
                            <p className="resend-terminate-tip">
                                确认终止补发批次 <strong>B{terminateTarget.id}</strong>？
                            </p>
                            <p className="resend-terminate-sub">
                                终止后该批次将停止继续补发，已发送的部分不受影响。
                            </p>
                        </div>
                        <div className="sms-modal-actions">
                            <button type="button" className="sms-btn" onClick={() => setTerminateTarget(null)}>
                                取消
                            </button>
                            <button
                                type="button"
                                className="sms-btn resend-danger-btn"
                                disabled={terminating}
                                onClick={confirmTerminate}
                            >
                                {terminating ? '终止中…' : '确认终止'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ 批次详情抽屉 ============ */}
            {detailBatch && (
                <BatchDetail
                    batch={detailBatch}
                    onClose={() => setDetailBatch(null)}
                    onTerminate={(b) => setTerminateTarget(b)}
                    onViewRecords={(filter) => {
                        setDetailBatch(null);
                        onSwitchTab?.('record', filter);
                    }}
                />
            )}

            {/* 轻提示 */}
            {toast && (
                <div className="resend-toast">
                    <Check size={14} />
                    {toast}
                </div>
            )}

            {/* 导出补发记录 */}
            <ExportModal
                visible={exportVisible}
                defaultName="Transmission Log_20260813"
                hideFormat
                onClose={() => setExportVisible(false)}
            />
        </div>
    );
}
