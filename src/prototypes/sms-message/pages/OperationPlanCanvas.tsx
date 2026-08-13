/**
 * 运营计划画布配置页：操作列「详情」进入
 * 高精度还原 UAT 流程定制画布：顶部工具栏 + 左侧节点面板 + 可拖拽画布
 * 支持：左侧组件拖入画布、画布内拖动移动、节点间拖线连接、选中删除
 * 判断节点支持配置为前置校验 / 补发控制，保存后展示配置摘要
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
            { id: 'judge', label: '判断', color: '#1890ff', shape: 'diamond', icon: Diamond },
            { id: 'end', label: '结束节点', color: '#98a1b8', shape: 'circle', text: 'END' },
            { id: 'delay', label: '延时器', color: '#98a1b8', shape: 'circle', icon: ClockIcon },
            { id: 'ab-test', label: 'A/B测试', color: '#98a1b8', icon: GitBranch },
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
    checks: string[];
    windows: { start: string; end: string }[];
    strategy: 'wait';
}

const DEFAULT_PRECHECK: PrecheckConfig = {
    checks: [],
    windows: [{ start: '09:00', end: '18:00' }],
    strategy: 'wait',
};

/** 补发控制配置 */
interface ResendControlConfig {
    triggers: string[];
    maxWaitHours: string;
    maxResend: string;
    interval: string;
}

const DEFAULT_RESEND_CONTROL: ResendControlConfig = {
    triggers: [],
    maxWaitHours: '24',
    maxResend: '3',
    interval: '30',
};

/** 判断节点配置：事件类型下拉，支持复用为前置校验 / 补发控制 */
interface JudgeConfig {
    gateWayType: 'EVENT' | 'BUSINESS' | 'GROUP' | 'PRECHECK' | 'RESEND_CONTROL';
    precheck: PrecheckConfig;
    resend: ResendControlConfig;
    eventChannel: string;
    recentDay: string;
}

const DEFAULT_JUDGE: JudgeConfig = {
    gateWayType: 'EVENT',
    precheck: { checks: [], windows: [{ start: '09:00', end: '18:00' }], strategy: 'wait' },
    resend: { triggers: [], maxWaitHours: '24', maxResend: '3', interval: '30' },
    eventChannel: '短信',
    recentDay: '30',
};

interface CanvasNode {
    id: string;
    def: NodeDef;
    x: number;
    y: number;
    config: PrecheckConfig | ResendControlConfig | JudgeConfig | null;
}

type PortDir = 'left' | 'right' | 'top' | 'bottom';

interface CanvasEdge {
    id: string;
    from: string;
    to: string;
    fromPort: PortDir;
    toPort: PortDir;
}

/* ================= 判断节点配置面板 ================= */

function JudgeSummary({ config }: { config: JudgeConfig }) {
    if (config.gateWayType === 'PRECHECK') {
        const p = config.precheck;
        const parts: string[] = [];
        if (p.checks.includes('blacklist')) {
            parts.push('黑名单');
        }
        if (p.checks.includes('timeWindow')) {
            parts.push(`时段 ${p.windows.map((w) => `${w.start}-${w.end}`).join('、')}`);
        }
        return <span className="plan-canvas-item-summary">前置校验 · {parts.length ? parts.join(' · ') : '未配置'}</span>;
    }
    if (config.gateWayType === 'RESEND_CONTROL') {
        const r = config.resend;
        const parts: string[] = [];
        if (r.triggers.includes('submitFail')) {
            parts.push('提交失败');
        }
        if (r.triggers.includes('receiptTimeout')) {
            parts.push(`回执超时${r.maxWaitHours}h`);
        }
        parts.push(`最多${r.maxResend}次`);
        return <span className="plan-canvas-item-summary">补发控制 · {parts.join(' · ')}</span>;
    }
    const names: Record<string, string> = {
        EVENT: '事件发生',
        BUSINESS: '业务属性',
        GROUP: '群组人数',
    };
    return <span className="plan-canvas-item-summary">判断 · {names[config.gateWayType] ?? config.gateWayType}</span>;
}

interface JudgeModalProps {
    initial: JudgeConfig;
    onClose: () => void;
    onSave: (config: JudgeConfig) => void;
}

function JudgeConfigModal({ initial, onClose, onSave }: JudgeModalProps) {
    const [draft, setDraft] = useState<JudgeConfig>(() => ({
        gateWayType: initial.gateWayType,
        precheck: {
            ...initial.precheck,
            checks: [...initial.precheck.checks],
            windows: initial.precheck.windows.map((w) => ({ ...w })),
        },
        resend: { ...initial.resend, triggers: [...initial.resend.triggers] },
        eventChannel: initial.eventChannel,
        recentDay: initial.recentDay,
    }));

    const togglePrecheckCheck = (key: string) => {
        setDraft((prev) => {
            const p = prev.precheck;
            const has = p.checks.includes(key);
            return { ...prev, precheck: { ...p, checks: has ? p.checks.filter((c) => c !== key) : [...p.checks, key] } };
        });
    };

    const updatePrecheckWindow = (index: number, key: 'start' | 'end', value: string) => {
        setDraft((prev) => ({
            ...prev,
            precheck: {
                ...prev.precheck,
                windows: prev.precheck.windows.map((w, i) => (i === index ? { ...w, [key]: value } : w)),
            },
        }));
    };

    const toggleResendTrigger = (key: string) => {
        setDraft((prev) => {
            const r = prev.resend;
            const has = r.triggers.includes(key);
            return { ...prev, resend: { ...r, triggers: has ? r.triggers.filter((t) => t !== key) : [...r.triggers, key] } };
        });
    };

    const updateResend = (patch: Partial<ResendControlConfig>) => {
        setDraft((prev) => ({ ...prev, resend: { ...prev.resend, ...patch } }));
    };

    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal plan-canvas-config-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">判断</div>
                <div className="sms-modal-body">
                    <div className="plan-canvas-config-group">
                        <div className="sms-form-item">
                            <label className="sms-form-label">事件类型</label>
                            <div className="sms-form-control">
                                <select
                                    className="sms-select"
                                    value={draft.gateWayType}
                                    onChange={(e) =>
                                        setDraft((prev) => ({ ...prev, gateWayType: e.target.value as JudgeConfig['gateWayType'] }))
                                    }
                                >
                                    <option value="EVENT">事件发生</option>
                                    <option value="BUSINESS">业务属性</option>
                                    <option value="GROUP">群组人数</option>
                                    <option value="PRECHECK">触达前置校验</option>
                                    <option value="RESEND_CONTROL">补发控制</option>
                                </select>
                            </div>
                        </div>

                        {draft.gateWayType === 'EVENT' && (
                            <>
                                <div className="sms-form-item">
                                    <label className="sms-form-label">事件</label>
                                    <div className="sms-form-control">
                                        <select
                                            className="sms-select"
                                            value={draft.eventChannel}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, eventChannel: e.target.value }))}
                                        >
                                            <option>短信</option>
                                            <option>WhatsApp</option>
                                            <option>电销</option>
                                            <option>智能语音</option>
                                            <option>应用推送</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="sms-form-item">
                                    <label className="sms-form-label">过去</label>
                                    <div className="sms-form-control">
                                        <div className="plan-canvas-check-row">
                                            <input
                                                type="text"
                                                className="sms-input plan-canvas-inline-select"
                                                value={draft.recentDay}
                                                onChange={(e) => setDraft((prev) => ({ ...prev, recentDay: e.target.value }))}
                                            />
                                            <span className="plan-canvas-inline-tip">天内发生营销触达</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {draft.gateWayType === 'BUSINESS' && (
                            <div className="plan-canvas-fixed-tip">按客户业务属性配置判断条件（演示占位，沿用现有实现）</div>
                        )}

                        {draft.gateWayType === 'GROUP' && (
                            <div className="plan-canvas-fixed-tip">按群组人数阈值判断（演示占位，沿用现有实现）</div>
                        )}

                        {draft.gateWayType === 'PRECHECK' && (
                            <>
                                <div className="sms-form-item">
                                    <label className="sms-form-label">校验能力</label>
                                    <div className="sms-form-control">
                                        <div className="plan-canvas-checks">
                                            <div className="plan-canvas-check-row">
                                                <label className="resend-cond-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={draft.precheck.checks.includes('blacklist')}
                                                        onChange={() => togglePrecheckCheck('blacklist')}
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
                                                    checked={draft.precheck.checks.includes('timeWindow')}
                                                    onChange={() => togglePrecheckCheck('timeWindow')}
                                                />
                                                <span className="resend-cond-option-text">发送时段校验</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {draft.precheck.checks.includes('timeWindow') && (
                                    <>
                                        <div className="sms-form-item plan-canvas-time-item">
                                            <label className="sms-form-label">允许发送时段</label>
                                            <div className="sms-form-control">
                                                {draft.precheck.windows.map((w, index) => (
                                                    <div className="plan-canvas-time-row" key={index}>
                                                        <input
                                                            type="time"
                                                            className="plan-canvas-time-input"
                                                            value={w.start}
                                                            onChange={(e) => updatePrecheckWindow(index, 'start', e.target.value)}
                                                        />
                                                        <span className="plan-canvas-time-sep">-</span>
                                                        <input
                                                            type="time"
                                                            className="plan-canvas-time-input"
                                                            value={w.end}
                                                            onChange={(e) => updatePrecheckWindow(index, 'end', e.target.value)}
                                                        />
                                                        {draft.precheck.windows.length > 1 && (
                                                            <button
                                                                type="button"
                                                                className="plan-canvas-time-del"
                                                                title="删除该时段"
                                                                onClick={() =>
                                                                    setDraft((prev) => ({
                                                                        ...prev,
                                                                        precheck: {
                                                                            ...prev.precheck,
                                                                            windows: prev.precheck.windows.filter((_, i) => i !== index),
                                                                        },
                                                                    }))
                                                                }
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {draft.precheck.windows.length < 3 && (
                                                    <button
                                                        type="button"
                                                        className="plan-canvas-time-add"
                                                        onClick={() =>
                                                            setDraft((prev) => ({
                                                                ...prev,
                                                                precheck: {
                                                                    ...prev.precheck,
                                                                    windows: [...prev.precheck.windows, { start: '09:00', end: '18:00' }],
                                                                },
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
                                                        name="judge-precheck-strategy"
                                                        checked={draft.precheck.strategy === 'wait'}
                                                        onChange={() =>
                                                            setDraft((prev) => ({
                                                                ...prev,
                                                                precheck: { ...prev.precheck, strategy: 'wait' },
                                                            }))
                                                        }
                                                    />
                                                    <span className="resend-cond-option-text">等到下一允许时段再继续</span>
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {draft.gateWayType === 'RESEND_CONTROL' && (
                            <>
                                <div className="sms-form-item plan-canvas-time-item">
                                    <label className="sms-form-label">触发条件</label>
                                    <div className="sms-form-control">
                                        <div className="plan-canvas-checks">
                                            <label className="resend-cond-option">
                                                <input
                                                    type="checkbox"
                                                    checked={draft.resend.triggers.includes('submitFail')}
                                                    onChange={() => toggleResendTrigger('submitFail')}
                                                />
                                                <span className="resend-cond-option-text">提交失败</span>
                                            </label>
                                            <div className="plan-canvas-check-row">
                                                <label className="resend-cond-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={draft.resend.triggers.includes('receiptTimeout')}
                                                        onChange={() => toggleResendTrigger('receiptTimeout')}
                                                    />
                                                    <span className="resend-cond-option-text">回执超时</span>
                                                </label>
                                                <span className="plan-canvas-inline-tip">最长等待</span>
                                                <select
                                                    className="plan-canvas-inline-select"
                                                    value={draft.resend.maxWaitHours}
                                                    onChange={(e) => updateResend({ maxWaitHours: e.target.value })}
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
                                            value={draft.resend.maxResend}
                                            onChange={(e) => updateResend({ maxResend: e.target.value })}
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
                                            value={draft.resend.interval}
                                            onChange={(e) => updateResend({ interval: e.target.value })}
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

/* ================= 画布 ================= */

interface OperationPlanCanvasProps {
    planName: string;
    onBack: () => void;
    onSaved?: (name: string) => void;
}

export default function OperationPlanCanvas({ planName, onBack, onSaved }: OperationPlanCanvasProps) {
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [edges, setEdges] = useState<CanvasEdge[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState(planName);
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
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
    const linkDragRef = useRef<{ fromId: string; fromPort: PortDir; startX: number; startY: number } | null>(null);

    const editingNode = nodes.find((n) => n.id === editingId) ?? null;

    const portPoint = (node: CanvasNode, port: PortDir) => {
        switch (port) {
            case 'left':
                return { x: node.x, y: node.y + NODE_H / 2 };
            case 'right':
                return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
            case 'top':
                return { x: node.x + NODE_W / 2, y: node.y };
            case 'bottom':
                return { x: node.x + NODE_W / 2, y: node.y + NODE_H };
        }
    };

    const edgePath = (from: CanvasNode, fromPort: PortDir, to: CanvasNode, toPort: PortDir) => {
        const p1 = portPoint(from, fromPort);
        const p2 = portPoint(to, toPort);
        const dx = Math.abs(p2.x - p1.x);
        const dy = Math.abs(p2.y - p1.y);
        const c1x = p1.x + (fromPort === 'right' ? dx / 2 : fromPort === 'left' ? -dx / 2 : 0);
        const c1y = p1.y + (fromPort === 'bottom' ? dy / 2 : fromPort === 'top' ? -dy / 2 : 0);
        const c2x = p2.x + (toPort === 'left' ? -dx / 2 : toPort === 'right' ? dx / 2 : 0);
        const c2y = p2.y + (toPort === 'top' ? -dy / 2 : toPort === 'bottom' ? dy / 2 : 0);
        return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    };

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
            config: def.id === 'judge' ? { ...DEFAULT_JUDGE } : null,
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

    const onPortPointerDown = (e: React.PointerEvent<HTMLSpanElement>, node: CanvasNode, port: PortDir) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        linkDragRef.current = {
            fromId: node.id,
            fromPort: port,
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
            const fromPort = linkDragRef.current?.fromPort ?? 'right';
            const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
            const targetEl = el?.closest?.('[data-node-id]') as HTMLElement | null;
            const targetId = targetEl?.getAttribute('data-node-id') ?? null;
            if (fromId && targetId && targetEl && targetId !== fromId) {
                const r = targetEl.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const candidates: { port: PortDir; dist: number }[] = [
                    { port: 'left', dist: Math.hypot(ev.clientX - r.left, ev.clientY - cy) },
                    { port: 'right', dist: Math.hypot(ev.clientX - r.right, ev.clientY - cy) },
                    { port: 'top', dist: Math.hypot(ev.clientX - cx, ev.clientY - r.top) },
                    { port: 'bottom', dist: Math.hypot(ev.clientX - cx, ev.clientY - r.bottom) },
                ];
                const toPort = candidates.reduce((best, c) => (c.dist < best.dist ? c : best)).port;
                setEdges((prev) => [
                    ...prev,
                    {
                        id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        from: fromId,
                        to: targetId,
                        fromPort,
                        toPort,
                    },
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
                    {editingName ? (
                        <input
                            className="plan-canvas-name-input"
                            value={nameDraft}
                            autoFocus
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const trimmed = nameDraft.trim();
                                    if (trimmed) {
                                        setName(trimmed);
                                        setEditingName(false);
                                    }
                                } else if (e.key === 'Escape') {
                                    setEditingName(false);
                                }
                            }}
                            onBlur={() => {
                                const trimmed = nameDraft.trim();
                                if (trimmed) {
                                    setName(trimmed);
                                }
                                setEditingName(false);
                            }}
                        />
                    ) : (
                        <span className="plan-canvas-name">{name}</span>
                    )}
                    <button
                        type="button"
                        className="sms-btn sms-btn-icon plan-canvas-edit"
                        title="编辑名称"
                        onClick={() => {
                            setNameDraft(name);
                            setEditingName(true);
                        }}
                    >
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
                            onSaved?.(name);
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
                            return (
                                <path
                                    key={edge.id}
                                    d={edgePath(from, edge.fromPort, to, edge.toPort)}
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
                                    node.def.id === 'judge' ? (
                                        <JudgeSummary config={node.config as JudgeConfig} />
                                    ) : null
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
                                    onPointerDown={(e) => onPortPointerDown(e, node, 'right')}
                                />
                                <span
                                    className="plan-canvas-port plan-canvas-port-left"
                                    title="拖拽连线"
                                    onPointerDown={(e) => onPortPointerDown(e, node, 'left')}
                                />
                                <span
                                    className="plan-canvas-port plan-canvas-port-top"
                                    title="拖拽连线"
                                    onPointerDown={(e) => onPortPointerDown(e, node, 'top')}
                                />
                                <span
                                    className="plan-canvas-port plan-canvas-port-bottom"
                                    title="拖拽连线"
                                    onPointerDown={(e) => onPortPointerDown(e, node, 'bottom')}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {savedTip && <div className="plan-canvas-toast">已保存，可继续编辑</div>}

            {editingNode?.def.id === 'judge' && (
                <JudgeConfigModal
                    key={editingNode.id}
                    initial={editingNode.config as JudgeConfig}
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
