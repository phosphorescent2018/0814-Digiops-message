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
                    <div className="home-cost-chart">
                        <div className="home-cost-line">
                            <span className="home-cost-num">0</span>
                            <svg className="home-cost-svg" viewBox="0 0 600 80" preserveAspectRatio="none">
                                <line x1="0" y1="40" x2="600" y2="40" className="home-cost-dash" />
                                <circle cx="56" cy="40" r="4" className="home-cost-dot" />
                            </svg>
                        </div>
                        <div className="home-cost-date">2026-08-27</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
