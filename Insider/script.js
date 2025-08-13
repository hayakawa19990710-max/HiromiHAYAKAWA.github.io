document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const screens = {
        entry: document.getElementById('screen-entry'),
        originalTheme: document.getElementById('screen-original-theme'),
        roleCheck: document.getElementById('screen-role-check'),
        masterCheck: document.getElementById('screen-master-check'),
        timer: document.getElementById('screen-timer'),
        vote: document.getElementById('screen-vote'),
        result: document.getElementById('screen-result'),
    };

    const playerNamesInput = document.getElementById('player-names');
    const timerMinutesInput = document.getElementById('timer-minutes');
    const startCommonBtn = document.getElementById('start-common-btn');
    const startProperBtn = document.getElementById('start-proper-btn');
    const startOriginalBtn = document.getElementById('start-original-btn');

    const originalThemeInput = document.getElementById('original-theme-input');
    const confirmOriginalBtn = document.getElementById('confirm-original-btn');
    const backToEntryBtn = document.getElementById('back-to-entry-btn');
    
    const playerCheckName = document.getElementById('player-check-name');
    const roleDisplay = document.getElementById('role-display');
    const roleName = document.getElementById('role-name');
    const themeForPlayer = document.getElementById('theme-for-player');
    const themeText = document.getElementById('theme-text');
    const showRoleBtn = document.getElementById('show-role-btn');
    const nextPlayerBtn = document.getElementById('next-player-btn');
    
    const themeForMaster = document.getElementById('theme-for-master');
    const startQTimeBtn = document.getElementById('start-q-time-btn');

    const timerDisplay = document.getElementById('timer-display');
    const startTimerBtn = document.getElementById('start-timer-btn');
    const finishEarlyBtn = document.getElementById('finish-early-btn');
    
    const voteButtonsContainer = document.getElementById('vote-buttons-container');
    
    const resultTheme = document.getElementById('result-theme');
    const resultInsider = document.getElementById('result-insider');
    const resultWinner = document.getElementById('result-winner');
    const playAgainBtn = document.getElementById('play-again-btn');

    // --- ゲームの状態管理 ---
    let gameState = {};
    let timerInterval;

    // --- お題リスト ---
    const commonNouns = [
        // 食べ物 (20)
        "リンゴ", "カレーライス", "寿司", "ラーメン", "ピザ", "ハンバーガー", "おにぎり", "パン", "ケーキ", "アイスクリーム",
        "バナナ", "ぶどう", "いちご", "オレンジ", "メロン", "スイカ", "トマト", "きゅうり", "じゃがいも", "たまねぎ",
        // 生活用品 (25)
        "テレビ", "スマホ", "パソコン", "椅子", "机", "ベッド", "冷蔵庫", "電子レンジ", "洗濯機", "掃除機",
        "エアコン", "扇風機", "鉛筆", "消しゴム", "ノート", "本", "時計", "メガネ", "帽子", "靴",
        "傘", "鍵", "鏡", "窓", "ドア",
        // 職業 (20)
        "医者", "看護師", "警察官", "消防士", "先生", "弁護士", "俳優", "歌手", "スポーツ選手", "漫画家",
        "プログラマー", "デザイナー", "建築家", "美容師", "シェフ", "パイロット", "農家", "漁師", "大工", "声優",
        // 概念 (20)
        "愛", "平和", "夢", "希望", "幸福", "健康", "お金", "仕事", "友情", "時間",
        "自由", "正義", "戦争", "歴史", "未来", "過去", "科学", "自然", "文化", "芸術",
        // 場所・国 (25)
        "学校", "病院", "駅", "空港", "公園", "海", "山", "川", "森", "宇宙",
        "日本", "アメリカ", "中国", "インド", "ブラジル", "ロシア", "イギリス", "フランス", "ドイツ", "イタリア",
        "エジプト", "オーストラリア", "カナダ", "韓国", "スペイン",
        // スポーツ (15)
        "サッカー", "野球", "バスケットボール", "テニス", "ゴルフ", "水泳", "柔道", "剣道", "相撲", "マラソン",
        "卓球", "バレーボール", "ラグビー", "スキー", "スケート",
        // その他 (25)
        "自転車", "自動車", "電車", "飛行機", "船", "犬", "猫", "鳥", "魚", "花",
        "木", "太陽", "月", "星", "雲", "雨", "雪", "雷", "虹", "音楽",
        "映画", "ゲーム", "温泉", "祭り", "誕生日"
    ];

    const properNouns = [
        // アニメ・漫画 (25)
        "鬼滅の刃", "ポケモン", "ドラえもん", "ワンピース", "ドラゴンボール", "新世紀エヴァンゲリオン", "進撃の巨人", "名探偵コナン", "ナルト", "セーラームーン",
        "ガンダム", "スラムダンク", "ちびまる子ちゃん", "サザエさん", "呪術廻戦", "SPY×FAMILY", "チェンソーマン", "東京リベンジャーズ", "アンパンマン", "クレヨンしんちゃん",
        "僕のヒーローアカデミア", "ジョジョの奇妙な冒険", "鋼の錬金術師", "ハンターハンター", "ベルセルク",
        // 映画・シリーズ (20)
        "ジブリ", "ディズニー", "ハリーポッター", "スターウォーズ", "マーベル・シネマティック・ユニバース", "パイレーツ・オブ・カリビアン", "ジュラシック・パーク", "トイ・ストーリー", "アナと雪の女王", "君の名は。",
        "タイタニック", "アバター", "ゴジラ", "007シリーズ", "バック・トゥ・ザ・フューチャー", "インディ・ジョーンズ", "ミッション:インポッシブル", "ワイルド・スピード", "トランスフォーマー", "マトリックス",
        // ゲーム (20)
        "スーパーマリオ", "ゼルダの伝説", "ファイナルファンタジー", "ドラゴンクエスト", "マインクラフト", "フォートナイト", "APEX LEGENDS", "大乱闘スマッシュブラザーズ", "どうぶつの森", "モンスターハンター",
        "ストリートファイター", "ウマ娘 プリティーダービー", "パズル＆ドラゴンズ", "モンスターストライク", "原神", "ポケットモンスター スカーレット・バイオレット", "スプラトゥーン", "テトリス", "バイオハザード", "メタルギアソリッド",
        // 人物（日本）(25)
        "大谷翔平", "藤井聡太", "羽生結弦", "芦田愛菜", "タモリ", "明石家さんま", "ビートたけし", "ダウンタウン", "イチロー", "HIKAKIN",
        "米津玄師", "村上春樹", "宮崎駿", "黒澤明", "手塚治虫", "坂本龍一", "安倍晋三", "織田信長", "徳川家康", "聖徳太子",
        "福沢諭吉", "夏目漱石", "本田圭佑", "池江璃花子", "ひろゆき",
        // 人物（海外）(20)
        "トランプ大統領", "バイデン大統領", "イーロン・マスク", "スティーブ・ジョブズ", "マイケル・ジャクソン", "リオネル・メッシ", "クリスティアーノ・ロナウド", "テイラー・スウィフト", "ビートルズ", "クイーン",
        "レオナルド・ディカプリオ", "トム・クルーズ", "アインシュタイン", "ニュートン", "シェイクスピア", "ナポレオン", "クレオパトラ", "ガンディー", "キング牧師", "ビル・ゲイツ",
        // 企業・ブランド (20)
        "トヨタ", "ソニー", "任天堂", "ユニクロ", "Apple", "Google", "Amazon", "Microsoft", "Facebook (Meta)", "テスラ",
        "マクドナルド", "スターバックス", "コカ・コーラ", "ナイキ", "ルイ・ヴィトン", "シャネル", "メルセデス・ベンツ", "IKEA", "Netflix", "YouTube",
        // その他 (20)
        "嵐 (アイドルグループ)", "水曜日のダウンタウン", "紅白歌合戦", "M-1グランプリ", "東京タワー", "東京スカイツリー", "富士山", "エッフェル塔", "自由の女神", "ピラミッド",
        "万里の長城", "FCバルセロナ", "読売ジャイアンツ", "WBC (ワールド・ベースボール・クラシック)", "オリンピック", "ワールドカップ", "アカデミー賞", "ノーベル賞", "週刊少年ジャンプ", "東海道新幹線"
    ];

    // --- 関数 ---

    function switchScreen(screenId) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenId].classList.add('active');
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function setupGame(options) {
        const playerNames = playerNamesInput.value.split('\n').filter(name => name.trim() !== '');
        if (playerNames.length < 3) {
            alert('3人以上でプレイしてください。');
            return;
        }

        const roles = ['マスター', 'インサイダー'];
        for (let i = 0; i < playerNames.length - 2; i++) {
            roles.push('庶民');
        }
        const shuffledRoles = shuffleArray(roles);

        let theme = '';
        if (options.mode === 'common') {
            theme = commonNouns[Math.floor(Math.random() * commonNouns.length)];
        } else if (options.mode === 'proper') {
            theme = properNouns[Math.floor(Math.random() * properNouns.length)];
        } else if (options.mode === 'original') {
            theme = options.theme;
        }

        gameState = {
            players: playerNames.map((name, index) => ({ name, role: shuffledRoles[index] })),
            theme: theme,
            timerMinutes: parseInt(timerMinutesInput.value, 10),
            currentPlayerIndex: 0,
            votedPlayer: null,
            gameMode: options.mode
        };
        
        startRoleCheck();
    }
    
    function startRoleCheck() {
        const player = gameState.players[gameState.currentPlayerIndex];
        playerCheckName.textContent = `${player.name}さん`;

        roleDisplay.classList.add('hidden');
        showRoleBtn.classList.remove('hidden');
        nextPlayerBtn.classList.add('hidden');
        themeForPlayer.classList.add('hidden');
        
        switchScreen('roleCheck');
    }

    function handleShowRole() {
        const player = gameState.players[gameState.currentPlayerIndex];
        roleName.textContent = player.role;
        
        const isStandardMode = gameState.gameMode === 'common' || gameState.gameMode === 'proper';

        // お題が見える人：
        // ・通常モードのマスターとインサイダー
        // ・オリジナルモードのインサイダー
        if ((isStandardMode && (player.role === 'マスター' || player.role === 'インサイダー')) || 
            (gameState.gameMode === 'original' && player.role === 'インサイダー')) {
            themeText.textContent = `『${gameState.theme}』`;
            themeForPlayer.classList.remove('hidden');
        }
        
        roleDisplay.classList.remove('hidden');
        showRoleBtn.classList.add('hidden');
        nextPlayerBtn.classList.remove('hidden');
    }

    function handleNextPlayer() {
        gameState.currentPlayerIndex++;
        if (gameState.currentPlayerIndex < gameState.players.length) {
            startRoleCheck();
        } else {
            // 通常モードならマスター確認画面へ、オリジナルモードならタイマーへ
            if (gameState.gameMode === 'common' || gameState.gameMode === 'proper') {
                themeForMaster.textContent = `お題は『${gameState.theme}』です`;
                switchScreen('masterCheck');
            } else {
                // オリジナルモードはマスター確認をスキップ
                prepareTimerScreen();
            }
        }
    }
    
    function prepareTimerScreen() {
        const minutes = gameState.timerMinutes.toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:00`;
        startTimerBtn.classList.remove('hidden');
        finishEarlyBtn.classList.add('hidden');
        switchScreen('timer');
    }

    function startTimerCountdown() {
        startTimerBtn.classList.add('hidden');
        finishEarlyBtn.classList.remove('hidden');
        
        let time = gameState.timerMinutes * 60;
        timerInterval = setInterval(() => {
            time--;
            const minutes = Math.floor(time / 60).toString().padStart(2, '0');
            const seconds = (time % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${minutes}:${seconds}`;

            if (time <= 0) {
                clearInterval(timerInterval);
                alert('時間切れです！');
                setupVote();
            }
        }, 1000);
    }
    
    function finishTimer() {
        clearInterval(timerInterval);
        setupVote();
    }

    function setupVote() {
        voteButtonsContainer.innerHTML = '';
        const playersToVote = gameState.players.filter(p => p.role !== 'マスター');
        
        playersToVote.forEach(player => {
            const button = document.createElement('button');
            button.textContent = player.name;
            button.addEventListener('click', () => handleVote(player));
            voteButtonsContainer.appendChild(button);
        });
        
        switchScreen('vote');
    }

    function handleVote(votedPlayer) {
        gameState.votedPlayer = votedPlayer;
        showResult();
    }

    function showResult() {
        const insider = gameState.players.find(p => p.role === 'インサイダー');
        resultTheme.textContent = `正解のお題は『${gameState.theme}』でした。`;
        resultInsider.textContent = `インサイダーは【${insider.name}】さんでした。`;
        
        if (gameState.votedPlayer.name === insider.name) {
            resultWinner.textContent = '庶民チームの勝利です！';
        } else {
            resultWinner.textContent = 'インサイダーの勝利です！';
        }

        switchScreen('result');
    }

    function resetGame() {
        playerNamesInput.value = '';
        originalThemeInput.value = '';
        switchScreen('entry');
    }

    // --- イベントリスナーの設定 ---
    startCommonBtn.addEventListener('click', () => setupGame({ mode: 'common' }));
    startProperBtn.addEventListener('click', () => setupGame({ mode: 'proper' }));
    startOriginalBtn.addEventListener('click', () => switchScreen('originalTheme'));
    
    backToEntryBtn.addEventListener('click', () => switchScreen('entry'));
    confirmOriginalBtn.addEventListener('click', () => {
        const theme = originalThemeInput.value.trim();
        if (!theme) {
            alert('お題を入力してください。');
            return;
        }
        setupGame({ mode: 'original', theme: theme });
    });

    showRoleBtn.addEventListener('click', handleShowRole);
    nextPlayerBtn.addEventListener('click', handleNextPlayer);
    
    startQTimeBtn.addEventListener('click', prepareTimerScreen);

    startTimerBtn.addEventListener('click', startTimerCountdown);
    finishEarlyBtn.addEventListener('click', finishTimer);
    playAgainBtn.addEventListener('click', resetGame);
});