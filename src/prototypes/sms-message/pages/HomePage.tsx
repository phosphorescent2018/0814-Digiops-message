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
    base: { total: 12847, success: 11203, percent: 87, count: 0 },
    withResend: { total: 14362, success: 12580, percent: 88, count: 1515 },
};

const STATS_COST = {
    base: { total: 8420.5, resend: 0 },
    withResend: { total: 9315.75, resend: 895.25 },
};

const STATS_PLAN = {
    base: { count: 12, running: 3, done: 9 },
    withResend: { count: 15, running: 4, done: 11 },
};

function IncludeResendSwitch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label className="home-card-toggle">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="home-card-toggle-track">
                <span className="home-card-toggle-thumb" />
            </span>
            <span className="home-card-toggle-label">是否包含补发短信</span>
        </label>
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
            </div>
            <div className="home-card-head-actions">
                <IncludeResendSwitch checked={checked} onChange={onToggle} />
                <button type="button" className="home-card-more" title="更多">
                    <MoreVertical size={14} />
                </button>
            </div>
        </div>
    );
}

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<string>('home');
    const [includeResend, setIncludeResend] = useState(false);

    const sms = includeResend ? STATS_SMS.withResend : STATS_SMS.base;
    const cost = includeResend ? STATS_COST.withResend : STATS_COST.base;
    const plan = includeResend ? STATS_PLAN.withResend : STATS_PLAN.base;

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
                                    <div className="home-ring-count">（{sms.count.toLocaleString()}）</div>
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
                    <div className="home-card-body">
                        <div className="home-ring">
                            <div className="home-ring-circle home-ring-circle-cost">
                                <div className="home-ring-center">
                                    <div className="home-ring-percent home-ring-percent-cost">
                                        {((cost.resend / cost.total) * 100).toFixed(1)}%
                                    </div>
                                    <div className="home-ring-count">补发占比</div>
                                </div>
                            </div>
                        </div>
                        <div className="home-card-stats">
                            <div className="home-card-stat">
                                <span className="home-card-dot home-card-dot-gray" />
                                总费用：
                                <span className="home-card-num">UGX {cost.total.toLocaleString()}</span>
                            </div>
                            <div className="home-card-stat">
                                <span className="home-card-dot home-card-dot-blue" />
                                补发费用：
                                <span className="home-card-num home-card-num-blue">UGX {cost.resend.toLocaleString()}</span>
                            </div>
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
                    <div className="home-plan-body">
                        <div className="home-plan-stats">
                            <div className="home-plan-stat">
                                <span className="home-card-dot home-card-dot-gray" />
                                计划数：
                                <span className="home-card-num">{plan.count}</span>
                            </div>
                            <div className="home-plan-stat">
                                <span className="home-card-dot home-card-dot-blue" />
                                执行中：
                                <span className="home-card-num">{plan.running}</span>
                            </div>
                            <div className="home-plan-stat">
                                <span className="home-card-dot home-card-dot-success" />
                                已完成：
                                <span className="home-card-num">{plan.done}</span>
                            </div>
                        </div>
                        <div className="home-plan-flow">
                            <div className="home-plan-node home-plan-node-start">
                                <PlayCircle size={30} />
                            </div>
                            <div className="home-plan-link" />
                            <div className="home-plan-node home-plan-node-wait">
                                <Timer size={30} />
                            </div>
                            <div className="home-plan-link" />
                            <div className="home-plan-node home-plan-node-group">
                                <Users size={30} />
                            </div>
                            <div className="home-plan-link" />
                            <div className="home-plan-node home-plan-node-sms">
                                <Mail size={30} />
                            </div>
                            <div className="home-plan-link" />
                            <div className="home-plan-node home-plan-node-end">
                                <CircleDot size={24} />
                                <span className="home-plan-node-end-text">END</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
