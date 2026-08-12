/**
 * 人工补发：条件筛选 → 命中汇总（导出/定时/立即补发）→ 批次补发记录
 */
import React, { useState } from 'react';
import { Search, RotateCcw, Download, Clock, Send, Eye, Ban, Check, Calendar } from 'lucide-react';

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
    '路径标记',
];

interface BatchRow {
    id: string;
    startTime: string;
    endTime: string;
    mode: '立即补发' | '定时补发';
    status: '执行中' | '已完成' | '已终止';
    count: number;
}

const BATCHES: BatchRow[] = [
    {
        id: '20260812003',
        startTime: '2026-08-12 14:35:12',
        endTime: '—',
        mode: '立即补发',
        status: '执行中',
        count: 1284,
    },
    {
        id: '20260812002',
        startTime: '2026-08-12 13:00:00',
        endTime: '2026-08-12 13:04:52',
        mode: '定时补发',
        status: '已完成',
        count: 860,
    },
    {
        id: '20260812001',
        startTime: '2026-08-12 09:26:33',
        endTime: '2026-08-12 09:31:18',
        mode: '立即补发',
        status: '已终止',
        count: 512,
    },
    {
        id: '20260811007',
        startTime: '2026-08-11 20:15:40',
        endTime: '2026-08-11 20:22:03',
        mode: '定时补发',
        status: '已完成',
        count: 2035,
    },
];

const STATUS_CLASS: Record<string, string> = {
    执行中: 'sms-status-delivering',
    已完成: 'sms-status-success',
    已终止: 'sms-status-unknown',
};

type ModalType = 'immediate' | 'scheduled' | null;

export default function ManualResend() {
    const [querying, setQuerying] = useState(false);
    const [hitCount, setHitCount] = useState(1284);
    const [hitVisible, setHitVisible] = useState(false);
    const [modal, setModal] = useState<ModalType>(null);
    const [toast, setToast] = useState('');
    const [terminateTarget, setTerminateTarget] = useState<BatchRow | null>(null);
    const [terminating, setTerminating] = useState(false);
    const [batches, setBatches] = useState<BatchRow[]>(BATCHES);

    const showToast = (text: string) => {
        setToast(text);
        setTimeout(() => setToast(''), 2200);
    };

    const query = () => {
        if (querying) return;
        setQuerying(true);
        setTimeout(() => {
            setQuerying(false);
            const count = Math.floor(800 + Math.random() * 800);
            setHitCount(count);
            setHitVisible(true);
            showToast('查询完成，已更新命中数量');
        }, 700);
    };

    const reset = () => {
        setHitVisible(false);
        showToast('筛选条件已重置');
    };

    const confirmModal = () => {
        const isImmediate = modal === 'immediate';
        setModal(null);
        const newBatch: BatchRow = {
            id: `20260812${String(100 + batches.length + 1).slice(-3)}`,
            startTime: isImmediate ? '2026-08-12 15:02:00' : '2026-08-12 18:00:00',
            endTime: '—',
            mode: isImmediate ? '立即补发' : '定时补发',
            status: '执行中',
            count: hitCount,
        };
        setBatches((prev) => [newBatch, ...prev]);
        showToast(`${isImmediate ? '立即补发' : '定时补发'}任务已创建（批次 ${newBatch.id}）`);
    };

    const confirmTerminate = () => {
        if (!terminateTarget || terminating) return;
        setTerminating(true);
        setTimeout(() => {
            setBatches((prev) =>
                prev.map((b) =>
                    b.id === terminateTarget.id ? { ...b, status: '已终止' as const, endTime: '2026-08-12 15:05:00' } : b
                )
            );
            setTerminating(false);
            setTerminateTarget(null);
            showToast(`批次 ${terminateTarget.id} 已终止`);
        }, 600);
    };

    return (
        <div className="resend-manual">
            {/* ============ 板块一：条件筛选区 ============ */}
            <div className="sms-card resend-section">
                <div className="resend-section-title">
                    <span>条件筛选</span>
                </div>
                <div className="resend-filter-grid">
                    {FIELD_LABELS.slice(0, 9).map((label) => (
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
                                ) : label === '手机号码' || label === '路径标记' ? (
                                    <input className="sms-input" placeholder="请输入" />
                                ) : (
                                    <select className="sms-select placeholder">
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
                                                <option value="未送达">未送达</option>
                                                <option value="回执超时">回执超时</option>
                                                <option value="未知">未知</option>
                                                <option value="--">--（无回执）</option>
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
                    <div className="sms-form-item">
                        <label className="sms-form-label">路径标记</label>
                        <div className="sms-form-control">
                            <input className="sms-input" placeholder="请输入" />
                        </div>
                    </div>
                    <div className="resend-filter-actions">
                        <button type="button" className="sms-btn" onClick={reset}>
                            <RotateCcw size={14} />
                            重置
                        </button>
                        <button type="button" className="sms-btn sms-btn-primary" onClick={query} disabled={querying}>
                            {querying ? '查询中…' : (
                                <>
                                    <Search size={14} />
                                    查询
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 查询后展开：命中信息（与条件筛选同一卡片） */}
                {hitVisible && (
                    <div className="resend-hit-panel">
                        <div className="resend-hit-summary">
                            <span className="resend-hit-summary-label">当前命中</span>
                            <span className="resend-hit-summary-num">{hitCount.toLocaleString()}</span>
                            <span className="resend-hit-summary-unit">条</span>
                        </div>
                        <div className="resend-hit-breakdown">
                            <span className="resend-hit-breakdown-item">
                                回执超时 / 未送达 <b>{Math.round(hitCount * 0.27).toLocaleString()}</b>
                            </span>
                            <span className="resend-hit-breakdown-item">
                                发送失败 <b className="resend-breakdown-danger">{Math.round(hitCount * 0.1).toLocaleString()}</b>
                            </span>
                        </div>
                        <div className="resend-hit-actions">
                            <button type="button" className="sms-btn" onClick={() => showToast('命中结果已导出（原型演示）')}>
                                <Download size={14} />
                                导出 Excel
                            </button>
                            <button type="button" className="sms-btn" onClick={() => setModal('scheduled')}>
                                <Clock size={14} />
                                定时补发
                            </button>
                            <button type="button" className="sms-btn sms-btn-primary" onClick={() => setModal('immediate')}>
                                <Send size={14} />
                                立即补发
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ============ 板块二：批次补发记录 ============ */}
            <div className="sms-card resend-section">
                <div className="resend-section-title">
                    <span>补发记录（按批次）</span>
                    <span className="resend-section-sub">共 {batches.length} 个批次</span>
                </div>
                <div className="sms-table-wrap">
                    <table className="sms-table resend-table resend-batch-table">
                        <thead>
                            <tr>
                                <th>批次 ID</th>
                                <th>补发开始时间</th>
                                <th>补发结束时间</th>
                                <th>补发方式</th>
                                <th>命中数量</th>
                                <th>补发状态</th>
                                <th style={{ width: 160 }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((b) => (
                                <tr key={b.id}>
                                    <td>
                                        <span className="resend-batch-id">B{b.id}</span>
                                    </td>
                                    <td>{b.startTime}</td>
                                    <td>{b.endTime}</td>
                                    <td>{b.mode}</td>
                                    <td>{b.count.toLocaleString()}</td>
                                    <td>
                                        <span className={`sms-status ${STATUS_CLASS[b.status]}`}>{b.status}</span>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="sms-action-link"
                                            onClick={() => showToast(`批次 B${b.id} 详情页待设计`)}
                                        >
                                            <Eye size={13} style={{ verticalAlign: '-2px', marginRight: 3 }} />
                                            详情
                                        </button>
                                        <button
                                            type="button"
                                            className="sms-action-link resend-terminate"
                                            disabled={b.status !== '执行中'}
                                            onClick={() => setTerminateTarget(b)}
                                        >
                                            <Ban size={13} style={{ verticalAlign: '-2px', marginRight: 3 }} />
                                            终止
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ============ 补发确认弹窗（立即/定时） ============ */}
            {modal && (
                <div className="sms-mask" onClick={() => setModal(null)}>
                    <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sms-modal-header">补发确认</div>
                        <div className="sms-modal-body">
                            <div className="resend-confirm-row">
                                <span className="resend-confirm-label">补发方式</span>
                                <span className="resend-confirm-value">
                                    {modal === 'immediate' ? '立即补发' : '定时补发'}
                                </span>
                            </div>
                            <div className="resend-confirm-row">
                                <span className="resend-confirm-label">预计补发时间</span>
                                <span className="resend-confirm-value">
                                    {modal === 'immediate' ? '立即（马上执行）' : '2026-08-12 18:00:00'}
                                </span>
                            </div>
                            <div className="resend-confirm-row">
                                <span className="resend-confirm-label">补发数量</span>
                                <span className="resend-confirm-value">{hitCount.toLocaleString()} 条</span>
                            </div>
                        </div>
                        <div className="sms-modal-actions">
                            <button type="button" className="sms-btn" onClick={() => setModal(null)}>
                                取消
                            </button>
                            <button type="button" className="sms-btn sms-btn-primary" onClick={confirmModal}>
                                确认{modal === 'immediate' ? '补发' : '定时'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ 终止二次确认弹窗 ============ */}
            {terminateTarget && (
                <div className="sms-mask" onClick={() => setTerminateTarget(null)}>
                    <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sms-modal-header">终止补发</div>
                        <div className="sms-modal-body">
                            <p className="resend-terminate-tip">
                                确认终止批次 <strong>B{terminateTarget.id}</strong>？
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

            {/* 轻提示 */}
            {toast && (
                <div className="resend-toast">
                    <Check size={14} />
                    {toast}
                </div>
            )}
        </div>
    );
}
