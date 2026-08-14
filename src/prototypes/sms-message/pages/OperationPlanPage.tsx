/**
 * 运营计划管理：计划管理（列表） / 计划总结
 * 高精度还原 UAT「运营计划管理」页面，风格与现有短信原型一致
 */
import React, { useState } from 'react';
import {
    RotateCcw,
    Search,
    ChevronUp,
    Calendar,
    ArrowRight,
    Plus,
    Trash2,
    RefreshCw,
    LayoutGrid,
    Eye,
    Copy,
    MoreHorizontal,
} from 'lucide-react';
import OperationPlanCanvas from './OperationPlanCanvas';

interface PlanRow {
    id: string;
    createdAt: string;
    updatedAt: string;
    businessId: string;
    planId: string;
    name: string;
    status: string;
    executeStatus: string;
    executeCycle: string;
    channel: string;
    hasDelay: string;
    operator: string;
    tag: string;
}

const PLAN_ROWS: PlanRow[] = [
    { id: '3059', createdAt: '2026-08-07 03:43:40', updatedAt: '2026-08-07 03:43:40', businessId: 'MTN_UG_Phone', planId: '3059', name: 'July2_Acquisition_A_1_8_260810', status: '关闭', executeStatus: '-', executeCycle: '-', channel: '-', hasDelay: '否', operator: 'Swart Guan', tag: '-' },
];

const TOTAL = 90;
const PAGE_SIZE = 10;

/** 分页页码：页数较多时中间折叠为 …，风格与 UAT 一致 */
function buildPages(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 9) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    if (current <= 5) {
        pages.push(1, 2, 3, 4, 5, 'ellipsis', total - 1, total);
    } else if (current >= total - 4) {
        pages.push(1, 2, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total);
    } else {
        pages.push(1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total);
    }
    return pages;
}

export default function OperationPlanPage({ onOpenBlacklist }: { onOpenBlacklist?: () => void }) {
    const [tab, setTab] = useState<'manage' | 'summary'>('manage');
    const [collapsed, setCollapsed] = useState(true);
    const [page, setPage] = useState(1);
    const [planRows, setPlanRows] = useState<PlanRow[]>(PLAN_ROWS);
    const [canvasCtx, setCanvasCtx] = useState<{ mode: 'new' | 'edit'; planId: string | null; name: string } | null>(
        null,
    );

    const renderSelect = (placeholder = '请选择', options?: string[]) => (
        <select className="sms-select placeholder" defaultValue="">
            <option value="">{placeholder}</option>
            {options?.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );

    if (canvasCtx) {
        return (
            <OperationPlanCanvas
                key={canvasCtx.planId ?? `new-${canvasCtx.name}`}
                planName={canvasCtx.name}
                onBack={() => setCanvasCtx(null)}
                onOpenBlacklist={onOpenBlacklist}
                onSaved={(savedName) => {
                    if (canvasCtx.mode === 'new') {
                        const now = new Date();
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
                        const finalName = savedName && savedName !== '未命名计划' ? savedName : `新建计划_${ts}`;
                        const row: PlanRow = {
                            id: `p${Date.now()}`,
                            createdAt: '2026-08-13 10:00:00',
                            updatedAt: '2026-08-13 10:00:00',
                            businessId: 'MTN_UG_Phone',
                            planId: `p${Date.now()}`,
                            name: finalName,
                            status: '关闭',
                            executeStatus: '-',
                            executeCycle: '-',
                            channel: '-',
                            hasDelay: '否',
                            operator: 'Swart Guan',
                            tag: '-',
                        };
                        setPlanRows((prev) => [row, ...prev]);
                        setCanvasCtx({ mode: 'edit', planId: row.id, name: finalName });
                    } else {
                        setPlanRows((prev) => prev.map((r) => (r.id === canvasCtx.planId ? { ...r, name: savedName } : r)));
                    }
                }}
            />
        );
    }

    return (
        <div>
            <h1 className="sms-page-title">运营计划管理</h1>

            {/* 计划管理 / 计划总结 */}
            <div className="sms-tabs">
                <div
                    className={`sms-tab${tab === 'manage' ? ' active' : ''}`}
                    onClick={() => setTab('manage')}
                >
                    计划管理
                </div>
                <div
                    className={`sms-tab${tab === 'summary' ? ' active' : ''}`}
                    onClick={() => setTab('summary')}
                >
                    计划总结
                </div>
            </div>

            {tab === 'manage' && (
                <>
                    {/* 条件筛选区 */}
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
                                        <span className="arrow">
                                            <ArrowRight size={12} />
                                        </span>
                                        <span>结束日期</span>
                                    </div>
                                </div>
                            </div>
                            <div className="sms-form-item">
                                <label className="sms-form-label">BusinessID</label>
                                <div className="sms-form-control">{renderSelect(undefined, ['MTN_UG_Phone', 'MTN_UG_Account_id'])}</div>
                            </div>
                            <div className="sms-form-item">
                                <label className="sms-form-label">计划名称</label>
                                <div className="sms-form-control">{renderSelect()}</div>
                            </div>
                            {!collapsed && (
                                <>
                                    <div className="sms-form-item">
                                        <label className="sms-form-label">状态</label>
                                        <div className="sms-form-control">{renderSelect(undefined, ['开启', '关闭'])}</div>
                                    </div>
                                    <div className="sms-form-item">
                                        <label className="sms-form-label">执行状态</label>
                                        <div className="sms-form-control">{renderSelect()}</div>
                                    </div>
                                    <div className="sms-form-item">
                                        <label className="sms-form-label">使用渠道</label>
                                        <div className="sms-form-control">{renderSelect(undefined, ['短信', 'WhatsApp', '电销', '智能语音', 'Viber', '应用推送'])}</div>
                                    </div>
                                    <div className="sms-form-item">
                                        <label className="sms-form-label">存在延时器</label>
                                        <div className="sms-form-control">{renderSelect(undefined, ['是', '否'])}</div>
                                    </div>
                                    <div className="sms-form-item">
                                        <label className="sms-form-label">操作人</label>
                                        <div className="sms-form-control">
                                            <input className="sms-input" placeholder="请输入" />
                                        </div>
                                    </div>
                                    <div className="sms-form-item">
                                        <label className="sms-form-label">计划标签</label>
                                        <div className="sms-form-control">{renderSelect('请先选择BusinessID')}</div>
                                    </div>
                                </>
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

                    {/* 列表工具栏 */}
                    <div className="sms-card plan-list-card">
                        <div className="plan-toolbar">
                            <div className="plan-toolbar-left">
                                <button
                                    type="button"
                                    className="sms-btn sms-btn-primary"
                                    onClick={() => setCanvasCtx({ mode: 'new', planId: null, name: '未命名计划' })}
                                >
                                    <Plus size={14} />
                                    新建计划
                                </button>
                                <button type="button" className="sms-btn" disabled>
                                    <Trash2 size={14} />
                                    批量删除
                                </button>
                            </div>
                            <div className="plan-toolbar-right">
                                <button type="button" className="sms-btn sms-btn-icon" title="刷新">
                                    <RefreshCw size={15} />
                                </button>
                                <button type="button" className="sms-btn sms-btn-icon" title="视图切换">
                                    <LayoutGrid size={15} />
                                </button>
                            </div>
                        </div>

                        <div className="sms-table-wrap plan-table-wrap">
                            <table className="sms-table plan-table">
                                <thead>
                                    <tr>
                                        <th className="plan-col-name">运营计划名称</th>
                                        <th className="plan-col-action">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {planRows.map((r) => (
                                        <tr key={r.id}>
                                            <td className="plan-col-name">
                                                <span className="sms-cell">{r.name}</span>
                                            </td>
                                            <td className="plan-col-action">
                                                <span className="plan-action-group">
                                                    <button
                                                        type="button"
                                                        className="sms-btn sms-btn-icon"
                                                        title="详情"
                                                        onClick={() => setCanvasCtx({ mode: 'edit', planId: r.id, name: r.name })}
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button type="button" className="sms-btn sms-btn-icon" title="复制">
                                                        <Copy size={15} />
                                                    </button>
                                                    <button type="button" className="sms-btn sms-btn-icon" title="删除">
                                                        <Trash2 size={15} />
                                                    </button>
                                                    <button type="button" className="sms-btn sms-btn-icon" title="更多">
                                                        <MoreHorizontal size={15} />
                                                    </button>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="sms-pagination">
                            <span className="sms-pagination-total">共 {TOTAL} 条</span>
                            <button
                                type="button"
                                className="sms-page-btn"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                ‹
                            </button>
                            {buildPages(page, Math.ceil(TOTAL / PAGE_SIZE) + 1).map((p, idx) =>
                                p === 'ellipsis' ? (
                                    <span key={`e${idx}`} className="sms-page-ellipsis">
                                        •••
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        key={p}
                                        className={`sms-page-btn${p === page ? ' active' : ''}`}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                ),
                            )}
                            <button
                                type="button"
                                className="sms-page-btn"
                                disabled={page >= Math.ceil(TOTAL / PAGE_SIZE) + 1}
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
                </>
            )}

            {tab === 'summary' && (
                <div className="sms-card plan-summary-empty">
                    <span>计划总结</span>
                </div>
            )}
        </div>
    );
}
