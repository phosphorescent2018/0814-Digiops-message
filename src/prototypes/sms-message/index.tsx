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
import { MessageSquareText, MessageCircle, BarChart3, Send } from 'lucide-react';
import './style.css';
import { AnnotationViewer, type AnnotationSourceDocument } from '@axhub/annotation';
import annotationSourceDocument from './annotation-source.json';

type TabKey = 'template' | 'record' | 'report' | 'resend';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'template', label: '模版', icon: MessageSquareText },
    { key: 'record', label: '发送记录', icon: MessageCircle },
    { key: 'report', label: '报表', icon: BarChart3 },
    { key: 'resend', label: '人工补发', icon: Send },
];

/** 本次新增 / 增强的功能 Tab：淡紫色背景标记 */
const PURPLE_TABS: TabKey[] = ['record', 'resend'];

/**
 * AxHub 批注运行时的悬浮层挂在 document 下（#__axhub_annotation_host__），
 * 自身 z-index: 2147483647，内容在 Shadow DOM 里，外部 CSS 无法覆盖。
 * 结果：原型的弹窗 / 抽屉打开时，它仍浮在 .sms-mask 之上并截走点击，
 * 导致「详情抽屉已经打开，还能点到别的按钮」。
 * 这里在遮罩存在期间给该宿主加 inert，让它彻底不接收指针事件（inert 会作用于
 * 宿主及其 Shadow DOM 后代），遮罩消失后立即恢复。
 */
const ANNOTATION_HOST_ID = '__axhub_annotation_host__';

function useAnnotationInertWhileModalOpen() {
    React.useEffect(() => {
        const host = () => document.getElementById(ANNOTATION_HOST_ID);
        const sync = () => {
            const el = host();
            if (!el) return;
            const modalOpen = Boolean(document.querySelector('.sms-mask'));
            if (el.inert !== modalOpen) el.inert = modalOpen;
        };
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        return () => {
            observer.disconnect();
            const el = host();
            if (el) el.inert = false;
        };
    }, []);
}

export default function SmsMessage() {
    useAnnotationInertWhileModalOpen();
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
              ) : page === 'blacklist' ? (
                  <>
                      <h1 className="sms-page-title">黑名单</h1>
                      <BlacklistPage />
                  </>
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
                                  }}
                              >
                                  <tab.icon className="sms-tab-icon" size={20} strokeWidth={1.6} />
                                  {tab.label}
                              </div>
                          ))}
                      </div>
                      {activeTab === 'record' && (
                          <RecordPage
                              filter={recordFilter ?? undefined}
                              onOpenResend={(id) => {
                                  setResendBatchId(id);
                                  setRecordFilter(null);
                                  setActiveTab('resend');
                              }}
                          />
                      )}
                      {activeTab === 'template' && <TemplatePage />}
                      {activeTab === 'report' && <ReportPage />}
                      {activeTab === 'resend' && (
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
