(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== НАСТРОЙКА СБОРА ЗАЯВОК =====
   * method: 'none' | 'googlesheets' | 'formspree' | 'telegram' | 'telegram-direct'
   * После развёртывания Apps Script вставьте URL веб-приложения в sheetsUrl.
   */
  var CONFIG = {
    method: 'googlesheets',
    sheetsUrl: 'https://script.google.com/macros/s/AKfycbwVhvPY-y2NNfQvJ4sU6au-MhwCrMh9pi55ONX1H_jlEWWBk-RHjfrcmELAPm_Z7REE/exec',
    formspreeUrl: '',
    telegramUrl: '',
    telegramBotToken: '',
    telegramChatId: ''
  };

  function sendLead(data) {
    var p;
    if (CONFIG.method === 'googlesheets' && CONFIG.sheetsUrl) {
      p = fetch(CONFIG.sheetsUrl, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } else if (CONFIG.method === 'formspree' && CONFIG.formspreeUrl) {
      p = fetch(CONFIG.formspreeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
    } else if (CONFIG.method === 'telegram' && CONFIG.telegramUrl) {
      p = fetch(CONFIG.telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else if (CONFIG.method === 'telegram-direct' && CONFIG.telegramBotToken) {
      var text = encodeURIComponent(
        'Заявка MARO\nИмя: ' + data.first_name +
        '\nФамилия: ' + data.last_name +
        '\nEmail: ' + data.email +
        '\nИсточник: ' + data.source
      );
      p = fetch('https://api.telegram.org/bot' + CONFIG.telegramBotToken +
        '/sendMessage?chat_id=' + CONFIG.telegramChatId + '&text=' + text);
    } else {
      p = Promise.resolve();
      if (window.console) console.log('MARO lead (demo mode):', data);
    }
    return p;
  }

  /* ===== Reveal при скролле ===== */
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !prefersReduced) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ===== Parallax ===== */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;

  function applyParallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      var rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      var center = rect.top + rect.height / 2 - vh / 2;
      var offset = center * speed * -1;
      var bg = el.querySelector('.feature-bg');
      var target = bg || el;
      target.style.transform = 'translate3d(0,' + offset + 'px,0)';
    });
    ticking = false;
  }

  function requestParallax() {
    if (!ticking && !prefersReduced) {
      window.requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }

  if (parallaxEls.length && !prefersReduced) {
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax, { passive: true });
    applyParallax();
  }

  /* ===== Шапка при скролле ===== */
  var header = document.querySelector('.site-header');
  var headerScrolled = function () {
    header.classList.toggle('scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', headerScrolled, { passive: true });
  headerScrolled();

  /* ===== Модалки: общие функции ===== */
  var openModal = function (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  var closeModal = function (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  var bindModal = function (modal, openSelector) {
    var opener = document.querySelector(openSelector);
    if (opener) opener.addEventListener('click', function () { openModal(modal); });
    modal.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', function () { closeModal(modal); });
    });
  };

  /* ===== Модалка заявки ===== */
  var signupModal = document.getElementById('signup-modal');
  bindModal(signupModal, '#signup-open');

  var signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!signupForm.checkValidity()) {
        signupForm.reportValidity();
        return;
      }
      var data = {
        first_name: signupForm.elements.first_name.value.trim(),
        last_name: signupForm.elements.last_name.value.trim(),
        email: signupForm.elements.email.value.trim(),
        source: 'signup-form'
      };
      sendLead(data);
      signupForm.hidden = true;
      document.getElementById('signup-success').hidden = false;
    });
  }

  /* ===== Модалка теста ===== */
  var quizModal = document.getElementById('quiz-modal');
  var quizEl = document.getElementById('quiz');
  var questionEl = document.getElementById('quiz-question');
  var optionsEl = document.getElementById('quiz-options');
  var resultEl = document.getElementById('quiz-result');
  var barEl = document.getElementById('quiz-bar');
  var typeEl = document.getElementById('quiz-type');
  var descEl = document.getElementById('quiz-desc');

  var questions = [
    {
      q: 'Какое украшение вам ближе?',
      options: ['Тонкая минималистичная цепочка', 'Крупный камень неправильной формы', 'Тёплая латунь вместо холодного серебра', 'Яркий акцентный кулон']
    },
    {
      q: 'С чем ассоциируется ваш момент?',
      options: ['Новая глава', 'Запоминание важной даты', 'Подарок близкому', 'Просто «моё» настроение']
    },
    {
      q: 'Как вы носите украшения?',
      options: ['Каждый день, почти не снимаю', 'По настроению и поводу', 'Только значимые вещи', 'Люблю менять и сочетать']
    },
    {
      q: 'Что для вас главное?',
      options: ['Уникальность — такой вещи больше нет', 'Смысл и история', 'Качество и ручная работа', 'Скорость изготовления']
    }
  ];

  var types = [
    { t: 'Тонкий минимализм', d: 'Вам подойдут лаконичные цепочки и геометрия — вещи, которые говорят «мне не нужно доказывать».' },
    { t: 'Смелый характер', d: 'Крупные камни неправильной формы — вы не вписываетесь в рамки, и это ваш стиль.' },
    { t: 'Тёплая натура', d: 'Латунь, янтарь и мягкие тона — вы за живое, а не за идеальное.' },
    { t: 'Яркий акцент', d: 'Акцентные кулоны и авторские формы — украшение, которое начинает разговор.' }
  ];

  var currentQuestion = 0;
  var answers = [];

  var openQuiz = function () {
    openModal(quizModal);
    currentQuestion = 0;
    answers = [];
    resultEl.hidden = true;
    quizEl.hidden = false;
    renderQuestion();
  };

  function renderQuestion() {
    var item = questions[currentQuestion];
    questionEl.textContent = item.q;
    optionsEl.innerHTML = '';
    barEl.style.width = (currentQuestion / questions.length) * 100 + '%';

    item.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', function () {
        answers.push(opt);
        if (currentQuestion + 1 < questions.length) {
          currentQuestion++;
          renderQuestion();
        } else {
          showResult();
        }
      });
      optionsEl.appendChild(btn);
    });
  }

  function showResult() {
    barEl.style.width = '100%';
    var idx = hashString(answers.join('|')) % types.length;
    typeEl.textContent = types[idx].t;
    descEl.textContent = types[idx].d;
    quizEl.hidden = true;
    resultEl.hidden = false;
  }

  function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  var quizOpen = document.getElementById('quiz-open');
  if (quizOpen) quizOpen.addEventListener('click', openQuiz);

  var footerQuiz = document.getElementById('footer-quiz');
  if (footerQuiz) footerQuiz.addEventListener('click', function (e) { e.preventDefault(); openQuiz(); });

  quizModal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', function () { closeModal(quizModal); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (signupModal.classList.contains('open')) closeModal(signupModal);
    if (quizModal.classList.contains('open')) closeModal(quizModal);
  });

  /* ===== Подписка на рассылку ===== */
  var newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!newsletterForm.checkValidity()) {
        newsletterForm.reportValidity();
        return;
      }
      var input = newsletterForm.querySelector('input');
      sendLead({ first_name: '', last_name: '', email: input.value.trim(), source: 'newsletter' });
      var btn = newsletterForm.querySelector('.btn');
      btn.textContent = 'Спасибо! ✦';
      input.value = '';
      setTimeout(function () { btn.textContent = 'Подписаться'; }, 4000);
    });
  }

  /* ===== Плавная прокрутка для якорей с учётом шапки ===== */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    if (link.id === 'footer-quiz') return;
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 84;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
})();
