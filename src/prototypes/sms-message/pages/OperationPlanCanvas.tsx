/**
 * 运营计划画布配置页：操作列「详情」进入
 * 高精度还原 UAT 流程定制画布：顶部工具栏 + 左侧节点面板 + 可拖拽画布
 * 支持：左侧组件拖入画布、画布内拖动移动、节点间拖线连接、选中删除
 * 定制组件（前置校验 / 补发控制）点击节点可打开配置面板，保存后展示配置摘要
 */
import React, { useRef, useState } from 'react';
import {
    ArrowLeft,
    Pencil,
    Plus,
    Clock,
    ChevronDown,
    Users,
    Clock as ClockIcon,
    GitBranch,
    Diamond,
    MousePointerClick,
    Filter,
    MessageSquareText,
    MessageCircle,
    AudioLines,
    Phone,
    Webhook,
    Slice,
    Bell,
    PhoneCall,
    Ticket,
    ShieldCheck,
    RefreshCw,
    X,
    LayoutGrid,
    SquarePlus,
    Copy,
    Trash2,
    Undo2,
    Redo2,
    LocateFixed,
    ZoomIn,
    ZoomOut,
    Eraser,
} from 'lucide-react';

interface NodeDef {
    id: string;
    label: string;
    color: string;
    icon?: React.ElementType;
    shape?: 'rect' | 'circle' | 'diamond';
    text?: string;
}

interface NodeGroup {
    title: string;
    nodes: NodeDef[];
}

const NODE_GROUPS: NodeGroup[] = [
    {
        title: '进入',
        nodes: [{ id: 'customer-group', label: '客户群组', color: '#98a1b8', icon: Users }],
    },
    {
        title: '动作',
        nodes: [
            { id: 'touch-precheck', label: '前置校验', color: '#1890ff', icon: ShieldCheck },
            { id: 'resend-control', label: '补发控制', color: '#fa8c16', icon: RefreshCw },
            { id: 'end', label: '结束节点', color: '#98a1b8', shape: 'circle', text: 'END' },
            { id: 'delay', label: '延时器', color: '#98a1b8', shape: 'circle', icon: ClockIcon },
            { id: 'ab-test', label: 'A/B测试', color: '#98a1b8', icon: GitBranch },
            { id: 'judge', label: '判断', color: '#98a1b8', shape: 'diamond', icon: Diamond },
            { id: 'action-judge', label: '动作判断', color: '#98a1b8', shape: 'diamond', icon: MousePointerClick },
            { id: 'group-filter', label: '群组过滤', color: '#98a1b8', shape: 'diamond', icon: Filter },
        ],
    },
    {
        title: '渠道',
        nodes: [
            { id: 'sms', label: '短信', color: '#98a1b8', icon: MessageSquareText },
            { id: 'whatsapp', label: 'WhatsApp', color: '#98a1b8', icon: MessageCircle },
            { id: 'voice', label: '智能语音', color: '#98a1b8', icon: AudioLines },
            { id: 'viber', label: 'Viber', color: '#98a1b8', icon: Phone },
            { id: 'webhook', label: 'Webhook', color: '#98a1b8', icon: Webhook },
            { id: 'slice', label: '切片', color: '#98a1b8', icon: Slice },
            { id: 'push', label: '应用推送', color: '#98a1b8', icon: Bell },
            { id: 'tel-sale', label: '电销', color: '#98a1b8', icon: PhoneCall },
            { id: 'coupon', label: '优惠券', color: '#98a1b8', icon: Ticket },
        ],
    },
];

const ALL_NODES: NodeDef[] = NODE_GROUPS.flatMap((group) => group.nodes);

const CANVAS_TOOLS = [LayoutGrid, SquarePlus, Copy, Trash2, Undo2, Redo2, LocateFixed, ZoomIn, ZoomOut, Eraser];

const NODE_W = 128;
const NODE_H = 92;

/** 前置校验配置 */
interface PrecheckConfig {
    enabled: boolean;
    checks: string[];
    windows: { start: string; end: string }[];
    strategy: 'wait';
}

const DEFAULT_PRECHECK: PrecheckConfig = {
    enabled: false,
    checks: [],
    windows: [{ start: '09:00', end: '18:00' }],
    strategy: 'wait',
};

/** 补发控制配置 */
interface ResendControlConfig {
    enabled: boolean;
    triggers: string[];
    maxWaitHours: string;
    maxResend: string;
    interval: string;
}

const DEFAULT_RESEND_CONTROL: ResendControlConfig = {
    enabled: false,
    triggers: [],
    maxWaitHours: '24',
    maxResend: '3',
    interval: '30',
};

interface CanvasNode {
    id: string;
    def: NodeDef;
    x: number;
    y: number;
    config: PrecheckConfig | ResendControlConfig | null;
}

interface CanvasEdge {
    id: string;
    from: string;
    to: string;
}

/* ================= 摘要 ================= */

function PrecheckSummary({ config }: { config: PrecheckConfig }) {
    if (!config.enabled) {
        return <span className="plan-canvas-item-summary">复用全局默认</span>;
    }
    const parts: string[] = [];
    if (config.checks.includes('blacklist')) {
        parts.push('黑名单校验');
    }
    if (config.checks.includes('timeWindow')) {
        const times = config.windows.map((w) => `${w.start}-${w.end}`).join('、');
        parts.push(`时段 ${times}`);
    }
    if (config.checks.includes('timeWindow') && config.strategy === 'wait') {
        parts.push('非时段等待');
    }
    return <span className="plan-canvas-item-summary">{parts.length ? parts.join(' · ') : '未选择校验项'}</span>;
}

function ResendControlSummary({ config }: { config: ResendControlConfig }) {
    if (!config.enabled) {
        return <span className="plan-canvas-item-summary">跟随全局自动补发</span>;
    }
    const parts: string[] = [];
    if (config.triggers.includes('submitFail')) {
        parts.push('提交失败');
    }
    if (config.triggers.includes('receiptTimeout')) {
        parts.push(`回执超时${config.maxWaitHours}h`);
    }
    parts.push(`最多${config.maxResend}次`, `间隔${config.interval}分钟`);
    return <span className="plan-canvas-item-summary">{parts.join(' · ')}</span>;
}

/* ================= 前置校验配置面板 ================= */

interface PrecheckModalProps {
    initial: PrecheckConfig;
    onClose: () => void;
    onSave: (config: PrecheckConfig) => void;
}

function PrecheckConfigModal({ initial, onClose, onSave }: PrecheckModalProps) {
    const [draft, setDraft] = useState<PrecheckConfig>(() => ({
        enabled: initial.enabled,
        checks: [...initial.checks],
        windows: initial.windows.map((w) => ({ ...w })),
        strategy: initial.strategy,
    }));

    const toggleCheck = (key: string) => {
        setDraft((prev) => {
            const has = prev.checks.includes(key);
            const checks = has ? prev.checks.filter((c) => c !== key) : [...prev.checks, key];
            return { ...prev, checks };
        });
    };

    const updateWindow = (index: number, key: 'start' | 'end', value: string) => {
        setDraft((prev) => ({
            ...prev,
            windows: prev.windows.map((w, i) => (i === index ? { ...w, [key]: value } : w)),
        }));
    };

    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal plan-canvas-config-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">前置校验</div>
                <div className="sms-modal-body">
                    <div className="sms-form-item">
                        <label className="sms-form-label">启用自定义规则</label>
                        <div className="sms-form-control">
                            <div className="plan-canvas-switch-row">
                                <label className="resend-switch">
                                    <input
                                        type="checkbox"
                                        checked={draft.enabled}
                                        onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
                                    />
                                    <span className="resend-switch-slider" />
                                </label>
                                <span className="plan-canvas-switch-tip">
                                    {draft.enabled ? '本计划按此组件配置执行' : '复用全局默认'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`plan-canvas-config-group${draft.enabled ? '' : ' disabled'}`}>
                        <div className="sms-form-item">
                            <label className="sms-form-label">校验能力</label>
                            <div className="sms-form-control">
                                <div className="plan-canvas-checks">
                                    <div className="plan-canvas-check-row">
                                        <label className="resend-cond-option">
                                            <input
                                                type="checkbox"
                                                checked={draft.checks.includes('blacklist')}
                                                disabled={!draft.enabled}
                                                onChange={() => toggleCheck('blacklist')}
                                            />
                                            <span className="resend-cond-option-text">黑名单校验</span>
                                        </label>
                                        <a
                                            href="#"
                                            className="plan-canvas-link"
                                            onClick={(e) => e.preventDefault()}
                                            title="暂未开放，后续再设计"
                                        >
                                            查看黑名单
                                        </a>
                                    </div>
                                    <label className="resend-cond-option">
                                        <input
                                            type="checkbox"
                                            checked={draft.checks.includes('timeWindow')}
                                            disabled={!draft.enabled}
                                            onChange={() => toggleCheck('timeWindow')}
                                        />
                                        <span className="resend-cond-option-text">发送时段校验</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {draft.checks.includes('timeWindow') && (
                            <>
                                <div className="sms-form-item plan-canvas-time-item">
                                    <label className="sms-form-label">允许发送时段</label>
                                    <div className="sms-form-control">
                                        {draft.windows.map((w, index) => (
                                            <div className="plan-canvas-time-row" key={index}>
                                                <input
                                                    type="time"
                                                    className="plan-canvas-time-input"
                                                    value={w.start}
                                                    disabled={!draft.enabled}
                                                    onChange={(e) => updateWindow(index, 'start', e.target.value)}
                                                />
                                                <span className="plan-canvas-time-sep">-</span>
                                                <input
                                                    type="time"
                                                    className="plan-canvas-time-input"
                                                    value={w.end}
                                                    disabled={!draft.enabled}
                                                    onChange={(e) => updateWindow(index, 'end', e.target.value)}
                                                />
                                                {draft.windows.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="plan-canvas-time-del"
                                                        title="删除该时段"
                                                        disabled={!draft.enabled}
                                                        onClick={() =>
                                                            setDraft((prev) => ({
                                                                ...prev,
                                                                windows: prev.windows.filter((_, i) => i !== index),
                                                            }))
                                                        }
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {draft.windows.length < 3 && (
                                            <button
                                                type="button"
                                                className="plan-canvas-time-add"
                                                disabled={!draft.enabled}
                                                onClick={() =>
                                                    setDraft((prev) => ({
                                                        ...prev,
                                                        windows: [...prev.windows, { start: '09:00', end: '18:00' }],
                                                    }))
                                                }
                                            >
                                                + 新增时段（最多 3 段）
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="sms-form-item">
                                    <label className="sms-form-label">非时段处理策略</label>
                                    <div className="sms-form-control">
                                        <label className="resend-cond-option">
                                            <input
                                                type="radio"
                                                name="precheck-strategy"
                                                checked={draft.strategy === 'wait'}
                                                disabled={!draft.enabled}
                                                onChange={() => setDraft((prev) => ({ ...prev, strategy: 'wait' }))}
                                            />
                                            <span className="resend-cond-option-text">等到下一允许时段再继续</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取 消
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary" onClick={() => onSave(draft)}>
                        保 存
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ================= 补发控制配置面板 ================= */

interface ResendControlModalProps {
    initial: ResendControlConfig;
    onClose: () => void;
    onSave: (config: ResendControlConfig) => void;
}

function ResendControlModal({ initial, onClose, onSave }: ResendControlModalProps) {
    const [draft, setDraft] = useState<ResendControlConfig>(() => ({
        enabled: initial.enabled,
        triggers: [...initial.triggers],
        maxWaitHours: initial.maxWaitHours,
        maxResend: initial.maxResend,
        interval: initial.interval,
    }));

    const toggleTrigger = (key: string) => {
        setDraft((prev) => {
            const has = prev.triggers.includes(key);
            const triggers = has ? prev.triggers.filter((t) => t !== key) : [...prev.triggers, key];
            return { ...prev, triggers };
        });
    };

    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal plan-canvas-config-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">补发控制</div>
                <div className="sms-modal-body">
                    <div className="sms-form-item">
                        <label className="sms-form-label">启用本计划自定义补发</label>
                        <div className="sms-form-control">
                            <div className="plan-canvas-switch-row">
                                <label className="resend-switch">
                                    <input
                                        type="checkbox"
                                        checked={draft.enabled}
                                        onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
                                    />
                                    <span className="resend-switch-slider" />
                                </label>
                                <span className="plan-canvas-switch-tip">
                                    {draft.enabled
                                        ? '开启后全局不再触发本计划的自动补发'
                                        : '跟随全局自动补发规则'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`plan-canvas-config-group${draft.enabled ? '' : ' disabled'}`}>
                        <div className="sms-form-item plan-canvas-time-item">
                            <label className="sms-form-label">触发条件</label>
                            <div className="sms-form-control">
                                <div className="plan-canvas-checks">
                                    <label className="resend-cond-option">
                                        <input
                                            type="checkbox"
                                            checked={draft.triggers.includes('submitFail')}
                                            disabled={!draft.enabled}
                                            onChange={() => toggleTrigger('submitFail')}
                                        />
                                        <span className="resend-cond-option-text">提交失败</span>
                                    </label>
                                    <div className="plan-canvas-check-row">
                                        <label className="resend-cond-option">
                                            <input
                                                type="checkbox"
                                                checked={draft.triggers.includes('receiptTimeout')}
                                                disabled={!draft.enabled}
                                                onChange={() => toggleTrigger('receiptTimeout')}
                                            />
                                            <span className="resend-cond-option-text">回执超时</span>
                                        </label>
                                        <span className="plan-canvas-inline-tip">最长等待</span>
                                        <select
                                            className="plan-canvas-inline-select"
                                            value={draft.maxWaitHours}
                                            disabled={!draft.enabled}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, maxWaitHours: e.target.value }))}
                                        >
                                            <option value="6">6</option>
                                            <option value="12">12</option>
                                            <option value="24">24</option>
                                            <option value="48">48</option>
                                        </select>
                                        <span className="plan-canvas-inline-tip">小时后无明确回执</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sms-form-item">
                            <label className="sms-form-label">最大补发次数</label>
                            <div className="sms-form-control">
                                <select
                                    className="sms-select plan-canvas-inline-select"
                                    value={draft.maxResend}
                                    disabled={!draft.enabled}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, maxResend: e.target.value }))}
                                >
                                    <option value="1">1 次</option>
                                    <option value="2">2 次</option>
                                    <option value="3">3 次</option>
                                    <option value="5">5 次</option>
                                </select>
                            </div>
                        </div>

                        <div className="sms-form-item">
                            <label className="sms-form-label">补发间隔</label>
                            <div className="sms-form-control">
                                <select
                                    className="sms-select plan-canvas-inline-select"
                                    value={draft.interval}
                                    disabled={!draft.enabled}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, interval: e.target.value }))}
                                >
                                    <option value="10">10 分钟</option>
                                    <option value="30">30 分钟</option>
                                    <option value="60">60 分钟</option>
                                    <option value="120">120 分钟</option>
                                </select>
                            </div>
                        </div>

                        <div className="sms-form-item plan-canvas-time-item">
                            <label className="sms-form-label">补发前校验</label>
                            <div className="sms-form-control">
                                <div className="plan-canvas-fixed-tip">
                                    必须重新经过前置校验（黑名单 + 发送时段），不提供绕过开关
                                </div>
                            </div>
                        </div>

                        <div className="sms-form-item plan-canvas-time-item">
                            <label className="sms-form-label">达到上限后</label>
                            <div className="sms-form-control">
                                <div className="plan-canvas-fixed-tip">流向结束节点</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取 消
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary" onClick={() => onSave(draft)}>
                        保 存
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ================= 画布 ================= */

interface OperationPlanCanvasProps {
    planName: string;
    onBack: () => void;
}

export default function OperationPlanCanvas({ planName, onBack }: OperationPlanCanvasProps) {
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [edges, setEdges] = useState<CanvasEdge[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [dragover, setDragover] = useState(false);
    const [savedTip, setSavedTip] = useState(false);
    const [linkPreview, setLinkPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    const savedTipTimer = useRef<number | null>(null);

    const areaRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{
        id: string;
        startX: number;
        startY: number;
        origX: number;
        origY: number;
        moved: boolean;
    } | null>(null);
    const linkDragRef = useRef<{ fromId: string; startX: number; startY: number } | null>(null);

    const editingNode = nodes.find((n) => n.id === editingId) ?? null;

    const toArea = (clientX: number, clientY: number) => {
        const rect = areaRef.current?.getBoundingClientRect();
        return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: 0, y: 0 };
    };

    const createNode = (def: NodeDef, x: number, y: number) => {
        const rect = areaRef.current?.getBoundingClientRect();
        const id = `${def.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const node: CanvasNode = {
            id,
            def,
            x: rect ? Math.max(8, Math.min(x, rect.width - NODE_W - 8)) : x,
            y: rect ? Math.max(8, Math.min(y, rect.height - NODE_H - 8)) : y,
            config:
                def.id === 'touch-precheck'
                    ? { ...DEFAULT_PRECHECK, windows: [{ start: '09:00', end: '18:00' }] }
                    : def.id === 'resend-control'
                      ? { ...DEFAULT_RESEND_CONTROL }
                      : null,
        };
        setNodes((prev) => [...prev, node]);
        setSelectedId(id);
    };

    const removeNode = (id: string) => {
        setNodes((prev) => prev.filter((n) => n.id !== id));
        setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
        setSelectedId(null);
        setEditingId(null);
    };

    const onNodePointerDown = (e: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => {
        if (e.button !== 0) return;
        e.preventDefault();
        dragRef.current = {
            id: node.id,
            startX: e.clientX,
            startY: e.clientY,
            origX: node.x,
            origY: node.y,
            moved: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        setSelectedId(node.id);
    };

    const onNodePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (Math.abs(dx) + Math.abs(dy) > 4) {
            drag.moved = true;
        }
        if (drag.moved) {
            setNodes((prev) => prev.map((n) => (n.id === drag.id ? { ...n, x: drag.origX + dx, y: drag.origY + dy } : n)));
        }
    };

    const onNodePointerUp = (e: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => {
        const drag = dragRef.current;
        dragRef.current = null;
        if (drag && !drag.moved && node.config) {
            setEditingId(node.id);
        }
    };

    const onPortPointerDown = (e: React.PointerEvent<HTMLSpanElement>, node: CanvasNode) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        linkDragRef.current = {
            fromId: node.id,
            startX: rect.left + rect.width / 2,
            startY: rect.top + rect.height / 2,
        };

        const onMove = (ev: PointerEvent) => {
            if (!linkDragRef.current) return;
            setLinkPreview({
                x1: linkDragRef.current.startX,
                y1: linkDragRef.current.startY,
                x2: ev.clientX,
                y2: ev.clientY,
            });
        };
        const onUp = (ev: PointerEvent) => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            const fromId = linkDragRef.current?.fromId;
            const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
            const targetId = el?.closest?.('[data-node-id]')?.getAttribute('data-node-id') ?? null;
            if (fromId && targetId && targetId !== fromId) {
                setEdges((prev) => [
                    ...prev,
                    { id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, from: fromId, to: targetId },
                ]);
            }
            setLinkPreview(null);
            linkDragRef.current = null;
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const onAreaDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragover(false);
        const label = e.dataTransfer.getData('application/x-plan-node') || e.dataTransfer.getData('text/plain');
        const def = ALL_NODES.find((n) => n.label === label);
        if (!def) return;
        const pos = toArea(e.clientX, e.clientY);
        createNode(def, pos.x - NODE_W / 2, pos.y - NODE_H / 2);
    };

    const previewStart = linkPreview ? toArea(linkPreview.x1, linkPreview.y1) : null;
    const previewEnd = linkPreview ? toArea(linkPreview.x2, linkPreview.y2) : null;

    return (
        <div className="plan-canvas">
            {/* 顶部工具栏 */}
            <div className="plan-canvas-top">
                <div className="plan-canvas-top-left">
                    <button type="button" className="sms-btn sms-btn-link plan-canvas-back" onClick={onBack}>
                        <ArrowLeft size={15} />
                        返回列表
                    </button>
                    <span className="plan-canvas-name">{planName}</span>
                    <button type="button" className="sms-btn sms-btn-icon plan-canvas-edit" title="编辑名称">
                        <Pencil size={14} />
                    </button>
                    <button type="button" className="sms-btn plan-canvas-tag">
                        <Plus size={13} />
                        添加标签
                    </button>
                </div>
                <div className="plan-canvas-top-right">
                    <span className="plan-canvas-trigger">
                        <Clock size={14} />
                        触发时间：
                        <select className="sms-select plan-canvas-trigger-select" defaultValue="">
                            <option value="">请选择</option>
                        </select>
                    </span>
                    <button type="button" className="sms-btn">
                        取 消
                    </button>
                    <button
                        type="button"
                        className="sms-btn plan-canvas-save"
                        onClick={() => {
                            setSavedTip(true);
                            if (savedTipTimer.current !== null) {
                                window.clearTimeout(savedTipTimer.current);
                            }
                            savedTipTimer.current = window.setTimeout(() => setSavedTip(false), 2600);
                        }}
                    >
                        保 存
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary plan-canvas-publish">
                        发 布
                    </button>
                </div>
            </div>

            {/* 画布主体：左侧节点面板 + 画布 */}
            <div className="plan-canvas-body">
                <aside className="plan-canvas-panel">
                    <div className="plan-canvas-panel-head">
                        <span>流程定制</span>
                        <ChevronDown size={14} />
                    </div>
                    {NODE_GROUPS.map((group) => (
                        <div className="plan-canvas-group" key={group.title}>
                            <div className="plan-canvas-group-title">
                                <span>{group.title}</span>
                                <ChevronDown size={12} />
                            </div>
                            <div className="plan-canvas-nodes">
                                {group.nodes.map((node) => {
                                    const Icon = node.icon;
                                    return (
                                        <div
                                            className="plan-canvas-node"
                                            key={node.id}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/x-plan-node', node.label);
                                                e.dataTransfer.setData('text/plain', node.label);
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            title="拖拽到画布"
                                        >
                                            <span
                                                className={`plan-canvas-node-icon${node.shape ? ` shape-${node.shape}` : ''}`}
                                                style={{ background: node.color }}
                                            >
                                                {node.text ? (
                                                    node.text
                                                ) : Icon ? (
                                                    <Icon size={20} color="#ffffff" strokeWidth={1.8} />
                                                ) : null}
                                            </span>
                                            <span className="plan-canvas-node-label">{node.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </aside>

                <div
                    className={`plan-canvas-area${dragover ? ' dragover' : ''}`}
                    ref={areaRef}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        setDragover(true);
                    }}
                    onDragLeave={(e) => {
                        if (!areaRef.current?.contains(e.relatedTarget as Node)) {
                            setDragover(false);
                        }
                    }}
                    onDrop={onAreaDrop}
                >
                    {dragover && <div className="plan-canvas-drop-hint">松开鼠标，将组件放置到画布</div>}

                    <svg className="plan-canvas-edges">
                        <defs>
                            <marker id="plan-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                                <path d="M0,0 L8,4 L0,8 Z" fill="#98a1b8" />
                            </marker>
                        </defs>
                        {edges.map((edge) => {
                            const from = nodes.find((n) => n.id === edge.from);
                            const to = nodes.find((n) => n.id === edge.to);
                            if (!from || !to) return null;
                            const x1 = from.x + NODE_W;
                            const y1 = from.y + NODE_H / 2;
                            const x2 = to.x;
                            const y2 = to.y + NODE_H / 2;
                            const mx = (x1 + x2) / 2;
                            return (
                                <path
                                    key={edge.id}
                                    d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                                    fill="none"
                                    stroke="#98a1b8"
                                    strokeWidth="1.6"
                                    markerEnd="url(#plan-arrow)"
                                />
                            );
                        })}
                        {previewStart && previewEnd && (
                            <line
                                x1={previewStart.x}
                                y1={previewStart.y}
                                x2={previewEnd.x}
                                y2={previewEnd.y}
                                stroke="#7c7f8f"
                                strokeWidth="1.6"
                                strokeDasharray="5 4"
                            />
                        )}
                    </svg>

                    {nodes.map((node) => {
                        const Icon = node.def.icon;
                        const selected = selectedId === node.id;
                        return (
                            <div
                                key={node.id}
                                data-node-id={node.id}
                                className={`plan-canvas-item${selected ? ' selected' : ''}`}
                                style={{ left: node.x, top: node.y }}
                                onPointerDown={(e) => onNodePointerDown(e, node)}
                                onPointerMove={onNodePointerMove}
                                onPointerUp={(e) => onNodePointerUp(e, node)}
                            >
                                <span
                                    className={`plan-canvas-item-icon${node.def.shape ? ` shape-${node.def.shape}` : ''}`}
                                    style={{ background: node.def.color }}
                                >
                                    {node.def.text ? (
                                        node.def.text
                                    ) : Icon ? (
                                        <Icon size={22} color="#ffffff" strokeWidth={1.8} />
                                    ) : null}
                                </span>
                                <span className="plan-canvas-item-label">{node.def.label}</span>
                                {node.config ? (
                                    node.def.id === 'touch-precheck' ? (
                                        <PrecheckSummary config={node.config as PrecheckConfig} />
                                    ) : (
                                        <ResendControlSummary config={node.config as ResendControlConfig} />
                                    )
                                ) : null}
                                {selected && (
                                    <button
                                        type="button"
                                        className="plan-canvas-item-del"
                                        title="删除节点"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeNode(node.id);
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                                <span
                                    className="plan-canvas-port plan-canvas-port-right"
                                    title="拖拽连线"
                                    onPointerDown={(e) => onPortPointerDown(e, node)}
                                />
                                <span
                                    className="plan-canvas-port plan-canvas-port-left"
                                    title="拖拽连线"
                                    onPointerDown={(e) => onPortPointerDown(e, node)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {savedTip && <div className="plan-canvas-toast">已保存，可继续编辑</div>}

            {editingNode?.def.id === 'touch-precheck' && (
                <PrecheckConfigModal
                    key={editingNode.id}
                    initial={editingNode.config as PrecheckConfig}
                    onClose={() => setEditingId(null)}
                    onSave={(config) => {
                        setNodes((prev) => prev.map((n) => (n.id === editingNode.id ? { ...n, config } : n)));
                        setEditingId(null);
                    }}
                />
            )}
            {editingNode?.def.id === 'resend-control' && (
                <ResendControlModal
                    key={editingNode.id}
                    initial={editingNode.config as ResendControlConfig}
                    onClose={() => setEditingId(null)}
                    onSave={(config) => {
                        setNodes((prev) => prev.map((n) => (n.id === editingNode.id ? { ...n, config } : n)));
                        setEditingId(null);
                    }}
                />
            )}
        </div>
    );
}
