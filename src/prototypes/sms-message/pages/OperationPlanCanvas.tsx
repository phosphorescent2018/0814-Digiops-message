/**
 * 运营计划画布配置页：操作列「详情」进入
 * 高精度还原 UAT 流程定制画布：顶部工具栏 + 左侧节点面板 + 可拖拽画布
 * 支持：左侧组件拖入画布、画布内拖动移动、节点间拖线连接、选中删除
 * 其余组件内部交互不在原型演示范围
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
        nodes: [
            { id: 'customer-group', label: '客户群组', color: '#98a1b8', icon: Users },
            { id: 'touch-precheck', label: '触达前置校验', color: '#98a1b8', icon: ShieldCheck },
        ],
    },
    {
        title: '动作',
        nodes: [
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

interface CanvasNode {
    id: string;
    def: NodeDef;
    x: number;
    y: number;
}

interface CanvasEdge {
    id: string;
    from: string;
    to: string;
}

interface OperationPlanCanvasProps {
    planName: string;
    onBack: () => void;
}

export default function OperationPlanCanvas({ planName, onBack }: OperationPlanCanvasProps) {
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [edges, setEdges] = useState<CanvasEdge[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [dragover, setDragover] = useState(false);
    const [linkPreview, setLinkPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

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
        };
        setNodes((prev) => [...prev, node]);
        setSelectedId(id);
    };

    const removeNode = (id: string) => {
        setNodes((prev) => prev.filter((n) => n.id !== id));
        setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
        setSelectedId(null);
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

    const onNodePointerUp = () => {
        dragRef.current = null;
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
                    <button type="button" className="sms-btn plan-canvas-save">
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
                                onPointerUp={onNodePointerUp}
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
        </div>
    );
}
