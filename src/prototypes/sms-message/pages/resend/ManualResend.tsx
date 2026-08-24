/**
 * 人工补发：条件筛选 → 命中汇总（导出/定时/立即补发）→ 批次补发记录
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Search, RotateCcw, Download, Clock, Send, Eye, Ban, Check, Calendar, ChevronUp, ExternalLink } from 'lucide-react';
import BatchDetail from './BatchDetail';
import ColumnSettings, { type ColumnDef } from '../../components/ColumnSettings';
import ExportModal from '../../components/ExportModal';
import DatePicker from '../../components/DatePicker';
import type { RecordFilter } from './BatchDetail';

interface ManualResendProps {
    onSwitchTab?: (tab: 'record', filter?: RecordFilter) => void;
    /** 从发送记录点击补发批次 ID 跳转带入的批次筛选 */
    incomingBatchId?: string;
}

const FIELD_LABELS = [
    '发送时间',
    'BusinessID',
    '计划名称',
    '用户分组',
    '手机号码',
    '内容类型',
    '发送名称',
    '补发批次 ID',
    '路径标记',
];

export interface BatchRow {
    id: string;
    scheduledTime: string;
    endTime: string;
    mode: '立即补发' | '定时补发';
    submitTime: string;
    isTerminated: boolean;
    isFailed: boolean;
    /** 提交校验数量：提交时用户校验的补发数量 */
    userVerifiedCount: number;
    /** 实际发送数量：实际执行了发送动作的条数（含单条提交失败）；待执行时为 null */
    systemVerifiedCount: number | null;
    /** 批次动态事件：用户操作与系统自动状态流转统一记录 */
    events: BatchEvent[];
}

export type BatchActorType = 'USER' | 'SYSTEM';

export type BatchEventType =
    | '创建批次'
    | '开始执行'
    | '分批校验'
    | '执行完成'
    | '执行异常'
    | '终止批次';

export interface BatchEvent {
    id: string;
    happenTime: string;
    actorType: BatchActorType;
    actorName: string;
    eventType: BatchEventType;
    fromStatus?: string;
    toStatus: string;
    remark?: string;
}

const BATCHES: BatchRow[] = [
    {
        id: '20260812003',
        scheduledTime: '2026-08-12 14:35:12',
        endTime: '—',
        mode: '立即补发',
        submitTime: '2026-08-12 14:34:50',
        isTerminated: false,
        isFailed: false,
        userVerifiedCount: 1284,
        systemVerifiedCount: 620,
        events: [
            {
                id: '20260812003-e001',
                happenTime: '2026-08-12 14:34:50',
                actorType: 'USER',
                actorName: 'bohua',
                eventType: '创建批次',
                toStatus: '执行中',
                remark: '提交立即补发',
            },
        ],
    },
    {
        id: '20260812002',
        scheduledTime: '2026-08-12 13:00:00',
        endTime: '2026-08-12 13:04:52',
        mode: '定时补发',
        submitTime: '2026-08-12 12:55:34',
        isTerminated: false,
        isFailed: false,
        userVerifiedCount: 860,
        systemVerifiedCount: 842,
        events: [
            {
                id: '20260812002-e001',
                happenTime: '2026-08-12 12:55:34',
                actorType: 'USER',
                actorName: 'bohua',
                eventType: '创建批次',
                toStatus: '待执行',
                remark: '提交定时补发',
            },
        ],
    },
    {
        id: '20260812001',
        scheduledTime: '2026-08-12 09:26:33',
        endTime: '2026-08-12 09:31:18',
        mode: '立即补发',
        submitTime: '2026-08-12 09:26:15',
        isTerminated: true,
        isFailed: false,
        userVerifiedCount: 512,
        systemVerifiedCount: 352,
        events: [
            {
                id: '20260812001-e001',
                happenTime: '2026-08-12 09:26:15',
                actorType: 'USER',
                actorName: 'bohua',
                eventType: '创建批次',
                toStatus: '执行中',
                remark: '提交立即补发',
            },
            {
                id: '20260812001-e004',
                happenTime: '2026-08-12 09:31:18',
                actorType: 'USER',
                actorName: 'bohua',
                eventType: '终止批次',
                fromStatus: '执行中',
                toStatus: '已终止',
                remark: '用户手动终止',
            },
        ],
    },
    {
        id: '20260811007',
        scheduledTime: '2026-08-11 20:15:40',
        endTime: '2026-08-11 20:22:03',
        mode: '定时补发',
        submitTime: '2026-08-11 20:15:10',
        isTerminated: false,
        isFailed: false,
        userVerifiedCount: 2035,
        systemVerifiedCount: 2018,
        events: [
            {
                id: '20260811007-e001',
                happenTime: '2026-08-11 20:15:10',
                actorType: 'USER',
                actorName: 'bohua',
                eventType: '创建批次',
                toStatus: '待执行',
                remark: '提交定时补发',
            },
        ],
    },
    {
        id: '20260823001',
        scheduledTime: '2026-08-30 18:00:00',
        endTime: '—',
        mode: '定时补发',
        submitTime: '2026-08-23 17:55:45',
        isTerminated: false,
        isFailed: false,
        userVerifiedCount: 968,
        systemVerifiedCount: null,
        events: [
            {
                id: '20260823001-e001',
                happenTime: '2026-08-23 17:55:45',
                actorType: 'USER',
                actorName: 'bohua',
                eventType: '创建批次',
                toStatus: '待执行',
                remark: '提交定时补发，等待执行',
            },
        ],
    },
    {
        id: '20260812004',
        scheduledTime: '2026-08-12 15:01:00',
        endTime: '2026-08-12 15:01:20',
        mode: '立即补发',
        submitTime: '2026-08-12 15:00:40',
        isTerminated: false,
        isFailed: true,
        userVerifiedCount: 300,
        systemVerifiedCount: 0,
        events: [
            {
                id: '20260812004-e001',
                happenTime: '2026-08-12 15:00:40',
                actorType: 'USER',
                actorName: 'bohua',
                eventType: '创建批次',
                toStatus: '执行中',
                remark: '提交立即补发',
            },
        ],
    },
    {
        id: '20260812005',
        scheduledTime: '2026-08-12 15:30:00',
        endTime: '2026-08-12 15:31:12',
        mode: '立即补发',
        submitTime: '2026-08-12 15:29:50',
        isTerminated: false,
        isFailed: true,
        userVerifiedCount: 1500,
        systemVerifiedCount: 620,
        events: [
            {
                id: '20260812005-e001',
                happenTime: '2026-08-12 15:29:50',
                actorType: 'USER',
                actorName: 'bohua',
                eventType: '创建批次',
                toStatus: '执行中',
                remark: '提交立即补发',
            },
        ],
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

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const CURRENT_OPERATOR = 'bohua';

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
type IncludeResent = 'yes' | 'no' | 'unset';

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

export default function ManualResend({ onSwitchTab, incomingBatchId }: ManualResendProps) {
    const formRef = React.useRef<HTMLFormElement>(null);
    const [filterCollapsed, setFilterCollapsed] = useState(true);
    const [querying, setQuerying] = useState(false);
    const [hitCount, setHitCount] = useState(1284);
    const [hitVisible, setHitVisible] = useState(false);
    const [queryCount, setQueryCount] = useState(0);
    const [modal, setModal] = useState<ModalType>(null);
    const [ignoreBlacklist, setIgnoreBlacklist] = useState<IgnoreBlacklist>('unset');
    const [includeResent, setIncludeResent] = useState<IncludeResent>('unset');
    const [scheduledTime, setScheduledTime] = useState('');
    const [validating, setValidating] = useState(false);
    const [validated, setValidated] = useState(false);
    const [verifiedCount, setVerifiedCount] = useState<number | null>(null);
    const [toast, setToast] = useState('');
    const [terminateTarget, setTerminateTarget] = useState<BatchRow | null>(null);
    const [terminating, setTerminating] = useState(false);
    const [terminateReason, setTerminateReason] = useState('');
    const [batches, setBatches] = useState<BatchRow[]>(BATCHES);
    const [detailBatch, setDetailBatch] = useState<BatchRow | null>(null);
    const [visibleCols, setVisibleCols] = useState<string[]>(MANUAL_COLUMNS.map((c) => c.key));
    const [exportVisible, setExportVisible] = useState(false);
    const [hasFilter, setHasFilter] = useState(false);
    const [batchPage, setBatchPage] = useState(1);
    const [batchPageSize, setBatchPageSize] = useState(10);
    const [resendStatus, setResendStatus] = useState('');
    const [activeView, setActiveView] = useState<'filter' | 'records'>('filter');
    const [recordStart, setRecordStart] = useState('');
    const [recordEnd, setRecordEnd] = useState('');
    const [recordStatus, setRecordStatus] = useState('');
    const [recordBatchId, setRecordBatchId] = useState('');
    const exportBatchId = recordBatchId.trim().replace(/^B/i, '') || BATCHES[0]?.id || '补发记录';
    const exportDefaultName = `${exportBatchId}_${todayStr()}`;

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

    const resetResendForm = () => {
        setIgnoreBlacklist('unset');
        setIncludeResent('unset');
        setScheduledTime('');
        setValidated(false);
        setVerifiedCount(null);
    };

    const openResendModal = (type: Exclude<ModalType, null>) => {
        resetResendForm();
        setModal(type);
    };

    const closeModal = () => {
        setModal(null);
        resetResendForm();
    };

    const verifyCount = () => {
        if (
            validating ||
            ignoreBlacklist === 'unset' ||
            includeResent === 'unset' ||
            (modal === 'scheduled' && !scheduledTimeValid)
        ) {
            return;
        }
        setValidating(true);
        setTimeout(() => {
            setValidating(false);
            // 模拟后端校验后的最新数量（略低于实际可补）
            setVerifiedCount(Math.max(actualHit - Math.round(actualHit * 0.02), 1));
            setValidated(true);
            showToast('校验完成，已获取最新补发数量');
        }, 800);
    };

    /** 查看命中明细：跳转发送记录页并带入当前筛选条件 */
    const viewHitDetail = () => {
        const read = (name: string) => {
            const el = formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
            return el?.value ?? '';
        };
        const filter: RecordFilter = {};
        const businessId = read('BusinessID');
        const phone = read('手机号码');
        const contentType = read('内容类型');
        const sendStatusCode = read('发送状态');
        const deliveryStatus = read('送达状态');
        const batchId = read('补发批次 ID').replace(/^B/, '');
        if (businessId) filter.businessId = businessId;
        if (phone) filter.phone = phone;
        if (contentType) filter.contentType = contentType;
        const sendStatusMap: Record<string, string> = { '2': '成功', '1': '失败', '0': '暂无数据' };
        if (sendStatusCode && sendStatusMap[sendStatusCode]) filter.sendStatus = sendStatusMap[sendStatusCode];
        if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
        if (batchId) filter.batchId = batchId;
        if (resendStatus) filter.resendStatus = resendStatus;
        onSwitchTab?.('record', filter);
    };

    const confirmFinal = () => {
        if (!validated || verifiedCount === null || includeResent === 'unset') return;
        const isImmediate = modal === 'immediate';
        const submitTime = nowStr();
        const newId = `20260812${String(100 + batches.length + 1).slice(-3)}`;
        const newEvents: BatchEvent[] = [
            {
                id: `${newId}-e001`,
                happenTime: submitTime,
                actorType: 'USER',
                actorName: CURRENT_OPERATOR,
                eventType: '创建批次',
                toStatus: isImmediate ? '执行中' : '待执行',
                remark: isImmediate ? '提交立即补发' : '提交定时补发',
            },
        ];
        setBatchPage(1);
        setActiveView('records');
        setModal(null);
        setValidated(false);
        setVerifiedCount(null);
        setIgnoreBlacklist('unset');
        setIncludeResent('unset');
        setScheduledTime('');
        const newBatch: BatchRow = {
            id: newId,
            scheduledTime: isImmediate ? submitTime : scheduledTime,
            endTime: '—',
            mode: isImmediate ? '立即补发' : '定时补发',
            submitTime,
            isTerminated: false,
            isFailed: false,
            userVerifiedCount: verifiedCount,
            systemVerifiedCount: isImmediate ? verifiedCount : null,
            events: newEvents,
        };
        setBatches((prev) => [newBatch, ...prev]);
        // 提交后清空筛选条件、隐藏命中面板，回到初始状态
        formRef.current?.reset();
        setHitVisible(false);
        showToast(`${isImmediate ? '立即补发' : '定时补发'}任务已创建（批次 ${newBatch.id}）`);
    };

    /** 记录筛选结果（本地过滤） */
    const filteredBatches = useMemo(
        () =>
            batches.filter((b) => {
                const status = computeStatus(b);
                if (recordBatchId.trim() && !b.id.includes(recordBatchId.trim().replace(/^B/, ''))) return false;
                if (recordStatus && status !== recordStatus) return false;
                const day = b.scheduledTime.slice(0, 10);
                if (recordStart && day < recordStart) return false;
                if (recordEnd && day > recordEnd) return false;
                return true;
            }),
        [batches, recordBatchId, recordStatus, recordStart, recordEnd]
    );

    useEffect(() => {
        if (incomingBatchId) {
            setRecordBatchId(incomingBatchId);
            setActiveView('records');
            setBatchPage(1);
        }
    }, [incomingBatchId]);

    const openTerminate = (batch: BatchRow) => {
        setTerminateReason('');
        setTerminateTarget(batch);
    };

    const confirmTerminate = () => {
        const target = terminateTarget;
        if (!target || terminating) return;
        setTerminating(true);
        const stopTime = nowStr();
        const beforeStatus = computeStatus(target);
        const terminateEvent: BatchEvent = {
            id: `${target.id}-${Date.now()}`,
            happenTime: stopTime,
            actorType: 'USER',
            actorName: CURRENT_OPERATOR,
            eventType: '终止批次',
            fromStatus: beforeStatus,
            toStatus: '已终止',
            remark: terminateReason.trim() || '用户手动终止',
        };
        const applyTerminate = (b: BatchRow) =>
            b.id === target.id
                ? { ...b, isTerminated: true, endTime: stopTime, events: [...b.events, terminateEvent] }
                : b;
        setTimeout(() => {
            setBatches((prev) => prev.map(applyTerminate));
            // 同步更新抽屉中的批次快照，避免事件列表仍停留在终止前
            setDetailBatch((prev) => (prev && prev.id === target.id ? applyTerminate(prev) : prev));
            setTerminating(false);
            setTerminateTarget(null);
            setTerminateReason('');
            showToast(`补发批次 ${target.id} 已终止`);
        }, 600);
    };

    return (
        <div className="resend-manual">
            <div className="resend-sub-tabs">
                <div
                    className={`resend-sub-tab${activeView === 'filter' ? ' active' : ''}`}
                    onClick={() => setActiveView('filter')}
                >
                    条件筛选
                </div>
                <div
                    className={`resend-sub-tab${activeView === 'records' ? ' active' : ''}`}
                    onClick={() => setActiveView('records')}
                >
                    补发记录
                </div>
            </div>
            {activeView === 'filter' && (
            <div className="sms-card resend-section">
                <form ref={formRef} onChange={() => setHasFilter(checkHasFilter())}>
                    <div className="resend-filter-grid">
                        {FIELD_LABELS.slice(0, filterCollapsed ? 2 : FIELD_LABELS.length).map((label) => (
                            <div
                                className={`sms-form-item${label === '发送时间' ? ' sms-filter-time-item' : ''}`}
                                key={label}
                            >
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
                                    ) : label === '补发类型' ? (
                                        <select
                                            className="resend-static-filter-select"
                                            disabled
                                            value="原始短信"
                                            title="人工补发范围固定为原始短信，补发短信不参与人工补发"
                                        >
                                            <option value="原始短信">原始短信</option>
                                        </select>
                                    ) : label === '补发状态' ? (
                                        <select
                                            className={`sms-select${resendStatus ? '' : ' placeholder'}`}
                                            name="补发状态"
                                            value={resendStatus}
                                            onChange={(e) => setResendStatus(e.target.value)}
                                        >
                                            <option value="">请选择</option>
                                            <option value="未补发过">未补发过</option>
                                            <option value="已补发过">已补发过</option>
                                        </select>
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
                                            {label === '发送状态' && (
                                                <>
                                                    <option value="2">成功</option>
                                                    <option value="1">失败</option>
                                                    <option value="0">暂无数据</option>
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
                            <>
                        <div className="sms-form-item">
                            <label className="sms-form-label">补发类型</label>
                            <div className="sms-form-control">
                                <select
                                    className="resend-static-filter-select"
                                    disabled
                                    value="原始短信"
                                    title="人工补发范围固定为原始短信，补发短信不参与人工补发"
                                >
                                    <option value="原始短信">原始短信</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">发送状态</label>
                            <div className="sms-form-control">
                                <select className="sms-select placeholder" name="发送状态">
                                    <option value="">请选择</option>
                                    <option value="2">成功</option>
                                    <option value="1">失败</option>
                                    <option value="0">暂无数据</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">送达状态</label>
                            <div className="sms-form-control">
                                <select className="sms-select sms-control-purple placeholder" name="送达状态">
                                    <option value="">请选择</option>
                                    <option value="回执中">回执中</option>
                                    <option value="已送达">已送达</option>
                                    <option value="回执超时">回执超时</option>
                                    <option value="--">--</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">补发状态</label>
                            <div className="sms-form-control">
                                <select
                                    className={`sms-select sms-control-purple${resendStatus ? '' : ' placeholder'}`}
                                    name="补发状态"
                                    value={resendStatus}
                                    onChange={(e) => setResendStatus(e.target.value)}
                                >
                                    <option value="">请选择</option>
                                    <option value="未补发过">未补发过</option>
                                    <option value="已补发过">已补发过</option>
                                </select>
                            </div>
                        </div>
                            </>
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
                                <b>{Math.round(hitCount * 0.036).toLocaleString()}</b> 条，已补发过{' '}
                                <b>{Math.round(hitCount * 0.02).toLocaleString()}</b> 条
                            </span>
                            <div className="resend-hit-sub">
                                <span>任务执行时将重新校验</span>
                                <button type="button" className="resend-link-btn" onClick={viewHitDetail}>
                                    <ExternalLink size={13} />
                                    查看命中明细
                                </button>
                            </div>
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
                                    openResendModal('scheduled');
                                }}
                            >
                                <Clock size={14} />
                                定时补发
                            </button>
                            <button
                                type="button"
                                className="sms-btn sms-btn-primary"
                                onClick={() => {
                                    openResendModal('immediate');
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
            )}

            {activeView === 'records' && (
            <>
            <div className="sms-card resend-section">
                    <div className="resend-record-filter">
                        <div className="sms-form-item">
                            <label className="sms-form-label">补发时间</label>
                            <div className="sms-form-control">
                                <div className="resend-record-range">
                                    <DatePicker value={recordStart} onChange={setRecordStart} placeholder="开始日期" />
                                    <span className="arrow">→</span>
                                    <DatePicker value={recordEnd} onChange={setRecordEnd} placeholder="结束日期" />
                                </div>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">补发状态</label>
                            <div className="sms-form-control">
                                <select className="sms-select" value={recordStatus} onChange={(e) => setRecordStatus(e.target.value)}>
                                    <option value="">全部</option>
                                    <option value="待执行">待执行</option>
                                    <option value="执行中">执行中</option>
                                    <option value="已完成">已完成</option>
                                    <option value="已终止">已终止</option>
                                    <option value="失败">失败</option>
                                    <option value="部分失败">部分失败</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">补发批次 ID</label>
                            <div className="sms-form-control">
                                <input
                                    className="sms-input"
                                    placeholder="请输入"
                                    value={recordBatchId}
                                    onChange={(e) => setRecordBatchId(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="resend-record-actions-row">
                        <button
                            type="button"
                            className="sms-btn"
                            onClick={() => {
                                setRecordStart('');
                                setRecordEnd('');
                                setRecordStatus('');
                                setRecordBatchId('');
                                setBatchPage(1);
                            }}
                        >
                            <RotateCcw size={14} />
                            重置
                        </button>
                        <button type="button" className="sms-btn sms-btn-primary" onClick={() => setBatchPage(1)}>
                            <Search size={14} />
                            查询
                        </button>
                    </div>
                </div>
                <div className="sms-card resend-section">
                    <div className="resend-table-toolbar">
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
                            {filteredBatches.slice((batchPage - 1) * batchPageSize, batchPage * batchPageSize).map((b) => {
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
                                                    onClick={() => openTerminate(b)}
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
                    <span className="sms-pagination-total">共 {filteredBatches.length} 个批次</span>
                    <button
                        type="button"
                        className="sms-page-btn"
                        disabled={batchPage === 1}
                        onClick={() => setBatchPage((p) => p - 1)}
                    >
                        ‹
                    </button>
                    {Array.from({ length: Math.max(1, Math.ceil(filteredBatches.length / batchPageSize)) }, (_, i) => (
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
                        disabled={batchPage >= Math.max(1, Math.ceil(filteredBatches.length / batchPageSize))}
                        onClick={() => setBatchPage((p) => p + 1)}
                    >
                        ›
                    </button>
                    <select
                        className="sms-page-size"
                        value={batchPageSize}
                        onChange={(e) => {
                            setBatchPageSize(Number(e.target.value));
                            setBatchPage(1);
                        }}
                    >
                        <option value={10}>10 条/页</option>
                        <option value={20}>20 条/页</option>
                        <option value={50}>50 条/页</option>
                    </select>
                    <span className="sms-jump">
                        跳至
                        <input type="text" defaultValue="" />
                        页
                    </span>
                </div>
            </div>
            </>
            )}

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
                            <div className="resend-confirm-row">
                                <span className="resend-confirm-label">已补发过的短信</span>
                                <div className="resend-radio-group">
                                    <label className={`resend-radio-item${includeResent === 'no' ? ' checked' : ''}`}>
                                        <input
                                            type="radio"
                                            name="includeResent"
                                            checked={includeResent === 'no'}
                                            onChange={() => {
                                                setIncludeResent('no');
                                                setValidated(false);
                                                setVerifiedCount(null);
                                            }}
                                        />
                                        不发送
                                    </label>
                                    <label className={`resend-radio-item${includeResent === 'yes' ? ' checked' : ''}`}>
                                        <input
                                            type="radio"
                                            name="includeResent"
                                            checked={includeResent === 'yes'}
                                            onChange={() => {
                                                setIncludeResent('yes');
                                                setValidated(false);
                                                setVerifiedCount(null);
                                            }}
                                        />
                                        发送
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
                                                    includeResent === 'unset' ||
                                                    (modal === 'scheduled' && !scheduledTimeValid)
                                                }
                                            >
                                                {validating ? '校验中…' : '点击校验'}
                                            </button>
                                            {(ignoreBlacklist === 'unset' ||
                                                includeResent === 'unset' ||
                                                (modal === 'scheduled' && !scheduledTimeValid)) && (
                                                <span className="sms-tooltip">
                                                    {ignoreBlacklist === 'unset'
                                                        ? '请先选择黑名单用户是否发送'
                                                        : includeResent === 'unset'
                                                            ? '请先选择已补发过的短信'
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
                                disabled={
                                    !validated ||
                                    ignoreBlacklist === 'unset' ||
                                    includeResent === 'unset' ||
                                    (modal === 'scheduled' && !scheduledTimeValid)
                                }
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
                            <div className="resend-terminate-reason">
                                <label className="resend-terminate-reason-label" htmlFor="terminate-reason">
                                    终止原因（选填）
                                </label>
                                <input
                                    id="terminate-reason"
                                    className="sms-input"
                                    value={terminateReason}
                                    maxLength={100}
                                    placeholder="请输入终止原因"
                                    onChange={(e) => setTerminateReason(e.target.value)}
                                />
                            </div>
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
                    onTerminate={openTerminate}
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
                defaultName={exportDefaultName}
                hideFormat
                onClose={() => setExportVisible(false)}
            />
        </div>
    );
}
