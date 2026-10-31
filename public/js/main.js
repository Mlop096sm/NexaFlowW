/* 邺山村新闻中心 - 全站公共脚本 */
(function () {
  'use strict';

  // ---------- Toast 轻提示 ----------
  function showToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2200);
  }
  window.showToast = showToast;

  // ---------- 详情弹窗（首页使用，数据来自服务端渲染的 NEWS_DATA） ----------
  var modalOverlay = document.getElementById('newsModal');

  function openModal(id) {
    if (!modalOverlay || !window.NEWS_DATA) return;
    var data = window.NEWS_DATA[id];
    if (!data) return;
    document.getElementById('modalTitle').textContent = data.title;
    document.getElementById('modalMeta').textContent = data.meta;
    var body = document.getElementById('modalBody');
    body.innerHTML = '';
    data.paras.forEach(function (p) {
      var el = document.createElement('p');
      el.textContent = p;
      body.appendChild(el);
    });
    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  window.openModal = openModal;

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }
  window.closeModal = closeModal;

  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  // 首页可点击卡片 → 弹窗
  document.querySelectorAll('.main-news .clickable, .clickable-side, .secret-block').forEach(function (el) {
    el.addEventListener('click', function () {
      var id = el.getAttribute('data-id');
      if (id) openModal(id);
    });
  });

  // ---------- 绝密档案区解锁（演示密码，可在后台把条目改成非绝密后不再展示） ----------
  var lockScreen = document.getElementById('lockScreen');
  var secretContent = document.getElementById('secretContent');
  if (lockScreen && secretContent) {
    window.unlockArchive = function () {
      var input = window.prompt('请输入绝密档案访问密码：');
      if (input === null) return;
      if (input.trim() === 'ysdhancun') {
        lockScreen.style.display = 'none';
        secretContent.style.display = 'block';
        showToast('验证通过，档案已解密');
      } else {
        showToast('密码错误，无法访问机密档案');
      }
    };
  }

  // ---------- 管理后台：删除前确认 ----------
  document.querySelectorAll('form.confirm-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm('确定执行该操作吗？')) e.preventDefault();
    });
  });
})();
