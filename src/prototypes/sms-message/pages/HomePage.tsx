/**
 * 首页：还原 Digiops UAT /home
 * 顶部 Tab + 工具栏 + 短信发送数量统计卡（原型静态演示）
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

const HOME_TABS: HomeTab[] = [
    { key: 'home', label: '首页' },
    { key: 'sms', label: '短信' },
    { key: 'plan', label: '运营计划管理' },
    { key: 'call', label: '电销' },
    { key: 'voice', label: '智能语音' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'userTag', label: '用户标签' },
];

/** 本次增强的首页页签：淡紫色呼吸 */
const PURPLE_HOME_TABS = ['home', 'blacklist'];

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<string>('home');

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
                        {activeTab !== tab.key && <span className="home-tab-close">×</span>}
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
                <div className="home-card">
                    <div className="home-card-head">
                        <div>
                            <div className="home-card-title">短信发送数量</div>
                            <div className="home-card-date">2026-08-27 至 2026-08-27</div>
                        </div>
                        <button type="button" className="home-card-more" title="更多">
                            <MoreVertical size={14} />
                        </button>
                    </div>
                    <div className="home-card-body">
                        <div className="home-ring">
                            <div className="home-ring-circle">
                                <div className="home-ring-center">
                                    <div className="home-ring-percent">0%</div>
                                    <div className="home-ring-count">（0）</div>
                                </div>
                            </div>
                        </div>
                        <div className="home-card-stats">
                            <div className="home-card-stat">
                                <span className="home-card-dot home-card-dot-gray" />
                                发送总数：
                                <span className="home-card-num">0</span>
                            </div>
                            <div className="home-card-stat">
                                <span className="home-card-dot home-card-dot-blue" />
                                发送成功次数：
                                <span className="home-card-num home-card-num-blue">0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
