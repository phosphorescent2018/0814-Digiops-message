/**
 * 批次详情抽屉：批次信息 / 数量概览 / 执行统计 / 明细表 / 操作
 */
import React, { useMemo, useState } from 'react';
import { X, RefreshCw, Ban, ChevronDown, ChevronRight, ExternalLink, History } from 'lucide-react';
import { computeStatus, STATUS_CLASS, type BatchRow } from './ManualResend';

interface BatchDetailProps {
    batch: BatchRow;
    onClose: () => void;
    onTerminate: (batch: BatchRow) => void;
    onViewRecords?: (filter?: RecordFilter) => void;
}

export interface RecordFilter {
    sendTimeStart?: string;
    sendTimeEnd?: string;
    businessId?: string;
    phone?: string;
    contentType?: string;
    sendStatus?: string;
    deliveryStatus?: string;
    batchId?: string;
    resendStatus?: string;
}

interface DetailRow {
    id: number;
    phone: string;
    content: string;
    sendStatus: string;
    deliveryStatus: string;
    failReason: string;
}

/**
 * 明细 mock：补发批次只包含新短信（失败 / 回执超时等可补发场景），
 * 不含历史短信；送达状态 -- 与发送状态失败数量保持一致。
 */
const DETAIL_ROWS: DetailRow[] = [
    {
        id: 1,
        phone: 'n6cHZ+wHVUE1uN3IqCAedg==',
        content: 'Congratulations! You qualify for a Momo Advance limit...',
        sendStatus: '成功',
        deliveryStatus: '回执中',
        failReason: '',
    },
    {
        id: 2,
        phone: '4U4I9nOEeJsD6sIIYO6MCw==',
        content: 'Congratulations! You qualify for a Momo Advance limit...',
        sendStatus: '成功',
        deliveryStatus: '已送达',
        failReason: '',
    },
    {
        id: 3,
        phone: 'tUAH5d+eIqihMk6w7bfD7w==',
        content: 'Congratulations! You qualify for a Momo Advance limit...',
        sendStatus: '成功',
        deliveryStatus: '回执超时',
        failReason: '',
    },
    {
        id: 4,
        phone: 'Wb+OvlfeXjTvpR+XIFDcUg==',
        content: 'Congratulations! You qualify for a Momo Advance limit...',
        sendStatus: '成功',
        deliveryStatus: '回执超时',
        failReason: '',
    },
    {
        id: 5,
        phone: 'fMlMy9u5342709lpj03DYA==',
        content: 'Congratulations! You qualify for a Momo Advance limit...',
        sendStatus: '失败',
        deliveryStatus: '--',
        failReason: '通道拒绝：号码无效',
    },
    {
        id: 6,
        phone: 'ISeQoDpJ7hmFgwSrN84srw==',
        content: "Y'ello! Your MoMo Advance has been successfully activated...",
        sendStatus: '失败',
        deliveryStatus: '--',
        failReason: '提交失败：通道限流',
    },
    {
        id: 7,
        phone: 'qO3Vx8yC2sTpR9wLk5eHuA==',
        content: 'Congratulations! You qualify for a Momo Advance limit...',
        sendStatus: '暂无数据',
        deliveryStatus: '--',
        failReason: '',
    },
];

const SEND_STATUS_CLASS: Record<string, string> = {
    成功: 'sms-status-success',
    失败: 'sms-status-fail',
    暂无数据: 'sms-status-unknown',
};

const DELIVERY_CLASS: Record<string, string> = {
    回执中: 'sms-status-delivering',
    已送达: 'sms-status-success',
    回执超时: 'sms-status-timeout',
};

export default function BatchDetail({ batch, onClose, onTerminate, onViewRecords }: BatchDetailProps) {
    const status = computeStatus(batch);
    const [showConditions, setShowConditions] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const stats = useMemo(() => {
        const send: Record<string, number> = { 成功: 0, 失败: 0, 暂无数据: 0 };
        const delivery: Record<string, number> = {};
        DETAIL_ROWS.forEach((r) => {
            send[r.sendStatus] = (send[r.sendStatus] ?? 0) + 1;
            delivery[r.deliveryStatus] = (delivery[r.deliveryStatus] ?? 0) + 1;
        });
        return { send, delivery };
    }, []);

    const progress =
        status === '执行中' && batch.systemVerifiedCount !== null
            ? Math.min((batch.systemVerifiedCount / batch.userVerifiedCount) * 100, 100)
            : null;
    const eventList = [...(batch.events ?? [])].sort((a, b) => b.happenTime.localeCompare(a.happenTime));

    const canTerminate = status === '待执行' || status === '执行中';

    const refresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 600);
    };

    const hasExecutionData = status !== '待执行';

    const deliveryTotal = Object.values(stats.delivery).reduce((a, b) => a + b, 0);
    const sendTotal = Object.values(stats.send).reduce((a, b) => a + b, 0);
    const SEND_COLORS: Record<string, string> = {
        成功: '#52c41a',
        失败: '#f5222d',
        暂无数据: '#98a1b8',
    };
    const DELIVERY_COLORS: Record<string, string> = {
        回执中: '#1677ff',
        已送达: '#52c41a',
        回执超时: '#fa8c16',
        '--': '#98a1b8',
    };

    return (
        <div className="sms-mask resend-drawer-mask" onClick={onClose}>
            <div className="resend-drawer" onClick={(e) => e.stopPropagation()}>
                {/* 抽屉头部 */}
                <div className="resend-drawer-header">
                    <div className="resend-drawer-title">
                        <span className="resend-batch-id">B{batch.id}</span>
                        <span className={`sms-status ${STATUS_CLASS[status]}`}>{status}</span>
                    </div>
                    <button type="button" className="resend-drawer-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="resend-drawer-body">
                    {/* 板块一：批次信息 */}
                    <div className="resend-detail-section">
                        <div className="resend-detail-section-title">批次信息</div>
                        <div className="resend-detail-grid">
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">补发方式</span>
                                <span className="resend-detail-value">{batch.mode}</span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">计划补发时间</span>
                                <span className="resend-detail-value">{batch.scheduledTime}</span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">补发开始时间</span>
                                <span className="resend-detail-value">
                                    {status === '待执行' ? '—' : batch.scheduledTime}
                                </span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">补发结束时间</span>
                                <span className="resend-detail-value">{batch.endTime}</span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">黑名单用户是否发送</span>
                                <span className="resend-detail-value">否</span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">提交时间</span>
                                <span className="resend-detail-value">{batch.submitTime}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="resend-conditions-toggle"
                            onClick={() => setShowConditions(!showConditions)}
                        >
                            {showConditions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            筛选条件快照
                        </button>
                        {showConditions && (
                            <div className="resend-conditions-box">
                                发送时间：2026-08-01 ~ 2026-08-12 · BusinessID：MTN_UG_Account_id ·
                                送达状态：回执超时 · 其余条件为空
                            </div>
                        )}
                    </div>

                    {/* 板块二：数量概览 */}
                    <div className="resend-detail-section">
                        <div className="resend-detail-section-title">数量概览</div>
                        <div className="resend-count-cards">
                            <div className="resend-count-card">
                                <span className="resend-count-label">提交校验数量</span>
                                <span className="resend-count-value">{batch.userVerifiedCount.toLocaleString()}</span>
                            </div>
                            <div className="resend-count-card">
                                <span className="sms-tooltip-wrap">
                                    <span className="resend-count-label">实际发送数量</span>
                                    <span className="sms-tooltip">实际执行了发送动作的条数</span>
                                </span>
                                <span className="resend-count-value">
                                    {batch.systemVerifiedCount === null ? '—' : batch.systemVerifiedCount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        {progress !== null && (
                            <div className="resend-progress">
                                <div className="resend-progress-bar">
                                    <div className="resend-progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="resend-progress-text">
                                    已发送 {batch.systemVerifiedCount?.toLocaleString()} / {batch.userVerifiedCount.toLocaleString()} 条
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 板块三：执行统计 */}
                    {hasExecutionData && (
                        <div className="resend-detail-section">
                            <div className="resend-stats-header">
                                <span className="resend-detail-section-title resend-stats-title">执行统计</span>
                                <div className="resend-stats-actions">
                                    <button
                                        type="button"
                                        className="resend-link-btn"
                                        onClick={() =>
                                            onViewRecords?.({
                                                sendTimeStart: '2026-08-01',
                                                sendTimeEnd: '2026-08-12',
                                                businessId: 'MTN_UG_Account_id',
                                                deliveryStatus: '回执超时',
                                                batchId: batch.id,
                                            })
                                        }
                                    >
                                        <ExternalLink size={13} />
                                        查看发送记录
                                    </button>
                                </div>
                            </div>
                            {status === '失败' && (
                                <div className="resend-fail-banner">
                                    批次失败：通道异常，执行中断于 {batch.endTime}
                                </div>
                            )}
                            {status === '部分失败' && (
                                <div className="resend-fail-banner">
                                    批次部分失败：通道异常，执行中断于 {batch.endTime}，已完成部分发送
                                </div>
                            )}
                            {status === '已终止' && (
                                <div className="resend-fail-banner resend-fail-banner-grey">
                                    已手动终止于 {batch.endTime}，剩余未执行条数未计入实际执行
                                </div>
                            )}
                            <div className="resend-stats-grid">
                                <div className="resend-stat-panel">
                                    <div className="resend-stat-panel-title">发送状态</div>
                                    <div className="resend-delivery-bar">
                                        {Object.entries(stats.send).map(([k, v]) => (
                                            <div
                                                key={k}
                                                className="resend-delivery-seg"
                                                style={{
                                                    width: `${(v / sendTotal) * 100}%`,
                                                    background: SEND_COLORS[k] ?? '#98a1b8',
                                                }}
                                                title={`${k}：${v}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="resend-delivery-legend">
                                        {Object.entries(stats.send).map(([k, v]) => (
                                            <span className="resend-delivery-legend-item" key={k}>
                                                <i style={{ background: SEND_COLORS[k] ?? '#98a1b8' }} />
                                                {k} {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="resend-stat-panel">
                                    <div className="resend-stat-panel-title">送达状态</div>
                                    <div className="resend-delivery-bar">
                                        {Object.entries(stats.delivery).map(([k, v]) => (
                                            <div
                                                key={k}
                                                className="resend-delivery-seg"
                                                style={{
                                                    width: `${(v / deliveryTotal) * 100}%`,
                                                    background: DELIVERY_COLORS[k] ?? '#98a1b8',
                                                }}
                                                title={`${k}：${v}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="resend-delivery-legend">
                                        {Object.entries(stats.delivery).map(([k, v]) => (
                                            <span className="resend-delivery-legend-item" key={k}>
                                                <i style={{ background: DELIVERY_COLORS[k] ?? '#98a1b8' }} />
                                                {k} {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 板块四：批次动态 */}
                    <div className="resend-detail-section">
                        <div className="resend-stats-header">
                            <span className="resend-detail-section-title resend-stats-title">
                                <History size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                                批次动态
                            </span>
                            <span className="resend-log-count">{eventList.length} 条</span>
                        </div>
                        {eventList.length > 0 ? (
                            <div className="resend-log-list">
                                {eventList.map((event) => (
                                    <div
                                        className={`resend-log-item${event.actorType === 'SYSTEM' ? ' system' : ''}`}
                                        key={event.id}
                                    >
                                        <div className="resend-log-time">{event.happenTime}</div>
                                        <div className="resend-log-main">
                                            <div className="resend-log-title">
                                                <span className="resend-log-actor">
                                                    {event.actorType === 'SYSTEM' ? '系统' : event.actorName}
                                                </span>
                                                <span className="resend-log-action">{event.eventType}</span>
                                            </div>
                                            <div className="resend-log-status">
                                                {event.fromStatus
                                                    ? `${event.fromStatus} → ${event.toStatus}`
                                                    : `进入 ${event.toStatus}`}
                                            </div>
                                            {event.remark && (
                                                <div className="resend-log-remark">{event.remark}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="resend-log-empty">暂无批次动态</div>
                        )}
                    </div>
                </div>

                {/* 底部操作栏 */}
                <div className="resend-drawer-footer">
                    <span className="resend-drawer-footer-tip">
                        {status === '待执行' && '定时任务等待执行，可终止'}
                        {status === '执行中' && '批次正在执行，可刷新进度或终止'}
                        {status === '已完成' && '批次已执行完成'}
                        {status === '已终止' && '批次已手动终止'}
                        {status === '失败' && '批次执行失败'}
                        {status === '部分失败' && '批次执行中断，已完成部分发送'}
                    </span>
                    <div className="resend-drawer-actions">
                        {status === '执行中' && (
                            <button type="button" className="sms-btn" onClick={refresh} disabled={refreshing}>
                                <RefreshCw size={14} />
                                {refreshing ? '刷新中…' : '刷新'}
                            </button>
                        )}
                        {canTerminate && (
                            <button type="button" className="sms-btn resend-danger-btn" onClick={() => onTerminate(batch)}>
                                <Ban size={14} />
                                终止批次
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
