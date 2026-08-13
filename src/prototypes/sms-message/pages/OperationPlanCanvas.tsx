/**
 * 运营计划画布配置页：操作列「详情」进入
 * 高精度还原 UAT 流程定制画布：顶部工具栏 + 左侧节点面板 + 空白画布
 */
import React from 'react';
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
        nodes: [{ label: '客户群组', color: '#98a1b8', icon: Users }],
    },
    {
        title: '动作',
        nodes: [
            { label: '结束节点', color: '#98a1b8', shape: 'circle', text: 'END' },
            { label: '延时器', color: '#98a1b8', shape: 'circle', icon: ClockIcon },
            { label: 'A/B测试', color: '#98a1b8', icon: GitBranch },
            { label: '判断', color: '#98a1b8', shape: 'diamond', icon: Diamond },
            { label: '动作判断', color: '#98a1b8', shape: 'diamond', icon: MousePointerClick },
            { label: '群组过滤', color: '#98a1b8', shape: 'diamond', icon: Filter },
        ],
    },
    {
        title: '渠道',
        nodes: [
            { label: '短信', color: '#98a1b8', icon: MessageSquareText },
            { label: 'WhatsApp', color: '#98a1b8', icon: MessageCircle },
            { label: '智能语音', color: '#98a1b8', icon: AudioLines },
            { label: 'Viber', color: '#98a1b8', icon: Phone },
            { label: 'Webhook', color: '#98a1b8', icon: Webhook },
            { label: '切片', color: '#98a1b8', icon: Slice },
            { label: '应用推送', color: '#98a1b8', icon: Bell },
            { label: '电销', color: '#98a1b8', icon: PhoneCall },
            { label: '优惠券', color: '#98a1b8', icon: Ticket },
        ],
    },
];

const CANVAS_TOOLS = [LayoutGrid, SquarePlus, Copy, Trash2, Undo2, Redo2, LocateFixed, ZoomIn, ZoomOut, Eraser];

interface OperationPlanCanvasProps {
    planName: string;
    onBack: () => void;
}

export default function OperationPlanCanvas({ planName, onBack }: OperationPlanCanvasProps) {
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
                                        <div className="plan-canvas-node" key={node.label}>
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

                <div className="plan-canvas-area">
                    <div className="plan-canvas-toolbar">
                        {CANVAS_TOOLS.map((Tool, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`plan-canvas-tool${i === 3 || i === 4 || i === 5 ? ' disabled' : ''}`}
                                title={`工具${i + 1}`}
                            >
                                <Tool size={15} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
