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
            { id: 'judge', label: '判断', color: '#98a1b8', shape: 'diamond', icon: Diamond },
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
            { id: 'sms', label: '短信', color: '#1890ff', icon: MessageSquareText },
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

/** 周一到周日的每天允许发送时段：索引 0=周一 … 6=周日，每天仅 1 段，留空 = 该天不发送 */
interface DailyTimeWindow {
    start: string;
    end: string;
}

const DAILY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;

const emptyDailyWindows = (): DailyTimeWindow[] => Array.from({ length: 7 }, () => ({ start: '', end: '' }));

/** 归一化按天时段：优先新结构 dailyWindows（逐索引取），否则兼容旧 windows（取第一段复制到每天） */
const normalizeDailyWindows = (daily: unknown, legacy: unknown): DailyTimeWindow[] => {
    if (Array.isArray(daily) && daily.length) {
        return Array.from({ length: 7 }, (_, i) => {
            const d = daily[i] as DailyTimeWindow | undefined;
            return { start: d?.start ?? '', end: d?.end ?? '' };
        });
    }
    const first = (Array.isArray(legacy) ? legacy : []).find((w) => w && (w.start || w.end)) as
        | DailyTimeWindow
        | undefined;
    const base = first ?? { start: '', end: '' };
    return Array.from({ length: 7 }, () => ({ start: base.start ?? '', end: base.end ?? '' }));
};

/** 前置校验配置 */
interface PrecheckConfig {
    checks: string[];
    dailyWindows: DailyTimeWindow[];
    strategy: 'wait';
}

/** 短信节点配置：基础信息 + 发送前校验 + 补发控制 */
interface SmsBasicConfig {
    nodeName: string;
    sender: string;
    channel: string;
    template: string;
}

interface SmsConfig {
    basic: SmsBasicConfig;
    precheck: PrecheckConfig;
    resend: {
        enabled: boolean;
        triggers: string[];
        maxResend: string;
        interval: string;
    };
}

const DEFAULT_SMS_CONFIG: SmsConfig = {
    basic: { nodeName: '', sender: '', channel: '', template: '' },
    precheck: { checks: [], dailyWindows: emptyDailyWindows(), strategy: 'wait' },
    resend: { enabled: false, triggers: [], maxResend: '', interval: '' },
};

/** 判断节点配置：事件类型下拉 */
interface JudgeConfig {
    gateWayType: 'EVENT' | 'BUSINESS' | 'GROUP';
    eventChannel: string;
    recentDay: string;
}

const DEFAULT_JUDGE: JudgeConfig = {
    gateWayType: 'EVENT',
    eventChannel: '短信',
    recentDay: '30',
};

/** 判断节点类型展示名：选了什么就展示什么 */
const JUDGE_TYPE_NAMES: Record<JudgeConfig['gateWayType'], string> = {
    EVENT: '事件发生',
    BUSINESS: '业务属性',
    GROUP: '群组人数',
};

interface CanvasNode {
    id: string;
    def: NodeDef;
    x: number;
    y: number;
    config: PrecheckConfig | JudgeConfig | SmsConfig | null;
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

/** 示例链路：客户群组 → 短信（内置校验设置 + 补发控制）→ 结束 */
const DEFAULT_PLAN_NODES: CanvasNode[] = [
    { id: 'demo-customer-group', def: findNodeDef('customer-group'), x: 30, y: 180, config: null },
    {
        id: 'demo-sms',
        def: findNodeDef('sms'),
        x: 200,
        y: 180,
        config: {
            basic: { nodeName: '', sender: '', channel: '', template: '' },
            precheck: { checks: [], dailyWindows: emptyDailyWindows(), strategy: 'wait' as const },
            resend: { enabled: false, triggers: [], maxResend: '', interval: '' },
        },
    },
    { id: 'demo-end-main', def: findNodeDef('end'), x: 370, y: 180, config: null },
];

const DEFAULT_PLAN_EDGES: CanvasEdge[] = [
    { id: 'demo-edge-1', from: 'demo-customer-group', to: 'demo-sms', fromPort: 'right', toPort: 'left' },
    { id: 'demo-edge-2', from: 'demo-sms', to: 'demo-end-main', fromPort: 'right', toPort: 'left' },
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
            if (config && def.id === 'sms') {
                const sms = config as Partial<SmsConfig>;
                config = {
                    basic: {
                        nodeName: sms.basic?.nodeName ?? '',
                        sender: sms.basic?.sender ?? '',
                        channel: sms.basic?.channel ?? '',
                        template: sms.basic?.template ?? '',
                    },
                   precheck: {
                       checks: Array.isArray(sms.precheck?.checks) ? sms.precheck.checks : [],
                        dailyWindows: normalizeDailyWindows(
                            sms.precheck?.dailyWindows,
                            (sms.precheck as { windows?: unknown } | undefined)?.windows,
                        ),
                       strategy: 'wait' as const,
                   },
                    resend: {
                        enabled: sms.resend?.enabled ?? false,
                        triggers: Array.isArray(sms.resend?.triggers) ? sms.resend.triggers : [],
                        maxResend: sms.resend?.maxResend ?? '',
                        interval: sms.resend?.interval ?? '',
                    },
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
}

function JudgeConfigModal({ initial, onClose, onSave }: JudgeModalProps) {
    const [draft, setDraft] = useState<JudgeConfig>(() => ({
        gateWayType: initial.gateWayType,
        eventChannel: initial.eventChannel,
        recentDay: initial.recentDay,
    }));

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


/* ================= 短信节点配置面板（右抽屉） ================= */

interface SmsConfigModalProps {
    initial: SmsConfig;
    onClose: () => void;
    onSave: (config: SmsConfig) => void;
    onOpenBlacklist?: () => void;
}

function SmsConfigModal({ initial, onClose, onSave, onOpenBlacklist }: SmsConfigModalProps) {
    const [draft, setDraft] = useState<SmsConfig>(() => ({
        basic: { ...initial.basic },
        precheck: {
            ...initial.precheck,
            checks: [...initial.precheck.checks],
            dailyWindows: normalizeDailyWindows(initial.precheck.dailyWindows, []),
        },
        resend: {
            enabled: initial.resend.enabled ?? false,
            triggers: [...initial.resend.triggers],
            maxResend: initial.resend.maxResend,
            interval: initial.resend.interval,
        },
    }));
    const [openSections, setOpenSections] = useState<{ basic: boolean; precheck: boolean; resend: boolean }>({
        basic: true,
        precheck: false,
        resend: false,
    });

    const toggleSection = (key: 'basic' | 'precheck' | 'resend') =>
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

    const updateBasic = (key: keyof SmsBasicConfig, value: string) => {
        setDraft((prev) => ({ ...prev, basic: { ...prev.basic, [key]: value } }));
    };

    const togglePrecheckCheck = (key: string) => {
        setDraft((prev) => {
            const p = prev.precheck;
            const has = p.checks.includes(key);
            const checks = has ? p.checks.filter((c) => c !== key) : [...p.checks, key];
            // 勾选「发送时段校验」时保证 7 天时段齐备；取消勾选则清空
            let dailyWindows = p.dailyWindows;
            if (key === 'timeWindow') {
                dailyWindows = has
                    ? emptyDailyWindows()
                    : p.dailyWindows.length === 7
                        ? p.dailyWindows
                        : normalizeDailyWindows(p.dailyWindows, []);
            }
            return { ...prev, precheck: { ...p, checks, dailyWindows } };
        });
    };

    const updatePrecheckWindow = (day: number, key: 'start' | 'end', value: string) => {
        setDraft((prev) => ({
            ...prev,
            precheck: {
                ...prev.precheck,
                dailyWindows: prev.precheck.dailyWindows.map((w, i) => (i === day ? { ...w, [key]: value } : w)),
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

    const precheckTimeSelected = draft.precheck.checks.includes('timeWindow');
    // 勾选任意校验项即视为「启用校验」；不勾选 = 发送前/补发前均不做校验
    const precheckEnabled = draft.precheck.checks.length > 0;
    const dayWindowValid = (w: { start: string; end: string }) => !!w.start && !!w.end;
    // 至少完整配置 1 天的时段，否则时段校验视为未完成；留空的天 = 该天不发送
    const precheckTimeMissing = precheckTimeSelected && !draft.precheck.dailyWindows.some(dayWindowValid);
    // 启用校验后若勾了时段校验则必须配全时段，否则拦截保存
    const precheckIncomplete = precheckEnabled && precheckTimeMissing;

    const resendTriggersMissing = draft.resend.enabled && draft.resend.triggers.length === 0;
    const resendCountMissing = draft.resend.enabled && !draft.resend.maxResend;
    const resendIntervalMissing = draft.resend.enabled && !draft.resend.interval;
    // 补发控制为可选项：未启用不校验；启用后须配全（校验项统一复用上方「校验设置」）
    const resendIncomplete = resendTriggersMissing || resendCountMissing || resendIntervalMissing;

    const basicMissing =
        !draft.basic.nodeName.trim() ||
        !draft.basic.sender.trim() ||
        !draft.basic.channel.trim() ||
        !draft.basic.template.trim();

    // 保存可用性由基础信息必填 + 「启用后未配全」决定；校验与补发控制本身不作为必选项
    const saveDisabled = basicMissing || precheckIncomplete || resendIncomplete;

    const sectionToggle = (title: string, key: 'basic' | 'precheck' | 'resend') => (
        <button type="button" className="sms-config-drawer-section-toggle" onClick={() => toggleSection(key)}>
            <span className="sms-config-drawer-section-title">{title}</span>
            <ChevronDown
                size={16}
                className={`sms-config-drawer-section-chevron${openSections[key] ? ' open' : ''}`}
            />
        </button>
    );

    return (
        <div className="sms-mask sms-drawer-mask" onClick={onClose}>
            <div className="sms-config-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="sms-config-drawer-header">
                    <span className="sms-config-drawer-title">
                        <MessageSquareText size={16} />
                        短信
                    </span>
                    <button type="button" className="sms-config-drawer-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
                <div className="sms-config-drawer-body">
                    {/* 基础信息 */}
                    <div className="sms-config-drawer-section">
                        {sectionToggle('基础信息', 'basic')}
                        {openSections.basic && (
                            <div className="sms-config-drawer-section-content">
                                <div className="sms-form-item">
                                    <label className="sms-form-label">
                                        <span className="resend-required">*</span>节点名称
                                    </label>
                                    <div className="sms-form-control">
                                        <input
                                            className="sms-input"
                                            value={draft.basic.nodeName}
                                            placeholder="请输入节点名称"
                                            onChange={(e) => updateBasic('nodeName', e.target.value)}
                                        />
                                        {!draft.basic.nodeName.trim() && (
                                            <div className="plan-canvas-time-error">请输入节点名称</div>
                                        )}
                                    </div>
                                </div>
                                <div className="sms-form-item">
                                    <label className="sms-form-label">
                                        <span className="resend-required">*</span>发送名称
                                    </label>
                                    <div className="sms-form-control">
                                        <input
                                            className="sms-input"
                                            value={draft.basic.sender}
                                            placeholder="请输入发送名称"
                                            onChange={(e) => updateBasic('sender', e.target.value)}
                                        />
                                        {!draft.basic.sender.trim() && (
                                            <div className="plan-canvas-time-error">请输入发送名称</div>
                                        )}
                                    </div>
                                </div>
                                <div className="sms-form-item">
                                    <label className="sms-form-label">
                                        <span className="resend-required">*</span>触达通道
                                    </label>
                                    <div className="sms-form-control">
                                        <select
                                            className="sms-select"
                                            value={draft.basic.channel}
                                            onChange={(e) => updateBasic('channel', e.target.value)}
                                        >
                                            <option value="">请选择</option>
                                            <option value="SMPP">SMPP</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="sms-form-item">
                                    <label className="sms-form-label">
                                        <span className="resend-required">*</span>短信模板
                                    </label>
                                    <div className="sms-form-control">
                                        <select
                                            className={`sms-select${!draft.basic.template ? ' placeholder' : ''}`}
                                            value={draft.basic.template}
                                            onChange={(e) => updateBasic('template', e.target.value)}
                                        >
                                            <option value="">请选择模板</option>
                                            <option value="还款提醒-逾期">还款提醒-逾期</option>
                                            <option value="放款成功通知">放款成功通知</option>
                                            <option value="营销活动-新客">营销活动-新客</option>
                                        </select>
                                        {!draft.basic.template && (
                                            <div className="plan-canvas-time-error">请选择短信模板</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 校验设置：黑名单 / 发送时段，发送前与补发前统一生效 */}
                    <div className="sms-config-drawer-section">
                        {sectionToggle('校验设置', 'precheck')}
                        {openSections.precheck && (
                            <div className="sms-config-drawer-section-content">
                                <div className="sms-config-drawer-hint">
                                    黑名单与发送时段校验，发送前及补发前统一生效
                                    <br />
                                    勾选任意校验项即启用，不勾选则不做校验
                                </div>
                                <div className="sms-form-item">
                                    <label className="sms-form-label">校验项</label>
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
                                    </div>
                                </div>
                                {precheckTimeSelected && (
                                    <div className="sms-form-item plan-canvas-time-item">
                                        <label className="sms-form-label">允许发送时段（按天，每天仅 1 段）</label>
                                        <div className="sms-form-control">
                                            <div className="plan-canvas-time-grid">
                                                {draft.precheck.dailyWindows.map((w, day) => {
                                                    const partial = (!!w.start || !!w.end) && !dayWindowValid(w);
                                                    return (
                                                        <div className="plan-canvas-time-day-row" key={day}>
                                                            <span className="plan-canvas-time-day">{DAILY_LABELS[day]}</span>
                                                            <input
                                                                type="time"
                                                                className="plan-canvas-time-input"
                                                                value={w.start}
                                                                onChange={(e) => updatePrecheckWindow(day, 'start', e.target.value)}
                                                            />
                                                            <span className="plan-canvas-time-sep">-</span>
                                                            <input
                                                                type="time"
                                                                className="plan-canvas-time-input"
                                                                value={w.end}
                                                                onChange={(e) => updatePrecheckWindow(day, 'end', e.target.value)}
                                                            />
                                                            {partial && (
                                                                <span className="plan-canvas-time-day-error">未填写完整</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="plan-canvas-time-hint plan-canvas-time-hint-gap">
                                                留空的天表示该天不发送
                                            </div>
                                            {precheckTimeMissing && (
                                                <div className="plan-canvas-time-error plan-canvas-time-error-gap">
                                                    请至少配置一天的允许发送时段
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {precheckTimeSelected && (
                                    <div className="plan-canvas-non-slot-tip">
                                        <ClockIcon size={14} className="plan-canvas-non-slot-icon" />
                                        <span>非允许时段内发送将自动挂起，等到下一允许时段再继续</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 补发控制：仅策略字段，校验项统一复用上方「校验设置」 */}
                    <div className="sms-config-drawer-section">
                        {sectionToggle('补发控制', 'resend')}
                        {openSections.resend && (
                            <div className="sms-config-drawer-section-content">
                                <label className="resend-cond-option sms-config-drawer-switch">
                                    <input
                                        type="checkbox"
                                        checked={draft.resend.enabled}
                                        onChange={(e) =>
                                            setDraft((prev) => ({ ...prev, resend: { ...prev.resend, enabled: e.target.checked } }))
                                        }
                                    />
                                    <span className="resend-cond-option-text">启用补发控制</span>
                                </label>
                                {!draft.resend.enabled ? (
                                    <div className="sms-config-drawer-hint">未启用补发控制，发送失败后不补发</div>
                                ) : (
                                    <>
                                        <div className="plan-canvas-non-slot-tip plan-canvas-non-slot-tip-gap">
                                            <ClockIcon size={14} className="plan-canvas-non-slot-icon" />
                                            <span>
                                                补发前校验：复用上方「校验设置」（黑名单 / 发送时段）
                                                <br />
                                                未启用校验项则补发前不做校验
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
                                                                checked={draft.resend.triggers.includes('submitFail')}
                                                                onChange={() => toggleResendTrigger('submitFail')}
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
                                                                    checked={draft.resend.triggers.includes('receiptTimeout')}
                                                                    onChange={() => toggleResendTrigger('receiptTimeout')}
                                                                />
                                                                <span className="resend-cond-option-text">回执超时</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                                {resendTriggersMissing && (
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
                                                    value={draft.resend.maxResend}
                                                    onChange={(e) =>
                                                        setDraft((prev) => ({ ...prev, resend: { ...prev.resend, maxResend: e.target.value } }))
                                                    }
                                                >
                                                    <option value="">请选择</option>
                                                    <option value="1">1 次</option>
                                                    <option value="2">2 次</option>
                                                    <option value="3">3 次</option>
                                                    <option value="5">5 次</option>
                                                </select>
                                                {resendCountMissing && (
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
                                                    value={draft.resend.interval}
                                                    onChange={(e) =>
                                                        setDraft((prev) => ({ ...prev, resend: { ...prev.resend, interval: e.target.value } }))
                                                    }
                                                >
                                                    <option value="">请选择</option>
                                                    <option value="10">10 分钟</option>
                                                    <option value="30">30 分钟</option>
                                                    <option value="60">60 分钟</option>
                                                    <option value="120">120 分钟</option>
                                                </select>
                                                {resendIntervalMissing && (
                                                    <div className="plan-canvas-time-error">请选择补发间隔</div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="sms-config-drawer-footer">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取 消
                    </button>
                    <button
                        type="button"
                        className="sms-btn sms-btn-primary"
                        disabled={saveDisabled}
                        onClick={() =>
                            onSave({
                                ...draft,
                                precheck: {
                                    ...draft.precheck,
                                    dailyWindows: normalizeDailyWindows(draft.precheck.dailyWindows, []),
                                },
                            })
                        }
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
                    : def.id === 'sms'
                        ? { ...DEFAULT_SMS_CONFIG,
                            basic: { ...DEFAULT_SMS_CONFIG.basic },
                            precheck: { checks: [], dailyWindows: emptyDailyWindows(), strategy: 'wait' as const },
                            resend: { enabled: false, triggers: [], maxResend: '', interval: '' },
                          }
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
                    onSave={(config) => {
                        setNodes((prev) => prev.map((n) => (n.id === editingNode.id ? { ...n, config } : n)));
                        setEditingId(null);
                    }}
                />
            )}
            {editingNode?.def.id === 'sms' && (
                <SmsConfigModal
                    key={editingNode.id}
                    initial={editingNode.config as SmsConfig}
                    onClose={() => setEditingId(null)}
                    onOpenBlacklist={onOpenBlacklist}
                    onSave={(config) => {
                        setNodes((prev) => prev.map((n) => (n.id === editingNode.id ? { ...n, config } : n)));
                        setEditingId(null);
                    }}
                />
            )}
        </div>
    );
}
