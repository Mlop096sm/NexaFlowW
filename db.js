/**
 * db.js — 邺山村新闻中心 数据库模块
 * 使用 better-sqlite3，数据文件位于 data/village.db
 * 首次启动自动建表并写入种子数据（现有页面内容 + 补充示例数据）
 */
'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'village.db'));
db.pragma('journal_mode = WAL');

// ---------- 建表 ----------
db.exec(`
CREATE TABLE IF NOT EXISTS news (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  category     TEXT    NOT NULL DEFAULT 'village',
  source       TEXT    NOT NULL DEFAULT '',
  publish_date TEXT    NOT NULL DEFAULT '',
  summary      TEXT    NOT NULL DEFAULT '',
  content      TEXT    NOT NULL DEFAULT '',
  is_top       INTEGER NOT NULL DEFAULT 0,
  is_secret    INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_publish  ON news(publish_date DESC);
`);

// ---------- 分类字典 ----------
const CATEGORIES = {
  village: '村务',
  education: '教育',
  livelihood: '民生',
  revitalization: '乡村振兴'
};

// ---------- 种子数据 ----------
// 前 5 条与现有 index.html 内容一致（原文保留），后 8 条为补充示例数据
const SEED_NEWS = [
  {
    title: '正式取消晚自习，减少学生压力',
    category: 'education',
    source: '邺山村教育局',
    publish_date: '2019-11-11',
    summary: '为进一步贯彻落实“双减”政策，保障青少年身心健康发展，经邺山村教育局研究决定，自即日起，全村中小学正式取消强制晚自习，将课余时间还给学生与家庭。此举旨在减轻学生课业负担，得到了广大学生及家长的一致好评。',
    content: '为进一步贯彻落实“双减”政策，保障青少年身心健康发展，经邺山村教育局研究决定，自即日起，全村中小学正式取消强制晚自习，将课余时间还给学生与家庭。\n\n此举旨在减轻学生课业负担，得到了广大学生及家长的一致好评。各学校将根据实际情况，合理布置课后作业，确保学生在校内学足学好，课后有充足的休息和自主发展时间。',
    is_top: 1
  },
  {
    title: '学校取消跑操，为学生减负',
    category: 'education',
    source: '邺山村教育局',
    publish_date: '2023-12-11',
    summary: '为切实减轻学生课业与体能负担，保障学生充足睡眠与休息时间，邺山村教育局发布通知，即日起全面取消辖区内各中小学的强制早操及跑操活动，鼓励学生根据自身情况参与体育锻炼。',
    content: '为切实减轻学生课业与体能负担，保障学生充足睡眠与休息时间，邺山村教育局发布通知，即日起全面取消辖区内各中小学的强制早操及跑操活动。\n\n通知指出，各校应因地制宜，鼓励学生根据自身情况，在课间或体育课上参与适宜的体育锻炼。这一举措旨在引导学生养成自觉锻炼的习惯，而非强制性的形式主义。',
    is_top: 1
  },
  {
    title: '警方通报：村民陈宇在后山失踪，调查仍在进行中',
    category: 'livelihood',
    source: '综合新闻',
    publish_date: '2020-11-12',
    summary: '在早些时候，警方通报，陈宇在后山失踪，但警方未找到陈宇。浙江政府走访后可能与当地传说██爷有关。目前，相关调查仍在进行中，请广大村民注意出行安全，切勿独自进入未开发区域。',
    content: '在早些时候，警方通报，陈宇在后山失踪，但警方未找到陈宇。浙江政府走访后可能与当地传说██爷有关。\n\n目前，相关调查仍在进行中。当地政府呼吁广大村民注意出行安全，切勿独自深入未开发的林区与后山地带。如有相关线索，请及时与村委会或警方联系。',
    is_top: 0
  },
  {
    title: '邺山村2025年度财政收支预算公开',
    category: 'village',
    source: '邺山村村委会',
    publish_date: '2025-01-05',
    summary: '根据村务公开制度，现将邺山村2025年度财务收支预算进行公示。2025年度预计总收入约 122.7 亿元（含茶叶、竹木及上级拨款）；预计总支出约 876 万元（用于道路硬化与小学修缮）。详细报表请前往村委会公告栏查阅。',
    content: '根据村务公开制度，现将邺山村2025年度财务收支预算进行公示。\n\n2025年度预计总收入约 122.7 亿元（含茶叶、竹木及上级拨款）；预计总支出约 876 万元（用于道路硬化与小学修缮）。详细报表请前往村委会公告栏查阅。',
    is_top: 0
  },
  {
    title: '关于2024年秋季学期小学招生入学工作的通知',
    category: 'education',
    source: '邺山村教育局',
    publish_date: '2024-05-20',
    summary: '根据上级教育部门统一部署，现将2024年秋季学期邺山村小学招生入学工作安排通知如下。请各位适龄儿童家长携带户口本、预防接种证等相关材料，于指定时间前往邺山村小学办理报名登记手续。',
    content: '根据上级教育部门统一部署，现将2024年秋季学期邺山村小学招生入学工作安排通知如下。\n\n请各位适龄儿童家长携带户口本、预防接种证等相关材料，于指定时间前往邺山村小学办理报名登记手续。具体时间与学区划分请关注后续详细公告。',
    is_top: 0
  },
  {
    title: '邺山村春茶开采，今年产量预计再创新高',
    category: 'revitalization',
    source: '邺山村村委会',
    publish_date: '2025-04-06',
    summary: '清明前后，邺山村千亩茶园迎来春茶采摘旺季。得益于去冬今春气候适宜与管护到位，今年春茶鲜叶产量预计较去年增长约一成，全村茶叶产业预计产值再创新高。',
    content: '清明前后，邺山村千亩茶园迎来春茶采摘旺季。得益于去冬今春气候适宜与管护到位，今年春茶鲜叶产量预计较去年增长约一成，全村茶叶产业预计产值再创新高。\n\n近年来，邺山村依托“公司+合作社+农户”模式，统一茶园管护标准与鲜叶收购价格，茶农收入稳步提升。首批“邺山云雾茶”已陆续上市。',
    is_top: 0
  },
  {
    title: '邺山村“茶叶+”农旅融合示范点通过市级验收',
    category: 'revitalization',
    source: '汀州市农业农村局',
    publish_date: '2025-06-18',
    summary: '日前，邺山村“茶叶+”农旅融合示范点顺利通过汀州市农业农村局组织的市级验收。示范点集茶园观光、制茶体验、民宿餐饮于一体，今年“五一”期间累计接待游客超五千人次。',
    content: '日前，邺山村“茶叶+”农旅融合示范点顺利通过汀州市农业农村局组织的市级验收。示范点集茶园观光、制茶体验、民宿餐饮于一体，今年“五一”期间累计接待游客超五千人次。\n\n下一步，邺山村将继续完善游客服务中心与配套设施，开发茶叶主题文创产品，带动更多村民在家门口就业增收。',
    is_top: 0
  },
  {
    title: '全村主干道硬化工程竣工，村容村貌焕然一新',
    category: 'village',
    source: '邺山村村委会',
    publish_date: '2025-03-28',
    summary: '历时四个月，邺山村主干道硬化工程于本月全部竣工。全村 6.2 公里主干道实现水泥路面全覆盖，配套排水沟与路灯同步完成，极大改善了村民出行条件。',
    content: '历时四个月，邺山村主干道硬化工程于本月全部竣工。全村 6.2 公里主干道实现水泥路面全覆盖，配套排水沟与路灯同步完成，极大改善了村民出行条件。\n\n村两委表示，2025 年将继续推进巷道硬化与庭院美化，进一步提升村容村貌，为乡村旅游发展打好基础。',
    is_top: 0
  },
  {
    title: '邺山村农家书屋获评市级示范书屋',
    category: 'revitalization',
    source: '汀州市文化和旅游局',
    publish_date: '2025-08-12',
    summary: '经申报与现场复核，邺山村农家书屋获评汀州市市级示范书屋。书屋现有藏书 8600 余册，常态化开展农技培训、亲子阅读等活动，成为村民家门口的“文化粮仓”。',
    content: '经申报与现场复核，邺山村农家书屋获评汀州市市级示范书屋。书屋现有藏书 8600 余册，常态化开展农技培训、亲子阅读等活动，成为村民家门口的“文化粮仓”。\n\n村里计划进一步拓展书屋功能，增设数字阅读区与电商直播角，让书香与茶香共同滋养邺山。',
    is_top: 0
  },
  {
    title: '暑期儿童托管班开班，解决村民后顾之忧',
    category: 'livelihood',
    source: '邺山村村委会',
    publish_date: '2025-07-15',
    summary: '为解决暑期学生看护难题，邺山村依托村党群服务中心开办暑期托管班，提供作业辅导、兴趣课程与安全看护服务，首期共有 42 名儿童报名参加。',
    content: '为解决暑期学生看护难题，邺山村依托村党群服务中心开办暑期托管班，提供作业辅导、兴趣课程与安全看护服务，首期共有 42 名儿童报名参加。\n\n托管班由返乡大学生志愿者与退休教师共同授课，课程涵盖书法、绘画、科普与安全自护教育，受到家长一致好评。',
    is_top: 0
  },
  // ---- 绝密档案（仅在首页“绝密档案区”展示） ----
  {
    title: '【内部调查通报】陈宇失踪案补充材料',
    category: 'livelihood',
    source: '内部调查',
    publish_date: '绝密：日期保密',
    summary: '在早些时候，警方通报，陈宇在后山失踪，但警方未找到陈宇。可能与当地传说██爷有关。本地居民证实疑似被献祭。',
    content: '在早些时候，警方通报，陈宇在后山失踪，但警方未找到陈宇。可能与当地传说██爷有关。\n\n本地居民证实疑似被献祭。\n\n绝密：日期保密',
    is_secret: 1
  },
  {
    title: '【村务财务审查】2025年度收支明细',
    category: 'village',
    source: '村务财务审查',
    publish_date: '2025-01-05',
    summary: '根据村务公开制度，现将邺山村2025年度财务收支预算进行公示。2025年度预计总收入约 122.7 亿元（含茶叶、竹木及上级拨款）；预计总支出约 876 万元。76%资金来自茶叶。',
    content: '根据村务公开制度，现将邺山村2025年度财务收支预算进行公示。\n\n2025年度预计总收入约 122.7 亿元（含茶叶、竹木及上级拨款）；预计总支出约 876 万元（用于道路硬化与小学修缮）。详细报表请前往村委会公告栏查阅。\n\n补充说明：76% 资金来自茶叶。',
    is_secret: 1
  },
  {
    title: '【商业调查】村内餐饮业态',
    category: 'livelihood',
    source: '商业调查',
    publish_date: '2020-11-04',
    summary: '本地蜜雪冰城非常火爆。',
    content: '本地蜜雪冰城非常火爆。',
    is_secret: 1
  }
];

// ---------- 初始化 ----------
function init() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM news').get().c;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO news (title, category, source, publish_date, summary, content, is_top, is_secret)
      VALUES (@title, @category, @source, @publish_date, @summary, @content, @is_top, @is_secret)
    `);
    const tx = db.transaction(() => {
      for (const n of SEED_NEWS) {
        insert.run(Object.assign({ is_top: 0, is_secret: 0 }, n));
      }
    });
    tx();
    console.log('[db] 已写入种子数据 ' + SEED_NEWS.length + ' 条');
  }
  console.log('[db] 数据库就绪：data/village.db');
}

init();

module.exports = { db, CATEGORIES };
