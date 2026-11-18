import { useState, useEffect, useMemo } from 'react'
import {
  VK_RUBRICS,
  SLANG_DICTIONARY,
  VK_POSTS,
  INITIAL_FLIPCHART_STICKERS
} from './data/vkPortalData'
import './App.css'

const resolveAsset = (path) => {
  if (!path) return ''
  if (path.startsWith('/')) {
    return `.${path}`
  }
  return path
}

export default function App() {
  // Theme state: dark | light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('kreatiff_theme') || 'dark'
  })

  // Posts state
  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('kreatiff_vk_posts')
    return saved ? JSON.parse(saved) : VK_POSTS
  })

  // Flipchart stickers state
  const [stickers, setStickers] = useState(() => {
    const saved = localStorage.getItem('kreatiff_stickers')
    return saved ? JSON.parse(saved) : INITIAL_FLIPCHART_STICKERS
  })

  const [selectedRubric, setSelectedRubric] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeArticle, setActiveArticle] = useState(null)
  const [activeSlang, setActiveSlang] = useState(SLANG_DICTIONARY[0])
  const [visibleCount, setVisibleCount] = useState(6)

  // Track quiz selections: { [postId]: selectedOptionIndex }
  const [quizAnswers, setQuizAnswers] = useState({})

  // Modals state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isAddStickerOpen, setIsAddStickerOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Form: Create Post
  const [postForm, setPostForm] = useState({
    title: '',
    rubric: 'grammar',
    author: '',
    group: '',
    lead: '',
    content: '',
    tags: '',
    hasQuiz: false,
    quizQuestion: '',
    quizOptA: '',
    quizOptB: '',
    quizCorrect: 'B',
    quizExplanation: ''
  })

  // Form: Add Sticker to Flipchart
  const [stickerForm, setStickerForm] = useState({
    author: '',
    text: '',
    color: '#ff794a'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kreatiff_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('kreatiff_vk_posts', JSON.stringify(posts))
  }, [posts])

  useEffect(() => {
    localStorage.setItem('kreatiff_stickers', JSON.stringify(stickers))
  }, [stickers])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 2800)
  }

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleQuizChoice = (postId, optionIdx) => {
    setQuizAnswers(prev => ({
      ...prev,
      [postId]: optionIdx
    }))
  }

  // Create post submit
  const handlePostSubmit = (e) => {
    e.preventDefault()
    if (!postForm.title.trim() || !postForm.content.trim() || !postForm.author.trim()) {
      showToast('Заполните заголовок, автора и текст публикации')
      return
    }

    const rubricObj = VK_RUBRICS.find(r => r.id === postForm.rubric) || VK_RUBRICS[1]
    const badgeColors = {
      grammar: '#ff794a',
      events: '#aaec3f',
      vocab: '#f4de24',
      memes: '#9ad9d0'
    }

    let parsedQuiz = null
    if (postForm.hasQuiz && postForm.quizQuestion.trim()) {
      parsedQuiz = {
        question: postForm.quizQuestion,
        options: [
          {
            text: `A) ${postForm.quizOptA || 'Вариант 1'}`,
            isCorrect: postForm.quizCorrect === 'A',
            explanation: postForm.quizCorrect === 'A' ? 'Верно!' : postForm.quizExplanation || 'Неверный вариант'
          },
          {
            text: `B) ${postForm.quizOptB || 'Вариант 2'}`,
            isCorrect: postForm.quizCorrect === 'B',
            explanation: postForm.quizCorrect === 'B' ? (postForm.quizExplanation || 'Верно!') : 'Неверный вариант'
          }
        ]
      }
    }

    const tagsArray = postForm.tags
      ? postForm.tags.split(',').map(t => (t.trim().startsWith('#') ? t.trim() : `#${t.trim()}`))
      : ['#КреатиFF', '#ККРИТ', `#${rubricObj.label.replace(/\s+/g, '')}`]

    const newPost = {
      id: Date.now(),
      isCustom: true,
      rubric: postForm.rubric,
      rubricLabel: rubricObj.label,
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
      title: postForm.title,
      badgeColor: badgeColors[postForm.rubric] || '#ff794a',
      image: './brand/media/WallpaperSimpleLogo1_for_Desktop.png',
      lead: postForm.lead || (postForm.content.slice(0, 110) + '...'),
      content: postForm.content,
      tags: tagsArray,
      quiz: parsedQuiz
    }

    setPosts(prev => [newPost, ...prev])
    setIsCreatePostOpen(false)
    setPostForm({
      title: '',
      rubric: 'grammar',
      author: '',
      group: '',
      lead: '',
      content: '',
      tags: '',
      hasQuiz: false,
      quizQuestion: '',
      quizOptA: '',
      quizOptB: '',
      quizCorrect: 'B',
      quizExplanation: ''
    })
    showToast('Публикация успешно добавлена в ленту!')
  }

  // Delete custom post
  const handleDeletePost = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id))
    showToast('Публикация удалена')
  }

  // Add sticker submit
  const handleStickerSubmit = (e) => {
    e.preventDefault()
    if (!stickerForm.text.trim()) {
      showToast('Напишите текст для стикера')
      return
    }

    const newSticker = {
      id: Date.now(),
      color: stickerForm.color,
      author: stickerForm.author.trim() || 'Студент ККРИТ',
      text: stickerForm.text,
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    }

    setStickers(prev => [newSticker, ...prev])
    setIsAddStickerOpen(false)
    setStickerForm({ author: '', text: '', color: '#ff794a' })
    showToast('Стикер прикреплен к флипчарту!')
  }

  // Filtered and paginated posts
  const filteredPosts = useMemo(() => {
    return posts.filter(item => {
      const matchRubric = selectedRubric === 'all' || item.rubric === selectedRubric
      const q = searchQuery.toLowerCase().trim()
      const matchSearch = !q ||
        item.title.toLowerCase().includes(q) ||
        item.lead.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      return matchRubric && matchSearch
    })
  }, [posts, selectedRubric, searchQuery])

  const paginatedPosts = filteredPosts.slice(0, visibleCount)

  const leadPost = posts[0]
  const sidePosts = posts.slice(1, 4)

  const logoSrc = theme === 'light'
    ? './brand/logos/Horizontal_logo_DarkText.svg'
    : './brand/logos/Horizontal_logo.svg'

  return (
    <div className="portal-wrapper">
      {toastMessage && <div className="toast-notice">{toastMessage}</div>}

      {/* Header */}
      <header className="portal-header">
        <div className="container portal-header-inner">
          <div className="portal-brand">
            <a href="#top">
              <img
                src={logoSrc}
                alt="КРЕАТИFF"
                className="portal-logo"
              />
            </a>
          </div>

          <nav className="portal-nav">
            <a href="#feed">Материалы</a>
            <a href="#slang">Сленг</a>
            <a href="#flipchart">Флипчарт</a>
          </nav>

          <div className="header-action-group">
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => setIsCreatePostOpen(true)}
            >
              + Добавить пост
            </button>

            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Lead Featured Post */}
        <section id="top" className="hero-editorial-section">
          <div className="container hero-lead-grid">
            {leadPost && (
              <article
                className="lead-card"
                onClick={() => setActiveArticle(leadPost)}
              >
                <div className="lead-card-media">
                  <img
                    src={resolveAsset(leadPost.image)}
                    alt={leadPost.title}
                    className="lead-card-img"
                  />
                  <span
                    className="lead-badge"
                    style={{ backgroundColor: leadPost.badgeColor }}
                  >
                    {leadPost.rubricLabel}
                  </span>
                </div>

                <div className="lead-card-body">
                  <div className="post-meta-row">
                    <span>{leadPost.date}</span>
                    <span>•</span>
                    <span>{leadPost.rubricLabel}</span>
                  </div>

                  <h1 className="lead-card-title">{leadPost.title}</h1>
                  <p className="lead-card-lead">{leadPost.lead}</p>

                  <div className="lead-card-footer">
                    <span style={{ color: 'var(--text-muted)' }}>Редакция Креатиff</span>
                    <button type="button" className="read-btn-link">
                      Читать полностью →
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* Side column */}
            <div className="side-feed-col">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--c-orange)' }}>
                  Свежие записи
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ККРИТ
                </span>
              </div>

              {sidePosts.map(p => (
                <article
                  key={p.id}
                  className="side-post-card"
                  onClick={() => setActiveArticle(p)}
                >
                  <div className="side-post-rubric" style={{ color: p.badgeColor }}>
                    {p.rubricLabel}
                  </div>
                  <h3 className="side-post-title">{p.title}</h3>
                  <div className="side-post-date">{p.date}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Slang & Vibe Check Widget */}
        <section id="slang" className="vibe-section">
          <div className="container">
            <div className="vibe-box">
              <div className="vibe-head">
                <div>
                  <div className="vibe-tag">Студенческий словарь ККРИТ • Лаундж 4 этажа</div>
                  <h2 className="vibe-title">СЛЕНГ ДЛЯ ТВОЕГО ВАЙБА & VIBE CHECK</h2>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Кликни на термин для разбора контекста
                </span>
              </div>

              <div className="vibe-chips-row">
                {SLANG_DICTIONARY.map((item) => (
                  <button
                    key={item.term}
                    type="button"
                    className={`vibe-chip-btn ${activeSlang.term === item.term ? 'active' : ''}`}
                    onClick={() => setActiveSlang(item)}
                  >
                    {item.term}
                  </button>
                ))}
              </div>

              <div className="vibe-active-card">
                <div className="vibe-term-row">
                  <span className="vibe-term-name">{activeSlang.term}</span>
                  <span className="vibe-term-transcription">{activeSlang.transcription}</span>
                </div>
                <div className="vibe-term-translation">
                  Значение: {activeSlang.translation}
                </div>
                <div className="vibe-term-example">
                  Пример в речи: «{activeSlang.example}»
                </div>
                <div className="vibe-term-note">
                  Контекст: {activeSlang.note}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Flipchart 4-th Floor Section */}
        <section id="flipchart" className="flipchart-section">
          <div className="container">
            <div className="flipchart-board">
              <div className="flipchart-header">
                <div>
                  <div className="section-tag">Безопасное пространство ККРИТ</div>
                  <h2 className="section-title">ИНТЕРАКТИВНЫЙ ФЛИПЧАРТ «DRAW YOUR MOOD»</h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Онлайн-доска эмоций и стикеров из лаундж-зоны 4 этажа. Оставь свой след!
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={() => setIsAddStickerOpen(true)}
                >
                  + Оставить стикер
                </button>
              </div>

              <div className="stickers-grid">
                {stickers.map(st => (
                  <div
                    key={st.id}
                    className="sticker-card"
                    style={{ backgroundColor: st.color }}
                  >
                    <span className="sticker-pin">📌</span>
                    <div className="sticker-text">«{st.text}»</div>
                    <div className="sticker-footer">
                      <span>{st.author}</span>
                      <span>{st.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Posts Feed Section */}
        <section id="feed" className="posts-section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-tag">Информационная лента</div>
                <h2 className="section-title">МАТЕРИАЛЫ, ГРАММАТИКА И ЖИЗНЬ СТУДИИ</h2>
              </div>
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => setIsCreatePostOpen(true)}
              >
                + Опубликовать материал
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="filter-toolbar">
              <div className="rubric-tabs">
                {VK_RUBRICS.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className={`rubric-tab-btn ${selectedRubric === r.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedRubric(r.id)
                      setVisibleCount(6)
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Поиск по статьям, мемам и тегам..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setVisibleCount(6)
                  }}
                  className="search-input"
                />
              </div>
            </div>

            {/* Posts Grid */}
            <div className="posts-grid">
              {paginatedPosts.map(post => {
                const selectedOptIdx = quizAnswers[post.id]
                return (
                  <article key={post.id} className="post-card">
                    <div
                      className="post-card-img-wrap"
                      onClick={() => setActiveArticle(post)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={resolveAsset(post.image)}
                        alt={post.title}
                        className="post-card-img"
                      />
                      <span
                        className="lead-badge"
                        style={{ backgroundColor: post.badgeColor }}
                      >
                        {post.rubricLabel}
                      </span>
                    </div>

                    <div className="post-card-body">
                      <div className="post-meta-row">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.rubricLabel}</span>
                        {post.isCustom && (
                          <button
                            type="button"
                            className="delete-post-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePost(post.id)
                            }}
                            title="Удалить добавленный пост"
                          >
                            Удалить
                          </button>
                        )}
                      </div>

                      <h3
                        className="post-card-title"
                        onClick={() => setActiveArticle(post)}
                      >
                        {post.title}
                      </h3>

                      <p className="post-card-lead">{post.lead}</p>

                      {/* Built-in Quiz on Card (for grammar posts) */}
                      {post.quiz && (
                        <div className="card-quiz-box">
                          <div className="card-quiz-q">
                            🎯 Мини-тест: {post.quiz.question}
                          </div>
                          <div className="card-quiz-options">
                            {post.quiz.options.map((opt, optIdx) => {
                              const isChosen = selectedOptIdx === optIdx
                              let btnClass = 'quiz-option-btn'
                              if (isChosen) {
                                btnClass += opt.isCorrect ? ' correct' : ' wrong'
                              }
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  className={btnClass}
                                  onClick={() => handleQuizChoice(post.id, optIdx)}
                                >
                                  {opt.text}
                                </button>
                              )
                            })}
                          </div>

                          {selectedOptIdx !== undefined && (
                            <div
                              className={`quiz-feedback-text ${
                                post.quiz.options[selectedOptIdx].isCorrect ? 'correct' : 'wrong'
                              }`}
                            >
                              {post.quiz.options[selectedOptIdx].explanation}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="post-card-footer">
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {post.tags.slice(0, 2).map(t => (
                            <span key={t} style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="read-btn-link"
                          onClick={() => setActiveArticle(post)}
                        >
                          Читать полностью →
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {filteredPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Публикаций по выбранным критериям не найдено.
              </div>
            )}

            {filteredPosts.length > visibleCount && (
              <div className="load-more-wrap">
                <button
                  type="button"
                  className="btn-vk-pill"
                  onClick={() => setVisibleCount(prev => prev + 6)}
                >
                  Показать ещё публикации ({filteredPosts.length - visibleCount})
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <img
                src={logoSrc}
                alt="Креатиff"
                className="footer-brand-logo"
              />
              <p className="footer-brand-desc">
                Информационный портал студенческой творческой студии «Креатиff» — объединения 
                Красноярского колледжа радиоэлектроники и информационных технологий. Основано в 2020 году.
              </p>
            </div>

            <div>
              <div className="footer-col-title">Рубрики</div>
              <ul className="footer-links">
                <li><a href="#feed">Грамматика и статьи</a></li>
                <li><a href="#slang">Сленг и Vibe Check</a></li>
                <li><a href="#flipchart">Флипчарт 4 этажа</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Контакты</div>
              <ul className="footer-links">
                <li><span>Красноярск, ККРИТ (пр. имени газеты «Красноярский Рабочий», 156)</span></li>
                <li><span>Лаундж-зона на 4 этаже (Flipchart Safe Space)</span></li>
                <li><span>Кураторы: преподаватели английского языка ККРИТ</span></li>
                <li>
                  <a
                    href="https://vk.ru/club229328469"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2787f5', fontWeight: 600 }}
                  >
                    Сообщество ВКонтакте: vk.ru/club229328469 →
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© 2020–2026 Творческая студия «Креатиff» • ККРИТ</div>
            <div>Информационный новостной ресурс сообщества</div>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Read Full Post */}
      {activeArticle && (
        <div className="modal-overlay" onClick={() => setActiveArticle(null)}>
          <div className="modal-dialog modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: activeArticle.badgeColor,
                    textTransform: 'uppercase'
                  }}
                >
                  {activeArticle.rubricLabel}
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {activeArticle.date} • Креатиff ККРИТ
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveArticle(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.65rem', color: 'var(--text-primary)', marginBottom: '18px', lineHeight: 1.25 }}>
                {activeArticle.title}
              </h2>

              <img
                src={resolveAsset(activeArticle.image)}
                alt={activeArticle.title}
                className="article-modal-img"
              />

              <div className="article-modal-lead">
                {activeArticle.lead}
              </div>

              <div className="article-modal-text">
                {activeArticle.content}
              </div>

              {activeArticle.quiz && (
                <div className="card-quiz-box" style={{ marginTop: '20px' }}>
                  <div className="card-quiz-q">
                    🎯 Проверь себя: {activeArticle.quiz.question}
                  </div>
                  <div className="card-quiz-options">
                    {activeArticle.quiz.options.map((opt, optIdx) => {
                      const isChosen = quizAnswers[activeArticle.id] === optIdx
                      let btnClass = 'quiz-option-btn'
                      if (isChosen) {
                        btnClass += opt.isCorrect ? ' correct' : ' wrong'
                      }
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          className={btnClass}
                          onClick={() => handleQuizChoice(activeArticle.id, optIdx)}
                        >
                          {opt.text}
                        </button>
                      )
                    })}
                  </div>
                  {quizAnswers[activeArticle.id] !== undefined && (
                    <div
                      className={`quiz-feedback-text ${
                        activeArticle.quiz.options[quizAnswers[activeArticle.id]].isCorrect ? 'correct' : 'wrong'
                      }`}
                      style={{ marginTop: '10px' }}
                    >
                      {activeArticle.quiz.options[quizAnswers[activeArticle.id]].explanation}
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                {activeArticle.tags.map(t => (
                  <span
                    key={t}
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.78rem',
                      color: 'var(--c-orange)',
                      background: 'var(--bg-card-subtle)',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => setActiveArticle(null)}
              >
                Закрыть материал
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Post Creator */}
      {isCreatePostOpen && (
        <div className="modal-overlay" onClick={() => setIsCreatePostOpen(false)}>
          <div className="modal-dialog modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-orange)' }}>
                  РЕДАКЦИЯ КРЕАТИFF
                </span>
                <h3 className="modal-title">Создать новую публикацию</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreatePostOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostSubmit}>
              <div className="modal-content">
                <div className="form-group">
                  <label className="form-label">Заголовок публикации *</label>
                  <input
                    type="text"
                    required
                    placeholder="Например, Разбор сложных времен в IT-документации"
                    className="form-input"
                    value={postForm.title}
                    onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Рубрика *</label>
                    <select
                      className="form-select"
                      value={postForm.rubric}
                      onChange={(e) => setPostForm(prev => ({ ...prev, rubric: e.target.value }))}
                    >
                      <option value="grammar">Грамматика без паники</option>
                      <option value="events">События ККРИТ</option>
                      <option value="vocab">Слово и идиома дня</option>
                      <option value="memes">Мемы и юмор</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Автор / Куратор (ФИО или группа) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Например, Куратор студии / гр. 9ПР-3.22"
                      className="form-input"
                      value={postForm.author}
                      onChange={(e) => setPostForm(prev => ({ ...prev, author: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Краткий анонс / лид (1-2 предложения)</label>
                  <input
                    type="text"
                    placeholder="Главная мысль статьи для карточки в ленте..."
                    className="form-input"
                    value={postForm.lead}
                    onChange={(e) => setPostForm(prev => ({ ...prev, lead: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Полный текст публикации *</label>
                  <textarea
                    rows="5"
                    required
                    placeholder="Подробный текст материала, примеры правил, цитаты..."
                    className="form-textarea"
                    value={postForm.content}
                    onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Хештеги (через запятую)</label>
                  <input
                    type="text"
                    placeholder="#КреатиFF, #ККРИТ, #English, #Студенты"
                    className="form-input"
                    value={postForm.tags}
                    onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>

                {/* Optional Quiz Builder */}
                <div style={{ marginTop: '16px', padding: '14px', background: 'var(--bg-card-subtle)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={postForm.hasQuiz}
                      onChange={(e) => setPostForm(prev => ({ ...prev, hasQuiz: e.target.checked }))}
                    />
                    <span>Прикрепить интерактивный мини-тест для самопроверки</span>
                  </label>

                  {postForm.hasQuiz && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Вопрос теста (например, Как правильно: He was very ___?)"
                        className="form-input"
                        value={postForm.quizQuestion}
                        onChange={(e) => setPostForm(prev => ({ ...prev, quizQuestion: e.target.value }))}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="Вариант A (например, bored)"
                          className="form-input"
                          value={postForm.quizOptA}
                          onChange={(e) => setPostForm(prev => ({ ...prev, quizOptA: e.target.value }))}
                        />
                        <input
                          type="text"
                          placeholder="Вариант B (например, boring)"
                          className="form-input"
                          value={postForm.quizOptB}
                          onChange={(e) => setPostForm(prev => ({ ...prev, quizOptB: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', alignItems: 'center' }}>
                        <select
                          className="form-select"
                          value={postForm.quizCorrect}
                          onChange={(e) => setPostForm(prev => ({ ...prev, quizCorrect: e.target.value }))}
                        >
                          <option value="A">Ответ: A</option>
                          <option value="B">Ответ: B</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Краткое объяснение правила при ответе"
                          className="form-input"
                          value={postForm.quizExplanation}
                          onChange={(e) => setPostForm(prev => ({ ...prev, quizExplanation: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="read-btn-link"
                  style={{ marginRight: 'auto' }}
                  onClick={() => setIsCreatePostOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary-action">
                  Опубликовать статью
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Sticker to Flipchart */}
      {isAddStickerOpen && (
        <div className="modal-overlay" onClick={() => setIsAddStickerOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-orange)' }}>
                  ФЛИПЧАРТ 4 ЭТАЖА
                </span>
                <h3 className="modal-title">Прикрепить стикер на доску</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddStickerOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStickerSubmit}>
              <div className="modal-content">
                <div className="form-group">
                  <label className="form-label">Цвет стикера</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['#ff794a', '#f4de24', '#aaec3f', '#9ad9d0'].map(color => (
                      <button
                        key={color}
                        type="button"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: color,
                          border: stickerForm.color === color ? '2px solid #000' : 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => setStickerForm(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Твое имя / группа</label>
                  <input
                    type="text"
                    placeholder="Например, Никита (9ПР-1.24)"
                    className="form-input"
                    value={stickerForm.author}
                    onChange={(e) => setStickerForm(prev => ({ ...prev, author: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Твой вайб / мысль / мем *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Напиши фразу на английском или русском, поделись настроением..."
                    className="form-textarea"
                    value={stickerForm.text}
                    onChange={(e) => setStickerForm(prev => ({ ...prev, text: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="read-btn-link"
                  style={{ marginRight: 'auto' }}
                  onClick={() => setIsAddStickerOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary-action">
                  Прикрепить на доску
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
