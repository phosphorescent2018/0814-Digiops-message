/**
 * 短信模版：搜索 + 新建模版 + 数据表格
 */
import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, RefreshCw, ListFilter, RotateCcw, Search, ChevronUp, Calendar, Trash2 } from 'lucide-react';
import { templateRows } from '../mockData';

function DisabledDeleteHint({ text, children }: { text: string; children: React.ReactNode }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    const show = () => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const center = r.left + r.width / 2;
        const left = Math.max(180, Math.min(center, window.innerWidth - 180));
        setPos({ top: r.top, left });
    };
    const hide = () => setPos(null);

    return (
        <span
            ref={ref}
            className="sms-tooltip-wrap"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {pos &&
                createPortal(
                    <span className="sms-tooltip sms-tooltip-portal" style={{ left: pos.left, top: pos.top }}>
                        {text}
                    </span>,
                    document.body
                )}
        </span>
    );
}

const PAGE_SIZE = 10;

function TemplateTable() {
    const [page, setPage] = useState(1);
    const rows = useMemo(() => templateRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [page]);
    const totalPages = Math.ceil(templateRows.length / PAGE_SIZE);

    return (
        <div className="sms-card sms-table-card sms-template-card">
            <div className="sms-toolbar">
                <button type="button" className="sms-btn sms-btn-primary">
                    <Plus size={14} />
                    新建模版
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
                <table className="sms-table sms-template-table">
                    <thead>
                        <tr>
                            <th className="sms-col-index">序号</th>
                            <th className="sms-col-sendtime">创建时间</th>
                            <th className="sms-col-sendtime">更新时间</th>
                            <th className="sms-col-business">BusinessID</th>
                            <th className="sms-col-plan">模板名称</th>
                            <th className="sms-col-type">触达方式</th>
                            <th className="sms-col-type">触达通道</th>
                            <th className="sms-col-type">内容类型</th>
                            <th className="sms-template-col-content">消息内容</th>
                            <th className="sms-col-operator">操作人</th>
                            <th className="sms-col-status">状态</th>
                            <th className="sms-col-action">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.index}>
                                <td className="sms-col-index">{row.index}</td>
                                <td>{row.createTime}</td>
                                <td>{row.updateTime}</td>
                                <td>
                                    <span className="sms-cell">{row.businessId}</span>
                                </td>
                                <td>
                                    <span className="sms-cell" style={{ color: '#031938' }}>
                                        {row.templateName}
                                    </span>
                                </td>
                                <td>{row.triggerWay}</td>
                                <td>{row.supplierType}</td>
                                <td>{row.contentType}</td>
                                <td>
                                    <span className="sms-cell" title={row.content}>
                                        {row.content}
                                    </span>
                                </td>
                                <td>{row.operator}</td>
                                <td>
                                    <span className="sms-status sms-status-approve">{row.status}</span>
                                </td>
                                <td>
                                    <button type="button" className="sms-action-link">
                                        试发
                                    </button>
                                    <button type="button" className="sms-action-link">
                                        编辑
                                    </button>
                                    {row.usedPlan ? (
                                        <DisabledDeleteHint
                                            text={`当前短信模板已在运营计划「${row.usedPlan}」中配置，请先删除对应的运营计划后再删除模板`}
                                        >
                                            <button type="button" className="sms-action-icon" disabled title="">
                                                <Trash2 size={15} />
                                            </button>
                                        </DisabledDeleteHint>
                                    ) : (
                                        <button type="button" className="sms-action-icon" title="删除">
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="sms-pagination">
                <span className="sms-pagination-total">共 {templateRows.length} 条</span>
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

export default function TemplatePage() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div>
            <div className="sms-card sms-search">
                <div className="sms-search-grid">
                    <div className="sms-form-item">
                        <label className="sms-form-label">创建时间</label>
                        <div className="sms-form-control">
                            <div className="sms-date-range">
                                <span>
                                    <Calendar size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                                    起始日期
                                </span>
                                <span className="arrow">→</span>
                                <span>结束日期</span>
                            </div>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">BusinessID</label>
                        <div className="sms-form-control">
                            <select className="sms-select placeholder">
                                <option value="">请选择</option>
                                <option value="MTN_UG_Account_id">MTN_UG_Account_id</option>
                                <option value="MTN_Uganda">MTN_Uganda</option>
                            </select>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">模板名称</label>
                        <div className="sms-form-control">
                            <input className="sms-input" placeholder="请输入" />
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">触达方式</label>
                        <div className="sms-form-control">
                            <select className="sms-select placeholder">
                                <option value="">请选择</option>
                                <option value="短信">短信</option>
                            </select>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">触达通道</label>
                        <div className="sms-form-control">
                            <select className="sms-select placeholder">
                                <option value="">请选择</option>
                                <option value="SMPP">SMPP</option>
                            </select>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">内容类型</label>
                        <div className="sms-form-control">
                            <select className="sms-select placeholder">
                                <option value="">请选择</option>
                                <option value="营销类">营销类</option>
                                <option value="通知类">通知类</option>
                            </select>
                        </div>
                    </div>
                    {!collapsed && (
                        <div className="sms-form-item">
                            <label className="sms-form-label">状态</label>
                            <div className="sms-form-control">
                                <select className="sms-select placeholder">
                                    <option value="">请选择</option>
                                    <option value="审核成功">审核成功</option>
                                    <option value="待审核">待审核</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
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
            <TemplateTable />
        </div>
    );
}
