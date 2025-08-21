// --- DOM要素の取得 ---
const scoreA_display = document.getElementById('score-a');
const scoreB_display = document.getElementById('score-b');
const bonusA_display = document.getElementById('bonus-a');
const bonusB_display = document.getElementById('bonus-b');
const useBonusA_btn = document.getElementById('use-bonus-a');
const useBonusB_btn = document.getElementById('use-bonus-b');
const turnInfo_display = document.getElementById('turn-info');
const leftTheme_display = document.getElementById('left-theme');
const rightTheme_display = document.getElementById('right-theme');
const guessSlider = document.getElementById('guess-slider');
const needle = document.getElementById('needle');
const targetCover = document.getElementById('target-cover');
const psychicControls = document.getElementById('psychic-controls');
const guesserControls = document.getElementById('guesser-controls');
const opponentControls = document.getElementById('opponent-controls');
const resultControls = document.getElementById('result-controls');
const rerollButton = document.getElementById('reroll-button');
const showGuesserViewBtn = document.getElementById('show-guesser-view');
const revealButton = document.getElementById('reveal-button');
const guessLeftBtn = document.getElementById('guess-left');
const guessRightBtn = document.getElementById('guess-right');
const nextTurnBtn = document.getElementById('next-turn-button');
const resultDisplay = document.getElementById('result-display');
const opponentTeamName = document.getElementById('opponent-team-name');
const opponentResultDisplay = document.getElementById('opponent-result-display');
const targets = {
    2: document.getElementById('target-2'),
    3: document.getElementById('target-3'),
    4: document.getElementById('target-4')
};
const sounds = {
    reveal: document.getElementById('sound-reveal'),
    score: document.getElementById('sound-score'),
    win: document.getElementById('sound-win'),
};

// ★ New: 正解エリアの幅のパターンを複数定義
const targetConfigs = [
    { points4: 0.08, points3: 0.16, points2: 0.24 }, // 標準
    { points4: 0.12, points3: 0.20, points2: 0.28 }, // 4点が広い
    { points4: 0.05, points3: 0.13, points2: 0.21 }, // 4点が狭い
    { points4: 0.09, points3: 0.18, points2: 0.25 }, // やや4点が広い
    { points4: 0.07, points3: 0.15, points2: 0.23 }, // やや4点が狭い
];

// --- お題データ ---
const topics = [
    { left: '下手な言い訳', right: '上手な言い訳' }, { left: '無名', right: '有名' }, { left: '普通の日', right: '最高の日' }, { left: 'まずいシリアル', right: '美味しいシリアル' }, { left: 'SF', right: 'ファンタジー' }, { left: '汚い', right: '綺麗' }, { left: '需要がない', right: '需要がある' }, { left: '過小評価', right: '過大評価' }, { left: '悪役', right: 'ヒーロー' }, { left: 'オプション', right: '必需品' }, { left: '退屈な趣味', right: '面白い趣味' }, { left: '無意味', right: '有意義' }, { left: 'B級映画', right: '名作映画' }, { left: '日常的な出来事', right: '一生に一度の出来事' }, { left: '無秩序', right: '秩序' }, { left: '難しいスキル', right: '簡単なスキル' }, { left: 'ダサい', right: 'おしゃれ' }, { left: '無駄遣い', right: '価値ある投資' }, { left: '柔らかい', right: '硬い' }, { left: 'アナログ', right: 'デジタル' }, { left: '静か', right: 'うるさい' }, { left: '頼りない', right: '頼もしい' }, { left: '一時的な流行', right: '時代を超越する' }, { left: '健康的', right: '不健康' }, { left: 'ローテク', right: 'ハイテク' }, { left: 'ありふれている', right: '珍しい' }, { left: '偽物', right: '本物' }, { left: '弱い', right: '強い' }, { left: '軽食', right: '大食事' }, { left: '悲しい歌', right: '楽しい歌' }, { left: 'ありえない', right: 'ありえる' }, { left: '保守的', right: '革新的' }, { left: '手作り', right: '大量生産' }, { left: '単純なゲーム', right: '複雑なゲーム' }, { left: '計画的', right: '衝動的' }, { left: '犬派', right: '猫派' }, { left: '甘い', right: 'しょっぱい' }, { left: '古典文学', right: '現代文学' }, { left: 'インドア', right: 'アウトドア' }, { left: '安い', right: '高い' }, { left: '安全', right: '危険' }, { left: 'コメディ', right: 'ホラー' }, { left: '朝型人間', right: '夜型人間' }, { left: '仕事', right: '遊び' }, { left: 'マイナースポーツ', right: 'メジャースポーツ' }, { left: '良い習慣', right: '悪い習慣' }, { left: '子供っぽい', right: '大人っぽい' }, { left: '期待外れ', right: '期待以上' }, { left: 'カジュアルな服装', right: 'フォーマルな服装' }, { left: '退屈な仕事', right: 'やりがいのある仕事' }, { left: '忘れられがち', right: '記憶に残る' }, { left: '狭い', right: '広い' }, { left: '軽い', right: '重い' }, { left: '短い', right: '長い' }, { left: '遅い', right: '速い' }, { left: '暗い', right: '明るい' }, { left: 'フィクション', right: 'ノンフィクション' }, { left: '芸術', right: '科学' }, { left: 'ローカル', right: 'グローバル' }, { left: '古い', right: '新しい' }, { left: '悲観主義', right: '楽観主義' }, { left: '自然', right: '人工' }, { left: '一般的な知識', right: '専門的な知識' }, { left: '有罪', right: '無罪' }, { left: '初心者', right: '専門家' }, { left: 'メリット', right: 'デメリット' }, { left: '許される', right: '許されない' }, { left: 'かっこ悪い', right: 'かっこ良い' }, { left: '役立つ', right: '役に立たない' }, { left: '現実的', right: '非現実的' }, { left: '人気がない', right: '人気がある' }, { left: '必要悪', right: '純粋な悪' }, { left: '倫理的', right: '非倫理的' }, { left: '一時的な満足', right: '長期的な幸福' }, { left: '美味しい食べ物', right: '体に良い食べ物' }, { left: '良いリーダー', right: '悪いリーダー' }, { left: '良いアドバイス', right: '悪いアドバイス' }, { left: '才能', right: '努力' }, { left: '面白い人', right: '良い人' }, { left: '自由', right: '安全' }, { left: '創造', right: '破壊' }, { left: '見た目', right: '中身' }, { left: '質', right: '量' }, { left: '多様性', right: '均一性' }, { left: '直感', right: '論理' }, { left: '知識', right: '知恵' }, { left: '謙虚', right: '傲慢' }, { left: '幸運', right: '不運' }, { left: '愛', right: 'お金' }, { left: '権力', right: '名誉' }, { left: '目的', right: '手段' }, { left: '他人からの評価', right: '自己評価' }, { left: '結果', right: '過程' }, { left: 'テクノロジーは善', right: 'テクノロジーは悪' }, { left: '秘密', right: '公開' }, { left: '伝統', right: '革新' }, { left: '個人主義', right: '集団主義' }, { left: '運命', right: '自由意志' }, { left: '客観', right: '主観' }, { left: 'ミニマリスト', right: 'マキシマリスト' }, { left: '普通', right: '奇妙' }, { left: '予測可能', right: '予測不可能' }, { left: '尊敬', right: '恐怖' }, { left: '良い秘密', right: '悪い秘密' }, { left: '静かな強さ', right: '派手な強さ' }, { left: '良い影響', right: '悪い影響' }, { left: '癒される', right: 'ストレスがたまる' }, { left: '良いSF', right: '悪いSF' }, { left: '良いファッション', right: '悪いファッション' }, { left: '良いスーパーヒーロー', right: '悪いスーパーヒーロー' }, { left: '良い親', right: '悪い親' }, { left: '良い映画のリメイク', right: '悪い映画のリメイク' }, { left: '良い友達', right: '悪い友達' }, { left: '良い芸術', right: '悪い芸術' }, { left: '良い先生', right: '悪い先生' }, { left: '良い冗談', right: '悪い冗談' }, { left: '良い嘘', right: '悪い嘘' }, { left: '良い決断', right: '悪い決断' }, { left: '良い投資', right: '悪い投資' }, { left: '良いサプライズ', right: '悪いサプライズ' }, { left: '良い物語の終わり方', right: '悪い物語の終わり方' }, { left: '良いペット', right: '悪いペット' }, { left: '良い曲', right: '悪い曲' }, { left: '良い匂い', right: '嫌な匂い' }, { left: '良いアイデア', right: '悪いアイデア' }, { left: '良いウェブサイト', right: '悪いウェブサイト' }, { left: '良い目標', right: '悪い目標' }, { left: '良いルール', right: '悪いルール' }, { left: '良い法律', right: '悪い法律' }, { left: '良いテレビゲーム', right: '悪いテレビゲーム' }, { left: '良い食事', right: '悪い食事' }, { left: '良い睡眠', right: '悪い睡眠' }
];

// --- ゲーム状態管理 ---
let gameState = {
    scoreA: 0,
    scoreB: 0,
    bonusA: 0,
    bonusB: 0,
    currentTurn: 'A',
    targetPosition: 0,
    gamePhase: 'SETUP',
    currentTopic: null,
    currentTargetConfig: null, // ★ New: 現在の正解エリアの幅設定を保持
};

// --- ヘルパー関数 ---
function playSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Sound play failed:", e));
}

// --- ゲーム進行関数 ---
function setupNewTurn() {
    gameState.gamePhase = 'PSYCHIC';
    turnInfo_display.textContent = `TEAM ${gameState.currentTurn}のターン`;
    turnInfo_display.className = `turn-info team-${gameState.currentTurn.toLowerCase()}`;
    setNewTopic();

    // ★ New: ターンごとにランダムな正解エリア設定を選択
    gameState.currentTargetConfig = targetConfigs[Math.floor(Math.random() * targetConfigs.length)];
    // ★ New: 正解エリアの位置もランダムに設定
    gameState.targetPosition = Math.random() * 180;
    
    console.log(`正解の位置: ${gameState.targetPosition.toFixed(2)}`, `エリア設定:`, gameState.currentTargetConfig);

    // UIリセット
    Object.values(targets).forEach(t => {
        t.style.opacity = 0;
        t.style.transform = 'scale(0.8)';
    });
    guessSlider.value = 90;
    updateNeedle(90, false);
    document.getElementById('clue-input').value = '';
    psychicControls.style.display = 'block';
    guesserControls.style.display = 'none';
    opponentControls.style.display = 'none';
    resultControls.style.display = 'none';
    opponentResultDisplay.textContent = '';
    targetCover.style.display = 'none';
    
    showTargetForPsychic();
}

function setNewTopic() { /* (変更なし) */ }
function updateTopicDisplay() { /* (変更なし) */ }
function rerollTopic() { setNewTopic(); }

function showTargetForPsychic() {
    // ★ Modified: gameStateから動的に幅を設定
    targets[4].style.width = `${gameState.currentTargetConfig.points4 * 100}%`;
    targets[3].style.width = `${gameState.currentTargetConfig.points3 * 100}%`;
    targets[2].style.width = `${gameState.currentTargetConfig.points2 * 100}%`;

    Object.entries(targets).forEach(([score, el]) => {
        const width = parseFloat(el.style.width);
        el.style.left = `calc(${(gameState.targetPosition / 180) * 100}% - ${width/2}%)`;
        el.style.display = 'flex';
        el.style.opacity = 1;
        el.style.transform = 'scale(1)';
    });
}

function updateNeedle(angle, animate = true) { /* (変更なし) */ }

function handleGuess() {
    gameState.gamePhase = 'OPPONENT';
    revealButton.disabled = true;
    playSound(sounds.reveal);
    const guess = parseFloat(guessSlider.value);
    updateNeedle(guess);

    setTimeout(() => {
        targetCover.style.display = 'none';
        showTargetForPsychic();
        Object.values(targets).forEach(t => {
            t.style.opacity = 1;
            t.style.transform = 'scale(1)';
        });
    }, 1200);

    setTimeout(() => {
        let score = 0;
        const targetCenter = gameState.targetPosition;
        
        // ★ Modified: gameStateから動的に得点範囲を計算
        const width4_deg = 180 * gameState.currentTargetConfig.points4;
        const width3_deg = 180 * gameState.currentTargetConfig.points3;
        const width2_deg = 180 * gameState.currentTargetConfig.points2;

        if (guess >= targetCenter - width4_deg / 2 && guess <= targetCenter + width4_deg / 2) {
            score = 4;
        } else if (guess >= targetCenter - width3_deg / 2 && guess <= targetCenter + width3_deg / 2) {
            score = 3;
        } else if (guess >= targetCenter - width2_deg / 2 && guess <= targetCenter + width2_deg / 2) {
            score = 2;
        }

        if (score > 0) playSound(sounds.score);

        if (gameState.currentTurn === 'A') {
            gameState.scoreA += score;
            if (score === 4) gameState.bonusA++;
        } else {
            gameState.scoreB += score;
            if (score === 4) gameState.bonusB++;
        }

        resultDisplay.textContent = `TEAM ${gameState.currentTurn} は ${score}点 獲得！`;
        if (score === 4) resultDisplay.textContent += ' (⭐ボーナス獲得！)';

        updateScores();
        guesserControls.style.display = 'none';
        
        if (score > 0) {
            opponentControls.style.display = 'block';
            const opponentTeam = gameState.currentTurn === 'A' ? 'B' : 'A';
            opponentTeamName.textContent = `相手チーム (TEAM ${opponentTeam}) のチャンス！`;
        } else {
            resultControls.style.display = 'block';
        }
    }, 2200);
}

function handleOpponentGuess(direction) { /* (変更なし) */ }
function updateScores() { /* (変更なし) */ }

// --- イベントリスナー ---
// (すべてのイベントリスナーは変更なし)
useBonusA_btn.addEventListener('click', () => { /* ... */ });
useBonusB_btn.addEventListener('click', () => { /* ... */ });
// (その他のリスナーも同様)

// --- ここから下は変更ありません ---
function setNewTopic() {
    gameState.currentTopic = topics[Math.floor(Math.random() * topics.length)];
    updateTopicDisplay();
}
function updateTopicDisplay() {
    leftTheme_display.textContent = gameState.currentTopic.left;
    rightTheme_display.textContent = gameState.currentTopic.right;
}
function updateNeedle(angle, animate = true) {
    needle.style.transition = animate ? 'transform 1s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
    needle.style.transform = `translateX(-50%) rotate(${angle - 90}deg)`;
}
function handleOpponentGuess(direction) {
    gameState.gamePhase = 'RESULT';
    const guess = parseFloat(guessSlider.value);
    const actual = gameState.targetPosition;
    let opponentScore = 0;
    const directionText = direction === 'left' ? '左' : '右';
    if ((direction === 'left' && actual < guess) || (direction === 'right' && actual > guess)) {
        opponentScore = 1;
        playSound(sounds.score);
        opponentResultDisplay.textContent = `相手チームの予想: ${directionText} (正解！) +1点`;
        opponentResultDisplay.className = 'opponent-result correct';
    } else {
        opponentResultDisplay.textContent = `相手チームの予想: ${directionText} (ハズレ...)`;
        opponentResultDisplay.className = 'opponent-result incorrect';
    }
    if (opponentScore > 0) {
        if (gameState.currentTurn === 'A') gameState.scoreB += 1;
        else gameState.scoreA += 1;
    }
    updateScores();
    opponentControls.style.display = 'none';
    resultControls.style.display = 'block';
}
function updateScores() {
    const scoreADisplay = document.querySelector('#score-a');
    const scoreBDisplay = document.querySelector('#score-b');
    if (parseInt(scoreADisplay.textContent) !== gameState.scoreA) scoreADisplay.classList.add('score-updated');
    if (parseInt(scoreBDisplay.textContent) !== gameState.scoreB) scoreBDisplay.classList.add('score-updated');
    scoreADisplay.textContent = gameState.scoreA;
    scoreBDisplay.textContent = gameState.scoreB;
    setTimeout(() => {
        scoreADisplay.classList.remove('score-updated');
        scoreBDisplay.classList.remove('score-updated');
    }, 500);
    bonusA_display.textContent = '⭐'.repeat(gameState.bonusA);
    bonusB_display.textContent = '⭐'.repeat(gameState.bonusB);
    useBonusA_btn.disabled = (gameState.bonusA === 0);
    useBonusB_btn.disabled = (gameState.bonusB === 0);
    if (gameState.scoreA >= 10 || gameState.scoreB >= 10) {
        const winner = gameState.scoreA >= 10 ? 'A' : 'B';
        resultDisplay.textContent = `🎉 TEAM ${winner} の勝利！ 🎉`;
        nextTurnBtn.textContent = 'もう一度遊ぶ';
        nextTurnBtn.onclick = () => location.reload();
        playSound(sounds.win);
    }
}
guessSlider.addEventListener('input', () => updateNeedle(guessSlider.value, false));
rerollButton.addEventListener('click', rerollTopic);
showGuesserViewBtn.addEventListener('click', () => {
    gameState.gamePhase = 'GUESSING';
    targetCover.style.display = 'block';
    Object.values(targets).forEach(t => {
        t.style.opacity = 0;
        t.style.display = 'none';
    });
    psychicControls.style.display = 'none';
    guesserControls.style.display = 'block';
    revealButton.disabled = false;
});
revealButton.addEventListener('click', handleGuess);
guessLeftBtn.addEventListener('click', () => handleOpponentGuess('left'));
guessRightBtn.addEventListener('click', () => handleOpponentGuess('right'));
nextTurnBtn.addEventListener('click', () => {
    gameState.currentTurn = gameState.currentTurn === 'A' ? 'B' : 'A';
    setupNewTurn();
});
useBonusA_btn.addEventListener('click', () => {
    if (gameState.bonusA > 0) {
        gameState.bonusA--;
        gameState.scoreA++;
        playSound(sounds.score);
        updateScores();
    }
});
useBonusB_btn.addEventListener('click', () => {
    if (gameState.bonusB > 0) {
        gameState.bonusB--;
        gameState.scoreB++;
        playSound(sounds.score);
        updateScores();
    }
});
setupNewTurn();