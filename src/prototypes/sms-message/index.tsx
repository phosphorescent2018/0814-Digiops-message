/**
 * @name 短信管理
 */
import React, { useState } from 'react';
import Layout from './components/Layout';
import TemplatePage from './pages/TemplatePage';
import RecordPage from './pages/RecordPage';
import ReportPage from './pages/ReportPage';
import { MessageSquareText, MessageCircle, BarChart3 } from 'lucide-react';
import './style.css';

type TabKey = 'template' | 'record' | 'report';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'template', label: '模版', icon: MessageSquareText },
    { key: 'record', label: '发送记录', icon: MessageCircle },
    { key: 'report', label: '报表', icon: BarChart3 },
];

export default function SmsMessage() {
    // 与 UAT 一致：默认激活「发送记录」
    const [activeTab, setActiveTab] = useState<TabKey>('record');

    return (
        <Layout>
            <h1 className="sms-page-title">短信</h1>
            <div className="sms-tabs">
                {TABS.map((tab) => (
                    <div
                        key={tab.key}
                        className={`sms-tab${activeTab === tab.key ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <tab.icon className="sms-tab-icon" size={20} strokeWidth={1.6} />
                        {tab.label}
                    </div>
                ))}
            </div>
            {activeTab === 'record' && <RecordPage />}
            {activeTab === 'template' && <TemplatePage />}
            {activeTab === 'report' && <ReportPage />}
        </Layout>
    );
}
