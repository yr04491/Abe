// 記事データを読み込む関数
async function loadStories() {
  try {
    const response = await fetch('./data/stories.json');
    if (!response.ok) {
      throw new Error('データの読み込みに失敗しました');
    }
    const data = await response.json();
    return data.stories;
  } catch (error) {
    console.error('エラーが発生しました:', error);
    return [];
  }
}

// URLパラメータから記事IDを取得する関数
function getStoryIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get('id'));
}

// URLパラメータを取得する関数
function getUrlParams() {
  return new URLSearchParams(window.location.search);
}

// 記事一覧を表示する関数
async function displayStoryList(categoryType) {
  const stories = await loadStories();
  const storyListContainer = document.getElementById('story-list');
  
  if (!storyListContainer) {
    console.error('記事リスト表示用のコンテナが見つかりません');
    return;
  }
  
  storyListContainer.innerHTML = '';
  
  // 現在のページURLから表示中のカテゴリタイプを推測
  let fromParam = '';
  
  // カテゴリページに応じてfromパラメータを設定
  if (window.location.pathname.includes('category_grade_1st.html')) {
    fromParam = 'grade/1st';
  } else if (window.location.pathname.includes('category_support_school.html')) {
    fromParam = 'support/school';
  }
  
  // URLパラメータを取得
  const urlParams = getUrlParams();
  const gradeFilter = urlParams.get('grade');
  const durationFilter = urlParams.get('duration');
  
  // ページタイトルを更新
  const pageTitle = document.querySelector('.page-title');
  if (pageTitle) {
    if (gradeFilter === 'junior') {
      pageTitle.textContent = '中学生の不登校体験談';
    } else if (gradeFilter === 'high') {
      pageTitle.textContent = '高校生の不登校体験談';
    } else if (durationFilter === 'long') {
      pageTitle.textContent = '長期化している不登校の体験談';
    }
  }
  
  // 記事をソートして表示（新着順）
  const sortedStories = [...stories].sort((a, b) => {
    const dateA = new Date(a.created_date.split('.').reverse().join('-'));
    const dateB = new Date(b.created_date.split('.').reverse().join('-'));
    return dateB - dateA;
  });
  
  sortedStories.forEach(story => {
    // カテゴリーフィルターがある場合は、それに合致する記事のみを表示
    if (categoryType === 'grade_1st') {
      if (gradeFilter === 'junior' && (!story.grade || !story.grade.includes('中学'))) {
        return;
      } else if (gradeFilter === 'high' && (!story.grade || !story.grade.includes('高校'))) {
        return;
      } else if (durationFilter === 'long' && (!story.content || !story.content.process || !story.content.process.includes('長期'))) {
        return;
      } else if (!gradeFilter && !durationFilter && (!story.grade || !story.grade.includes('小学1年生'))) {
        return;
      }
    } else if (categoryType === 'support_school' && (!story.title || !story.title.includes('学校'))) {
      return;
    }
    
    const storyItem = document.createElement('div');
    storyItem.className = 'story-item';
    
    // fromパラメータを付与したリンクを作成
    const fromQuery = fromParam ? `&from=${fromParam}` : '';
    
      storyItem.innerHTML = `
      <h3 class="story-title"><a href="post.html?id=${story.id}${fromQuery}">${story.title}</a></h3>
      <div class="story-meta">
        <span class="story-date">記載日: ${story.created_date}</span>
        <span class="story-grade">不登校時の学年: ${story.grade}</span>
        <span class="story-family">家族構成: ${story.family}</span>
      </div>
      <div class="story-tags">
        ${story.grade ? `<span class="story-tag">学年: ${story.grade}</span>` : ''}
        ${story.content.trigger && story.content.trigger.includes('いじめ') ? `<span class="story-tag">きっかけ: いじめ</span>` : ''}
        ${story.content.improvement && story.content.improvement.includes('改善') ? `<span class="story-tag">状況: 改善</span>` : ''}
      </div>
      <div class="story-excerpt">
        ${story.content.trigger.substring(0, 150)}...
      </div>
      <a href="post.html?id=${story.id}${fromQuery}" class="read-more-btn">続きを読む</a>
    `;    storyListContainer.appendChild(storyItem);
  });
}

// 記事詳細を表示する関数
async function displayStory(id) {
  const stories = await loadStories();
  const story = stories.find(s => s.id === id);
  
  if (!story) {
    alert('指定された記事が見つかりませんでした。');
    return;
  }
  
  // タイトルを設定
  document.getElementById('story-title').textContent = story.title;
  
  // 記事のメタ情報を表示
  document.getElementById('story-date').textContent = `記載日: ${story.created_date}`;
  document.getElementById('story-grade').textContent = `不登校時の学年: ${story.grade}`;
  document.getElementById('story-family').textContent = `家族構成: ${story.family}`;
  
  // 記事の内容を表示
  document.getElementById('story-trigger').textContent = story.content.trigger;
  document.getElementById('story-process').textContent = story.content.process;
  document.getElementById('story-improvement').textContent = story.content.improvement;
  document.getElementById('story-advice').textContent = story.content.advice;
  
  // URLからfromパラメータを取得
  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get('from');
  
  // パンくずリストを設定
  const breadcrumbContainer = document.getElementById('breadcrumb-container');
  if (breadcrumbContainer) {
    breadcrumbContainer.innerHTML = `
      <nav class="breadcrumb" aria-label="パンくずリスト">
        <a href="index.html">ホーム</a>
    `;
    
    if (fromParam) {
      if (fromParam === 'grade/1st') {
        breadcrumbContainer.innerHTML += ` > <a href="category_grade_1st.html">小学1年生の体験談</a>`;
      } else if (fromParam === 'support/school') {
        breadcrumbContainer.innerHTML += ` > <a href="category_support_school.html">学校へのサポート体験談</a>`;
      }
    }
    
    breadcrumbContainer.innerHTML += ` > <span>${story.title}</span></nav>`;
  }
  
  // 関連記事を表示
  displayRelatedStories(story, fromParam);
}

// 記事詳細ページの表示を処理する関数
async function displayStoryDetail() {
  // URLから記事IDを取得
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');
  
  if (!storyId) {
    alert('記事IDが指定されていません。');
    window.location.href = 'index.html';
    return;
  }
  
  // 数値として処理するために整数に変換
  const storyIdNum = parseInt(storyId, 10);
  
  if (isNaN(storyIdNum)) {
    alert('無効な記事IDです。');
    window.location.href = 'index.html';
    return;
  }
  
  // 記事詳細を表示
  await displayStory(storyIdNum);
}

// 関連記事を表示する関数
async function displayRelatedStories(currentStory, fromParam) {
  const relatedContainer = document.getElementById('related-stories');
  if (!relatedContainer) return;
  
  const stories = await loadStories();
  let relatedStories = [];
  
  // 同じ学年の記事を関連記事として表示
  if (currentStory.grade) {
    relatedStories = stories.filter(s => 
      s.id !== currentStory.id && 
      s.grade === currentStory.grade
    ).slice(0, 3);
  }
  
  // 関連記事が3つに満たない場合は、同じきっかけや改善状況の記事も表示
  if (relatedStories.length < 3) {
    const moreStories = stories.filter(s => 
      s.id !== currentStory.id && 
      !relatedStories.find(rs => rs.id === s.id) &&
      (
        (currentStory.content.trigger && s.content.trigger && 
         s.content.trigger.includes(currentStory.content.trigger.substring(0, 10))) ||
        (currentStory.content.improvement && s.content.improvement &&
         s.content.improvement.includes(currentStory.content.improvement.substring(0, 10)))
      )
    ).slice(0, 3 - relatedStories.length);
    
    relatedStories = [...relatedStories, ...moreStories];
  }
  
  // それでも3つに満たない場合は、ランダムに追加
  if (relatedStories.length < 3) {
    const randomStories = stories
      .filter(s => 
        s.id !== currentStory.id && 
        !relatedStories.find(rs => rs.id === s.id)
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 - relatedStories.length);
    
    relatedStories = [...relatedStories, ...randomStories];
  }
  
  // 関連記事を表示
  if (relatedStories.length > 0) {
    relatedContainer.innerHTML = '<h3 class="section-title">関連する体験談</h3><div class="related-stories-grid">';
    
    relatedStories.forEach(story => {
      // fromパラメータを付与したリンクを作成
      const fromQuery = fromParam ? `&from=${fromParam}` : '';
      
      relatedContainer.innerHTML += `
        <div class="related-story-item">
          <h4><a href="post.html?id=${story.id}${fromQuery}">${story.title}</a></h4>
          <div class="story-meta">
            <span class="story-grade">${story.grade}</span>
          </div>
          <p>${story.content.trigger.substring(0, 80)}...</p>
          <a href="post.html?id=${story.id}${fromQuery}" class="read-more-btn">読む</a>
        </div>
      `;
    });
    
    relatedContainer.innerHTML += '</div>';
  } else {
    relatedContainer.innerHTML = '';
  }
}

// 関連記事を表示する関数
async function displayRelatedStories(currentStory) {
  const stories = await loadStories();
  const relatedStoriesContainer = document.getElementById('related-stories');
  
  if (!relatedStoriesContainer) {
    console.error('関連記事表示用のコンテナが見つかりません');
    return;
  }
  
  // URLパラメータを取得
  const urlParams = getUrlParams();
  const fromParam = urlParams.get('from');
  
  let relatedStories = [];
  
  if (fromParam) {
    // fromパラメータからカテゴリ分類を取得
    const [type, slug] = fromParam.split('/');
    
    // 同じカテゴリの記事を取得（現在の記事を除く）
    if (type === 'grade' && slug === '1st') {
      // 小学1年生の記事を抽出
      relatedStories = stories.filter(s => 
        s.id !== currentStory.id && 
        s.grade && s.grade.includes('小学1年生')
      );
    } else if (type === 'support' && slug === 'school') {
      // 学校サポートの記事を抽出
      relatedStories = stories.filter(s => 
        s.id !== currentStory.id && 
        s.title && s.title.includes('学校')
      );
    }
  }
  
  // 関連記事がなければ、同じ学年の記事をフォールバックとして表示
  if (relatedStories.length === 0 && currentStory.grade) {
    relatedStories = stories.filter(s => 
      s.id !== currentStory.id && 
      s.grade === currentStory.grade
    );
  }
  
  // それでも関連記事がなければ、すべての記事から新着順に表示
  if (relatedStories.length === 0) {
    relatedStories = stories.filter(s => s.id !== currentStory.id);
  }
  
  // 最大10件に制限し、新着順にソート
  relatedStories = relatedStories
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 10);
  
  if (relatedStories.length === 0) {
    relatedStoriesContainer.innerHTML = '<p>関連する記事がありません。</p>';
    return;
  }
  
  relatedStoriesContainer.innerHTML = '';
  
  relatedStories.forEach(story => {
    const storyItem = document.createElement('div');
    storyItem.className = 'related-story-item';
    
    const fromQuery = fromParam ? `?from=${fromParam}` : '';
    
    storyItem.innerHTML = `
      <h3 class="story-title"><a href="post.html?id=${story.id}${fromQuery}">${story.title}</a></h3>
      <div class="story-meta">
        <span class="story-date">記載日: ${story.created_date}</span>
        <span class="story-grade">学年: ${story.grade}</span>
      </div>
      <div class="story-excerpt">
        ${story.content.trigger.substring(0, 80)}...
      </div>
    `;
    
    relatedStoriesContainer.appendChild(storyItem);
  });
}

// 検索機能の実装
async function searchStories(query) {
  const stories = await loadStories();
  const urlParams = getUrlParams();
  
  // タグやステータスでのフィルターを確認
  const tagFilter = urlParams.get('tag');
  const statusFilter = urlParams.get('status');
  
  // 検索結果を絞り込み
  const searchResults = stories.filter(story => {
    // クエリがある場合はテキスト検索
    const matchesQuery = !query || 
      story.title.toLowerCase().includes(query.toLowerCase()) ||
      story.content.trigger.toLowerCase().includes(query.toLowerCase()) ||
      story.content.process.toLowerCase().includes(query.toLowerCase()) ||
      story.content.improvement.toLowerCase().includes(query.toLowerCase()) ||
      story.content.advice.toLowerCase().includes(query.toLowerCase());
    
    // タグフィルターに基づく絞り込み
    let matchesTag = !tagFilter;
    if (tagFilter) {
      switch(tagFilter) {
        case 'bullying':
          matchesTag = story.content.trigger.includes('いじめ') || story.content.trigger.includes('友人');
          break;
        case 'study':
          matchesTag = story.content.trigger.includes('勉強') || story.content.trigger.includes('学習');
          break;
        case 'development':
          matchesTag = story.content.trigger.includes('発達') || story.content.trigger.includes('体調');
          break;
        case 'teacher':
          matchesTag = story.content.trigger.includes('教師') || story.content.trigger.includes('学校');
          break;
        case 'other':
          matchesTag = story.content.trigger.includes('転校') || story.content.trigger.includes('進級');
          break;
      }
    }
    
    // ステータスフィルターに基づく絞り込み
    let matchesStatus = !statusFilter;
    if (statusFilter) {
      switch(statusFilter) {
        case 'initial':
          matchesStatus = story.content.process.includes('初期') || story.content.process.includes('1か月');
          break;
        case 'half-year':
          matchesStatus = story.content.process.includes('半年');
          break;
        case 'over-year':
          matchesStatus = story.content.process.includes('1年以上');
          break;
        case 'improving':
          matchesStatus = story.content.improvement.includes('改善');
          break;
        case 'continuing':
          matchesStatus = story.content.improvement.includes('続いて');
          break;
      }
    }
    
    // 全ての条件に合致する記事のみ返す
    return matchesQuery && matchesTag && matchesStatus;
  });
  
  return searchResults;
}

// ヘッダーとフッターを読み込む関数
async function loadCommonElements() {
  // ヘッダーを読み込む
  const headerContainer = document.getElementById('common-header');
  if (headerContainer) {
    try {
      const headerResponse = await fetch('includes/header.html');
      if (headerResponse.ok) {
        const headerContent = await headerResponse.text();
        headerContainer.innerHTML = headerContent;
        
        // 現在のページのナビゲーションアイテムをアクティブにする
        highlightCurrentPage();
      } else {
        console.error('ヘッダーの読み込みに失敗しました');
      }
    } catch (error) {
      console.error('ヘッダー読み込みエラー:', error);
    }
  }
  
  // フッターを読み込む
  const footerContainer = document.getElementById('common-footer');
  if (footerContainer) {
    try {
      const footerResponse = await fetch('includes/footer.html');
      if (footerResponse.ok) {
        footerContainer.innerHTML = await footerResponse.text();
      } else {
        console.error('フッターの読み込みに失敗しました');
      }
    } catch (error) {
      console.error('フッター読み込みエラー:', error);
    }
  }
}

// 現在のページのナビゲーションをハイライトする関数
function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const filename = currentPath.split('/').pop();
  
  // ナビゲーションアイテムからアクティブクラスを削除
  const navLinks = document.querySelectorAll('nav ul li a');
  navLinks.forEach(link => {
    link.classList.remove('active');
  });
  
  // 現在のページに基づいて適切なナビゲーションアイテムをハイライト
  if (filename === 'index.html' || filename === '') {
    document.getElementById('nav-home')?.classList.add('active');
  } else if (filename === 'stories_list.html') {
    document.getElementById('nav-stories')?.classList.add('active');
  } else if (filename === 'category_support_school.html') {
    document.getElementById('nav-school')?.classList.add('active');
  } else if (filename === 'support.html') {
    document.getElementById('nav-support')?.classList.add('active');
  } else if (filename === 'post_form.html') {
    document.getElementById('nav-post')?.classList.add('active');
  }
}

// ドキュメント読み込み完了時にヘッダーとフッターを読み込む
document.addEventListener('DOMContentLoaded', loadCommonElements);

// 検索結果を表示する関数
async function displaySearchResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  
  if (!query) {
    return;
  }
  
  const searchResultsContainer = document.getElementById('search-results');
  if (!searchResultsContainer) {
    console.error('検索結果表示用のコンテナが見つかりません');
    return;
  }
  
  const searchTerm = document.getElementById('search-term');
  if (searchTerm) {
    searchTerm.textContent = query;
  }
  
  const results = await searchStories(query);
  
  if (results.length === 0) {
    searchResultsContainer.innerHTML = '<p>検索結果が見つかりませんでした。別のキーワードで検索してみてください。</p>';
    return;
  }
  
  searchResultsContainer.innerHTML = '';
  
  results.forEach(story => {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';
    
    resultItem.innerHTML = `
      <h3 class="story-title"><a href="post.html?id=${story.id}">${story.title}</a></h3>
      <div class="story-meta">
        <span class="story-date">記載日: ${story.created_date}</span>
        <span class="story-grade">不登校時の学年: ${story.grade}</span>
      </div>
      <div class="story-excerpt">
        ${story.content.trigger.substring(0, 150)}...
      </div>
      <a href="post.html?id=${story.id}" class="read-more-btn">続きを読む</a>
    `;
    
    searchResultsContainer.appendChild(resultItem);
  });
}

// 記事投稿フォームの処理
function setupStoryForm() {
  // すでにpost_form.htmlにインラインスクリプトとして実装
}

// 記事をJSONに保存する関数
async function saveStory(storyData) {
  try {
    // 既存のストーリーデータを読み込む
    const response = await fetch('./data/stories.json');
    if (!response.ok) {
      throw new Error('データの読み込みに失敗しました');
    }
    
    const data = await response.json();
    
    // 新しい記事IDを設定
    storyData.id = data.stories.length > 0 
      ? Math.max(...data.stories.map(s => s.id)) + 1 
      : 1;
    
    // 既存データに新しい記事を追加
    data.stories.push(storyData);
    
    // 実際の環境では、サーバーサイドでJSONを更新する処理が必要です
    // ここでは一時的にLocalStorageに保存します
    localStorage.setItem('pendingStories', JSON.stringify(data));
    
    return true;
  } catch (error) {
    console.error('エラーが発生しました:', error);
    return false;
  }
}
