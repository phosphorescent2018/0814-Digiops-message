/**
 * 自动补发：规则配置 + 运行统计 + 补发记录
 */
import React, { useRef, useState } from 'react';
import { Save, Check, RefreshCw, Clock, AlertCircle, Eye, Info } from 'lucide-react';
import AutoBatchDetail, { AUTO_BATCH_STATUS_CLASS, type AutoBatchRow } from './AutoBatchDetail';
import type { RecordFilter } from './BatchDetail';

const AUTO_BATCHES: AutoBatchRow[] = [
    {
        batchId: 'A20260813001',
        status: '执行中',
        startTime: '2026-08-13 10:02:11',
        endTime: '—',
        systemVerifiedCount: 620,
        queuedCount: 1000,
        triggerReasons: ['回执超时', '未送达'],
        source: '全局规则',
        createdAt: '2026-08-13 10:01:40',
    },
    {
        batchId: 'A20260813002',
        status: '已完成',
        startTime: '2026-08-13 09:30:00',
        endTime: '2026-08-13 09:33:18',
        systemVerifiedCount: 2018,
        queuedCount: 2050,
        triggerReasons: ['发送失败', '回执超时'],
        source: '运营计划：新客激活活动',
        createdAt: '2026-08-13 09:29:20',
    },
    {
        batchId: 'A20260812005',
        status: '待执行',
        startTime: '2026-08-13 14:05:00',
        endTime: '—',
        systemVerifiedCount: null,
        queuedCount: 968,
        triggerReasons: ['未送达'],
        source: '全局规则',
        createdAt: '2026-08-13 13:50:00',
    },
    {
        batchId: 'A20260812003',
        status: '已终止',
        startTime: '2026-08-12 21:10:00',
        endTime: '2026-08-12 21:12:45',
        systemVerifiedCount: 486,
        queuedCount: 500,
        triggerReasons: ['发送失败'],
        source: '全局规则',
        createdAt: '2026-08-12 21:09:30',
    },
    {
        batchId: 'A20260812004',
        status: '失败',
        startTime: '2026-08-12 22:15:00',
        endTime: '2026-08-12 22:15:03',
        systemVerifiedCount: 0,
        queuedCount: 300,
        triggerReasons: ['回执超时'],
        source: '全局规则',
        createdAt: '2026-08-12 22:14:00',
    },
];

interface AutoResendProps {
    onSwitchTab?: (tab: 'record', filter?: RecordFilter) => void;
}

export default function AutoResend({ onSwitchTab }: AutoResendProps) {
    const [enabled, setEnabled] = useState(false);
    const [saved, setSaved] = useState(false);
    const [batches, setBatches] = useState<AutoBatchRow[]>(AUTO_BATCHES);
    const [conditions, setConditions] = useState<string[]>([]);
    const [switchModal, setSwitchModal] = useState<'open' | 'close' | null>(null);
    const [saveModal, setSaveModal] = useState(false);
    const [scheduleMode, setScheduleMode] = useState<'all' | 'range' | ''>('');
    const [windowStart, setWindowStart] = useState('08:00');
    const [windowEnd, setWindowEnd] = useState('22:00');
    const [maxResend, setMaxResend] = useState('');
    const [interval, setInterval] = useState('');
    const [batchThreshold, setBatchThreshold] = useState<number | ''>('');
    const [maxWait, setMaxWait] = useState('');
    const [detailBatch, setDetailBatch] = useState<AutoBatchRow | null>(null);
    const [toast, setToast] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const toastTimer = useRef<number | null>(null);

    const thresholdNum = typeof batchThreshold === 'number' ? batchThreshold : 0;
    const configReady =
        conditions.length > 0 &&
        !!maxResend &&
        (maxResend === '1' || !!interval) &&
        thresholdNum > 0 &&
        !!maxWait &&
        !!scheduleMode;

    const showToast = (text: string) => {
        setToast(text);
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(''), 3000);
    };

    const refresh = () => {
        setRefreshing(true);
        setBatches((prev) =>
            prev.map((b) =>
                b.status === '执行中' && b.systemVerifiedCount !== null
                    ? { ...b, systemVerifiedCount: b.systemVerifiedCount + 26 }
                    : b,
            ),
        );
        showToast('数据已刷新');
        window.setTimeout(() => setRefreshing(false), 800);
    };

    const toggleCondition = (value: string) => {
        setConditions((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    };

    const save = () => {
        setSaveModal(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 5000);
    };

    const handleSwitchChange = () => {
        if (!configReady) {
            showToast('开启前需完成自动补发规则配置');
            return;
        }
        setSwitchModal(enabled ? 'close' : 'open');
    };

    const confirmSwitch = () => {
        if (switchModal) {
            setEnabled(switchModal === 'open');
        }
        setSwitchModal(null);
    };

    const stats = [
        { label: '今日补发', value: 128, tone: '' },
        { label: '补发成功', value: 96, tone: 'success' },
        { label: '补发失败', value: 21, tone: 'danger' },
        { label: '待确认', value: 11, tone: 'info' },
        { label: '队列中', value: enabled ? 11 : 0, tone: 'warn' },
    ];

    return (
        <div className="resend-auto">
            {/* 自动补发状态条 */}
            <div className="resend-status-bar">
                <div className="resend-status-main">
                    <div className="resend-status-title-row">
                        <span className="resend-status-title">自动补发</span>
                        <span className={`sms-status ${enabled ? 'sms-status-success' : 'sms-status-unknown'}`}>
                            {enabled ? '已开启' : '已关闭'}
                        </span>
                    </div>
                    <div className="resend-status-summary">
                        <Clock size={13} />
                        <span>
                            {enabled
                                ? `队列中 11 条 · 预计 14:05 发送 · 满 ${thresholdNum.toLocaleString()} 条提前触发`
                                : '自动补发已关闭，规则可编辑'}
                        </span>
                    </div>
                </div>
                <div className="resend-status-actions">
                    {enabled && (
                        <button
                            type="button"
                            className={`sms-btn sms-btn-icon resend-refresh-btn${refreshing ? ' spinning' : ''}`}
                            title="刷新"
                            aria-label="刷新"
                            onClick={refresh}
                        >
                            <RefreshCw size={15} />
                        </button>
                    )}
                    <label className={`resend-switch${configReady ? '' : ' resend-switch-disabled'}`}>
                        <input type="checkbox" checked={enabled} onChange={handleSwitchChange} />
                        <span className="resend-switch-slider" />
                        <span className="resend-switch-text">{enabled ? '已开启' : '已关闭'}</span>
                    </label>
                </div>
            </div>

            {/* 运行统计 */}
            <div className="resend-stat-row">
                {stats.map((s) => (
                    <div className="resend-stat-card" key={s.label}>
                        <div className="resend-stat-main">
                            <div className={`resend-stat-num resend-stat-${s.tone || 'normal'}`}>{s.value}</div>
                            <div className="resend-stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 规则配置 */}
            <div className="sms-card resend-section">
                <div className="resend-rule-header">
                    <div className="resend-rule-title-wrap">
                        <span className="resend-toolbar-title">
                            自动补发规则
                        </span>
                        <div className="resend-rule-tip">
                            <span>2026.8.24 日前的历史短信不参与自动补发</span>
                            <span>本规则默认全局生效，但配置了自动补发组件的运营计划除外</span>
                        </div>
                    </div>
                    {enabled && <span className="resend-rule-lock-tip">开启状态下规则不可编辑</span>}
                </div>

                <div className={`resend-rule-body${enabled ? ' resend-rule-disabled' : ''}`}>
                    <div className="resend-cond-row">
                        <div className="sms-form-item">
                            <label className="sms-form-label">
                                <span className="resend-required">*</span>
                                触发条件
                            </label>
                            <div className="sms-form-control">
                                <div className="resend-cond-groups">
                                    <div className="resend-cond-group">
                                        <div className="resend-cond-group-head">
                                            <span className="resend-cond-group-title">提交失败时</span>
                                            <span className="resend-cond-group-desc">无需等待回执</span>
                                        </div>
                                        <label className="resend-cond-option">
                                            <input
                                                type="checkbox"
                                                checked={conditions.includes('发送失败')}
                                                onChange={() => toggleCondition('发送失败')}
                                            />
                                            <span className="resend-cond-option-text">发送失败</span>
                                        </label>
                                    </div>
                                    <div className="resend-cond-group">
                                        <div className="resend-cond-group-head">
                                            <span className="resend-cond-group-title">回执判定后</span>
                                            <span className="resend-cond-group-desc">未送达或 24 小时内无明确回执</span>
                                        </div>
                                        <div className="resend-cond-options">
                                            <label className="resend-cond-option">
                                                <input
                                                    type="checkbox"
                                                    checked={conditions.includes('未送达')}
                                                    onChange={() => toggleCondition('未送达')}
                                                />
                                                <span className="resend-cond-option-text">未送达</span>
                                            </label>
                                            <label className="resend-cond-option">
                                                <input
                                                    type="checkbox"
                                                    checked={conditions.includes('回执超时')}
                                                    onChange={() => toggleCondition('回执超时')}
                                                />
                                                <span className="resend-cond-option-text">回执超时</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="resend-form-grid">
                        <div className="sms-form-item">
                            <label className="sms-form-label">
                                <span className="resend-required">*</span>
                                <span className="sms-tooltip-wrap">
                                    最多补发次数
                                    <span className="sms-tooltip">同一条短信的最多自动补发次数</span>
                                </span>
                            </label>
                            <div className="sms-form-control">
                                <select className={`sms-select${maxResend ? '' : ' placeholder'}`} value={maxResend} onChange={(e) => setMaxResend(e.target.value)}>
                                    <option value="" disabled>
                                        请选择
                                    </option>
                                    <option value="1">1 次</option>
                                    <option value="2">2 次</option>
                                    <option value="3">3 次</option>
                                    <option value="5">5 次</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">
                                {maxResend !== '1' && <span className="resend-required">*</span>}
                                <span className="sms-tooltip-wrap">
                                    补发时间间隔
                                    <span className="sms-tooltip">同一条短信两次自动补发之间的最小间隔</span>
                                </span>
                            </label>
                            <div className="sms-form-control">
                                <select
                                    className={`sms-select${interval ? '' : ' placeholder'}`}
                                    value={interval}
                                    disabled={maxResend === '1'}
                                    onChange={(e) => setInterval(e.target.value)}
                                >
                                    <option value="" disabled>
                                        请选择
                                    </option>
                                    <option value="1">1 小时</option>
                                    <option value="2">2 小时</option>
                                    <option value="4">4 小时</option>
                                    <option value="24">24 小时</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">
                                <span className="resend-required">*</span>
                                <span className="sms-tooltip-wrap">
                                    最大排队数量
                                    <span className="sms-tooltip">队列积累达到该数量时立即触发补发</span>
                                </span>
                            </label>
                            <div className="sms-form-control">
                                <select
                                    className={`sms-select${batchThreshold === '' ? ' placeholder' : ''}`}
                                    value={batchThreshold}
                                    onChange={(e) => setBatchThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                                >
                                    <option value="" disabled>
                                        请选择
                                    </option>
                                    <option value={100}>100 条</option>
                                    <option value={500}>500 条</option>
                                    <option value={1000}>1,000 条</option>
                                    <option value={2000}>2,000 条</option>
                                    <option value={5000}>5,000 条</option>
                                    <option value={10000}>10,000 条</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">
                                <span className="resend-required">*</span>
                                <span className="sms-tooltip-wrap">
                                    批次最长等待
                                    <span className="sms-tooltip">从该批次第一条短信入队起算，未达最大排队数量时到点也会强制补发</span>
                                </span>
                            </label>
                            <div className="sms-form-control">
                                <select className={`sms-select${maxWait ? '' : ' placeholder'}`} value={maxWait} onChange={(e) => setMaxWait(e.target.value)}>
                                    <option value="" disabled>
                                        请选择
                                    </option>
                                    <option value={5}>5 分钟</option>
                                    <option value={10}>10 分钟</option>
                                    <option value={15}>15 分钟</option>
                                    <option value={30}>30 分钟</option>
                                    <option value={60}>60 分钟</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="resend-schedule-row">
                        <div className="sms-form-item">
                            <label className="sms-form-label">
                                <span className="resend-required">*</span>
                                生效时段
                            </label>
                            <div className="sms-form-control">
                                <div className="resend-schedule-inline">
                                    <div className="resend-cond-options">
                                        <label className="resend-cond-option">
                                            <input
                                                type="radio"
                                                name="scheduleMode"
                                                checked={scheduleMode === 'all'}
                                                onChange={() => setScheduleMode('all')}
                                            />
                                            <span className="resend-cond-option-text">全天</span>
                                        </label>
                                        <label className="resend-cond-option">
                                            <input
                                                type="radio"
                                                name="scheduleMode"
                                                checked={scheduleMode === 'range'}
                                                onChange={() => setScheduleMode('range')}
                                            />
                                            <span className="resend-cond-option-text">指定时段</span>
                                        </label>
                                    </div>
                                    {scheduleMode === 'range' && (
                                        <div className="resend-time-range">
                                            <input
                                                type="time"
                                                className="resend-range-input"
                                                value={windowStart}
                                                onChange={(e) => setWindowStart(e.target.value)}
                                            />
                                            <span className="resend-time-sep">-</span>
                                            <input
                                                type="time"
                                                className="resend-range-input"
                                                value={windowEnd}
                                                onChange={(e) => setWindowEnd(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="resend-rule-footer">
                        <button type="button" className="sms-btn sms-btn-primary" onClick={() => setSaveModal(true)} disabled={enabled || !configReady}>
                            {saved ? (
                                <>
                                    <Check size={14} />
                                    已保存
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    保存规则
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 保存规则提醒弹窗 */}
            {saveModal && (
                <div className="sms-mask" onClick={() => setSaveModal(false)}>
                    <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sms-modal-header">保存规则</div>
                        <div className="sms-modal-body">
                            <div className="resend-save-body">
                                <span className="resend-save-icon">
                                    <Info size={18} />
                                </span>
                                <div className="resend-save-text">
                                    <span className="resend-save-title">规则即将保存</span>
                                    <span className="resend-save-desc">自动补发当前处于关闭状态，保存的规则将在补发开关开启后生效。</span>
                                </div>
                            </div>
                        </div>
                        <div className="sms-modal-actions">
                            <button type="button" className="sms-btn sms-btn-primary" onClick={save}>
                                知道了
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 开关确认弹窗 */}
            {switchModal && (
                <div className="sms-mask" onClick={() => setSwitchModal(null)}>
                    <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sms-modal-header">{switchModal === 'open' ? '开启自动补发' : '关闭自动补发'}</div>
                        <div className="sms-modal-body">
                            <div className="resend-switch-tip">
                                {switchModal === 'open' ? (
                                    <>
                                        <span>开启后，满足触发条件的失败短信将由系统自动补发</span>
                                        <span>请确认规则已配置正确</span>
                                    </>
                                ) : (
                                    <>
                                        <span>关闭后，系统将<em className="resend-danger-text">立即停止</em>自动补发</span>
                                        <span>已有的自动补发队列会被清空，进行中的人工补发不受影响</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="sms-modal-actions">
                            <button type="button" className="sms-btn" onClick={() => setSwitchModal(null)}>
                                取消
                            </button>
                            <button
                                type="button"
                                className={`sms-btn ${switchModal === 'close' ? 'resend-danger-btn' : 'sms-btn-primary'}`}
                                onClick={confirmSwitch}
                            >
                                {switchModal === 'open' ? '确认开启' : '确认关闭'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 任务列表 */}
            <div className="sms-card resend-section">
                <div className="sms-toolbar">
                    <span className="resend-toolbar-title">自动补发记录</span>
                </div>
                <div className="sms-table-wrap resend-batch-wrap">
                    <table className="sms-table resend-table resend-history-table">
                        <thead>
                            <tr>
                                <th>补发批次 ID</th>
                                <th>当前状态</th>
                                <th>补发开始时间</th>
                                <th>补发结束时间</th>
                                <th className="resend-th-tooltip">
                                    <span className="sms-tooltip-wrap">
                                        实际发送数量
                                        <span className="sms-tooltip">实际执行了发送动作的条数</span>
                                    </span>
                                </th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((b) => (
                                <tr key={b.batchId}>
                                    <td>
                                        <span className="resend-batch-id">{b.batchId}</span>
                                    </td>
                                    <td>
                                        <span className={`sms-status ${AUTO_BATCH_STATUS_CLASS[b.status]}`}>{b.status}</span>
                                    </td>
                                    <td>{b.startTime}</td>
                                    <td>{b.endTime}</td>
                                    <td>{b.systemVerifiedCount === null ? '—' : b.systemVerifiedCount.toLocaleString()}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="sms-action-link"
                                            onClick={() => setDetailBatch(b)}
                                        >
                                            <Eye size={13} style={{ verticalAlign: '-2px', marginRight: 3 }} />
                                            详情
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 批次详情抽屉 */}
            {detailBatch && (
                <AutoBatchDetail
                    batch={detailBatch}
                    onClose={() => setDetailBatch(null)}
                    onViewRecords={(filter) => {
                        setDetailBatch(null);
                        onSwitchTab?.('record', filter);
                    }}
                />
            )}

            {/* 轻提示 */}
            {toast && (
                <div className="resend-toast warn">
                    <AlertCircle size={14} />
                    {toast}
                </div>
            )}
        </div>
    );
}
