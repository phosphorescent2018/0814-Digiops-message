/**
 * @name 短信管理
 */
import React, { useState } from 'react';
import Layout, { type AppPage } from './components/Layout';
import HomePage from './pages/HomePage';
import TemplatePage from './pages/TemplatePage';
import RecordPage from './pages/RecordPage';
import ReportPage from './pages/ReportPage';
import ResendCenter from './pages/ResendCenter';
import BlacklistPage from './pages/BlacklistPage';
import OperationPlanPage from './pages/OperationPlanPage';
import type { RecordFilter } from './pages/resend/BatchDetail';
import { MessageSquareText, MessageCircle, BarChart3, Send, Home, Shield } from 'lucide-react';
import './style.css';
import { AnnotationViewer, type AnnotationSourceDocument } from '@axhub/annotation';
import annotationSourceDocument from './annotation-source.json';

type TabKey = 'template' | 'record' | 'report' | 'resend' | 'home' | 'blacklist';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'home', label: '首页', icon: Home },
    { key: 'blacklist', label: '黑名单', icon: Shield },
    { key: 'template', label: '模版', icon: MessageSquareText },
    { key: 'record', label: '发送记录', icon: MessageCircle },
    { key: 'report', label: '报表', icon: BarChart3 },
    { key: 'resend', label: '人工补发', icon: Send },
];

/** 本次新增 / 增强的功能 Tab：淡紫色背景标记 */
const PURPLE_TABS: TabKey[] = ['home', 'blacklist', 'record', 'resend'];

export default function SmsMessage() {
    // 与 UAT 一致：默认激活「发送记录」
    const [activeTab, setActiveTab] = useState<TabKey>('record');
    const [page, setPage] = useState<AppPage>(() => {
        const p = new URLSearchParams(window.location.search).get('page');
        return p === 'home' ? 'home' : p === 'blacklist' ? 'blacklist' : 'sms';
    });
    const [recordFilter, setRecordFilter] = useState<RecordFilter | null>(null);
    const [resendBatchId, setResendBatchId] = useState('');

    return (
        <>
          <Layout activePage={page} onNavigate={setPage}>
              {page === 'plan' ? (
                  <OperationPlanPage
                      onOpenBlacklist={() => {
                          const url = new URL(window.location.href);
                          url.searchParams.set('page', 'blacklist');
                          window.open(url.toString(), '_blank');
                      }}
                  />
              ) : page === 'home' ? (
                  <HomePage />
              ) : (
                  <>
                      <h1 className="sms-page-title">短信</h1>
                      <div className="sms-tabs">
                          {TABS.map((tab) => (
                              <div
                                  key={tab.key}
                                  className={`sms-tab${activeTab === tab.key ? ' active' : ''}${
                                      PURPLE_TABS.includes(tab.key) ? ' sms-tab-purple' : ''
                                  }`}
                                  onClick={() => {
                                      setRecordFilter(null);
                                      setActiveTab(tab.key);
                                      if (tab.key === 'home') setPage('home');
                                      if (tab.key === 'blacklist') setPage('blacklist');
                                  }}
                              >
                                  <tab.icon className="sms-tab-icon" size={20} strokeWidth={1.6} />
                                  {tab.label}
                              </div>
                          ))}
                      </div>
                      {page === 'blacklist' && (
                          <>
                              <h1 className="sms-page-title">黑名单</h1>
                              <BlacklistPage />
                          </>
                      )}
                      {page !== 'blacklist' && activeTab === 'record' && (
                          <RecordPage
                              filter={recordFilter ?? undefined}
                              onOpenResend={(id) => {
                                  setResendBatchId(id);
                                  setRecordFilter(null);
                                  setActiveTab('resend');
                              }}
                          />
                      )}
                      {page !== 'blacklist' && activeTab === 'template' && <TemplatePage />}
                      {page !== 'blacklist' && activeTab === 'report' && <ReportPage />}
                      {page !== 'blacklist' && activeTab === 'resend' && (
                          <ResendCenter
                              incomingBatchId={resendBatchId}
                              onSwitchTab={(tab, filter) => {
                                  setRecordFilter(filter ?? null);
                                  setActiveTab(tab);
                              }}
                          />
                      )}
                  </>
              )}
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
