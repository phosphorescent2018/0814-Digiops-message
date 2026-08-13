/**
 * 全局布局：左侧导航 + 顶部栏
 */
import React, { useState } from 'react';
import {
    Home,
    Users,
    CalendarRange,
    Megaphone,
    MessageSquareText,
    MessageCircle,
    PhoneCall,
    AudioLines,
    MessagesSquare,
    Bell,
    Gift,
    Settings,
    BookOpen,
    ChevronDown,
    Clock3,
    Globe,
    Menu,
} from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    activePage?: AppPage;
    onNavigate?: (page: AppPage) => void;
}

export type AppPage = 'sms' | 'plan';

interface MenuChild {
    label: string;
    page?: AppPage;
}

interface MenuItem {
    icon: React.ElementType;
    label: string;
    page?: AppPage;
    children?: (string | MenuChild)[];
}

const MENU: MenuItem[] = [
    { icon: Home, label: '首页' },
    {
        icon: Users,
        label: '用户管理',
        children: ['用户标签', '客户分组', '用户列表', '导入导出'],
    },
    {
        icon: CalendarRange,
        label: '运营计划',
        page: 'plan',
        children: [{ label: '运营计划管理', page: 'plan' }],
    },
    {
        icon: Megaphone,
        label: '营销渠道',
        page: 'sms',
        children: [
            { label: '短信', page: 'sms' },
            { label: 'WhatsApp' },
            { label: '电销' },
            { label: '智能语音' },
            { label: 'Viber' },
            { label: '应用推送' },
        ],
    },
    { icon: Gift, label: '活动' },
    { icon: Settings, label: '系统管理' },
];

function Sidebar({ activePage, onNavigate }: { activePage: AppPage; onNavigate?: (page: AppPage) => void }) {
    // 一级菜单展开状态：默认全部展开，点击一级菜单可伸缩
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(MENU.filter((item) => item.children).map((item) => [item.label, true]))
    );

    const toggleMenu = (label: string) => {
        setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <aside className="sms-sidebar">
            <div className="sms-logo">
                <span className="sms-logo-mark">M</span>
                <span className="sms-logo-text">mindigital GLOBAL</span>
            </div>
            <nav className="sms-menu">
                {MENU.map((item) => (
                    <div key={item.label}>
                        <div
                            className={`sms-menu-item${item.page && activePage === item.page ? ' active' : ''}${
                                item.children ? ` open${expanded[item.label] ? ' expanded' : ''}` : ''
                            }`}
                            onClick={item.children ? () => toggleMenu(item.label) : undefined}
                        >
                            <item.icon className="sms-menu-icon" size={18} strokeWidth={1.8} />
                            <span>{item.label}</span>
                            {item.children && (
                                <ChevronDown className="sms-menu-chevron" size={14} strokeWidth={1.8} />
                            )}
                        </div>
                        {item.children && expanded[item.label] && (
                            <div className="sms-menu-sub">
                                {item.children.map((child) => {
                                    const childLabel = typeof child === 'string' ? child : child.label;
                                    const childPage = typeof child === 'object' ? child.page : undefined;
                                    const childActive = childPage ? activePage === childPage : false;
                                    const purple = childPage === 'sms' || childPage === 'plan';
                                    return (
                                        <div
                                            key={childLabel}
                                            className={`sms-menu-item${childActive ? ' active' : ''}${
                                                purple ? ' sms-menu-sub-purple' : ''
                                            }`}
                                            onClick={childPage ? () => onNavigate?.(childPage) : undefined}
                                        >
                                            <span>{childLabel}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
                <div className="sms-menu-group-label">其他</div>
                <div className="sms-menu-item">
                    <BookOpen className="sms-menu-icon" size={18} strokeWidth={1.8} />
                    <span>设置指南</span>
                </div>
            </nav>
        </aside>
    );
}

function Header({ activePage }: { activePage: AppPage }) {
    return (
        <header className="sms-header">
            <div className="sms-breadcrumb">
                <span className="sms-hide-menu">
                    <Menu size={16} />
                </span>
                <a href="#">首页</a>
                {activePage === 'sms' ? (
                    <>
                        <span className="sep">/</span>
                        <span>短信</span>
                        <span className="sep">/</span>
                        <span>运营计划管理</span>
                        <span className="sep">/</span>
                        <span style={{ color: '#031938' }}>短信</span>
                    </>
                ) : (
                    <>
                        <span className="sep">/</span>
                        <span>运营计划</span>
                        <span className="sep">/</span>
                        <span style={{ color: '#031938' }}>运营计划管理</span>
                    </>
                )}
            </div>
            <div className="sms-header-right">
                <span className="sms-header-time">
                    <Clock3 size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                    Uganda Time 2026/08/11 13:27:02
                </span>
                <span className="sms-lang">
                    <Globe size={15} />
                    中文
                    <ChevronDown size={13} />
                </span>
                <span className="sms-user">
                    <span className="sms-avatar">b</span>
                    bohua
                </span>
            </div>
        </header>
    );
}

export default function Layout({ children, activePage = 'sms', onNavigate }: LayoutProps) {
    return (
        <div className="sms-app">
            <Sidebar activePage={activePage} onNavigate={onNavigate} />
            <div className="sms-main">
                <Header activePage={activePage} />
                <main className="sms-content">{children}</main>
            </div>
        </div>
    );
}

export const TAB_ICONS = {
    template: MessageSquareText,
    record: MessageCircle,
    report: AudioLines,
    notify: Bell,
    chat: MessagesSquare,
    call: PhoneCall,
};
