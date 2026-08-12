/**
 * @name 短信管理
 */
import React, { useState } from 'react';
import Layout from './components/Layout';
import TemplatePage from './pages/TemplatePage';
import RecordPage from './pages/RecordPage';
import ReportPage from './pages/ReportPage';
import ResendCenter from './pages/ResendCenter';
import { MessageSquareText, MessageCircle, BarChart3, Send } from 'lucide-react';
import './style.css';
import { AnnotationViewer, type AnnotationSourceDocument } from '@axhub/annotation';
import annotationSourceDocument from './annotation-source.json';

type TabKey = 'template' | 'record' | 'report' | 'resend';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'template', label: '模版', icon: MessageSquareText },
    { key: 'record', label: '发送记录', icon: MessageCircle },
    { key: 'report', label: '报表', icon: BarChart3 },
    { key: 'resend', label: '补发中心', icon: Send },
];

export default function SmsMessage() {
    // 与 UAT 一致：默认激活「发送记录」
    const [activeTab, setActiveTab] = useState<TabKey>('record');

    return (
        <>
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
                      {activeTab === 'resend' && <ResendCenter />}
                  </Layout>
          <AnnotationViewer
            source={annotationSourceDocument as unknown as AnnotationSourceDocument}
            options={{
              currentPageId: "sms-message",
              toolbarEdge: 'right',
              showToolbar: true,
              showThemeToggle: true,
              showColorFilter: true,
              emptyWhenNoData: true,
            }}
          />
        </>
    );
}
