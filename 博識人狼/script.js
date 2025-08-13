window.addEventListener('DOMContentLoaded', () => {
    
    // --- HTML要素の取得 ---
    const scoreboardDiv = document.getElementById('scoreboard');
    const setupPhase = document.getElementById('setup-phase');
    const roleRevealPhase = document.getElementById('role-reveal-phase');
    const gamePhase = document.getElementById('game-phase');
    const votingPhase = document.getElementById('voting-phase');
    const resultPhase = document.getElementById('result-phase');

    const playerInputsContainer = document.getElementById('player-inputs');
    const addPlayerButton = document.getElementById('add-player-button');
    const startGameButton = document.getElementById('start-game-button');
    const difficultySelector = document.getElementById('difficulty-selector');
    const revealPlayerName = document.getElementById('reveal-player-name');
    const showRoleButton = document.getElementById('show-role-button');
    const revealedRoleArea = document.getElementById('revealed-role-area');
    const revealedRoleText = document.getElementById('revealed-role-text');
    const revealedAnswerText = document.getElementById('revealed-answer-text');
    const nextPlayerButton = document.getElementById('next-player-button');
    const questionArea = document.getElementById('question-area');
    const changeQuestionButton = document.getElementById('change-question-button');
    const timerDisplay = document.getElementById('timer');
    const finalAnswerInput = document.getElementById('final-answer-input');
    const submitAnswerButton = document.getElementById('submit-answer-button');
    const votePlayerList = document.getElementById('vote-player-list');
    const resultMessage = document.getElementById('result-message');
    const werewolfReveal = document.getElementById('werewolf-reveal');
    const nextGameButton = document.getElementById('next-game-button');

    // --- ゲームの状態を管理する変数 ---
    let players = [];
    let currentPlayerIndex = 0;
    let gameQuestion = "";
    let gameAnswer = "";
    let gameKeywords = [];
    let timerInterval;
    let timeRemaining = 600;
    let currentQuestionPool = [];
    let isInitialGame = true; // ★最初のゲームかどうかを判定するフラグを追加

    // --- イベントリスナー ---

    addPlayerButton.addEventListener('click', () => {
        const playerCount = playerInputsContainer.children.length;
        const newPlayerInput = document.createElement('input');
        newPlayerInput.type = 'text';
        newPlayerInput.placeholder = `プレイヤー${playerCount + 1}`;
        playerInputsContainer.appendChild(newPlayerInput);
    });

    // ★「ゲーム開始」ボタンのロジックを更新
    startGameButton.addEventListener('click', () => {
        // この処理は、一番最初のゲーム開始時にのみ実行されます
        if (isInitialGame) {
            const inputs = playerInputsContainer.getElementsByTagName('input');
            let playerNames = [];
            for (let i = 0; i < inputs.length; i++) {
                if (inputs[i].value.trim() !== '') {
                    playerNames.push(inputs[i].value.trim());
                }
            }
            if (playerNames.length < 3) {
                alert('プレイヤーは3人以上必要です。');
                return;
            }
            // プレイヤー情報（名前とスコア）をここで一度だけ作成します
            players = playerNames.map(name => ({ name: name, role: '', score: 0 }));
            
            // プレイヤー名が変更されないように入力欄を無効化します
            for (let i = 0; i < inputs.length; i++) {
                inputs[i].disabled = true;
            }
            addPlayerButton.disabled = true;
            
            // 最初のゲームが終わったことを記録します
            isInitialGame = false;
        }
        
        // 毎ラウンド、選択された難易度を読み込みます
        const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
        switch (selectedDifficulty) {
            case 'easy':
                currentQuestionPool = easyQuestions;
                break;
            case 'normal':
                currentQuestionPool = normalQuestions;
                break;
            case 'hard':
                currentQuestionPool = hardQuestions;
                break;
            case 'very-hard':
                currentQuestionPool = veryHardQuestions;
                break;
        }
        
        // 新しいラウンドを開始します
        startNewRound();
    });

    showRoleButton.addEventListener('click', () => {
        const currentPlayer = players[currentPlayerIndex];
        revealedRoleText.textContent = currentPlayer.role;
        if (currentPlayer.role === '人狼') {
            revealedAnswerText.textContent = `答えは「${gameAnswer}」です。`;
            revealedAnswerText.classList.remove('hidden');
        } else {
            revealedAnswerText.classList.add('hidden');
        }
        showRoleButton.classList.add('hidden');
        revealedRoleArea.classList.remove('hidden');
    });

    nextPlayerButton.addEventListener('click', () => {
        currentPlayerIndex++;
        if (currentPlayerIndex < players.length) {
            startRoleRevealTurn();
        } else {
            roleRevealPhase.classList.add('hidden');
            gamePhase.classList.remove('hidden');
            startTimer();
        }
    });

    submitAnswerButton.addEventListener('click', () => {
        const finalAnswer = finalAnswerInput.value.trim();
        if (finalAnswer === "") {
            alert("解答を入力してください。");
            return;
        }
        processAnswer(finalAnswer);
    });

    changeQuestionButton.addEventListener('click', () => {
        changeQuestion();
    });

    // ★「次のゲームへ」ボタンのロジックを更新
    nextGameButton.addEventListener('click', () => {
        // 結果画面を隠し、設定画面に戻ります
        resultPhase.classList.add('hidden');
        setupPhase.classList.remove('hidden');
    });

    // --- 関数 ---

    function toHiragana(str) {
        return str.replace(/[\u30a1-\u30f6]/g, function(match) {
            const chr = match.charCodeAt(0) - 0x60;
            return String.fromCharCode(chr);
        });
    }

    function startNewRound() {
        // 役職だけをリセットします（スコアは維持されます）
        players.forEach(p => p.role = '市民');
        const werewolfIndex = Math.floor(Math.random() * players.length);
        players[werewolfIndex].role = '人狼';

        changeQuestion(true); // 新しい問題を設定

        updateScoreboard();
        timeRemaining = 600;
        updateTimerDisplay();
        finalAnswerInput.value = "";

        // 設定画面を隠し、役職確認画面に進みます
        setupPhase.classList.add('hidden');
        roleRevealPhase.classList.remove('hidden');
        
        currentPlayerIndex = 0;
        startRoleRevealTurn();
    }
    
    function changeQuestion(isFirstTime = false) {
        let newQuestion;
        do {
            newQuestion = currentQuestionPool[Math.floor(Math.random() * currentQuestionPool.length)];
        } while (newQuestion.q === gameQuestion && currentQuestionPool.length > 1);

        gameQuestion = newQuestion.q;
        gameAnswer = newQuestion.a;
        gameKeywords = newQuestion.keywords;

        questionArea.textContent = `問題：${gameQuestion}`;

        if (!isFirstTime) {
            const werewolf = players.find(p => p.role === '人狼');
            alert(`問題が変更されました。\n\n【人狼だけ確認】\n新しい答えは「${gameAnswer}」です。\n\n他の人は見ないでください！`);
        }
    }

    function updateScoreboard() {
        scoreboardDiv.innerHTML = '<h3>スコア</h3>';
        players.sort((a, b) => b.score - a.score).forEach(p => {
            const scoreP = document.createElement('p');
            scoreP.textContent = `${p.name}: ${p.score}点`;
            scoreboardDiv.appendChild(scoreP);
        });
    }
    
    function processAnswer(submittedAnswer) {
        clearInterval(timerInterval);

        let isCorrect = false;
        const normalizedSubmittedAnswer = toHiragana(submittedAnswer.toLowerCase().replace(/[\s　]/g, ''));

        for (const keyword of gameKeywords) {
            const normalizedKeyword = toHiragana(keyword.toLowerCase());
            if (normalizedSubmittedAnswer.includes(normalizedKeyword)) {
                isCorrect = true;
                break;
            }
        }

        if (isCorrect) {
            resultMessage.textContent = `正解！答えは「${gameAnswer}」でした。市民チームの勝利です！`;
            players.forEach(p => {
                if (p.role === '市民') p.score++;
            });
            const werewolf = players.find(p => p.role === '人狼');
            werewolfReveal.textContent = `人狼は ${werewolf.name} さんでした。`;
            updateScoreboard();
            gamePhase.classList.add('hidden');
            resultPhase.classList.remove('hidden');
        } 
        else {
            gamePhase.classList.add('hidden');
            votingPhase.classList.remove('hidden');
            setupVoting();
        }
    }

    function setupVoting() {
        votePlayerList.innerHTML = '';
        players.forEach(playerToVote => {
            const voteButton = document.createElement('button');
            voteButton.textContent = playerToVote.name;
            voteButton.classList.add('vote-button');
            voteButton.addEventListener('click', () => {
                castVote(playerToVote);
            });
            votePlayerList.appendChild(voteButton);
        });
    }

    function castVote(votedPlayer) {
        const werewolf = players.find(p => p.role === '人狼');
        
        if (votedPlayer.role === '人狼') {
            resultMessage.textContent = `人狼は ${votedPlayer.name} さんでした！市民チームの逆転勝利！`;
            players.forEach(p => {
                if (p.role === '市民') p.score++;
            });
        } 
        else {
            resultMessage.textContent = `${votedPlayer.name} さんは市民でした…。人狼チームの完全勝利！`;
            werewolf.score += 2;
        }
        
        werewolfReveal.textContent = `正解は「${gameAnswer}」、人狼は ${werewolf.name} さんでした。`;
        updateScoreboard();
        votingPhase.classList.add('hidden');
        resultPhase.classList.remove('hidden');
    }

    function startRoleRevealTurn() {
        const currentPlayer = players[currentPlayerIndex];
        revealPlayerName.textContent = currentPlayer.name;
        showRoleButton.classList.remove('hidden');
        revealedRoleArea.classList.add('hidden');
    }

    function startTimer() {
        submitAnswerButton.disabled = false;
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert("議論時間終了！");
                submitAnswerButton.disabled = true;
                processAnswer("");
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const formattedSeconds = String(seconds).padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${formattedSeconds}`;
    }

    // ★★★ 400問の問題リスト ★★★
    const easyQuestions = [
        { q: "日本の首都はどこ？", a: "東京", keywords: ["東京", "とうきょう"] },
        { q: "信号機で「進め」を意味する色は？", a: "青", keywords: ["青", "緑", "あお", "みどり"] },
        { q: "童話『桃太郎』で、犬、猿と一緒に鬼退治に行った鳥は何？", a: "雉", keywords: ["雉", "きじ"] },
        { q: "1年は何か月？", a: "12ヶ月", keywords: ["12", "十二"] },
        { q: "サッカーは1チーム何人でプレーする？", a: "11人", keywords: ["11", "十一"] },
        { q: "アニメ『ドラえもん』の主人公、のび太のフルネームは何？", a: "野比のび太", keywords: ["野比のび太", "のびのびた"] },
        { q: "お寿司のネタで、赤い身の魚の代表格といえば？", a: "マグロ", keywords: ["マグロ", "まぐろ"] },
        { q: "「A」から始まるアルファベットの最初の文字は何？", a: "A", keywords: ["A", "a"] },
        { q: "夜空に光る、地球の周りを回っている星は何？", a: "月", keywords: ["月", "つき"] },
        { q: "クリスマスにプレゼントを配る、赤い服を着たおじいさんの名前は？", a: "サンタクロース", keywords: ["サンタ", "サンタクロース"] },
        { q: "ごはん、みそ汁、焼き魚。これはどこの国の典型的な朝食？", a: "日本", keywords: ["日本", "にほん", "にっぽん"] },
        { q: "ライオンやトラが分類される、ネコの仲間の動物をまとめて何科という？", a: "ネコ科", keywords: ["ネコ", "ねこ"] },
        { q: "暑い夏に食べる、氷を削ってシロップをかけた冷たいおやつは何？", a: "かき氷", keywords: ["かき氷", "かきごおり"] },
        { q: "『白雪姫』に登場する、姫を助ける7人の小人。彼らの職業は何？", a: "鉱夫", keywords: ["鉱夫", "炭鉱夫", "こうふ"] },
        { q: "パンダの主な食べ物は何？", a: "笹", keywords: ["笹", "竹", "ささ", "たけ"] },
        { q: "日本で一番高い電波塔の名前は？", a: "東京スカイツリー", keywords: ["スカイツリー", "東京スカイツリー"] },
        { q: "手紙やハガキを出すとき、宛先の住所や名前を書く面の反対側に貼るものは何？", a: "切手", keywords: ["切手", "きって"] },
        { q: "野球で、ボールを打つ人が持つ道具は何？", a: "バット", keywords: ["バット"] },
        { q: "一週間の最初の曜日は何曜日？", a: "日曜日", keywords: ["日曜", "にちよう"] },
        { q: "『となりのトトロ』で、サツキとメイが引っ越してきた家の隣に住んでいる、森の主の名前は？", a: "トトロ", keywords: ["トトロ"] },
        { q: "蛇口をひねると出てくる、人間が生きていくのに欠かせない透明な液体は何？", a: "水", keywords: ["水", "みず"] },
        { q: "朝起きた時に「おはよう」と言いますが、夜寝る前に言う挨拶は何？", a: "おやすみなさい", keywords: ["おやすみ", "おやすみなさい"] },
        { q: "日本の通貨単位は何？", a: "円", keywords: ["円", "えん"] },
        { q: "スマートフォンやパソコンで文字を入力するために使う、ボタンが並んだ板状の装置は何？", a: "キーボード", keywords: ["キーボード"] },
        { q: "海に住んでいる、足が8本ある生き物で、墨を吐くことで知られるのは何？", a: "タコ", keywords: ["タコ", "たこ"] },
        { q: "甘くて黄色い、皮をむいて食べる果物で、猿の好物としても知られるのは何？", a: "バナナ", keywords: ["バナナ"] },
        { q: "雨が降った時に空に現れる、七色のアーチ状の光の現象は何？", a: "虹", keywords: ["虹", "にじ"] },
        { q: "『アンパンマン』の主人公、アンパンマンの顔は何でできている？", a: "パン", keywords: ["パン", "あんパン"] },
        { q: "ボールを足で蹴って相手のゴールに入れるスポーツは何？", a: "サッカー", keywords: ["サッカー"] },
        { q: "春に咲く、日本の国花としても有名なピンク色の花は何？", a: "桜", keywords: ["桜", "さくら"] },
        { q: "1年は何日？（うるう年を除く）", a: "365日", keywords: ["365", "三百六十五"] },
        { q: "体調が悪い時に行く場所はどこ？", a: "病院", keywords: ["病院", "びょういん"] },
        { q: "鉛筆で書いた文字を消すために使う文房具は何？", a: "消しゴム", keywords: ["消しゴム", "けしごむ"] },
        { q: "『シンデレラ』が舞踏会に行くために乗った、カボチャから変身した乗り物は何？", a: "馬車", keywords: ["馬車", "ばしゃ"] },
        { q: "世界で一番大きな動物は何？", a: "シロナガスクジラ", keywords: ["シロナガスクジラ", "クジラ"] },
        { q: "顔を洗ったり、歯を磨いたりする場所はどこ？", a: "洗面所", keywords: ["洗面所", "せんめんじょ"] },
        { q: "本をたくさん置いてあり、借りることができる施設は何？", a: "図書館", keywords: ["図書館", "としょかん"] },
        { q: "熱いお湯に入って体をきれいにする場所はどこ？", a: "お風呂", keywords: ["風呂", "ふろ"] },
        { q: "ゲーム『ポケットモンスター』で、ピカチュウが使うでんきタイプの技の代表格は何？", a: "10まんボルト", keywords: ["10万ボルト", "十万ボルト"] },
        { q: "お米を炊いて作る、日本の主食は何？", a: "ごはん", keywords: ["ごはん", "米", "こめ"] },
        { q: "空を飛ぶ乗り物で、翼がついているものは何？", a: "飛行機", keywords: ["飛行機", "ひこうき"] },
        { q: "犬が嬉しそうに振る、体の一部はどこ？", a: "しっぽ", keywords: ["しっぽ", "尻尾"] },
        { q: "寒い冬に降る、白い雪の結晶が集まったものは何？", a: "雪", keywords: ["雪", "ゆき"] },
        { q: "童話『大きなかぶ』で、おじいさん、おばあさん、孫の次にかぶを引っ張ったのは誰？", a: "犬", keywords: ["犬", "いぬ"] },
        { q: "スーパーマーケットなどで、商品を買うときにお金を入れる機械は何？", a: "レジ", keywords: ["レジ"] },
        { q: "『ちびまる子ちゃん』の主人公、まる子の本名は何？", a: "さくらももこ", keywords: ["さくらももこ"] },
        { q: "体の大きさを測る時に使う単位は何？", a: "メートル", keywords: ["メートル", "センチメートル"] },
        { q: "お腹がすいた時に食べるものは何？", a: "食べ物", keywords: ["食べ物", "たべもの"] },
        { q: "道路を渡る時に使う、白と黒の縞模様が描かれた場所は何？", a: "横断歩道", keywords: ["横断歩道", "おうだんほどう"] },
        { q: "ハチミツが好きな、黄色いクマのキャラクターの名前は何？", a: "くまのプーさん", keywords: ["プーさん", "プー"] },
        { q: "指にはめるアクセサリーの名前は何？", a: "指輪", keywords: ["指輪", "ゆびわ"] },
        { q: "紙を切るために使う文房具は何？", a: "はさみ", keywords: ["はさみ", "ハサミ"] },
        { q: "『名探偵コナン』の主人公、コナンの正体である高校生探偵の名前は何？", a: "工藤新一", keywords: ["工藤新一", "くどうしんいち"] },
        { q: "一日のうち、太陽が沈んで暗くなる時間帯を何という？", a: "夜", keywords: ["夜", "よる"] },
        { q: "遠くのものを見るために使う、筒状の道具は何？", a: "望遠鏡", keywords: ["望遠鏡", "ぼうえんきょう"] },
        { q: "足に履く、布や革でできたものは何？", a: "靴", keywords: ["靴", "くつ"] },
        { q: "頭にかぶるものは何？", a: "帽子", keywords: ["帽子", "ぼうし"] },
        { q: "スタジオジブリの映画で、黒猫のジジが登場する作品のタイトルは何？", a: "魔女の宅急便", keywords: ["魔女の宅急便", "まじょのたっきゅうびん"] },
        { q: "勉強を教えてくれる人は誰？", a: "先生", keywords: ["先生", "せんせい"] },
        { q: "椅子に座って食事や勉強をするための家具は何？", a: "机", keywords: ["机", "つくえ", "テーブル"] },
        { q: "ミッキーマウスの恋人の名前は何？", a: "ミニーマウス", keywords: ["ミニー", "ミニーマウス"] },
        { q: "日本の昔話で、金太郎が相撲をとった相手の動物は何？", a: "熊", keywords: ["熊", "くま"] },
        { q: "電話をかけるときに押す、数字が書かれたボタンがある機械は何？", a: "電話", keywords: ["電話", "でんわ"] },
        { q: "暑い日に涼むために使う、風を起こす機械は何？", a: "扇風機", keywords: ["扇風機", "せんぷうき"] },
        { q: "『クレヨンしんちゃん』の主人公、しんのすけの妹の名前は何？", a: "ひまわり", keywords: ["ひまわり"] },
        { q: "海や川で泳ぐ魚を捕まえることを何という？", a: "釣り", keywords: ["釣り", "つり"] },
        { q: "眠る時に使う、ふかふかの寝具は何？", a: "布団", keywords: ["布団", "ふとん", "ベッド"] },
        { q: "火を消すために消防士が使う乗り物は何？", a: "消防車", keywords: ["消防車", "しょうぼうしゃ"] },
        { q: "『ONE PIECE』の主人公、ルフィが目指している「海賊王」になるために探している宝物は何？", a: "ひとつなぎの大秘宝（ワンピース）", keywords: ["ワンピース", "ひとつなぎの大秘宝"] },
        { q: "お祝いの時に食べる、甘くてデコレーションされたケーキの代表格は何？", a: "ショートケーキ", keywords: ["ショートケーキ"] },
        { q: "ゾウの最も特徴的な、長くて曲がった鼻を何という？", a: "鼻", keywords: ["鼻", "はな"] },
        { q: "物語の登場人物が話す言葉を何という？", a: "セリフ", keywords: ["セリフ", "台詞"] },
        { q: "『それいけ！アンパンマン』に登場する、アンパンマンの宿敵の名前は？", a: "ばいきんまん", keywords: ["ばいきんまん", "バイキンマン"] },
        { q: "冬のスポーツで、スキー板を履いて雪の上を滑るものは何？", a: "スキー", keywords: ["スキー"] },
        { q: "時間を知るために見る道具は何？", a: "時計", keywords: ["時計", "とけい"] },
        { q: "お湯を沸かすために使う台所用品は何？", a: "やかん", keywords: ["やかん", "ケトル"] },
        { q: "『ゲゲゲの鬼太郎』の主人公、鬼太郎の左目には何が隠されている？", a: "目玉おやじ", keywords: ["目玉おやじ", "めだまおやじ"] },
        { q: "鳥が空を飛ぶために使う、体の一部はどこ？", a: "翼", keywords: ["翼", "つばさ", "羽"] },
        { q: "地面に穴を掘って暮らす、ミミズを食べる動物は何？", a: "モグラ", keywords: ["モグラ", "もぐら"] },
        { q: "日本で子供の日（5月5日）に飾る、魚の形をしたのぼりは何？", a: "こいのぼり", keywords: ["こいのぼり", "鯉のぼり"] },
        { q: "食事の時に使う、食べ物を口に運ぶための道具は何？", a: "箸", keywords: ["箸", "はし"] },
        { q: "『サザエさん』の主人公、サザEさんの夫の名前は何？", a: "マスオ", keywords: ["マスオ", "フグ田マスオ"] },
        { q: "電車やバスに乗るために買う、小さな紙の券は何？", a: "切符", keywords: ["切符", "きっぷ"] },
        { q: "夜、道を明るく照らすために設置されている照明は何？", a: "街灯", keywords: ["街灯", "がいとう"] },
        { q: "『となりのトトロ』で、トトロが雨の日にサツキに貸してくれた、頭の上にのせる葉っぱは何？", a: "傘", keywords: ["傘", "かさ"] },
        { q: "自分の顔や姿を映して見るために使う、ガラス製の道具は何？", a: "鏡", keywords: ["鏡", "かがみ"] },
        { q: "病気やケガを治すために飲むものは何？", a: "薬", keywords: ["薬", "くすり"] },
        { q: "字を書いたり、絵を描いたりするために使う、インクが出る筆記用具は何？", a: "ペン", keywords: ["ペン"] },
        { q: "『天空の城ラピュタ』で、パズーが屋根の上で吹いていた楽器は何？", a: "トランペット", keywords: ["トランペット"] },
        { q: "お正月に子供がもらう、お金が入った袋を何という？", a: "お年玉", keywords: ["お年玉", "おとしだま"] }
    ];
    const normalQuestions = [
        { q: "日本で一番高い山は何？", a: "富士山", keywords: ["富士山", "ふじさん"] },
        { q: "日本で一番大きい湖は何？", a: "琵琶湖", keywords: ["琵琶湖", "びわこ"] },
        { q: "世界で最も人口が多い国はどこ？(2023年時点)", a: "インド", keywords: ["インド"] },
        { q: "太陽系の惑星のうち、地球のすぐ外側を公転している惑星は何？", a: "火星", keywords: ["火星", "かせい"] },
        { q: "元素記号「H」が示す元素は何？", a: "水素", keywords: ["水素", "すいそ"] },
        { q: "光の三原色といえば、赤、緑と何？", a: "青", keywords: ["青", "あお", "ブルー"] },
        { q: "江戸幕府を開いた初代将軍は誰？", a: "徳川家康", keywords: ["徳川家康", "家康"] },
        { q: "『最後の晩餐』や『モナ・リザ』を描いたルネサンス期の芸術家は誰？", a: "レオナルド・ダ・ヴィンチ", keywords: ["レオナルド・ダ・ヴィンチ", "ダヴィンチ", "ダビンチ", "レオナルド"] },
        { q: "漫画『ONE PIECE』の主人公ルフィが食べた悪魔の実は何？", a: "ゴムゴムの実", keywords: ["ゴムゴム", "ゴム"] },
        { q: "『ハリー・ポッター』シリーズで、主人公ハリーが通う魔法学校の名前は何？", a: "ホグワーツ", keywords: ["ホグワーツ", "Hogwarts"] },
        { q: "日本の運転免許証で、優良運転者（ゴールド免許）の有効期間は何年？", a: "5年", keywords: ["5", "五"] },
        { q: "鉛筆の芯の硬さを表す記号で、「H」と「B」がありますが、「B」は何の略？", a: "ブラック", keywords: ["ブラック", "Black"] },
        { q: "トランプのキングの中で、唯一口ひげがない王様は何のマーク？", a: "ハート", keywords: ["ハート", "Heart"] },
        { q: "サッカーの1チームの人数は何人？", a: "11人", keywords: ["11", "十一"] },
        { q: "寿司屋で使われる「ガリ」。これは何を甘酢に漬けたもの？", a: "生姜", keywords: ["生姜", "しょうが", "ショウガ"] },
        { q: "世界で最も面積の大きい国はどこ？", a: "ロシア", keywords: ["ロシア"] },
        { q: "オリンピックの五輪の色に含まれない色は？ (青・黄・黒・緑・赤・白)", a: "白", keywords: ["白", "しろ"] },
        { q: "十二支で、へびの次に来る動物は何？", a: "馬", keywords: ["馬", "うま"] },
        { q: "日本のプロ野球で、セントラル・リーグの球団ではないのはどれ？（巨人、阪神、ソフトバンク）", a: "ソフトバンク", keywords: ["ソフトバンク", "Softbank"] },
        { q: "世界で一番高い建物がある都市はどこ？(2024年時点)", a: "ドバイ", keywords: ["ドバイ", "Dubai"] },
        { q: "水が気体になると何という？", a: "水蒸気", keywords: ["水蒸気", "すいじょうき"] },
        { q: "植物が光を使ってエネルギーを作り出す働きを何という？", a: "光合成", keywords: ["光合成", "こうごうせい"] },
        { q: "人間の体で最も大きい臓器は何？", a: "皮膚", keywords: ["皮膚", "ひふ"] },
        { q: "血液を全身に送り出すポンプの役割をする臓器は何？", a: "心臓", keywords: ["心臓", "しんぞう"] },
        { q: "鉄が錆びる化学反応を何という？", a: "酸化", keywords: ["酸化", "さんか"] },
        { q: "フランス革命のスローガン「自由、平等」のあと一つは何？", a: "博愛", keywords: ["博愛", "友愛", "はくあい"] },
        { q: "アメリカの初代大統領は誰？", a: "ジョージ・ワシントン", keywords: ["ワシントン", "Washington"] },
        { q: "日本の歴史上、最も長く続いた時代区分は何時代？", a: "江戸時代", keywords: ["江戸", "えど"] },
        { q: "俳句の基本の音の数は「五・七・？」", a: "五", keywords: ["五", "ご", "5"] },
        { q: "1964年にアジアで初めてオリンピックが開催された都市はどこ？", a: "東京", keywords: ["東京", "とうきょう"] },
        { q: "アニメ『サザエさん』の主人公、サザエさんの夫、マスオさんの職業は何？", a: "サラリーマン", keywords: ["サラリーマン", "商社"] },
        { q: "ゲーム『ドラゴンクエスト』シリーズに登場する、一番有名な呪文は何？", a: "ホイミ", keywords: ["ホイミ"] },
        { q: "スタジオジブリの映画で、人間の言葉を話す猫のキャラクター「バロン」が登場する作品は何？", a: "猫の恩返し", keywords: ["猫の恩返し", "ねこのおんがえし"] },
        { q: "映画『君の名は。』を監督したのは誰？", a: "新海誠", keywords: ["新海誠", "新海"] },
        { q: "ビートルズのメンバーが4人であることは有名ですが、その出身都市はどこ？", a: "リバプール", keywords: ["リバプール", "Liverpool"] },
        { q: "キーボードの配列で、最も一般的な「QWERTY配列」の名前の由来は何？", a: "キーボードの左上の6文字", keywords: ["キーボード", "左上", "配列"] },
        { q: "ゴルフで、1つのホールを規定の打数より1打少なく終えることを何という？", a: "バーディー", keywords: ["バーディー", "Birdie"] },
        { q: "「サハラ砂漠」の「サハラ」とは、現地の言葉でどういう意味？", a: "砂漠", keywords: ["砂漠", "さばく"] },
        { q: "タラバガニは、生物学的にはカニの仲間ではない。○か×か？", a: "○", keywords: ["○", "まる", "はい"] },
        { q: "世界で初めてインスタントラーメンを発明した日本人は誰？", a: "安藤百福", keywords: ["安藤百福", "安藤"] },
        { q: "日本の都道府県で、県の面積が一番小さいのはどこ？", a: "香川県", keywords: ["香川", "かがわ"] },
        { q: "元素記号「Au」が示す元素は何？", a: "金", keywords: ["金", "きん", "ゴールド"] },
        { q: "地球の自転によって生じる、風や海流の向きを変える見かけの力を何という？", a: "コリオリの力", keywords: ["コリオリ", "転向力"] },
        { q: "鎌倉幕府を倒し、建武の新政を始めた天皇は誰？", a: "後醍醐天皇", keywords: ["後醍醐", "ごだいご"] },
        { q: "ゴッホの代表作で、渦巻く夜空が描かれた絵画のタイトルは何？", a: "星月夜", keywords: ["星月夜", "ほしづきよ"] },
        { q: "漫画『SLAM DUNK』の主人公、桜木花道が所属するバスケ部がある高校は？", a: "湘北高校", keywords: ["湘北", "しょうほく"] },
        { q: "アカデミー賞で作品賞を受賞した初の外国語映画は何？", a: "パラサイト 半地下の家族", keywords: ["パラサイト", "Parasite"] },
        { q: "『千と千尋の神隠し』で、千尋が働くことになる湯屋の名前は何？", a: "油屋", keywords: ["油屋", "あぶらや"] },
        { q: "自動販売機で飲み物を買うとき、お金を入れる前にボタンを押しても反応しないのはなぜ？", a: "売り切れ表示のため", keywords: ["売り切れ", "うりきれ"] },
        { q: "「お歳暮」を贈る時期として一般的なのはいつ？", a: "12月", keywords: ["12月", "十二月", "年末"] },
        { q: "世界三大珍味といえば、キャビア、フォアグラとあと一つは何？", a: "トリュフ", keywords: ["トリュフ"] },
        { q: "太陽系で、太陽に一番近い惑星は何？", a: "水星", keywords: ["水星", "すいせい"] },
        { q: "日本の初代内閣総理大臣は誰？", a: "伊藤博文", keywords: ["伊藤博文", "伊藤"] },
        { q: "シェイクスピアの四大悲劇に含まれない作品は？（ハムレット、オセロ、リア王、ロミオとジュリエット）", a: "ロミオとジュリエット", keywords: ["ロミオとジュリエット", "ロミオ"] },
        { q: "アニメ『新世紀エヴァンゲリオン』の主人公、碇シンジが搭乗する機体の名前は何？", a: "エヴァンゲリオン初号機", keywords: ["初号機", "エヴァ"] },
        { q: "バスケットボールの試合で、1チームのコート上の選手は何人？", a: "5人", keywords: ["5", "五"] },
        { q: "ことわざ「二階から〇〇」。〇〇に入るのは？", a: "目薬", keywords: ["目薬", "めぐすり"] },
        { q: "日本の都道府県で、人口が最も少ないのはどこ？", a: "鳥取県", keywords: ["鳥取", "とっとり"] },
        { q: "色の三原色（減法混色）といえば、シアン、マゼンタと何？", a: "イエロー", keywords: ["イエロー", "黄"] },
        { q: "DNAの二重らせん構造を発見した科学者は、ワトソンと誰？", a: "クリック", keywords: ["クリック", "Crick"] },
        { q: "1492年にアメリカ大陸に到達した探検家は誰？", a: "コロンブス", keywords: ["コロンブス", "Columbus"] },
        { q: "ベートーヴェンの交響曲第5番の通称は何？", a: "運命", keywords: ["運命", "うんめい"] },
        { q: "漫画『ベルサイユのばら』の主人公、男装の麗人オスカルのフルネームは何？", a: "オスカル・フランソワ・ド・ジャルジェ", keywords: ["オスカル"] },
        { q: "映画『スター・ウォーズ』シリーズに登場する、光る剣の名前は何？", a: "ライトセーバー", keywords: ["ライトセーバー", "ライトセイバー"] },
        { q: "テニスで、スコアが0点のことを何という？", a: "ラブ", keywords: ["ラブ", "Love"] },
        { q: "「情けは人の為ならず」という言葉の正しい意味は？", a: "人に親切にすれば、巡り巡って自分に良い報いが来る", keywords: ["自分に返ってくる", "巡り巡って"] },
        { q: "世界で最も多くの島を持つ国はどこ？", a: "スウェーデン", keywords: ["スウェーデン"] },
        { q: "元素記号「Fe」が示す元素は何？", a: "鉄", keywords: ["鉄", "てつ"] },
        { q: "地動説を唱えたポーランドの天文学者は誰？", a: "コペルニクス", keywords: ["コペルニクス", "Copernicus"] },
        { q: "平家を滅ぼした源氏の武将で、鎌倉幕府を開いたのは誰？", a: "源頼朝", keywords: ["源頼朝", "頼朝"] },
        { q: "アニメ『機動戦士ガンダム』の主人公、アムロ・レイが言った有名なセリフ「親父にもぶたれたことないのに！」の「親父」とは誰のこと？", a: "テム・レイ", keywords: ["テム・レイ", "テム"] },
        { q: "J-POPグループ「嵐」のメンバーの人数は何人？", a: "5人", keywords: ["5", "五"] },
        { q: "ボクシングの階級で、最も重い階級を何という？", a: "ヘビー級", keywords: ["ヘビー級", "ヘビー"] },
        { q: "日本の伝統的なカードゲームで、百人の歌人の和歌が書かれているものは何？", a: "百人一首", keywords: ["百人一首", "ひゃくにんいっしゅ"] },
        { q: "インターネット上で自分の分身として表示されるキャラクター画像を何という？", a: "アバター", keywords: ["アバター", "Avatar"] },
        { q: "地球の大気の主成分である気体は何？", a: "窒素", keywords: ["窒素", "ちっそ"] },
        { q: "1853年、黒船を率いて日本に来航したアメリカの軍人は誰？", a: "ペリー", keywords: ["ペリー", "Perry"] },
        { q: "小説『吾輩は猫である』の作者は誰？", a: "夏目漱石", keywords: ["夏目漱石", "漱石"] },
        { q: "アニメ『ルパン三世』で、ルパンの仲間である凄腕のガンマンの名前は何？", a: "次元大介", keywords: ["次元大介", "次元"] },
        { q: "世界で最も話者数が多い言語（母語話者数）は何語？", a: "中国語", keywords: ["中国語", "ちゅうごくご"] },
        { q: "日本の国会は、衆議院と何で構成されている？", a: "参議院", keywords: ["参議院", "さんぎいん"] },
        { q: "元素記号「Ag」が示す元素は何？", a: "銀", keywords: ["銀", "ぎん", "シルバー"] },
        { q: "相対性理論を提唱した物理学者は誰？", a: "アインシュタイン", keywords: ["アインシュタイン", "Einstein"] },
        { q: "1543年に日本に鉄砲を伝えたのはどこの国の人？", a: "ポルトガル", keywords: ["ポルトガル", "Portugal"] },
        { q: "ギリシャ神話で、神々の王として知られるのは誰？", a: "ゼウス", keywords: ["ゼウス", "Zeus"] },
        { q: "映画『E.T.』で、主人公の少年と心を通わせる宇宙人の名前は何？", a: "E.T.", keywords: ["ET", "イーティー"] },
        { q: "日本の武道で、礼に始まり礼に終わるとされるものは何？", a: "柔道", keywords: ["柔道", "じゅうどう"] },
        { q: "ことわざ「石の上にも〇〇」。〇〇に入るのは？", a: "三年", keywords: ["三年", "さんねん"] },
        { q: "世界で一番小さい国はどこ？", a: "バチカン市国", keywords: ["バチカン", "Vatican"] },
        { q: "人間の五感に含まれないものはどれ？（視覚、聴覚、嗅覚、味覚、触覚、第六感）", a: "第六感", keywords: ["第六感", "だいろっかん"] }
    ];
    const hardQuestions = [
        { q: "1867年に徳川慶喜が行った、政権を朝廷に返上した出来事を何という？", a: "大政奉還", keywords: ["大政奉還", "たいせいほうかん"] },
        { q: "細胞内でエネルギーを生産する「細胞の発電所」とも呼ばれる小器官は何？", a: "ミトコンドリア", keywords: ["ミトコンドリア"] },
        { q: "ゲーテの戯曲『ファウスト』で、主人公が魂を売る契約を交わした悪魔の名前は何？", a: "メフィストフェレス", keywords: ["メフィストフェレス", "メフィスト"] },
        { q: "慣性の法則、運動の法則、作用・反作用の法則からなる、古典力学の基本法則をまとめたのは誰？", a: "ニュートン", keywords: ["ニュートン", "Newton"] },
        { q: "「人間は考える葦である」という言葉を残した、17世紀フランスの哲学者は誰？", a: "パスカル", keywords: ["パスカル", "Pascal"] },
        { q: "コンピュータの記憶装置で、電源を切ると内容が消えてしまう、主記憶装置として使われるメモリを何という？", a: "RAM", keywords: ["RAM", "ラム"] },
        { q: "オーストラリアの先住民を何と呼ぶ？", a: "アボリジニ", keywords: ["アボリジニ"] },
        { q: "絵画の技法で、点描によって視覚混合を利用し、明るい色彩効果を生み出した画家の代表格は誰？", a: "スーラ", keywords: ["スーラ", "Seurat"] },
        { q: "旧約聖書に登場する、神が建てさせた巨大な塔が、言語の混乱を引き起こしたとされる伝説の塔は何？", a: "バベルの塔", keywords: ["バベルの塔", "バベル"] },
        { q: "経済学で、市場価格が需要と供給のバランスをとるように動くことを、比喩的に「神の何」と表現する？", a: "見えざる手", keywords: ["見えざる手", "みえざるて"] },
        { q: "日本の戦国時代、武田信玄が掲げた軍旗に書かれていた四文字は何？", a: "風林火山", keywords: ["風林火山", "ふうりんかざん"] },
        { q: "地球の成層圏に存在し、太陽からの有害な紫外線を吸収する気体の層を何という？", a: "オゾン層", keywords: ["オゾン層", "オゾン"] },
        { q: "トルストイの長編小説で、ナポレオン戦争期のロシア社会を舞台にした作品のタイトルは何？", a: "戦争と平和", keywords: ["戦争と平和", "せんそうとへいわ"] },
        { q: "コンピュータウイルスの一種で、自己増殖能力を持ち、ネットワークを介して他のコンピュータに感染を広げるものを何という？", a: "ワーム", keywords: ["ワーム", "Worm"] },
        { q: "古代ギリシャの三大悲劇詩人といえば、アイスキュロス、ソフォクレスと誰？", a: "エウリピデス", keywords: ["エウリピデス"] },
        { q: "生物の体内で、特定の化学反応を促進する触媒の役割を果たすタンパク質を何という？", a: "酵素", keywords: ["酵素", "こうそ"] },
        { q: "1919年にドイツで制定され、当時最も民主的な憲法と評価された憲法の通称は何？", a: "ワイマール憲法", keywords: ["ワイマール", "ワイマール"] },
        { q: "インターネットのドメイン名で、「.jp」や「.us」のように国や地域を表す部分を何と呼ぶ？", a: "ccTLD", keywords: ["ccTLD", "国別コードトップレベルドメイン"] },
        { q: "スペインの画家ダリに代表される、無意識の世界や夢の中の風景を描こうとした芸術運動を何という？", a: "シュルレアリスム", keywords: ["シュルレアリスム", "超現実主義"] },
        { q: "ノーベル賞の6つの部門に含まれていない賞はどれ？（物理学、化学、医学・生理学、文学、平和、経済学、数学）", a: "数学", keywords: ["数学", "すうがく"] },
        { q: "平安時代の女流作家、清少納言が書いた随筆のタイトルは何？", a: "枕草子", keywords: ["枕草子", "まくらのそうし"] },
        { q: "原子核を構成する粒子である、陽子と中性子を総称して何と呼ぶ？", a: "核子", keywords: ["核子", "かくし"] },
        { q: "アメリカの公民権運動の指導者で、「I Have a Dream」の演説で知られるのは誰？", a: "キング牧師", keywords: ["キング牧師", "マーティン・ルーサー・キング"] },
        { q: "オーケストラで使われる楽器のうち、木管楽器に分類されないのはどれ？（フルート、クラリネット、トランペット、オーボエ）", a: "トランペット", keywords: ["トランペット"] },
        { q: "心理学で、自分の成功は内的要因（能力など）に、失敗は外的要因（不運など）に帰属させる傾向を何という？", a: "自己奉仕バイアス", keywords: ["自己奉仕バイアス", "セルフサービングバイアス"] },
        { q: "日本の法律で、国民の祝日を定めている法律の名前は何？", a: "国民の祝日に関する法律", keywords: ["祝日法"] },
        { q: "月の満ち欠けで、新月から次の新月までにかかる期間は、約何日？", a: "29.5日", keywords: ["29.5", "二十九・五"] },
        { q: "1962年に、アメリカとソ連の対立が核戦争寸前まで高まった事件を何という？", a: "キューバ危機", keywords: ["キューバ危機"] },
        { q: "フランスの作曲家ドビュッシーの代表曲で、月の光を題材にしたピアノ曲のタイトルは何？", a: "月の光", keywords: ["月の光", "つきのひかり"] },
        { q: "企業の社会的責任を意味する、アルファベット3文字の略語は何？", a: "CSR", keywords: ["CSR"] },
        { q: "日本の古典芸能で、面（おもて）を用いることで知られる歌舞劇は何？", a: "能", keywords: ["能", "のう"] },
        { q: "気象学において、地中海地域で見られる、アフリカから吹く高温で乾燥した南風を何という？", a: "シロッコ", keywords: ["シロッコ"] },
        { q: "イギリスの経済学者ケインズが、不況期に政府が公共事業などを行うことで有効需要を創出するべきだと主張した経済理論を何という？", a: "ケインズ経済学", keywords: ["ケインズ"] },
        { q: "ギリシャ神話で、自分の姿を水面に映して見とれているうちに水仙の花になった美少年の名前は何？", a: "ナルキッソス", keywords: ["ナルキッソス"] },
        { q: "コンピュータのファイルシステムで、ファイルの断片化を解消し、読み書きの速度を向上させる操作を何という？", a: "デフラグ", keywords: ["デフラグ"] },
        { q: "江戸時代の浮世絵師で、「富嶽三十六景」を描いたことで知られるのは誰？", a: "葛飾北斎", keywords: ["葛飾北斎", "北斎"] },
        { q: "生物の分類階級で、「科」と「種」の間にあるのは何？", a: "属", keywords: ["属", "ぞく"] },
        { q: "第一次世界大戦の講和条約で、ドイツに巨額の賠償金などを課した条約は何？", a: "ヴェルサイユ条約", keywords: ["ヴェルサイユ条約"] },
        { q: "イタリアの作曲家ヴェルディのオペラで、エジプトの将軍ラダメスとエチオピアの王女の悲恋を描いた作品は何？", a: "アイーダ", keywords: ["アイーダ"] },
        { q: "哲学で、経験や感覚に頼らず、理性的な思考のみによって真理に到達しようとする立場を何という？", a: "合理論", keywords: ["合理論", "ごうりろん"] },
        { q: "日本の城で、天守閣が黒いことから「烏城（うじょう）」とも呼ばれる城はどこ？", a: "岡山城", keywords: ["岡山城", "おかやまじょう"] },
        { q: "光が物質を透過する際に、その一部が吸収される度合いを示す物理量を何という？", a: "吸光度", keywords: ["吸光度", "きゅうこうど"] },
        { q: "1989年に、東西ドイツを隔てていた「ベルリンの壁」が崩壊しましたが、この壁が建設されたのは西暦何年？", a: "1961年", keywords: ["1961"] },
        { q: "シェイクスピアの戯曲『ヴェニスの商人』で、悪役として知られる金貸しの名前は何？", a: "シャイロック", keywords: ["シャイロック"] },
        { q: "社会心理学で、集団で意思決定を行う際に、個人で考えるよりも極端な結論に至りやすくなる現象を何という？", a: "集団極性化", keywords: ["集団極性化", "グループポーラリゼーション"] },
        { q: "OSI参照モデルにおいて、第3層にあたり、ネットワーク間のデータ転送（ルーティング）を担当する層は何？", a: "ネットワーク層", keywords: ["ネットワーク層"] },
        { q: "江戸時代に、伊能忠敬が作成した非常に精密な日本地図の名前は何？", a: "大日本沿海輿地全図", keywords: ["大日本沿海輿地全図", "伊能図"] },
        { q: "生物の遺伝情報を担うDNAの二重らせん構造において、アデニン(A)は必ず何と対をなす？", a: "チミン", keywords: ["チミン", "T"] },
        { q: "ベトナム戦争の終結につながった、1973年に結ばれた和平協定は何？", a: "パリ協定", keywords: ["パリ協定"] },
        { q: "スペインの建築家ガウディが設計した、現在も建設が続くバルセロナの巨大な教会の名前は何？", a: "サグラダ・ファミリア", keywords: ["サグラダファミリア"] }
    ];
    const veryHardQuestions = [
        { q: "哲学において、物事の根源的な原因や原理を探求する学問分野を何という？", a: "形而上学", keywords: ["形而上学", "けいじじょうがく", "メタフィジックス"] },
        { q: "素数であり、かつ一つ前の素数との差が2であるような素数のペアを何という？", a: "双子素数", keywords: ["双子素数", "ふたごそすう"] },
        { q: "コンピュータのCPUにおいて、命令を解釈し実行するサイクルを何サイクルという？", a: "フェッチ・デコード・エグゼキュートサイクル", keywords: ["フェッチ", "デコード", "エグゼキュート"] },
        { q: "19世紀のイギリスで、機械化に反対して機械を破壊した労働者たちの運動を何という？", a: "ラッダイト運動", keywords: ["ラッダイト", "Luddite"] },
        { q: "生物の細胞内で、遺伝情報に基づいてタンパク質を合成する役割を持つ小さな器官は何？", a: "リボソーム", keywords: ["リボソーム", "Ribosome"] },
        { q: "シェイクスピアの戯曲『夏の夜の夢』に登場する、いたずら好きな妖精の名前は何？", a: "パック", keywords: ["パック", "Puck"] },
        { q: "経済学において、市場の失敗を是正するために政府が市場に介入することを正当化する理論的根拠の一つである、外部性が存在する財を何という？", a: "公共財", keywords: ["公共財", "こうきょうざい"] },
        { q: "量子力学において、観測されるまで粒子の状態が確定しないことを示す、有名な思考実験に登場する猫の名前は何？", a: "シュレーディンガーの猫", keywords: ["シュレーディンガー", "Schrödinger"] },
        { q: "古代ギリシャの哲学者アリストテレスが提唱した、物語の三つの構成要素とは、始まり、中間と何？", a: "終わり", keywords: ["終わり", "おわり", "終結"] },
        { q: "美術史において、17世紀のオランダで活躍した、光と影の描写に優れた画家で、『夜警』などの作品で知られるのは誰？", a: "レンブラント", keywords: ["レンブラント", "Rembrandt"] },
        { q: "古代ローマの政治家カエサルがガリア遠征について記した著作のタイトルは何？", a: "ガリア戦記", keywords: ["ガリア戦記", "ガリア"] },
        { q: "素粒子物理学の標準模型において、力を媒介する素粒子を総称して何と呼ぶ？", a: "ゲージ粒子", keywords: ["ゲージ粒子", "ゲージボソン"] },
        { q: "音楽理論において、長調の主音から数えて3番目と7番目の音を半音下げて作られる、ブルースなどで特徴的に使われる音階を何という？", a: "ブルーノートスケール", keywords: ["ブルーノート"] },
        { q: "ロシアの文豪ドストエフスキーの長編小説で、主人公ラスコーリニコフが老婆を殺害し、その罪の意識に苦しむ物語のタイトルは何？", a: "罪と罰", keywords: ["罪と罰", "つみとばつ"] },
        { q: "14世紀にヨーロッパで大流行し、人口の3分の1が死亡したとされる伝染病は何？", a: "ペスト", keywords: ["ペスト", "黒死病"] },
        { q: "心理学において、人が集団の中にいると、個人でいる時よりも手抜きをしやすくなる現象を何という？", a: "社会的手抜き", keywords: ["社会的手抜き", "リンゲルマン効果"] },
        { q: "仏教において、一切の煩悩から解放された、理想的な心の境地のことを何という？", a: "涅槃", keywords: ["涅槃", "ねはん", "ニルヴァーナ"] },
        { q: "化学において、分子構造は同じだが、原子の立体的な配置が異なる異性体を何という？", a: "立体異性体", keywords: ["立体異性体", "ステレオアイソマー"] },
        { q: "映画理論において、画面に映っているものだけでなく、音や観客の想像力によって暗示される画面外の空間を何という？", a: "オフスクリーン", keywords: ["オフスクリーン", "off-screen"] },
        { q: "日本の平安時代に成立した、世界最古の長編小説とされる作品は何？", a: "源氏物語", keywords: ["源氏物語", "げんじものがたり"] },
        { q: "天文学において、超新星爆発の後に残される、極めて密度の高い中性子の塊からなる天体を何という？", a: "中性子星", keywords: ["中性子星", "ちゅうせいしせい"] },
        { q: "言語学において、文の基本的な構造を「主語(S)」「動詞(V)」「目的語(O)」などで表しますが、日本語の語順は一般的にどの型に分類される？", a: "SOV型", keywords: ["SOV"] },
        { q: "1929年の世界恐慌を受け、アメリカのルーズベルト大統領が実施した一連の経済政策を何という？", a: "ニューディール政策", keywords: ["ニューディール", "New Deal"] },
        { q: "精神分析学の創始者フロイトが提唱した、人間の無意識の中に抑圧された願望が、言い間違いや物忘れとして現れることを何という？", a: "失錯行為", keywords: ["失錯行為", "しっさくこうい"] },
        { q: "コンピュータサイエンスにおいて、ある問題を解決するための計算手順や処理方法を明確に記述したものを何という？", a: "アルゴリズム", keywords: ["アルゴリズム", "Algorithm"] },
        { q: "ギリシャ神話に登場する、上半身が人間で下半身が馬の姿をした種族を何という？", a: "ケンタウロス", keywords: ["ケンタウロス", "Centaur"] },
        { q: "法学において、成文法が存在しない場合に、慣習や条理に基づいて裁判官が法を創造することを認める考え方を何という？", a: "判例法主義", keywords: ["判例法", "はんれいほう"] },
        { q: "細胞が自らの細胞内成分を分解し、リサイクルする自食作用のことを英語で何という？", a: "オートファジー", keywords: ["オートファジー", "Autophagy"] },
        { q: "16世紀の宗教改革で、カトリック教会に抗議（プロテスト）したことから生まれたキリスト教の宗派を総称して何という？", a: "プロテスタント", keywords: ["プロテスタント", "Protestant"] },
        { q: "認知心理学において、最初に提示された情報が後の判断に影響を及ぼす現象を何という？", a: "アンカリング効果", keywords: ["アンカリング"] },
        { q: "数学の未解決問題「リーマン予想」が、もし証明されれば、何に関する分布の謎が解明される？", a: "素数", keywords: ["素数", "そすう"] },
        { q: "アメリカの作家メルヴィルが書いた、白鯨モービィ・ディックに復讐を誓うエイハブ船長の物語のタイトルは何？", a: "白鯨", keywords: ["白鯨", "はくげい"] },
        { q: "遺伝子の本体であるDNAを構成する4種類の塩基は、アデニン、グアニン、シトシンと何？", a: "チミン", keywords: ["チミン", "Thymine"] },
        { q: "社会学において、人々が特定の社会的役割や期待に合わせて行動するようになることを、演劇の比喩で説明した概念を何という？", a: "ドラマツルギー", keywords: ["ドラマツルギー"] },
        { q: "ルネサンス期のイタリアの思想家マキャヴェリが著書『君主論』で述べた、目的のためには手段を選ばない政治思想を何と呼ぶ？", a: "マキャヴェリズム", keywords: ["マキャベリズム", "マキャヴェリズム"] },
        { q: "物理学において、物体の温度が絶対零度に近づくにつれて、その電気抵抗がゼロになる現象を何という？", a: "超伝導", keywords: ["超伝導", "ちょうでんどう"] },
        { q: "古代インドの叙事詩で、パーンダヴァ族とカウラヴァ族の間の壮大な戦いを描いた、世界最長の詩とされる作品は何？", a: "マハーバーラタ", keywords: ["マハーバーラタ"] },
        { q: "経済学において、ある企業の製品やサービスが普及することで、その製品やサービスの価値が高まる効果を何という？", a: "ネットワーク外部性", keywords: ["ネットワーク外部性"] },
        { q: "イスラム教の五行（信者が行うべき五つの義務）に含まれないものはどれ？（信仰告白、礼拝、断食、喜捨、巡礼、聖戦）", a: "聖戦", keywords: ["聖戦", "ジハード"] },
        { q: "フランスの哲学者デカルトが、方法的懐疑の末にたどり着いた、自己の存在を証明する有名な命題は何？", a: "我思う、故に我あり", keywords: ["我思う故に我あり", "コギトエルゴスム"] },
        { q: "地質学において、約6600万年前に恐竜などの大量絶滅が起きたとされる、中生代と新生代の境界を示す地層を何と呼ぶ？", a: "K-Pg境界", keywords: ["K-Pg", "K-T"] },
        { q: "ドイツの哲学者ニーチェが、従来の道徳や価値観を否定し、自らの力で新たな価値を創造する人間を指して呼んだ言葉は何？", a: "超人", keywords: ["超人", "ちょうじん", "ユーベルメンシュ"] },
        { q: "映画『2001年宇宙の旅』で、反乱を起こす人工知能（AI）の名前は何？", a: "HAL 9000", keywords: ["HAL", "ハル"] },
        { q: "文学において、物語の結末で、絶対的な力を持つ存在（神など）が現れて問題を解決する強引な手法を、古代ギリシャ演劇に由来する言葉で何という？", a: "デウス・エクス・マキナ", keywords: ["デウスエクスマキナ"] },
        { q: "情報理論において、情報の量を表す基本的な単位は何？", a: "ビット", keywords: ["ビット", "bit"] },
        { q: "18世紀のフランスで、ダランベールやディドロらによって編纂された、近代的な百科事典の先駆けとなった書物は何？", a: "百科全書", keywords: ["百科全書", "エンサイクロペディア"] },
        { q: "生物の進化において、異なる種が同じような環境に適応した結果、似たような形態を持つようになる現象を何という？", a: "収斂進化", keywords: ["収斂進化", "しゅうれんしんか"] },
        { q: "サンスクリット語で「行為」を意味し、インド哲学において、過去の行いが現在の、そして未来の運命を決定するという法則を何という？", a: "カルマ", keywords: ["カルマ", "業"] },
        { q: "19世紀のフランスの画家マネが、裸婦と着衣の男性を同じ画面に描いたことでスキャンダルを巻き起こした作品のタイトルは何？", a: "草上の昼食", keywords: ["草上の昼食"] },
        { q: "アインシュタインの特殊相対性理論において、高速で移動する物体では、時間の進み方が遅くなる現象を何という？", a: "時間の遅れ", keywords: ["時間の遅れ", "ウラシマ効果"] },
        { q: "万葉集に収められている和歌の形式で、五・七・五・七・七の音数律からなるものを何という？", a: "短歌", keywords: ["短歌", "たんか"] },
        { q: "絶対王政期のフランスで、ルイ14世が建設した壮麗な宮殿の名前は何？", a: "ヴェルサイユ宮殿", keywords: ["ヴェルサイユ宮殿"] },
        { q: "分子生物学において、DNAの遺伝情報をRNAに写し取る過程を何という？", a: "転写", keywords: ["転写", "てんしゃ"] },
        { q: "ギリシャ神話で、神々の食べ物とされ、食べると不老不死になるといわれる食物は何？", a: "アンブロシア", keywords: ["アンブロシア"] },
        { q: "カフカの小説『変身』で、主人公がある朝目覚めると何になっていた？", a: "巨大な虫", keywords: ["虫", "むし"] },
        { q: "インターネット通信で用いられる、データをパケットに分割して送信するためのプロトコル群を総称して何という？", a: "TCP/IP", keywords: ["TCP/IP", "TCP"] },
        { q: "ローマ帝国の初代皇帝は誰？", a: "アウグストゥス", keywords: ["アウグストゥス", "オクタヴィアヌス"] },
        { q: "人間の耳には聞こえない、周波数が高い音波を何という？", a: "超音波", keywords: ["超音波", "ちょうおんぱ"] },
        { q: "フランスの思想家ルソーが著書『社会契約論』で述べた、人民全体の共通の利益を目指す意思を何という？", a: "一般意志", keywords: ["一般意志", "いっぱんいし"] },
        { q: "オペラ『魔笛』や『フィガロの結婚』などを作曲したオーストリアの作曲家は誰？", a: "モーツァルト", keywords: ["モーツァルト", "Mozart"] },
        { q: "経済学において、2四半期連続で実質GDPがマイナス成長となる状態を一般に何と呼ぶ？", a: "リセッション", keywords: ["リセッション", "景気後退"] },
        { q: "仏教の開祖であるゴータマ・シッダールタの尊称は何？", a: "釈迦", keywords: ["釈迦", "しゃか", "ブッダ"] },
        { q: "化学反応の前後で、原子の種類と数は変わらないという法則を何という？", a: "質量保存の法則", keywords: ["質量保存の法則"] },
        { q: "1905年にアインシュタインが発表した、光が粒子としての性質も持つという考え方を何という？", a: "光量子仮説", keywords: ["光量子仮説", "こうりょうしかせつ"] },
        { q: "古代エジプトで使われていた、象形文字を何と呼ぶ？", a: "ヒエログリフ", keywords: ["ヒエログリフ"] },
        { q: "イギリスの童話『不思議の国のアリス』の作者は誰？", a: "ルイス・キャロル", keywords: ["ルイス・キャロル"] },
        { q: "美術において、遠近感を表現するために、近くのものを大きく、遠くのものを小さく描く技法を何という？", a: "遠近法", keywords: ["遠近法", "えんきんほう"] },
        { q: "すべてのコンピュータプログラムの基礎となる、0と1の2つの数字だけで数を表現する方法を何進法という？", a: "2進法", keywords: ["2進法", "にしんほう"] },
        { q: "南北戦争で、奴隷解放宣言を行ったアメリカの大統領は誰？", a: "リンカーン", keywords: ["リンカーン", "Lincoln"] },
        { q: "気象現象で、積乱雲の中で氷の粒が大きく成長し、地上に降ってくるものを何という？", a: "雹", keywords: ["雹", "ひょう"] },
        { q: "心理学者のユングが提唱した、個人の経験を超えて人類に共通して受け継がれる無意識の領域を何という？", a: "集合的無意識", keywords: ["集合的無意識"] },
        { q: "日本の戦国武将で、「鳴かぬなら殺してしまえホトトギス」と詠んだとされるのは誰？", a: "織田信長", keywords: ["織田信長", "信長"] },
        { q: "天動説を体系化し、中世ヨーロッパの宇宙観に大きな影響を与えた古代ギリシャの天文学者は誰？", a: "プトレマイオス", keywords: ["プトレマイオス"] },
        { q: "フランスの作家サン＝テグジュペリの小説『星の王子さま』で、王子さまが自分の星に残してきたたった一つの花は何？", a: "バラ", keywords: ["バラ", "ばら"] },
        { q: "コンピュータネットワークにおいて、IPアドレスとドメイン名を相互に変換するシステムを何という？", a: "DNS", keywords: ["DNS", "ドメインネームシステム"] },
        { q: "中国の思想家で、儒教の始祖として知られるのは誰？", a: "孔子", keywords: ["孔子", "こうし"] },
        { q: "生物の体内で、外部から侵入した異物（抗原）を攻撃するために作られるタンパク質を何という？", a: "抗体", keywords: ["抗体", "こうたい"] },
        { q: "19世紀末のフランスで起きた、ユダヤ人の軍人がスパイ容疑で不当に告発された冤罪事件を何という？", a: "ドレフュス事件", keywords: ["ドレフュス事件"] },
        { q: "ギリシャ神話で、迷宮ラビュリントスを建設した名工の名前は何？", a: "ダイダロス", keywords: ["ダイダロス"] },
        { q: "認知科学において、人間が何かを学習したり問題を解決したりする際の、思考の枠組みやモデルを何という？", a: "メンタルモデル", keywords: ["メンタルモデル"] },
        { q: "ロシアの作曲家チャイコフスキーが作曲した、クリスマスを舞台にしたバレエ音楽のタイトルは何？", a: "くるみ割り人形", keywords: ["くるみ割り人形"] },
        { q: "マーケティングにおいて、顧客の購買意欲を喚起するために用いられる、注意・関心・欲求・記憶・行動の頭文字をとったモデルを何という？", a: "AIDMAの法則", keywords: ["AIDMA", "アイドマ"] }
    ];
});
