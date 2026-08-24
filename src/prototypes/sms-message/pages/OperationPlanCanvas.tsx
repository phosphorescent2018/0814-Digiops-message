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
            { id: 'judge', label: '判断', color: '#1890ff', shape: 'diamond', icon: Diamond },
            { id: 'resend-control', label: '补发控制', color: '#fa8c16', icon: RefreshCw },
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
    windows: [],
    strategy: 'wait',
};

/** 补发控制配置 */
interface ResendControlConfig {
    triggers: string[];
    checks: string[];
    maxResend: string;
    interval: string;
    window: { start: string; end: string } | null;
}

const DEFAULT_RESEND_CONTROL: ResendControlConfig = {
    triggers: [],
    checks: [],
    maxResend: '',
    interval: '',
    window: null,
};

/** 判断节点配置：事件类型下拉，支持复用为前置校验 */
interface JudgeConfig {
    gateWayType: 'EVENT' | 'BUSINESS' | 'GROUP' | 'PRECHECK';
    precheck: PrecheckConfig;
    eventChannel: string;
    recentDay: string;
}

const DEFAULT_JUDGE: JudgeConfig = {
    gateWayType: 'EVENT',
    precheck: { checks: [], windows: [], strategy: 'wait' },
    eventChannel: '短信',
    recentDay: '30',
};

/** 判断节点类型展示名：选了什么就展示什么 */
const JUDGE_TYPE_NAMES: Record<JudgeConfig['gateWayType'], string> = {
    EVENT: '事件发生',
    BUSINESS: '业务属性',
    GROUP: '群组人数',
    PRECHECK: '前置校验',
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
    /** 网关分支语义：第一条 YES（对勾），第二条 NO（叉子） */
    expect?: 'YES' | 'NO';
}

/** 网关类节点：出线自动带对勾/叉子分支标签 */
const BRANCH_NODE_IDS = ['judge', 'action-judge', 'group-filter'];

/* ================= 默认示例画布（完整链路） ================= */

const PLAN_CANVAS_STORAGE_KEY = 'axhub-plan-canvas:default';

const findNodeDef = (id: string): NodeDef => {
    const def = ALL_NODES.find((n) => n.id === id);
    if (!def) {
        throw new Error(`Unknown node def: ${id}`);
    }
    return def;
};

/** 示例链路：客户群组 → 前置校验判断 → 短信 → 补发控制 → 结束；黑名单分支 → 结束 */
const DEFAULT_PLAN_NODES: CanvasNode[] = [
    { id: 'demo-customer-group', def: findNodeDef('customer-group'), x: 30, y: 180, config: null },
    {
        id: 'demo-judge',
        def: findNodeDef('judge'),
        x: 200,
        y: 168,
        config: {
            gateWayType: 'PRECHECK',
            precheck: {
                checks: ['blacklist', 'timeWindow'],
                windows: [{ start: '09:00', end: '18:00' }],
                strategy: 'wait',
            },
            eventChannel: '短信',
            recentDay: '30',
        },
    },
    { id: 'demo-sms', def: findNodeDef('sms'), x: 370, y: 180, config: null },
    {
        id: 'demo-resend',
        def: findNodeDef('resend-control'),
        x: 540,
        y: 180,
        config: {
            triggers: ['submitFail', 'receiptTimeout'],
            checks: ['blacklist', 'timeWindow'],
            maxResend: '3',
            interval: '30',
            window: { start: '09:00', end: '18:00' },
        },
    },
    { id: 'demo-end-main', def: findNodeDef('end'), x: 710, y: 180, config: null },
    { id: 'demo-end-black', def: findNodeDef('end'), x: 248, y: 372, config: null },
];

const DEFAULT_PLAN_EDGES: CanvasEdge[] = [
    { id: 'demo-edge-1', from: 'demo-customer-group', to: 'demo-judge', fromPort: 'right', toPort: 'left' },
    { id: 'demo-edge-2', from: 'demo-judge', to: 'demo-sms', fromPort: 'right', toPort: 'left', expect: 'YES' },
    { id: 'demo-edge-3', from: 'demo-judge', to: 'demo-end-black', fromPort: 'bottom', toPort: 'top', expect: 'NO' },
    { id: 'demo-edge-4', from: 'demo-sms', to: 'demo-resend', fromPort: 'right', toPort: 'left' },
    { id: 'demo-edge-5', from: 'demo-resend', to: 'demo-end-main', fromPort: 'right', toPort: 'left' },
];

interface PersistedCanvas {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

/** 画布数据持久化：节点只存 defId，读回时映射回节点定义（图标组件不能 JSON 序列化） */
function persistCanvas(nodes: CanvasNode[], edges: CanvasEdge[]) {
    try {
        localStorage.setItem(
            PLAN_CANVAS_STORAGE_KEY,
            JSON.stringify({
                nodes: nodes.map((n) => ({ id: n.id, defId: n.def.id, x: n.x, y: n.y, config: n.config })),
                edges,
            }),
        );
    } catch {
        // 隐私模式等场景下存储失败时忽略，画布仍可正常编辑
    }
}

function loadPersistedCanvas(): PersistedCanvas | null {
    try {
        const raw = localStorage.getItem(PLAN_CANVAS_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as {
            nodes?: Array<{ id: string; defId: string; x: number; y: number; config: CanvasNode['config'] }>;
            edges?: CanvasEdge[];
        };
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
        const nodes: CanvasNode[] = [];
        for (const item of parsed.nodes) {
            const def = ALL_NODES.find((n) => n.id === item?.defId);
            if (!def || typeof item?.x !== 'number' || typeof item?.y !== 'number') continue;
            let config = item.config ?? null;
            if (config && def.id === 'resend-control') {
                const resendConfig = config as Partial<ResendControlConfig>;
                config = {
                    triggers: Array.isArray(resendConfig.triggers) ? resendConfig.triggers : [],
                    checks: Array.isArray(resendConfig.checks) ? resendConfig.checks : [],
                    maxResend: resendConfig.maxResend ?? '',
                    interval: resendConfig.interval ?? '',
                    window: resendConfig.window ?? null,
                };
            }
            nodes.push({ id: String(item.id), def, x: item.x, y: item.y, config });
        }
        return { nodes, edges: parsed.edges };
    } catch {
        return null;
    }
}

/* ================= 判断节点配置面板 ================= */

interface JudgeModalProps {
    initial: JudgeConfig;
    onClose: () => void;
    onSave: (config: JudgeConfig) => void;
    onOpenBlacklist?: () => void;
}

function JudgeConfigModal({ initial, onClose, onSave, onOpenBlacklist }: JudgeModalProps) {
    const [draft, setDraft] = useState<JudgeConfig>(() => ({
        gateWayType: initial.gateWayType,
        precheck: {
            ...initial.precheck,
            checks: [...initial.precheck.checks],
            windows: initial.precheck.windows.map((w) => ({ ...w })),
        },
        eventChannel: initial.eventChannel,
        recentDay: initial.recentDay,
    }));
    const [timeError, setTimeError] = useState<string | null>(null);

    /** 两个时段是否重合（端点相接不算重合，如 09:00-12:00 与 12:00-14:00 允许） */
    const timeOverlap = (a: { start: string; end: string }, b: { start: string; end: string }) =>
        a.start < b.end && b.start < a.end;

    const hasWindowConflict = (windows: { start: string; end: string }[], target: { start: string; end: string }, index: number) =>
        windows.some((w, i) => i !== index && timeOverlap(w, target));

    /** 新增时段不预填，由用户自行录入 */
    const nextWindowCandidate = () => ({ start: '', end: '' });

    const togglePrecheckCheck = (key: string) => {
        setDraft((prev) => {
            const p = prev.precheck;
            const has = p.checks.includes(key);
            return { ...prev, precheck: { ...p, checks: has ? p.checks.filter((c) => c !== key) : [...p.checks, key] } };
        });
    };

    const updatePrecheckWindow = (index: number, key: 'start' | 'end', value: string) => {
        const nextWindows = draft.precheck.windows.map((w, i) => (i === index ? { ...w, [key]: value } : w));
        if (hasWindowConflict(nextWindows, nextWindows[index], index)) {
            setTimeError('时段存在重合，请调整后再保存');
            return;
        }
        setTimeError(null);
        setDraft((prev) => ({
            ...prev,
            precheck: {
                ...prev.precheck,
                windows: nextWindows,
            },
        }));
    };

    const timeWindowSelected =
        draft.gateWayType === 'PRECHECK' && draft.precheck.checks.includes('timeWindow');
    const checksMissing = draft.gateWayType === 'PRECHECK' && draft.precheck.checks.length === 0;
    const timeMissing =
        timeWindowSelected &&
        (draft.precheck.windows.length === 0 ||
            draft.precheck.windows.some((w) => !w.start || !w.end));
    const saveDisabled =
        draft.gateWayType === 'PRECHECK' &&
        (checksMissing || timeMissing || (timeWindowSelected && timeError !== null));

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
                                    <option value="PRECHECK">前置校验</option>
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
                                    <label className="sms-form-label">
                                        <span className="resend-required">*</span>校验项
                                    </label>
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
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onOpenBlacklist?.();
                                                    }}
                                                    title="前往短信黑名单页面"
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
                                        {checksMissing && (
                                            <div className="plan-canvas-time-error">请至少选择一个校验项</div>
                                        )}
                                    </div>
                                </div>

                                {draft.precheck.checks.includes('timeWindow') && (
                                    <>
                                        <div className="sms-form-item plan-canvas-time-item">
                                            <label className="sms-form-label">
                                                <span className="resend-required">*</span>允许发送时段
                                            </label>
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
                                                        {draft.precheck.windows.length > 0 && (
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
                                                {timeError && <div className="plan-canvas-time-error">{timeError}</div>}
                                                {timeMissing && !timeError && (
                                                    <div className="plan-canvas-time-error">请完整填写允许发送时段</div>
                                                )}
                                                {draft.precheck.windows.length < 3 && (
                                                    <button
                                                        type="button"
                                                        className="plan-canvas-time-add"
                                                        onClick={() => {
                                                            const candidate = nextWindowCandidate();
                                                            if (hasWindowConflict(draft.precheck.windows, candidate, -1)) {
                                                                setTimeError('新增时段与已有时段重合，请先调整已有时段');
                                                                return;
                                                            }
                                                            setTimeError(null);
                                                            setDraft((prev) => ({
                                                                ...prev,
                                                                precheck: {
                                                                    ...prev.precheck,
                                                                    windows: [...prev.precheck.windows, candidate],
                                                                },
                                                            }));
                                                        }}
                                                    >
                                                        + 新增时段（最多 3 段）
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="plan-canvas-non-slot-tip">
                                            <ClockIcon size={14} className="plan-canvas-non-slot-icon" />
                                            <span>非允许时段内发送将自动挂起，等到下一允许时段再继续</span>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                    </div>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取 消
                    </button>
                    <button
                        type="button"
                        className="sms-btn sms-btn-primary"
                        disabled={saveDisabled}
                        onClick={() => onSave(draft)}
                    >
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

function ResendControlConfigModal({ initial, onClose, onSave }: ResendControlModalProps) {
    const [draft, setDraft] = useState<ResendControlConfig>(() => ({
        triggers: [...initial.triggers],
        checks: [...(initial.checks ?? [])],
        maxResend: initial.maxResend,
        interval: initial.interval,
        window:
            initial.checks?.includes('timeWindow') && initial.window
                ? { ...initial.window }
                : null,
    }));

    const toggleTrigger = (key: string) => {
        setDraft((prev) => {
            const has = prev.triggers.includes(key);
            return { ...prev, triggers: has ? prev.triggers.filter((t) => t !== key) : [...prev.triggers, key] };
        });
    };

    const toggleCheck = (key: string) => {
        setDraft((prev) => {
            const has = prev.checks.includes(key);
            const checks = has ? prev.checks.filter((c) => c !== key) : [...prev.checks, key];
            return {
                ...prev,
                checks,
                window: checks.includes('timeWindow') ? prev.window : null,
            };
        });
    };

    const triggersMissing = draft.triggers.length === 0;
    const checksMissing = draft.checks.length === 0;
    const timeWindowSelected = draft.checks.includes('timeWindow');
    const windowMissing =
        timeWindowSelected && (!draft.window || !draft.window.start || !draft.window.end);
    const resendSaveDisabled =
        triggersMissing || !draft.maxResend || !draft.interval || windowMissing;

    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal plan-canvas-config-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">补发控制</div>
                <div className="sms-modal-body">
                    <div className="plan-canvas-config-group">
                        <div className="plan-canvas-non-slot-tip plan-canvas-non-slot-tip-gap">
                            <ClockIcon size={14} className="plan-canvas-non-slot-icon" />
                            <span>
                                流程将在此停留，直到补发完成（补发成功或达到上限）后继续
                            </span>
                        </div>

                        <div className="sms-form-item plan-canvas-time-item">
                            <label className="sms-form-label">
                                <span className="resend-required">*</span>触发条件
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
                                                checked={draft.triggers.includes('submitFail')}
                                                onChange={() => toggleTrigger('submitFail')}
                                            />
                                            <span className="resend-cond-option-text">发送失败</span>
                                        </label>
                                    </div>
                                    <div className="resend-cond-group">
                                        <div className="resend-cond-group-head">
                                            <span className="resend-cond-group-title">回执判定后</span>
                                            <span className="resend-cond-group-desc">24 小时内无明确回执</span>
                                        </div>
                                        <div className="resend-cond-options">
                                            <label className="resend-cond-option">
                                                <input
                                                    type="checkbox"
                                                    checked={draft.triggers.includes('receiptTimeout')}
                                                    onChange={() => toggleTrigger('receiptTimeout')}
                                                />
                                                <span className="resend-cond-option-text">回执超时</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {triggersMissing && (
                                    <div className="plan-canvas-time-error">请至少选择一个触发条件</div>
                                )}
                            </div>
                        </div>

                        <div className="sms-form-item">
                            <label className="sms-form-label">
                                <span className="resend-required">*</span>最大补发次数
                            </label>
                            <div className="sms-form-control">
                                <select
                                    className="sms-select plan-canvas-inline-select"
                                    value={draft.maxResend}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, maxResend: e.target.value }))}
                                >
                                    <option value="">请选择</option>
                                    <option value="1">1 次</option>
                                    <option value="2">2 次</option>
                                    <option value="3">3 次</option>
                                    <option value="5">5 次</option>
                                </select>
                                {!draft.maxResend && (
                                    <div className="plan-canvas-time-error">请选择最大补发次数</div>
                                )}
                            </div>
                        </div>

                        <div className="sms-form-item">
                            <label className="sms-form-label">
                                <span className="resend-required">*</span>补发间隔
                            </label>
                            <div className="sms-form-control">
                                <select
                                    className="sms-select plan-canvas-inline-select"
                                    value={draft.interval}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, interval: e.target.value }))}
                                >
                                    <option value="">请选择</option>
                                    <option value="10">10 分钟</option>
                                    <option value="30">30 分钟</option>
                                    <option value="60">60 分钟</option>
                                    <option value="120">120 分钟</option>
                                </select>
                                {!draft.interval && (
                                    <div className="plan-canvas-time-error">请选择补发间隔</div>
                                )}
                            </div>
                        </div>

                        {timeWindowSelected && (
                            <div className="sms-form-item plan-canvas-time-item">
                                <label className="sms-form-label">
                                    <span className="resend-required">*</span>允许发送时段
                                </label>
                                <div className="sms-form-control">
                                    {draft.window ? (
                                        <div className="plan-canvas-time-row">
                                            <input
                                                type="time"
                                                className="plan-canvas-time-input"
                                                value={draft.window.start}
                                                onChange={(e) =>
                                                    setDraft((prev) => ({
                                                        ...prev,
                                                        window: { start: e.target.value, end: prev.window!.end },
                                                    }))
                                                }
                                            />
                                            <span className="plan-canvas-time-sep">-</span>
                                            <input
                                                type="time"
                                                className="plan-canvas-time-input"
                                                value={draft.window.end}
                                                onChange={(e) =>
                                                    setDraft((prev) => ({
                                                        ...prev,
                                                        window: { start: prev.window!.start, end: e.target.value },
                                                    }))
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="plan-canvas-time-del"
                                                title="删除该时段"
                                                onClick={() => setDraft((prev) => ({ ...prev, window: null }))}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="plan-canvas-time-add"
                                            onClick={() =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    window: { start: '', end: '' },
                                                }))
                                            }
                                        >
                                            + 添加时段
                                        </button>
                                    )}
                                    {windowMissing && (
                                        <div className="plan-canvas-time-error">请完整填写允许发送时段</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="sms-form-item plan-canvas-time-item">
                            <label className="sms-form-label">校验项</label>
                            <div className="sms-form-control">
                                <div className="resend-cond-options">
                                    <label className="resend-cond-option">
                                        <input
                                            type="checkbox"
                                            checked={draft.checks.includes('blacklist')}
                                            onChange={() => toggleCheck('blacklist')}
                                        />
                                        <span className="resend-cond-option-text">黑名单校验</span>
                                    </label>
                                    <label className="resend-cond-option">
                                        <input
                                            type="checkbox"
                                            checked={draft.checks.includes('timeWindow')}
                                            onChange={() => toggleCheck('timeWindow')}
                                        />
                                        <span className="resend-cond-option-text">发送时段校验</span>
                                    </label>
                                </div>
                                {checksMissing && (
                                    <div className="plan-canvas-time-hint">
                                        未勾选校验项时，补发前不做黑名单 / 发送时段校验
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取 消
                    </button>
                    <button
                        type="button"
                        className="sms-btn sms-btn-primary"
                        disabled={resendSaveDisabled}
                        onClick={() => onSave(draft)}
                    >
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
    onOpenBlacklist?: () => void;
}

export default function OperationPlanCanvas({ planName, onBack, onSaved, onOpenBlacklist }: OperationPlanCanvasProps) {
    const [persistedState] = useState(() => loadPersistedCanvas());
    const [nodes, setNodes] = useState<CanvasNode[]>(persistedState?.nodes ?? DEFAULT_PLAN_NODES);
    const [edges, setEdges] = useState<CanvasEdge[]>(persistedState?.edges ?? DEFAULT_PLAN_EDGES);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState(planName);
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
    const [dragover, setDragover] = useState(false);
    const [savedTip, setSavedTip] = useState(false);
    const [warnTip, setWarnTip] = useState<string | null>(null);
    const [linkPreview, setLinkPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    const savedTipTimer = useRef<number | null>(null);
    const warnTipTimer = useRef<number | null>(null);

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
            config:
                def.id === 'judge'
                    ? { ...DEFAULT_JUDGE }
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
                const sourceNode = nodes.find((n) => n.id === fromId);
                const isBranch = sourceNode ? BRANCH_NODE_IDS.includes(sourceNode.def.id) : false;
                const outCount = edges.filter((e) => e.from === fromId).length;
                if (isBranch && outCount >= 2) {
                    if (warnTipTimer.current !== null) {
                        window.clearTimeout(warnTipTimer.current);
                    }
                    setWarnTip(`${sourceNode?.def.label ?? '该节点'}最多允许 2 条出线`);
                    warnTipTimer.current = window.setTimeout(() => setWarnTip(null), 2600);
                    setLinkPreview(null);
                    linkDragRef.current = null;
                    return;
                }
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
                setEdges((prev) => {
                    const hasYes = prev.some((e) => e.from === fromId && e.expect === 'YES');
                    const expect: 'YES' | 'NO' | undefined = isBranch ? (hasYes ? 'NO' : 'YES') : undefined;
                    return [
                        ...prev,
                        {
                            id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            from: fromId,
                            to: targetId,
                            fromPort,
                            toPort,
                            expect,
                        },
                    ];
                });
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
                            persistCanvas(nodes, edges);
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
                            const p1 = portPoint(from, edge.fromPort);
                            const p2 = portPoint(to, edge.toPort);
                            return (
                                <g
                                    key={edge.id}
                                >
                                    <path
                                        d={edgePath(from, edge.fromPort, to, edge.toPort)}
                                        fill="none"
                                        stroke="#98a1b8"
                                        strokeWidth="1.6"
                                        markerEnd="url(#plan-arrow)"
                                    />
                                    {edge.expect && (
                                        <g
                                            className="plan-canvas-edge-expect"
                                            transform={`translate(${(p1.x + p2.x) / 2 - 10}, ${(p1.y + p2.y) / 2 - 10})`}
                                        >
                                            <title>{edge.expect === 'NO' ? '否' : '是'}</title>
                                            <circle r="10" fill={edge.expect === 'NO' ? '#FF2855' : '#52C41A'} />
                                            {edge.expect === 'NO' ? (
                                                <g fill="white" transform="translate(6, 6)">
                                                    <path d="M 11.7238 10.3819 L 7.33181 5.99504 L 11.7238 1.60826 C 12.0921 1.24034 12.0921 0.643852 11.7238 0.275936 C 11.3554 -0.0919788 10.7582 -0.0919788 10.3899 0.275936 L 5.99507 4.66568 L 1.61014 0.285775 C 1.24175 -0.0821398 0.644614 -0.0820943 0.276273 0.285775 C -0.0920682 0.653691 -0.0921138 1.25018 0.276273 1.6181 L 4.66818 6.00493 L 0.276273 10.3918 C -0.0920682 10.7596 -0.0921138 11.3562 0.276273 11.7241 C 0.64466 12.092 1.24179 12.092 1.61014 11.7241 L 6.00497 7.33433 L 10.3899 11.7142 C 10.7582 12.0821 11.3554 12.0821 11.7238 11.7142 C 12.0921 11.3463 12.0921 10.7498 11.7238 10.3819" />
                                                </g>
                                            ) : (
                                                <g fill="white" transform="translate(5, 7)">
                                                    <path d="M12.1131978,0.329504871 C12.5448299,-0.109834957 13.2446438,-0.109834957 13.6762759,0.329504871 C14.107908,0.768844699 14.107908,1.4811553 13.6762759,1.92049513 L5.57101276,10.1704951 C5.13938065,10.609835 4.43956672,10.609835 4.00793461,10.1704951 L0.323724084,6.42049513 C-0.107908028,5.9811553 -0.107908028,5.2688447 0.323724084,4.82950487 C0.755356196,4.39016504 1.45517012,4.39016504 1.88680223,4.82950487 L4.78947368,7.78400974 L12.1131978,0.329504871 Z" />
                                                </g>
                                            )}
                                        </g>
                                    )}
                                </g>
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
                                {node.def.id === 'judge' && node.config && (
                                    <span className="plan-canvas-item-summary">
                                        {JUDGE_TYPE_NAMES[(node.config as JudgeConfig).gateWayType]}
                                    </span>
                                )}
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
            {warnTip && <div className="plan-canvas-toast plan-canvas-toast-warn">{warnTip}</div>}

            {editingNode?.def.id === 'judge' && (
                <JudgeConfigModal
                    key={editingNode.id}
                    initial={editingNode.config as JudgeConfig}
                    onClose={() => setEditingId(null)}
                    onOpenBlacklist={onOpenBlacklist}
                    onSave={(config) => {
                        setNodes((prev) => prev.map((n) => (n.id === editingNode.id ? { ...n, config } : n)));
                        setEditingId(null);
                    }}
                />
            )}
            {editingNode?.def.id === 'resend-control' && (
                <ResendControlConfigModal
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
