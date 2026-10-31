/**
 * config.js — 邺山村新闻中心 站点配置
 * 修改端口、管理员账号密码都在这里
 */
'use strict';

module.exports = {
  // 站点服务端口（20000-39999 区间）
  PORT: 32800,
  // 管理后台账号（可在本地自行修改）
  ADMIN_USER: 'admin',
  ADMIN_PASS: 'admin123',
  // 会话有效期（毫秒），默认 12 小时
  SESSION_TTL: 12 * 60 * 60 * 1000,
  // 新闻列表每页条数
  PAGE_SIZE: 8
};
