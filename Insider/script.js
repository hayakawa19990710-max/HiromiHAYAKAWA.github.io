document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 (変更なし) ---
    const screens = {
        entry: document.getElementById('screen-entry'),
        originalTheme: document.getElementById('screen-original-theme'),
        roleCheck: document.getElementById('screen-role-check'),
        gmCheck: document.getElementById('screen-gm-check'),
        timer: document.getElementById('screen-timer'),
        vote: document.getElementById('screen-vote'),
        result: document.getElementById('screen-result'),
    };
    const playersList = document.getElementById('players-list');
    const addPlayerBtn = document.getElementById('add-player-btn');
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
    const gmCheckName = document.getElementById('gm-check-name');
    const gmThemeDisplay = document.getElementById('gm-theme-display');
    const gmThemeText = document.getElementById('gm-theme-text');
    const showGmThemeBtn = document.getElementById('show-gm-theme-btn');
    const gotoTimerBtn = document.getElementById('goto-timer-btn');
    const timerDisplay = document.getElementById('timer-display');
    const startTimerBtn = document.getElementById('start-timer-btn');
    const finishEarlyBtn = document.getElementById('finish-early-btn');
    const voteButtonsContainer = document.getElementById('vote-buttons-container');
    const resultTextTimedOut = document.getElementById('result-text-timed-out');
    const resultDetails = document.getElementById('result-details');
    const resultTheme = document.getElementById('result-theme');
    const resultInsider = document.getElementById('result-insider');
    const resultWinner = document.getElementById('result-winner');
    const playAgainBtn = document.getElementById('play-again-btn');

    let gameState = {};
    let timerInterval;

    // --- 【拡張】お題リスト ---

    const commonNouns = [
        // 食べ物・飲み物 (50)
        "リンゴ", "カレーライス", "寿司", "ラーメン", "ピザ", "ハンバーガー", "おにぎり", "パン", "ケーキ", "アイスクリーム",
        "バナナ", "ぶどう", "いちご", "オレンジ", "メロン", "スイカ", "トマト", "きゅうり", "じゃがいも", "たまねぎ",
        "ステーキ", "焼肉", "たこ焼き", "そば", "うどん", "天ぷら", "お好み焼き", "餃子", "パスタ", "グラタン",
        "卵", "牛乳", "チーズ", "ヨーグルト", "豆腐", "納豆", "味噌汁", "ご飯", "食パン", "クロワッサン",
        "コーヒー", "紅茶", "緑茶", "ジュース", "水", "ビール", "ワイン", "日本酒", "ウイスキー", "コーラ",
        // 生活用品 (50)
        "テレビ", "スマホ", "パソコン", "椅子", "机", "ベッド", "冷蔵庫", "電子レンジ", "洗濯機", "掃除機",
        "エアコン", "扇風機", "鉛筆", "消しゴム", "ノート", "本", "時計", "メガネ", "帽子", "靴",
        "傘", "鍵", "鏡", "窓", "ドア", "ソファ", "カーテン", "照明", "歯ブラシ", "タオル",
        "石鹸", "シャンプー", "ドライヤー", "爪切り", "体温計", "薬", "ゴミ箱", "ハンガー", "アイロン", "布団",
        "ハサミ", "のり", "定規", "ペン", "ホッチキス", "財布", "バッグ", "ティッシュ", "電池", "電卓",
        // 職業 (30)
        "医者", "看護師", "警察官", "消防士", "先生", "弁護士", "俳優", "歌手", "スポーツ選手", "漫画家",
        "プログラマー", "デザイナー", "建築家", "美容師", "シェフ", "パイロット", "農家", "漁師", "大工", "声優",
        "アナウンサー", "宇宙飛行士", "研究者", "社長", "店員", "駅員", "運転手", "保育士", "銀行員", "公務員",
        // 概念・感情 (30)
        "愛", "平和", "夢", "希望", "幸福", "健康", "お金", "仕事", "友情", "時間",
        "自由", "正義", "戦争", "歴史", "未来", "過去", "科学", "自然", "文化", "芸術",
        "知識", "知恵", "勇気", "恐怖", "怒り", "悲しみ", "喜び", "感情", "思考", "記憶",
        // 場所・自然 (50)
        "学校", "病院", "駅", "空港", "公園", "海", "山", "川", "森", "宇宙",
        "日本", "アメリカ", "中国", "インド", "ブラジル", "ロシア", "イギリス", "フランス", "ドイツ", "イタリア",
        "エジプト", "オーストラリア", "カナダ", "韓国", "スペイン", "城", "神社", "寺", "教会", "工場",
        "畑", "田んぼ", "港", "砂漠", "氷河", "洞窟", "遺跡", "劇場", "スタジアム", "市役所",
        "太陽", "月", "星", "雲", "雨", "雪", "雷", "虹", "風", "台風",
        // スポーツ・趣味 (30)
        "サッカー", "野球", "バスケットボール", "テニス", "ゴルフ", "水泳", "柔道", "剣道", "相撲", "マラソン",
        "卓球", "バレーボール", "ラグビー", "スキー", "スケート", "ボクシング", "陸上競技", "体操", "バドミントン", "空手",
        "読書", "散歩", "登山", "ダンス", "歌", "演奏", "絵", "睡眠", "会話", "休憩",
        // 動物・植物 (40)
        "自転車", "自動車", "電車", "飛行機", "船", "犬", "猫", "鳥", "魚", "花",
        "木", "草", "キノコ", "ライオン", "ゾウ", "キリン", "パンダ", "ウサギ", "ネズミ", "虎", 
        "猿", "熊", "鹿", "狼", "狐", "蛇", "亀", "蛙", "蝶", "蜂",
        "蟻", "蜘蛛", "クラゲ", "タコ", "イカ", "エビ", "カニ", "イルカ", "クジラ", "サメ",
        // その他 (20)
        "音楽", "映画", "ゲーム", "温泉", "祭り", "誕生日", "クリスマス", "お正月", "ハロウィン", "バレンタインデー",
        "家族", "友達", "インターネット", "SNS", "YouTube", "カメラ", "写真", "料理", "買い物", "勉強"
    ];

    const properNouns = [
        // アニメ・漫画 (50)
        "鬼滅の刃", "ポケモン", "ドラえもん", "ワンピース", "ドラゴンボール", "新世紀エヴァンゲリオン", "進撃の巨人", "名探偵コナン", "ナルト", "セーラームーン",
        "機動戦士ガンダム", "スラムダンク", "ちびまる子ちゃん", "サザエさん", "呪術廻戦", "SPY×FAMILY", "チェンソーマン", "東京リベンジャーズ", "アンパンマン", "クレヨンしんちゃん",
        "僕のヒーローアカデミア", "ジョジョの奇妙な冒険", "鋼の錬金術師", "ハンター×ハンター", "ベルセルク", "ハイキュー!!", "キングダム", "銀魂", "BLEACH", "DEATH NOTE",
        "エヴァンゲリオン", "タッチ", "北斗の拳", "シティーハンター", "キャプテン翼", "こちら葛飾区亀有公園前派出所", "犬夜叉", "らんま1/2", "うる星やつら", "ルパン三世",
        "鉄腕アトム", "ブラック・ジャック", "火の鳥", "あしたのジョー", "巨人の星", "AKIRA", "風の谷のナウシカ", "天空の城ラピュタ", "となりのトトロ", "もののけ姫",
        // 映画・ドラマ (40)
        "ジブリ", "ディズニー", "ハリー・ポッター", "スター・ウォーズ", "マーベル・シネマティック・ユニバース", "パイレーツ・オブ・カリビアン", "ジュラシック・パーク", "トイ・ストーリー", "アナと雪の女王", "君の名は。",
        "タイタニック", "アバター", "ゴジラ", "007シリーズ", "バック・トゥ・ザ・フューチャー", "インディ・ジョーンズ", "ミッション:インポッシブル", "ワイルド・スピード", "トランスフォーマー", "マトリックス",
        "E.T.", "ターミネーター", "ロッキー", "男はつらいよ", "踊る大捜査線", "相棒", "ドクターX", "半沢直樹", "孤独のグルメ", "ゲーム・オブ・スローンズ",
        "ストレンジャー・シングス", "イカゲーム", "愛の不時着", "ウォーキング・デッド", "24 -TWENTY FOUR-", "プリズン・ブレイク", "X-ファイル", "フルハウス", "フレンズ", "glee/グリー",
        // ゲーム (40)
        "スーパーマリオ", "ゼルダの伝説", "ファイナルファンタジー", "ドラゴンクエスト", "マインクラフト", "フォートナイト", "APEX LEGENDS", "大乱闘スマッシュブラザーズ", "どうぶつの森", "モンスターハンター",
        "ストリートファイター", "ウマ娘 プリティーダービー", "パズル＆ドラゴンズ", "モンスターストライク", "原神", "ポケットモンスター スカーレット・バイオレット", "スプラトゥーン", "テトリス", "バイオハザード", "メタルギアソリッド",
        "ELDEN RING", "ペルソナシリーズ", "NieR:Automata", "UNDERTALE", "ぷよぷよ", "ファイアーエムブレム", "星のカービィ", "桃太郎電鉄", "サクラ大戦", "信長の野望",
        "三國志", "パワフルプロ野球", "ウイニングイレブン", "グランツーリスモ", "リッジレーサー", "ソニック・ザ・ヘッジホッグ", "ロックマン", "悪魔城ドラキュラ", "スペースインベーダー", "パックマン",
        // 人物・グループ (60)
        "大谷翔平", "藤井聡太", "羽生結弦", "芦田愛菜", "タモリ", "明石家さんま", "ビートたけし", "ダウンタウン", "イチロー", "HIKAKIN",
        "米津玄師", "村上春樹", "宮崎駿", "黒澤明", "手塚治虫", "坂本龍一", "安倍晋三", "織田信長", "徳川家康", "聖徳太子",
        "福沢諭吉", "夏目漱石", "本田圭佑", "池江璃花子", "ひろゆき", "トランプ大統領", "バイデン大統領", "イーロン・マスク", "スティーブ・ジョブズ", "マイケル・ジャクソン",
        "リオネル・メッシ", "クリスティアーノ・ロナウド", "テイラー・スウィフト", "ビートルズ", "クイーン", "レオナルド・ディカプリオ", "トム・クルーズ", "アインシュタイン", "ニュートン", "シェイクスピア",
        "ナポレオン", "クレオパトラ", "ガンディー", "キング牧師", "ビル・ゲイツ", "King Gnu", "Official髭男dism", "YOASOBI", "Ado", "宇多田ヒカル",
        "B'z", "サザンオールスターズ", "Mr.Children", "スピッツ", "X JAPAN", "嵐", "SMAP", "BTS", "BLACKPINK", "TWICE",
        // 企業・ブランド (40)
        "トヨタ", "ソニー", "任天堂", "ユニクロ", "Apple", "Google", "Amazon", "Microsoft", "Meta (Facebook)", "テスラ",
        "マクドナルド", "スターバックス", "コカ・コーラ", "ナイキ", "ルイ・ヴィトン", "シャネル", "メルセデス・ベンツ", "IKEA", "Netflix", "YouTube",
        "セブン-イレブン", "ファミリーマート", "ローソン", "吉野家", "すき家", "無印良品", "資生堂", "パナソニック", "日立", "サントリー",
        "アサヒビール", "キリンビール", "集英社", "講談社", "小学館", "角川書店", "ウォルト・ディズニー・カンパニー", "ワーナー・ブラザース", "20世紀スタジオ", "パラマウント・ピクチャーズ",
        // 場所・イベント・その他 (70)
        "水曜日のダウンタウン", "紅白歌合戦", "M-1グランプリ", "東京タワー", "東京スカイツリー", "富士山", "エッフェル塔", "自由の女神", "ピラミッド", "万里の長城",
        "FCバルセロナ", "読売ジャイアンツ", "阪神タイガース", "浦和レッズ", "ロサンゼルス・エンゼルス", "レアル・マドリード", "WBC (ワールド・ベースボール・クラシック)", "オリンピック", "FIFAワールドカップ", "アカデミー賞",
        "ノーベル賞", "週刊少年ジャンプ", "東海道新幹線", "JR東日本", "ANA (全日本空輸)", "JAL (日本航空)", "渋谷スクランブル交差点", "道頓堀", "金閣寺", "清水寺",
        "厳島神社", "姫路城", "首里城", "白川郷", "屋久島", "知床", "小笠原諸島", "日光東照宮", "伊勢神宮", "出雲大社",
        "ルーブル美術館", "大英博物館", "メトロポリタン美術館", "サグラダ・ファミリア", "マチュピチュ", "グランド・キャニオン", "ナイアガラの滝", "ヴェネツィア", "ハワイ", "グアム",
        "コミックマーケット", "東京ゲームショウ", "フジロックフェスティバル", "サマーソニック", "さっぽろ雪まつり", "青森ねぶた祭", "祇園祭", "阿波おどり", "隅田川花火大会", "箱根駅伝",
        "夏の甲子園", "有馬記念", "日本ダービー", "GReeeeN", "いきものがかり", "Perfume", "BABYMETAL", "ONE OK ROCK", "SEKAI NO OWARI", "乃木坂46"
    ];

    // --- ここから下のゲームロジックは変更ありません ---

    function switchScreen(screenId) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenId]) screens[screenId].classList.add('active');
    }

    function createPlayerInput(index, isChecked = false) {
        const id = `player-${Date.now()}-${index}`;
        const group = document.createElement('div');
        group.className = 'player-input-group';
        const label = document.createElement('label');
        label.htmlFor = id;
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'game-master';
        radio.id = id;
        radio.checked = isChecked;
        const text = document.createElement('span');
        text.textContent = ' GM';
        label.appendChild(radio);
        label.appendChild(text);
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'player-name';
        nameInput.placeholder = `プレイヤー${index + 1}`;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-player-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            group.remove();
            updatePlayerInputs();
        });
        group.appendChild(label);
        group.appendChild(nameInput);
        group.appendChild(removeBtn);
        return group;
    }

    function updatePlayerInputs() {
        const groups = playersList.querySelectorAll('.player-input-group');
        let isAnyRadioChecked = false;
        groups.forEach((group, index) => {
            group.querySelector('.player-name').placeholder = `プレイヤー${index + 1}`;
            group.querySelector('.remove-player-btn').style.display = groups.length > 4 ? 'block' : 'none';
            if (group.querySelector('input[type="radio"]').checked) isAnyRadioChecked = true;
        });
        if (!isAnyRadioChecked && groups.length > 0) {
            groups[0].querySelector('input[type="radio"]').checked = true;
        }
    }

    function addPlayer() {
        const currentPlayers = playersList.querySelectorAll('.player-input-group').length;
        playersList.appendChild(createPlayerInput(currentPlayers));
        updatePlayerInputs();
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function setupGame(options) {
        const playerInputs = Array.from(playersList.querySelectorAll('.player-input-group'));
        const playersData = playerInputs.map(group => ({
            name: group.querySelector('.player-name').value.trim(),
            isGm: group.querySelector('input[type="radio"]').checked,
        })).filter(p => p.name !== '');

        if (playersData.length < 4) {
            alert('名前が入力されているプレイヤーが4人未満です。');
            return;
        }

        const gmData = playersData.find(p => p.isGm);
        const otherPlayersData = playersData.filter(p => !p.isGm);

        const otherRoles = ['インサイダー'];
        for (let i = 0; i < otherPlayersData.length - 1; i++) {
            otherRoles.push('庶民');
        }
        const shuffledOtherRoles = shuffleArray(otherRoles);
        
        const allPlayers = [];
        const roleCheckPlayers = [];

        otherPlayersData.forEach((playerData, index) => {
            const playerWithRole = { name: playerData.name, role: shuffledOtherRoles[index] };
            allPlayers.push(playerWithRole);
            roleCheckPlayers.push(playerWithRole);
        });
        allPlayers.push({ name: gmData.name, role: 'マスター' });
        
        let theme = '';
        if (options.mode === 'common') theme = commonNouns[Math.floor(Math.random() * commonNouns.length)];
        else if (options.mode === 'proper') theme = properNouns[Math.floor(Math.random() * properNouns.length)];
        else if (options.mode === 'original') theme = options.theme;

        gameState = {
            players: allPlayers,
            roleCheckPlayers: roleCheckPlayers,
            theme: theme,
            timerMinutes: parseInt(timerMinutesInput.value, 10),
            currentPlayerIndex: 0,
            votedPlayer: null,
            gameMode: options.mode
        };
        
        startRoleCheck();
    }
    
    function startRoleCheck() {
        const player = gameState.roleCheckPlayers[gameState.currentPlayerIndex];
        playerCheckName.textContent = `${player.name}さん`;
        roleDisplay.classList.add('hidden');
        showRoleBtn.classList.remove('hidden');
        nextPlayerBtn.classList.add('hidden');
        themeForPlayer.classList.add('hidden');
        switchScreen('roleCheck');
    }

    function handleShowRole() {
        const player = gameState.roleCheckPlayers[gameState.currentPlayerIndex];
        roleName.textContent = player.role;
        
        if (player.role === 'インサイダー') {
             themeText.textContent = `『${gameState.theme}』`;
             themeForPlayer.classList.remove('hidden');
        }
        
        roleDisplay.classList.remove('hidden');
        showRoleBtn.classList.add('hidden');
        nextPlayerBtn.classList.remove('hidden');
    }

    function handleNextPlayer() {
        gameState.currentPlayerIndex++;
        if (gameState.currentPlayerIndex < gameState.roleCheckPlayers.length) {
            startRoleCheck();
        } else {
            prepareGmCheckScreen();
        }
    }
    
    function prepareGmCheckScreen() {
        const gmName = gameState.players.find(p => p.role === 'マスター').name;
        gmCheckName.textContent = `【${gmName}】さん (マスター) へ`;
        gmThemeText.textContent = `『${gameState.theme}』`;

        gmThemeDisplay.classList.add('hidden');
        showGmThemeBtn.classList.remove('hidden');
        gotoTimerBtn.classList.add('hidden');

        if (gameState.gameMode === 'original') {
            showGmThemeBtn.textContent = '確認して進む';
        } else {
            showGmThemeBtn.textContent = 'お題を見る';
        }

        switchScreen('gmCheck');
    }

    function handleShowGmTheme() {
        gmThemeDisplay.classList.remove('hidden');
        showGmThemeBtn.classList.add('hidden');
        gotoTimerBtn.classList.remove('hidden');
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
                showResult(true);
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
        shuffleArray(playersToVote).forEach(player => {
            const button = document.createElement('button');
            button.textContent = player.name;
            button.addEventListener('click', () => handleVote(player));
            voteButtonsContainer.appendChild(button);
        });
        switchScreen('vote');
    }

    function handleVote(votedPlayer) {
        gameState.votedPlayer = votedPlayer;
        showResult(false);
    }
    
    function showResult(isTimedOut) {
        if(isTimedOut) {
            resultTextTimedOut.textContent = '時間切れのため、全員の負けです！';
            resultTextTimedOut.classList.remove('hidden');
            resultDetails.classList.add('hidden');
        } else {
            resultTextTimedOut.classList.add('hidden');
            resultDetails.classList.remove('hidden');
            const insider = gameState.players.find(p => p.role === 'インサイダー');
            resultTheme.textContent = `正解のお題は『${gameState.theme}』でした。`;
            resultInsider.textContent = `インサイダーは【${insider.name}】さんでした。`;
            if (gameState.votedPlayer.name === insider.name) {
                resultWinner.textContent = '庶民チームの勝利です！';
            } else {
                resultWinner.textContent = 'インサイダーとマスターの勝利です！';
            }
        }
        switchScreen('result');
    }

    function resetGame() {
        originalThemeInput.value = '';
        switchScreen('entry');
    }
    
    function initializeApp() {
        playersList.innerHTML = '';
        for (let i=0; i<4; i++) {
            playersList.appendChild(createPlayerInput(i, i === 0));
        }
        updatePlayerInputs();
        switchScreen('entry');
    }

    // --- イベントリスナーの設定 ---
    addPlayerBtn.addEventListener('click', addPlayer);
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
    showGmThemeBtn.addEventListener('click', handleShowGmTheme);
    gotoTimerBtn.addEventListener('click', prepareTimerScreen);
    startTimerBtn.addEventListener('click', startTimerCountdown);
    finishEarlyBtn.addEventListener('click', finishTimer);
    playAgainBtn.addEventListener('click', resetGame);

    // --- 初期設定 ---
    initializeApp();
});