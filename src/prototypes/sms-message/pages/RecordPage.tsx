/**
 * 发送记录：搜索表单 + 导出 + 数据表格 + 分页
 */
import React, { useMemo, useState } from 'react';
import {
    RefreshCw,
    ListFilter,
    RotateCcw,
    Search,
    ChevronUp,
    Download,
    Calendar,
    ArrowRight,
} from 'lucide-react';
import { recordRows, contentTypeOptions, statusOptions } from '../mockData';
import type { RecordFilter } from './resend/BatchDetail';

interface RecordPageProps {
    activeKey?: string;
    filter?: RecordFilter;
}

const PAGE_SIZE = 10;

const PLACEHOLDER_SELECT = '请选择';

/** 送达状态 hover 气泡提示 */
function DeliveryTooltip({ text, children }: { text: string; children: React.ReactNode }) {
    return (
        <span className="sms-tooltip-wrap">
            {children}
            <span className="sms-tooltip">{text}</span>
        </span>
    );
}

function SearchForm({
    filter,
    resendType,
    onResendTypeChange,
}: {
    filter?: RecordFilter;
    resendType: string;
    onResendTypeChange: (v: string) => void;
}) {
    const [collapsed, setCollapsed] = useState(false);

    const renderSelect = (placeholder = PLACEHOLDER_SELECT, options?: string[], defaultValue?: string) => (
        <select
            className={`sms-select${defaultValue ? '' : ' placeholder'}`}
            defaultValue={defaultValue ?? ''}
        >
            {defaultValue ? (
                <option value={defaultValue}>{defaultValue}</option>
            ) : (
                <option value="">{placeholder}</option>
            )}
            {options?.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );

    const fields = (
        <>
            <div className="sms-form-item">
                <label className="sms-form-label">发送时间</label>
                <div className="sms-form-control">
                    <div className="sms-date-range">
                        <span>
                            {filter?.sendTimeStart ? (
                                filter.sendTimeStart
                            ) : (
                                <>
                                    <Calendar size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                                    起始日期
                                </>
                            )}
                        </span>
                        <span className="arrow">
                            <ArrowRight size={12} />
                        </span>
                        <span>{filter?.sendTimeEnd ?? '结束日期'}</span>
                    </div>
                </div>
            </div>
            <div className="sms-form-item">
                <label className="sms-form-label">BusinessID</label>
                <div className="sms-form-control">{renderSelect('', undefined, filter?.businessId)}</div>
            </div>
            <div className="sms-form-item">
                <label className="sms-form-label">计划名称</label>
                <div className="sms-form-control">{renderSelect()}</div>
            </div>
            <div className="sms-form-item">
                <label className="sms-form-label">用户分组</label>
                <div className="sms-form-control">{renderSelect()}</div>
            </div>
            <div className="sms-form-item">
                <label className="sms-form-label">手机号码</label>
                <div className="sms-form-control">
                    <input className="sms-input" placeholder="请输入" defaultValue={filter?.phone ?? ''} />
                </div>
            </div>
            <div className="sms-form-item">
                <label className="sms-form-label">内容类型</label>
                <div className="sms-form-control">{renderSelect(undefined, contentTypeOptions.slice(1), filter?.contentType)}</div>
            </div>
            {!collapsed && (
                <>
                    <div className="sms-form-item">
                        <label className="sms-form-label">发送名称</label>
                        <div className="sms-form-control">{renderSelect()}</div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">发送状态</label>
                        <div className="sms-form-control">
                            {renderSelect(undefined, statusOptions.map((s) => s.label), filter?.sendStatus)}
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">送达状态</label>
                        <div className="sms-form-control">
                            <select
                                className={`sms-select sms-control-purple${filter?.deliveryStatus ? '' : ' placeholder'}`}
                                defaultValue={filter?.deliveryStatus ?? ''}
                            >
                                <option value="">请选择</option>
                                <option value="回执中">回执中</option>
                                <option value="已送达">已送达</option>
                                <option value="回执超时">回执超时</option>
                                <option value="--">--</option>
                            </select>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">补发类型</label>
                        <div className="sms-form-control">
                            <select
                                className={`sms-select sms-control-purple${resendType ? '' : ' placeholder'}`}
                                value={resendType}
                                onChange={(e) => onResendTypeChange(e.target.value)}
                            >
                                <option value="">请选择</option>
                                <option value="原始短信">原始短信</option>
                                <option value="人工补发">人工补发</option>
                                <option value="计划内自动补发">计划内自动补发</option>
                            </select>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">补发批次 ID</label>
                        <div className="sms-form-control">
                            <input
                                className="sms-input sms-control-purple"
                                placeholder="请输入"
                                defaultValue={filter?.batchId ?? ''}
                            />
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">路径标记</label>
                        <div className="sms-form-control">
                            <input className="sms-input" placeholder="请输入" />
                        </div>
                    </div>
                </>
            )}
        </>
    );

    return (
        <div className="sms-card sms-search">
            <div className="sms-search-grid">{fields}</div>
            <div className="sms-search-actions">
                <button type="button" className="sms-btn">
                    <RotateCcw size={14} />
                    重置
                </button>
                <button type="button" className="sms-btn sms-btn-primary">
                    <Search size={14} />
                    查询
                </button>
                <button type="button" className="sms-btn sms-btn-link" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? '展开' : '收起'}
                    <ChevronUp size={14} style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
                </button>
            </div>
        </div>
    );
}

function RecordTable({
    onExport,
    filter,
    resendType,
}: {
    onExport: () => void;
    filter?: RecordFilter;
    resendType: string;
}) {
    const [page, setPage] = useState(1);
    const filteredRows = useMemo(
        () => {
            const statusCodeMap: Record<string, string> = { 成功: '2', 失败: '1', 暂无数据: '0' };
            return recordRows.filter((r) => {
                if (filter?.batchId && r.batchId !== filter.batchId) return false;
                if (filter?.businessId && r.businessId !== filter.businessId) return false;
                if (filter?.deliveryStatus && r.deliveryStatus !== filter.deliveryStatus) return false;
                if (filter?.contentType && r.contentType !== filter.contentType) return false;
                if (filter?.sendStatus && r.notifyStatus !== statusCodeMap[filter.sendStatus]) return false;
                if (filter?.phone && !r.phone.includes(filter.phone)) return false;
                if (resendType && r.resendType !== resendType) return false;
                return true;
            });
        },
        [filter, resendType]
    );
    const rows = useMemo(() => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredRows, page]);
    const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
    /** 计划内自动补发序号：按发送时间排序，用于「补发类型」列展示第 N 次 */
    const resendSeqMap = useMemo(() => {
        const map: Record<string, number> = {};
        filteredRows
            .filter((r) => r.resendType === '计划内自动补发')
            .sort((a, b) => a.sendTime.localeCompare(b.sendTime))
            .forEach((r, i) => {
                map[`${r.index}-${r.sendTime}`] = i + 1;
            });
        return map;
    }, [filteredRows]);

    const renderResendType = (row: (typeof recordRows)[number]) => {
        if (row.resendType === '计划内自动补发') {
            const seq = resendSeqMap[`${row.index}-${row.sendTime}`];
            return `计划内自动补发·第 ${seq} 次`;
        }
        return row.resendType;
    };

    const renderStatus = (status: string) => {
        const statusMap: Record<string, { className: string; text: string }> = {
            '2': { className: 'sms-status-success', text: '成功' },
            '1': { className: 'sms-status-fail', text: '失败' },
            '0': { className: 'sms-status-unknown', text: '暂无数据' },
        };
        const item = statusMap[status];
        return <span className={`sms-status ${item?.className ?? 'sms-status-unknown'}`}>{item?.text ?? '-'}</span>;
    };

    // 送达状态：历史短信一律 --；失败 --；暂无数据 --；成功按回执状态展示
    const renderDelivery = (row: (typeof recordRows)[number]) => {
        if (row.isHistory || row.notifyStatus === '1') {
            const tip = row.isHistory ? '历史数据，不计算回执' : '发送失败，无回执';
            return (
                <DeliveryTooltip text={tip}>
                    <span className="sms-dash">--</span>
                </DeliveryTooltip>
            );
        }
        if (row.notifyStatus === '0') {
            return (
                <DeliveryTooltip text="发送状态未确认">
                    <span className="sms-dash">--</span>
                </DeliveryTooltip>
            );
        }
        const classMap: Record<string, string> = {
            回执中: 'sms-status-delivering',
            已送达: 'sms-status-success',
            回执超时: 'sms-status-timeout',
        };
        const tipMap: Record<string, string> = {
            回执中: '正在等待运营商回执',
            已送达: '短信投递成功',
            回执超时: '24 小时内无明确回执',
        };
        const className = classMap[row.deliveryStatus] ?? 'sms-status-unknown';
        return (
            <DeliveryTooltip text={tipMap[row.deliveryStatus] ?? row.deliveryStatus}>
                <span className={`sms-status ${className}`}>{row.deliveryStatus}</span>
            </DeliveryTooltip>
        );
    };

    return (
        <div className="sms-card sms-table-card sms-record-card">
            <div className="sms-toolbar">
                <button type="button" className="sms-btn sms-btn-primary" onClick={onExport}>
                    <Download size={14} />
                    导出
                </button>
                <div className="sms-toolbar-right">
                    <button type="button" className="sms-btn sms-btn-icon" title="刷新">
                        <RefreshCw size={15} />
                    </button>
                    <button type="button" className="sms-btn sms-btn-icon" title="列设置">
                        <ListFilter size={15} />
                    </button>
                </div>
            </div>
            <div className="sms-table-wrap">
                <table className="sms-table sms-record-table">
                    <thead>
                        <tr>
                            <th className="sms-col-index">序号</th>
                            <th className="sms-col-sendtime">发送时间</th>
                            <th className="sms-col-business">BusinessID</th>
                            <th className="sms-col-plan">计划名称</th>
                            <th className="sms-col-group">用户分组</th>
                            <th className="sms-col-phone">手机号码</th>
                            <th className="sms-col-type">内容类型</th>
                            <th className="sms-record-col-content">内容</th>
                            <th className="sms-col-sender">发送名称</th>
                            <th className="sms-col-status">发送状态</th>
                            <th className="sms-record-col-delivery">送达状态</th>
                            <th className="sms-record-col-resend-type">补发类型</th>
                            <th className="sms-record-col-batch">补发批次 ID</th>
                            <th className="sms-col-sol">路径标记</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.index}>
                                <td className="sms-col-index">{row.index}</td>
                                <td>{row.sendTime}</td>
                                <td>
                                    <span className="sms-cell">{row.businessId}</span>
                                </td>
                                <td>
                                    <span className="sms-cell sms-dash">{row.planName}</span>
                                </td>
                                <td>
                                    <span className="sms-cell sms-dash">{row.groupName}</span>
                                </td>
                                <td>
                                    <span className="sms-cell">{row.phone}</span>
                                </td>
                                <td>{row.contentType}</td>
                                <td>
                                    <span className="sms-cell" title={row.content}>
                                        {row.content}
                                    </span>
                                </td>
                                <td>{row.sender}</td>
                                <td>{renderStatus(row.notifyStatus)}</td>
                                <td className="sms-record-col-delivery">{renderDelivery(row)}</td>
                                <td className="sms-record-col-resend-type">{renderResendType(row)}</td>
                                <td>
                                    {row.batchId ? (
                                        row.batchId.startsWith('A') ? row.batchId : `B${row.batchId}`
                                    ) : (
                                        <span className="sms-dash">—</span>
                                    )}
                                </td>
                                <td>
                                    <span className="sms-cell sms-dash">{row.solId}</span>
                                </td>
                            </tr>
                        ))}
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
                <span className="sms-jump">
                    跳至
                    <input type="text" defaultValue="" />
                    页
                </span>
            </div>
        </div>
    );
}

export default function RecordPage({ activeKey, filter }: RecordPageProps) {
    const [exportVisible, setExportVisible] = useState(false);
    const [resendType, setResendType] = useState('');

    return (
        <div>
            <SearchForm
                filter={filter}
                resendType={resendType}
                onResendTypeChange={setResendType}
            />
            <RecordTable onExport={() => setExportVisible(true)} filter={filter} resendType={resendType} />

            {exportVisible && (
                <div className="sms-mask" onClick={() => setExportVisible(false)}>
                    <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sms-modal-header">导出</div>
                        <div className="sms-modal-body">
                            <div className="sms-form-item">
                                <label className="sms-form-label">导出名称</label>
                                <div className="sms-form-control">
                                    <input className="sms-input" defaultValue="短信发送记录_20260811_1327" />
                                </div>
                            </div>
                            <div className="sms-form-item">
                                <label className="sms-form-label">文件格式</label>
                                <div className="sms-form-control">
                                    <select className="sms-select" defaultValue="EXECL">
                                        <option value="EXECL">EXECL</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="sms-modal-actions">
                            <button type="button" className="sms-btn" onClick={() => setExportVisible(false)}>
                                取消
                            </button>
                            <button
                                type="button"
                                className="sms-btn sms-btn-primary"
                                onClick={() => setExportVisible(false)}
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
