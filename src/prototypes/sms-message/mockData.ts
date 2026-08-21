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
    /** 送达状态：回执中 / 已送达 / 未送达 / 回执超时 / --（无回执，含失败、暂无数据、历史） */
    deliveryStatus: string;
    /** 关联补发批次 ID（无批次则无） */
    batchId?: string;
    /** 补发类型：原始短信 / 人工补发 / 计划内自动补发 */
    resendType: '原始短信' | '人工补发' | '计划内自动补发';
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
        batchId: '20260812003',
        resendType: '人工补发',
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
        batchId: '20260812003',
        resendType: '人工补发',
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
        batchId: '20260812002',
        resendType: '人工补发',
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
        batchId: '20260812002',
        resendType: '人工补发',
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
        resendType: '原始短信',
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
        deliveryStatus: '--',
        batchId: '20260812004',
        resendType: '人工补发',
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
        batchId: '20260812002',
        resendType: '人工补发',
        isHistory: false,
        solId: '-',
    },
    {
        index: 8,
        sendTime: '2026-08-13 10:02:11',
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
        batchId: 'A20260813001',
        resendType: '计划内自动补发',
        isHistory: false,
        solId: '-',
    },
    {
        index: 9,
        sendTime: '2026-08-13 10:02:30',
        businessId: 'MTN_UG_Account_id',
        planName: '-',
        groupName: '-',
        phone: '4U4I9nOEeJsD6sIIYO6MCw==',
        contentType: '营销类',
        content:
            'Congratulations! You qualify for a Momo Advance limit of UGX #total_quota_amount#. ID: #overdraft_id#. Use the momo app or dial *165*30# to opt in.',
        sender: 'MOMOADVANCE',
        notifyStatus: '1',
        deliveryStatus: '--',
        batchId: 'A20260813001',
        resendType: '计划内自动补发',
        isHistory: false,
        solId: '-',
    },
    {
        index: 10,
        sendTime: '2026-08-13 09:30:00',
        businessId: 'MTN_UG_Account_id',
        planName: '新客激活活动',
        groupName: '-',
        phone: 'tUAH5d+eIqihMk6w7bfD7w==',
        contentType: '服务类',
        content:
            "Y'ello! Your MoMo Advance has been successfully activated...",
        sender: 'MOMOADVANCE',
        notifyStatus: '2',
        deliveryStatus: '已送达',
        batchId: 'A20260813002',
        resendType: '计划内自动补发',
        isHistory: false,
        solId: '-',
    },
    {
        index: 11,
        sendTime: '2026-08-13 09:31:12',
        businessId: 'MTN_UG_Account_id',
        planName: '新客激活活动',
        groupName: '-',
        phone: 'fMlMy9u5342709lpj03DYA==',
        contentType: '服务类',
        content:
            "Y'ello! Your MoMo Advance has been successfully activated...",
        sender: 'MOMOADVANCE',
        notifyStatus: '2',
        deliveryStatus: '回执超时',
        batchId: 'A20260813002',
        resendType: '计划内自动补发',
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

/** 黑名单：名单库资产，供人工补发 / 自动补发 / 运营计划前置校验使用 */
export interface BlacklistRow {
    index: number;
    phone: string;
    businessId: string;
    addTime: string;
    effectiveTime: string;
    expireTime: string;
    status: 'active' | 'expired';
    remark: string;
}

export const blacklistRows: BlacklistRow[] = [
    { index: 1, phone: '2567****1234', businessId: 'MTN_UG_Account_id', addTime: '2026-08-12 10:24:18', effectiveTime: '2026-08-12 10:24:18', expireTime: '永久', status: 'active', remark: 'xxxxx' },
    { index: 2, phone: '2567****8901', businessId: 'MTN_UG_Account_id', addTime: '2026-08-12 09:41:02', effectiveTime: '2026-08-12 09:41:02', expireTime: '2026-09-30 23:59:59', status: 'active', remark: 'xxxxx' },
    { index: 3, phone: '2567****3456', businessId: 'MTN_UG_Product_id', addTime: '2026-08-11 17:08:45', effectiveTime: '2026-08-11 17:08:45', expireTime: '永久', status: 'active', remark: 'xxxxx' },
    { index: 4, phone: '2567****7890', businessId: 'MTN_UG_Account_id', addTime: '2026-08-11 15:32:19', effectiveTime: '2026-08-11 15:32:19', expireTime: '永久', status: 'active', remark: 'xxxxx' },
    { index: 5, phone: '2567****2345', businessId: 'MTN_UG_Account_id', addTime: '2026-08-10 11:15:37', effectiveTime: '2026-08-10 11:15:37', expireTime: '2026-08-20 23:59:59', status: 'active', remark: 'xxxxx' },
    { index: 6, phone: '2567****6789', businessId: 'MTN_UG_Product_id', addTime: '2026-08-10 09:02:11', effectiveTime: '2026-08-10 09:02:11', expireTime: '永久', status: 'active', remark: 'xxxxx' },
    { index: 7, phone: '2567****0123', businessId: 'MTN_UG_Account_id', addTime: '2026-08-09 16:47:53', effectiveTime: '2026-08-09 16:47:53', expireTime: '2026-09-15 23:59:59', status: 'active', remark: 'xxxxx' },
    { index: 8, phone: '2567****4567', businessId: 'MTN_UG_Account_id', addTime: '2026-08-08 14:20:08', effectiveTime: '2026-08-08 14:20:08', expireTime: '永久', status: 'active', remark: 'xxxxx' },
    { index: 9, phone: '2567****8901', businessId: 'MTN_UG_Product_id', addTime: '2026-08-07 10:33:26', effectiveTime: '2026-08-07 10:33:26', expireTime: '2026-08-07 23:59:59', status: 'expired', remark: 'xxxxx' },
    { index: 10, phone: '2567****2345', businessId: 'MTN_UG_Account_id', addTime: '2026-08-06 18:55:44', effectiveTime: '2026-08-06 18:55:44', expireTime: '永久', status: 'active', remark: 'xxxxx' },
    { index: 11, phone: '2567****6789', businessId: 'MTN_UG_Account_id', addTime: '2026-08-05 12:08:31', effectiveTime: '2026-08-05 12:08:31', expireTime: '2026-08-12 23:59:59', status: 'expired', remark: 'xxxxx' },
    { index: 12, phone: '2567****0123', businessId: 'MTN_UG_Product_id', addTime: '2026-08-04 09:14:57', effectiveTime: '2026-08-04 09:14:57', expireTime: '永久', status: 'active', remark: 'xxxxx' },
];
