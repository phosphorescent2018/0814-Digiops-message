/**
 * 首页：还原 Digiops UAT /home
 * 三个内容块：短信发送数量 / 短信费用 / 运营计划，均支持「是否包含补发短信」开关
 */
import React, { useState } from 'react';
import {
    Plus,
    RefreshCw,
    Maximize2,
    MoreVertical,
    ChevronDown,
    LayoutGrid,
    PlayCircle,
    Timer,
    Users,
    Mail,
    CircleDot,
} from 'lucide-react';

interface HomeTab {
    key: string;
    label: string;
}

const HOME_TABS: HomeTab[] = [{ key: 'home', label: '首页' }];

/** 本次增强的首页页签：淡紫色呼吸 */
const PURPLE_HOME_TABS = ['home'];

const STATS_SMS = {
    base: { total: 12847, success: 11203, percent: 87 },
    withResend: { total: 14362, success: 12580, percent: 88 },
};

const STATS_PLAN = {
    base: {
        start: 12847,
        wait: 12847,
        group: 12580,
        sms: 11203,
        end: 11203,
    },
    withResend: {
        start: 14362,
        wait: 14362,
        group: 13950,
        sms: 12580,
        end: 12580,
    },
};

const STATS_COST_DAILY = {
    base: [
        { day: '08-22', value: 890.5 },
        { day: '08-23', value: 1020.25 },
        { day: '08-24', value: 960.75 },
        { day: '08-25', value: 1180.4 },
        { day: '08-26', value: 1350.2 },
        { day: '08-27', value: 1280.6 },
    ],
    withResend: [
        { day: '08-22', value: 990.5 },
        { day: '08-23', value: 1140.25 },
        { day: '08-24', value: 1080.75 },
        { day: '08-25', value: 1310.4 },
        { day: '08-26', value: 1490.2 },
        { day: '08-27', value: 1420.6 },
    ],
};

function PlanCountBubble({ value }: { value: number }) {
    const [expanded, setExpanded] = useState(false);
    const short = value >= 1000 ? `${Math.round(value / 100) / 10}K` : String(value);
    return (
        <span
            className="home-plan-bubble"
            title={expanded ? short : value.toLocaleString()}
            onClick={() => setExpanded((v) => !v)}
        >
            {expanded ? value.toLocaleString() : short}
        </span>
    );
}

function ResendToggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="home-card-toggle">
            <span className="home-card-toggle-label">补发短信</span>
            <div className="home-card-toggle-options">
                {[true, false].map((value) => (
                    <label
                        key={String(value)}
                        className={`home-card-toggle-option${checked === value ? ' active' : ''}`}
                    >
                        <input
                            type="radio"
                            name="includeResend"
                            checked={checked === value}
                            onChange={() => onChange(value)}
                        />
                        {value ? '包含' : '不包含'}
                    </label>
                ))}
            </div>
        </div>
    );
}

function CardHead({
    title,
    date,
    checked,
    onToggle,
}: {
    title: string;
    date: string;
    checked: boolean;
    onToggle: (v: boolean) => void;
}) {
    return (
        <div className="home-card-head">
            <div>
                <div className="home-card-title">{title}</div>
                <div className="home-card-date">{date}</div>
                <div className="home-card-toggle-wrap">
                    <ResendToggle checked={checked} onChange={onToggle} />
                </div>
            </div>
            <div className="home-card-head-actions">
                <button type="button" className="home-card-more" title="更多">
                    <MoreVertical size={14} />
                </button>
            </div>
        </div>
    );
}

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<string>('home');
    const [includeResend, setIncludeResend] = useState(true);

    const sms = includeResend ? STATS_SMS.withResend : STATS_SMS.base;
    const plan = includeResend ? STATS_PLAN.withResend : STATS_PLAN.base;
    const costDaily = includeResend ? STATS_COST_DAILY.withResend : STATS_COST_DAILY.base;
    const costMax = Math.max(...costDaily.map((d) => d.value)) * 1.15;
    const costPoints = costDaily
        .map((d, i) => {
            const x = (i / (costDaily.length - 1)) * 100;
            const y = 100 - (d.value / costMax) * 88;
            return `${x},${y}`;
        })
        .join(' ');
    const costArea = `0,100 ${costPoints} 100,100`;

    return (
        <div className="home-page">
            <div className="home-tabs">
                {HOME_TABS.map((tab) => (
                    <div
                        key={tab.key}
                        className={`home-tab${activeTab === tab.key ? ' active' : ''}${
                            PURPLE_HOME_TABS.includes(tab.key) ? ' home-tab-purple' : ''
                        }`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            <div className="home-toolbar">
                <div className="home-toolbar-right">
                    <button type="button" className="sms-btn sms-btn-icon" title="视图">
                        <LayoutGrid size={15} />
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary">
                        <Plus size={14} />
                        新建
                        <ChevronDown size={12} />
                    </button>
                    <button type="button" className="sms-btn sms-btn-icon" title="刷新">
                        <RefreshCw size={15} />
                    </button>
                    <button type="button" className="sms-btn sms-btn-icon" title="全屏">
                        <Maximize2 size={15} />
                    </button>
                </div>
            </div>

            <div className="home-content">
                {/* 短信发送数量 */}
                <div className="home-card">
                    <CardHead
                        title="短信发送数量"
                        date="2026-08-27 至 2026-08-27"
                        checked={includeResend}
                        onToggle={setIncludeResend}
                    />
                    <div className="home-card-body">
                        <div className="home-ring">
                            <div className="home-ring-circle">
                                <div className="home-ring-center">
                                    <div className="home-ring-percent">{sms.percent}%</div>
                                    <div className="home-ring-count">（{sms.total.toLocaleString()}）</div>
                                </div>
                            </div>
                        </div>
                        <div className="home-card-stats">
                            <div className="home-card-stat">
                                <span className="home-card-dot home-card-dot-gray" />
                                发送总数：
                                <span className="home-card-num">{sms.total.toLocaleString()}</span>
                            </div>
                            <div className="home-card-stat">
                                <span className="home-card-dot home-card-dot-blue" />
                                发送成功次数：
                                <span className="home-card-num home-card-num-blue">{sms.success.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 短信费用 */}
                <div className="home-card home-card-gap">
                    <CardHead
                        title="短信费用"
                        date="2026-08-27 至 2026-08-27"
                        checked={includeResend}
                        onToggle={setIncludeResend}
                    />
                    <div className="home-cost-chart">
                        <div className="home-cost-line">
                            <div className="home-cost-y">
                                <span>UGX</span>
                                <span>{Math.round(costMax).toLocaleString()}</span>
                                <span>0</span>
                            </div>
                            <svg className="home-cost-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="costAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#1890ff" stopOpacity="0.22" />
                                        <stop offset="100%" stopColor="#1890ff" stopOpacity="0.02" />
                                    </linearGradient>
                                </defs>
                                <line x1="0" y1="12" x2="100" y2="12" className="home-cost-grid" />
                                <line x1="0" y1="56" x2="100" y2="56" className="home-cost-grid" />
                                <polygon points={costArea} fill="url(#costAreaGrad)" />
                                <polyline points={costPoints} className="home-cost-line-path" />
                                {costDaily.map((d, i) => {
                                    const x = (i / (costDaily.length - 1)) * 100;
                                    const y = 100 - (d.value / costMax) * 88;
                                    return <circle key={d.day} cx={x} cy={y} r="1.6" className="home-cost-point" />;
                                })}
                            </svg>
                        </div>
                        <div className="home-cost-x">
                            {costDaily.map((d) => (
                                <span key={d.day}>{d.day}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 运营计划 */}
                <div className="home-card home-card-gap">
                    <CardHead
                        title="运营计划"
                        date="2026-08-27 至 2026-08-27"
                        checked={includeResend}
                        onToggle={setIncludeResend}
                    />
                    <div className="home-plan-flow">
                        <div className="home-plan-node home-plan-node-start">
                            <PlayCircle size={30} />
                            <PlanCountBubble value={plan.start} />
                        </div>
                        <div className="home-plan-link" />
                        <div className="home-plan-node home-plan-node-wait">
                            <Timer size={30} />
                            <PlanCountBubble value={plan.wait} />
                        </div>
                        <div className="home-plan-link" />
                        <div className="home-plan-node home-plan-node-group">
                            <Users size={30} />
                            <PlanCountBubble value={plan.group} />
                        </div>
                        <div className="home-plan-link" />
                        <div className="home-plan-node home-plan-node-sms">
                            <Mail size={30} />
                            <PlanCountBubble value={plan.sms} />
                        </div>
                        <div className="home-plan-link" />
                        <div className="home-plan-node home-plan-node-end">
                            <CircleDot size={22} />
                            <span className="home-plan-node-end-text">END</span>
                            <PlanCountBubble value={plan.end} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
