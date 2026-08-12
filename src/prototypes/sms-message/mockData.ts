/**
 * 短信页面原型数据
 * 数据来源：AI-短信-complete 数据包 content.md（UAT 环境真实数据）
 */

export interface RecordRow {
    index: number;
    sendTime: string;
    businessId: string;
    planName: string;
    groupName: string;
    phone: string;
    contentType: string;
    content: string;
    sender: string;
    notifyStatus: '0' | '1' | '2';
    /** 送达状态：回执中 / 已送达 / 未送达 / 回执超时 / -- / 未知 */
    deliveryStatus: string;
    /** 是否历史短信（历史短信送达状态一律展示 --） */
    isHistory: boolean;
    solId: string;
}

export const recordRows: RecordRow[] = [
    {
        index: 1,
        sendTime: '2026-08-11 12:49:39',
        businessId: 'MTN_UG_Account_id',
        planName: '-',
        groupName: '-',
        phone: 'n6cHZ+wHVUE1uN3IqCAedg==',
        contentType: '营销类',
        content:
            'Congratulations! You qualify for a Momo Advance limit of UGX #total_quota_amount#. ID: #overdraft_id#. Use the momo app or dial *165*30# to opt in.',
        sender: 'MOMOADVANCE',
        notifyStatus: '2',
        deliveryStatus: '回执中',
        isHistory: false,
        solId: '-',
    },
    {
        index: 2,
        sendTime: '2026-08-07 09:54:10',
        businessId: 'MTN_UG_Account_id',
        planName: '-',
        groupName: '-',
        phone: '4U4I9nOEeJsD6sIIYO6MCw==',
        contentType: '营销类',
        content:
            'Congratulations! You qualify for a Momo Advance limit of UGX #total_quota_amount#. ID: #overdraft_id#. Use the momo app or dial *165*30# to opt in.',
        sender: 'MOMOADVANCE',
        notifyStatus: '2',
        deliveryStatus: '已送达',
        isHistory: false,
        solId: '-',
    },
    {
        index: 3,
        sendTime: '2026-08-06 13:29:03',
        businessId: 'MTN_UG_Account_id',
        planName: '-',
        groupName: '-',
        phone: 'tUAH5d+eIqihMk6w7bfD7w==',
        contentType: '营销类',
        content:
            'Congratulations! You qualify for a Momo Advance limit of UGX #total_quota_amount#. ID: #overdraft_id#. Use the momo app or dial *165*30# to opt in.',
        sender: 'MOMOADVANCE',
        notifyStatus: '2',
        deliveryStatus: '未送达',
        isHistory: false,
        solId: '-',
    },
    {
        index: 4,
        sendTime: '2026-08-06 13:28:36',
        businessId: 'MTN_UG_Account_id',
        planName: '-',
        groupName: '-',
        phone: 'tUAH5d+eIqihMk6w7bfD7w==',
        contentType: '营销类',
        content:
            'Congratulations! You qualify for a Momo Advance limit of UGX #total_quota_amount#. ID: #overdraft_id#. Use the momo app or dial *165*30# to opt in.',
        sender: 'MOMOADVANCE',
        notifyStatus: '2',
        deliveryStatus: '回执超时',
        isHistory: false,
        solId: '-',
    },
    {
        index: 5,
        sendTime: '2026-07-20 10:00:00',
        businessId: 'MTN_UG_Account_id',
        planName: '-',
        groupName: '-',
        phone: 'qO3Vx8yC2sTpR9wLk5eHuA==',
        contentType: '营销类',
        content:
            'Congratulations! You qualify for a Momo Advance limit of UGX #total_quota_amount#. ID: #overdraft_id#. Use the momo app or dial *165*30# to opt in.',
        sender: 'MOMOADVANCE',
        notifyStatus: '2',
        deliveryStatus: '--',
        isHistory: true,
        solId: '-',
    },
    {
        index: 6,
        sendTime: '2026-08-06 13:28:03',
        businessId: 'MTN_UG_Account_id',
        planName: '-',
        groupName: '-',
        phone: 'tUAH5d+eIqihMk6w7bfD7w==',
        contentType: '营销类',
        content:
            'Congratulations! You qualify for a Momo Advance limit of UGX #total_quota_amount#. ID: #overdraft_id#. Use the momo app or dial *165*30# to opt in.',
        sender: 'MOMOADVANCE',
        notifyStatus: '0',
        deliveryStatus: '未知',
        isHistory: false,
        solId: '-',
    },
    {
        index: 7,
        sendTime: '2026-08-06 13:28:14',
        businessId: 'MTN_UG_Account_id',
        planName: '-',
        groupName: '-',
        phone: 'tUAH5d+eIqihMk6w7bfD7w==',
        contentType: '营销类',
        content:
            'Congratulations! You qualify for a Momo Advance limit of UGX #total_quota_amount#. ID: #overdraft_id#. Use the momo app or dial *165*30# to opt in.',
        sender: 'MOMOADVANCE',
        notifyStatus: '1',
        deliveryStatus: '--',
        isHistory: false,
        solId: '-',
    },
];

export interface TemplateRow {
    index: number;
    createTime: string;
    updateTime: string;
    businessId: string;
    templateName: string;
    triggerWay: string;
    supplierType: string;
    contentType: string;
    content: string;
    operator: string;
    status: string;
}

export const templateRows: TemplateRow[] = [];

export interface ReportRow {
    index: number;
    sendTime: string;
    businessId: string;
    planName: string;
    groupName: string;
    todayCount: number;
    yesterdayCount: number;
}

export const reportRows: ReportRow[] = [
    {
        index: 1,
        sendTime: '2026-08-11',
        businessId: 'MTN_UG_Account_id',
        planName: '计划A',
        groupName: '全部用户',
        todayCount: 32,
        yesterdayCount: 28,
    },
    {
        index: 2,
        sendTime: '2026-08-10',
        businessId: 'MTN_UG_Account_id',
        planName: '计划A',
        groupName: '全部用户',
        todayCount: 28,
        yesterdayCount: 31,
    },
    {
        index: 3,
        sendTime: '2026-08-09',
        businessId: 'MTN_UG_Account_id',
        planName: '计划A',
        groupName: '全部用户',
        todayCount: 31,
        yesterdayCount: 26,
    },
];

/** 近 7 天短信发送数量 */
export const sendTrend = [
    { date: '2026-08-05', count: 96 },
    { date: '2026-08-06', count: 132 },
    { date: '2026-08-07', count: 116 },
    { date: '2026-08-08', count: 88 },
    { date: '2026-08-09', count: 104 },
    { date: '2026-08-10', count: 121 },
    { date: '2026-08-11', count: 138 },
];

export const reportSummary = {
    totalCount: 348,
    successCount: 118,
    failCount: 230,
    waitCount: 0,
    arriveRate: 33.9,
    totalPrice: 0,
};

export const contentTypeOptions = ['请选择', '营销类', '通知类', '服务类'];
export const statusOptions = [
    { value: '2', label: '成功' },
    { value: '1', label: '失败' },
    { value: '0', label: '暂无数据' },
];
