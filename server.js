/**
 * server.js - 邺山村新闻中心 服务端入口
 * Express + EJS 服务端渲染，SQLite 持久化
 * 启动：npm start  ->  http://localhost:32800
 */
'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const config = require('./config');
const { db, CATEGORIES } = require('./db');

const app = express();

// ---------- 基础配置 ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- 视图辅助函数 ----------
app.locals.siteName = '邺山村新闻中心';
app.locals.categories = CATEGORIES;
app.locals.catName = (code) => CATEGORIES[code] || code || '未分类';
app.locals.fmtDate = (d) => String(d || '');
app.locals.paragraphs = (text) => String(text || '').split(/\n+/).filter((p) => p.trim());
app.locals.truncate = (text, n) => {
  const s = String(text || '');
  return s.length > n ? s.slice(0, n) + '…' : s;
};

// ---------- 管理后台会话（内存令牌 + HttpOnly Cookie） ----------
const sessions = new Map(); // token -> { user, ts }

function newSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { user, ts: Date.now() });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() - s.ts > config.SESSION_TTL) {
    sessions.delete(token);
    return null;
  }
  s.ts = Date.now(); // 滑动续期
  return s;
}

// 管理后台路由守卫（附带 CSRF 令牌）
function requireAdmin(req, res, next) {
  const session = getSession(req.cookies ? req.cookies.ysh_admin : null);
  if (!session) {
    return res.redirect('/admin/login');
  }
  res.locals.adminUser = session.user;
  res.locals.csrfToken = req.cookies.ysh_admin;
  next();
}

// 简单 Cookie 读取（避免额外依赖）
app.use((req, res, next) => {
  req.cookies = {};
  const raw = req.headers.cookie;
  if (raw) {
    for (const part of raw.split(';')) {
      const idx = part.indexOf('=');
      if (idx > -1) req.cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  next();
});

function setAdminCookie(res, token) {
  res.setHeader('Set-Cookie', 'ysh_admin=' + encodeURIComponent(token) + '; HttpOnly; Path=/; SameSite=Lax; Max-Age=' + Math.floor(config.SESSION_TTL / 1000));
}

function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', 'ysh_admin=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
}

// ---------- 公开页面：首页 ----------
app.get('/', (req, res) => {
  const tops = db.prepare('SELECT * FROM news WHERE is_secret = 0 AND is_top = 1 ORDER BY id ASC').all();
  const others = db.prepare('SELECT * FROM news WHERE is_secret = 0 AND is_top = 0 ORDER BY publish_date DESC, id DESC').all();
  const secrets = db.prepare('SELECT * FROM news WHERE is_secret = 1 ORDER BY id ASC').all();
  const sidebarLatest = db.prepare('SELECT * FROM news WHERE is_secret = 0 ORDER BY publish_date DESC, id DESC LIMIT 3').all();
  const missingCase = db.prepare("SELECT * FROM news WHERE is_secret = 0 AND title LIKE '%陈宇%' ORDER BY id ASC LIMIT 1").get();
  // 弹窗数据（服务端渲染为 JSON，供前端弹窗使用）
  const modalData = {};
  tops.concat(others, secrets).forEach((n) => {
    modalData[n.id] = {
      title: n.title,
      meta: '来源：' + n.source + ' | 发布时间：' + n.publish_date,
      paras: app.locals.paragraphs(n.content)
    };
  });
  res.render('index', {
    title: '首页',
    active: 'home',
    tops,
    others,
    secrets,
    sidebarLatest,
    missingCase,
    modalData
  });
});

// ---------- 公开页面：新闻中心（分类 / 搜索 / 分页） ----------
app.get('/news', (req, res) => {
  const cat = CATEGORIES[req.query.cat] ? req.query.cat : '';
  const kw = String(req.query.q || '').trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage = config.PAGE_SIZE;

  let where = 'is_secret = 0';
  const params = [];
  if (cat) {
    where += ' AND category = ?';
    params.push(cat);
  }
  if (kw) {
    where += ' AND (title LIKE ? OR summary LIKE ?)';
    params.push('%' + kw + '%', '%' + kw + '%');
  }

  const total = db.prepare('SELECT COUNT(*) AS c FROM news WHERE ' + where).get(...params).c;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, pages);
  const list = db.prepare('SELECT * FROM news WHERE ' + where + ' ORDER BY is_top DESC, publish_date DESC, id DESC LIMIT ? OFFSET ?')
    .all(...params, perPage, (current - 1) * perPage);

  res.render('news', { title: '新闻中心', active: 'news', list, cat, kw, page: current, pages, total });
});

// ---------- 公开页面：新闻详情 ----------
app.get('/news/:id', (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return next();
  const item = db.prepare('SELECT * FROM news WHERE id = ? AND is_secret = 0').get(id);
  if (!item) return next();
  const related = db.prepare('SELECT * FROM news WHERE is_secret = 0 AND category = ? AND id != ? ORDER BY publish_date DESC, id DESC LIMIT 4')
    .all(item.category, item.id);
  res.render('detail', { title: item.title, active: 'news', item, related });
});

// ---------- 公开页面：乡村振兴 ----------
app.get('/revitalize', (req, res) => {
  const list = db.prepare('SELECT * FROM news WHERE is_secret = 0 AND category = ? ORDER BY publish_date DESC, id DESC').all('revitalization');
  res.render('revitalize', { title: '乡村振兴', active: 'revitalize', list });
});

// ---------- 公开页面：村情简介 ----------
app.get('/village', (req, res) => {
  res.render('village', { title: '村情简介', active: 'village' });
});

// ---------- 管理后台 ----------
app.get('/admin/login', (req, res) => {
  const session = getSession(req.cookies.ysh_admin);
  if (session) return res.redirect('/admin');
  res.render('admin/login', { title: '管理员登录', error: null });
});

app.post('/admin/login', (req, res) => {
  const user = String(req.body.username || '').trim();
  const pass = String(req.body.password || '');
  if (user === config.ADMIN_USER && pass === config.ADMIN_PASS) {
    const token = newSession(user);
    setAdminCookie(res, token);
    return res.redirect('/admin');
  }
  res.status(401).render('admin/login', { title: '管理员登录', error: '用户名或密码错误' });
});

app.get('/admin/logout', (req, res) => {
  const token = req.cookies.ysh_admin;
  if (token) sessions.delete(token);
  clearAdminCookie(res);
  res.redirect('/admin/login');
});

app.get('/admin', requireAdmin, (req, res) => {
  const cat = CATEGORIES[req.query.cat] ? req.query.cat : '';
  const where = cat ? 'WHERE category = ?' : '';
  const params = cat ? [cat] : [];
  const list = db.prepare('SELECT * FROM news ' + where + ' ORDER BY is_secret DESC, is_top DESC, publish_date DESC, id DESC').all(...params);
  const counts = db.prepare('SELECT category, COUNT(*) AS c FROM news GROUP BY category').all();
  res.render('admin/list', { title: '新闻管理', active: 'admin', list, cat, counts });
});

// 编辑表单（新增 / 修改）
app.get('/admin/new', requireAdmin, (req, res) => {
  res.render('admin/edit', { title: '新增新闻', item: null, error: null });
});

app.get('/admin/edit/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
  if (!item) return res.redirect('/admin');
  res.render('admin/edit', { title: '编辑新闻', item, error: null });
});

// 保存（新增 / 更新）
app.post('/admin/save', requireAdmin, (req, res) => {
  const body = req.body;
  if (body._token !== res.locals.csrfToken) {
    return res.status(403).send('令牌校验失败，请返回重试');
  }
  const id = parseInt(body.id, 10) || 0;
  const title = String(body.title || '').trim();
  const category = CATEGORIES[body.category] ? body.category : 'village';
  const source = String(body.source || '').trim().slice(0, 80);
  const publish_date = String(body.publish_date || '').trim().slice(0, 40);
  const summary = String(body.summary || '').trim().slice(0, 500);
  const content = String(body.content || '').trim();
  const is_top = body.is_top === 'on' ? 1 : 0;
  const is_secret = body.is_secret === 'on' ? 1 : 0;

  if (!title || !content) {
    return res.status(400).render('admin/edit', {
      title: id ? '编辑新闻' : '新增新闻',
      item: { title, category, source, publish_date, summary, content, is_top, is_secret, id },
      error: !title ? '标题不能为空' : '正文内容不能为空'
    });
  }

  if (id > 0) {
    db.prepare('UPDATE news SET title=?, category=?, source=?, publish_date=?, summary=?, content=?, is_top=?, is_secret=? WHERE id=?')
      .run(title, category, source, publish_date, summary, content, is_top, is_secret, id);
  } else {
    db.prepare('INSERT INTO news (title, category, source, publish_date, summary, content, is_top, is_secret) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(title, category, source, publish_date, summary, content, is_top, is_secret);
  }
  res.redirect('/admin');
});

// 删除
app.post('/admin/delete/:id', requireAdmin, (req, res) => {
  if (req.body._token !== res.locals.csrfToken) return res.status(403).send('令牌校验失败');
  const id = parseInt(req.params.id, 10);
  db.prepare('DELETE FROM news WHERE id = ?').run(id);
  res.redirect('/admin');
});

// 置顶 / 绝密 开关
app.post('/admin/toggle/:id', requireAdmin, (req, res) => {
  if (req.body._token !== res.locals.csrfToken) return res.status(403).send('令牌校验失败');
  const id = parseInt(req.params.id, 10);
  const field = req.body.field === 'is_secret' ? 'is_secret' : 'is_top';
  const cur = db.prepare('SELECT ' + field + ' AS v FROM news WHERE id = ?').get(id);
  if (cur) {
    db.prepare('UPDATE news SET ' + field + ' = ? WHERE id = ?').run(cur.v ? 0 : 1, id);
  }
  res.redirect('/admin');
});

// ---------- 404 / 错误处理 ----------
app.use((req, res) => {
  res.status(404).render('404', { title: '页面未找到' });
});

app.use((err, req, res, next) => {
  console.error('[server] 未处理异常：', err);
  res.status(500).send('服务器内部错误，请查看控制台日志');
});

// ---------- 启动 ----------
function listen(port) {
  const server = app.listen(port, () => {
    console.log('');
    console.log('  邺山村新闻中心已启动：http://localhost:' + port);
    console.log('  管理后台：http://localhost:' + port + '/admin  （账号 ' + config.ADMIN_USER + ' / ' + config.ADMIN_PASS + '）');
    console.log('');
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('  端口 ' + port + ' 被占用，尝试 ' + (port + 1) + ' ...');
      listen(port + 1);
    } else {
      console.error('  启动失败：', err.message);
      process.exit(1);
    }
  });
}

listen(config.PORT);
