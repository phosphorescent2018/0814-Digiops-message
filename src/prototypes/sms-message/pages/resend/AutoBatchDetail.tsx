/**
 * 自动补发批次详情抽屉：批次信息 / 数量概览 / 执行统计 / 操作
 * 仿照人工补发详情，差异：无单批次终止（全局关闭产生已终止）
 */
import React, { useMemo, useState } from 'react';
import { X, RefreshCw, ChevronDown, ChevronRight, ExternalLink, Download } from 'lucide-react';
import type { RecordFilter } from './BatchDetail';

export interface AutoBatchRow {
    batchId: string;
    status: '待执行' | '执行中' | '已完成' | '已终止' | '失败';
    startTime: string;
    endTime: string;
    systemVerifiedCount: number | null;
    queuedCount: number;
    triggerReasons: string[];
    source: string;
    createdAt: string;
}

export const AUTO_BATCH_STATUS_CLASS: Record<string, string> = {
    待执行: 'sms-status-pending',
    执行中: 'sms-status-delivering',
    已完成: 'sms-status-success',
    已终止: 'sms-status-unknown',
    失败: 'sms-status-fail',
};

interface AutoBatchDetailProps {
    batch: AutoBatchRow;
    onClose: () => void;
    onViewRecords?: (filter?: RecordFilter) => void;
}

/** 执行统计 mock：与人工补发明细分布一致 */
const DETAIL_ROWS = [
    { sendStatus: '成功', deliveryStatus: '回执中' },
    { sendStatus: '成功', deliveryStatus: '已送达' },
    { sendStatus: '成功', deliveryStatus: '未送达' },
    { sendStatus: '成功', deliveryStatus: '回执超时' },
    { sendStatus: '失败', deliveryStatus: '--' },
    { sendStatus: '失败', deliveryStatus: '--' },
    { sendStatus: '暂无数据', deliveryStatus: '未知' },
];

const SEND_COLORS: Record<string, string> = {
    成功: '#52c41a',
    失败: '#f5222d',
    暂无数据: '#98a1b8',
};

const DELIVERY_COLORS: Record<string, string> = {
    回执中: '#1677ff',
    已送达: '#52c41a',
    未送达: '#f5222d',
    回执超时: '#fa8c16',
    '--': '#98a1b8',
    未知: '#8b94a3',
};

export default function AutoBatchDetail({ batch, onClose, onViewRecords }: AutoBatchDetailProps) {
    const { status } = batch;
    const [showRules, setShowRules] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [exported, setExported] = useState(false);

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
            ? Math.min((batch.systemVerifiedCount / batch.queuedCount) * 100, 100)
            : null;

    const canExport = status === '已完成' || status === '已终止' || status === '失败';
    const hasExecutionData = status !== '待执行';

    const refresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 600);
    };

    const handleExport = () => {
        if (exported) return;
        setExported(true);
        setTimeout(() => setExported(false), 2000);
    };

    const deliveryTotal = Object.values(stats.delivery).reduce((a, b) => a + b, 0);
    const sendTotal = Object.values(stats.send).reduce((a, b) => a + b, 0);

    return (
        <div className="sms-mask resend-drawer-mask" onClick={onClose}>
            <div className="resend-drawer" onClick={(e) => e.stopPropagation()}>
                {/* 抽屉头部 */}
                <div className="resend-drawer-header">
                    <div className="resend-drawer-title">
                        <span className="resend-batch-id">{batch.batchId}</span>
                        <span className={`sms-status ${AUTO_BATCH_STATUS_CLASS[status]}`}>{status}</span>
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
                                <span className="resend-detail-label">规则来源</span>
                                <span className="resend-detail-value">{batch.source}</span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">计划补发时间</span>
                                <span className="resend-detail-value">{batch.startTime}</span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">补发开始时间</span>
                                <span className="resend-detail-value">{status === '待执行' ? '—' : batch.startTime}</span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">补发结束时间</span>
                                <span className="resend-detail-value">{batch.endTime}</span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">入队时间</span>
                                <span className="resend-detail-value">{batch.createdAt}</span>
                            </div>
                            <div className="resend-detail-item">
                                <span className="resend-detail-label">黑名单校验</span>
                                <span className="resend-detail-value">是（黑名单内不发送）</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="resend-conditions-toggle"
                            onClick={() => setShowRules(!showRules)}
                        >
                            {showRules ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            规则快照
                        </button>
                        {showRules && (
                            <div className="resend-conditions-box">
                                触发条件：{batch.triggerReasons.join('、')} · 生效时段：全天 ·
                                最多补发次数：3 次 · 补发时间间隔：1 小时 · 最大排队数量：1,000 条 ·
                                批次最长等待：15 分钟
                            </div>
                        )}
                    </div>

                    {/* 板块二：数量概览 */}
                    <div className="resend-detail-section">
                        <div className="resend-detail-section-title">数量概览</div>
                        <div className="resend-count-cards">
                            <div className="resend-count-card">
                                <span className="sms-tooltip-wrap">
                                    <span className="resend-count-label">入队数量</span>
                                    <span className="sms-tooltip">聚批时进入本批次的短信条数</span>
                                </span>
                                <span className="resend-count-value">{batch.queuedCount.toLocaleString()}</span>
                            </div>
                            <div className="resend-count-card">
                                <span className="sms-tooltip-wrap">
                                    <span className="resend-count-label">实际发送数量</span>
                                    <span className="sms-tooltip">实际执行了发送动作的条数，含单条提交失败</span>
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
                                    已发送 {batch.systemVerifiedCount?.toLocaleString()} / {batch.queuedCount.toLocaleString()} 条 · 实时更新
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
                                                sendTimeStart: batch.startTime.slice(0, 10),
                                                sendTimeEnd: (batch.endTime !== '—' ? batch.endTime : batch.startTime).slice(0, 10),
                                                batchId: batch.batchId,
                                            })
                                        }
                                    >
                                        <ExternalLink size={13} />
                                        查看发送记录
                                    </button>
                                    <span className="sms-tooltip-wrap">
                                        <button
                                            type="button"
                                            className="sms-btn"
                                            onClick={handleExport}
                                            disabled={!canExport || exported}
                                        >
                                            <Download size={14} />
                                            {exported ? '已导出' : '导出'}
                                        </button>
                                        {!canExport && <span className="sms-tooltip">待任务结束后可导出</span>}
                                    </span>
                                </div>
                            </div>
                            {status === '失败' && (
                                <div className="resend-fail-banner">
                                    批次失败：系统异常，执行中断于 {batch.endTime}
                                </div>
                            )}
                            {status === '已终止' && (
                                <div className="resend-fail-banner resend-fail-banner-grey">
                                    该批次因关闭自动补发被中断于 {batch.endTime}，已发送部分保留统计
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
                                                style={{ width: `${(v / sendTotal) * 100}%`, background: SEND_COLORS[k] ?? '#98a1b8' }}
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
                                                style={{ width: `${(v / deliveryTotal) * 100}%`, background: DELIVERY_COLORS[k] ?? '#98a1b8' }}
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
                </div>

                {/* 底部操作栏 */}
                <div className="resend-drawer-footer">
                    <span className="resend-drawer-footer-tip">
                        {status === '待执行' && '批次等待执行'}
                        {status === '执行中' && '批次正在执行，实际发送数量实时更新'}
                        {status === '已完成' && '批次已执行完成'}
                        {status === '已终止' && '该批次因关闭自动补发被中断'}
                        {status === '失败' && '批次执行失败'}
                    </span>
                    <div className="resend-drawer-actions">
                        {status === '执行中' && (
                            <button type="button" className="sms-btn" onClick={refresh} disabled={refreshing}>
                                <RefreshCw size={14} />
                                {refreshing ? '刷新中…' : '刷新'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
