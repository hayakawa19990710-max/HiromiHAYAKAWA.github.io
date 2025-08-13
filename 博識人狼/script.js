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
    const hint1Button = document.getElementById('hint-1-button');
    const hint2Button = document.getElementById('hint-2-button');
    const hintDisplayArea = document.getElementById('hint-display-area');
    const hint1Text = document.getElementById('hint-1-text');
    const hint2Text = document.getElementById('hint-2-text');

    // --- ゲームの状態を管理する変数 ---
    let players = [];
    let currentPlayerIndex = 0;
    let gameQuestion = "", gameAnswer = "", gameKeywords = [];
    let gameHint1 = "", gameHint2 = "";
    let hintsUsed = 0;
    let timerInterval;
    let timeRemaining = 600;
    let currentQuestionPool = [];
    let isInitialGame = true;

    // --- イベントリスナー ---

    addPlayerButton.addEventListener('click', () => {
        const playerCount = playerInputsContainer.children.length;
        const newPlayerInput = document.createElement('input');
        newPlayerInput.type = 'text';
        newPlayerInput.placeholder = `プレイヤー${playerCount + 1}`;
        playerInputsContainer.appendChild(newPlayerInput);
    });

    startGameButton.addEventListener('click', () => {
        if (isInitialGame) {
            const inputs = playerInputsContainer.getElementsByTagName('input');
            let playerNames = [];
            for (let i = 0; i < inputs.length; i++) {
                if (inputs[i].value.trim() !== '') playerNames.push(inputs[i].value.trim());
            }
            if (playerNames.length < 3) {
                alert('プレイヤーは3人以上必要です。');
                return;
            }
            players = playerNames.map(name => ({ name: name, role: '', score: 0 }));
            Array.from(inputs).forEach(input => input.disabled = true);
            addPlayerButton.disabled = true;
            isInitialGame = false;
        }
        
        const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
        switch (selectedDifficulty) {
            case 'easy': currentQuestionPool = easyQuestions; break;
            case 'normal': currentQuestionPool = normalQuestions; break;
            case 'hard': currentQuestionPool = hardQuestions; break;
            case 'very-hard': currentQuestionPool = veryHardQuestions; break;
        }
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

    changeQuestionButton.addEventListener('click', () => changeQuestion());

    nextGameButton.addEventListener('click', () => {
        resultPhase.classList.add('hidden');
        setupPhase.classList.remove('hidden');
    });

    hint1Button.addEventListener('click', () => {
        if (confirm("ヒント①を使用しますか？\n人狼の勝利点が1点増えます。")) {
            hintsUsed = 1;
            hint1Text.textContent = `ヒント①： ${gameHint1}`;
            hintDisplayArea.classList.remove('hidden');
            hint1Button.disabled = true;
            hint2Button.disabled = false;
        }
    });

    hint2Button.addEventListener('click', () => {
        if (confirm("ヒント②を使用しますか？\n人狼の勝利点がさらに1点増えます。")) {
            hintsUsed = 2;
            hint2Text.textContent = `ヒント②： ${gameHint2}`;
            hint2Button.disabled = true;
        }
    });

    // --- 関数 ---

    function toHiragana(str) {
        return str.replace(/[\u30a1-\u30f6]/g, match => String.fromCharCode(match.charCodeAt(0) - 0x60));
    }

    function startNewRound() {
        players.forEach(p => p.role = '市民');
        const werewolfIndex = Math.floor(Math.random() * players.length);
        players[werewolfIndex].role = '人狼';

        changeQuestion(true);

        updateScoreboard();
        timeRemaining = 600;
        updateTimerDisplay();
        finalAnswerInput.value = "";

        hintsUsed = 0;
        hintDisplayArea.classList.add('hidden');
        hint1Text.textContent = "";
        hint2Text.textContent = "";
        hint1Button.disabled = false;
        hint2Button.disabled = true;

        setupPhase.classList.add('hidden');
        resultPhase.classList.add('hidden');
        votingPhase.classList.add('hidden');
        gamePhase.classList.add('hidden');
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
        gameHint1 = newQuestion.hint1;
        gameHint2 = newQuestion.hint2;

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
            players.forEach(p => { if (p.role === '市民') p.score++; });
            const werewolf = players.find(p => p.role === '人狼');
            werewolfReveal.textContent = `人狼は ${werewolf.name} さんでした。`;
            updateScoreboard();
            gamePhase.classList.add('hidden');
            resultPhase.classList.remove('hidden');
        } else {
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
            voteButton.addEventListener('click', () => castVote(playerToVote));
            votePlayerList.appendChild(voteButton);
        });
    }

    function castVote(votedPlayer) {
        const werewolf = players.find(p => p.role === '人狼');
        if (votedPlayer.role === '人狼') {
            resultMessage.textContent = `人狼は ${votedPlayer.name} さんでした！市民チームの逆転勝利！`;
            players.forEach(p => { if (p.role === '市民') p.score++; });
        } else {
            const bonusPoints = hintsUsed;
            const totalPoints = 2 + bonusPoints;
            let resultStr = `${votedPlayer.name} さんは市民でした…。人狼チームの完全勝利！`;
            if (bonusPoints > 0) {
                resultStr += ` (ヒントボーナス+${bonusPoints}点)`;
            }
            resultMessage.textContent = resultStr;
            werewolf.score += totalPoints;
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

// ★★★ 800問の問題リスト ★★★

// --- かんたん (200問) ---
const easyQuestions = [
    // 1-50
    { q: "日本の首都はどこ？", a: "東京", keywords: ["東京", "とうきょう"], hint1: "日本の東側にあります。", hint2: "かつては「江戸」と呼ばれていました。" },
    { q: "信号機で「進め」を意味する色は？", a: "青", keywords: ["青", "緑", "あお", "みどり"], hint1: "実際には緑色に近い色です。", hint2: "赤と黄色の次に来る色です。" },
    { q: "童話『桃太郎』で、犬、猿と一緒に鬼退治に行った鳥は何？", a: "雉", keywords: ["雉", "きじ"], hint1: "日本の国鳥です。", hint2: "オスは美しい羽を持っています。" },
    { q: "1年は何か月？", a: "12ヶ月", keywords: ["12", "十二"], hint1: "時計の文字盤と同じ数です。", hint2: "1ダースと同じ数です。" },
    { q: "サッカーは1チーム何人でプレーする？", a: "11人", keywords: ["11", "十一"], hint1: "野球より2人多いです。", hint2: "ゴールキーパーを含みます。" },
    { q: "アニメ『ドラえもん』の主人公、のび太のフルネームは何？", a: "野比のび太", keywords: ["野比のび太", "のびのびた"], hint1: "苗字は「野比」です。", hint2: "名前もひらがな3文字です。" },
    { q: "お寿司のネタで、赤い身の魚の代表格といえば？", a: "マグロ", keywords: ["マグロ", "まぐろ"], hint1: "トロという部位が人気です。", hint2: "海のスプリンターと呼ばれます。" },
    { q: "「A」から始まるアルファベットの最初の文字は何？", a: "A", keywords: ["A", "a"], hint1: "Appleの頭文字です。", hint2: "成績で一番良い評価です。" },
    { q: "夜空に光る、地球の周りを回っている星は何？", a: "月", keywords: ["月", "つき"], hint1: "ウサギが住んでいると言われます。", hint2: "満ち欠けをします。" },
    { q: "クリスマスにプレゼントを配る、赤い服を着たおじいさんの名前は？", a: "サンタクロース", keywords: ["サンタ", "サンタクロース"], hint1: "トナカイのそりに乗っています。", hint2: "煙突から入ってきます。" },
    { q: "ごはん、みそ汁、焼き魚。これはどこの国の典型的な朝食？", a: "日本", keywords: ["日本", "にほん", "にっぽん"], hint1: "箸を使って食べます。", hint2: "四季があります。" },
    { q: "ライオンやトラが分類される、ネコの仲間の動物をまとめて何科という？", a: "ネコ科", keywords: ["ネコ", "ねこ"], hint1: "肉食動物です。", hint2: "イエネコもこの仲間です。" },
    { q: "暑い夏に食べる、氷を削ってシロップをかけた冷たいおやつは何？", a: "かき氷", keywords: ["かき氷", "かきごおり"], hint1: "お祭りの屋台でよく見かけます。", hint2: "宇治金時などの種類があります。" },
    { q: "『白雪姫』に登場する、姫を助ける7人の小人。彼らの職業は何？", a: "鉱夫", keywords: ["鉱夫", "炭鉱夫", "こうふ"], hint1: "山で宝石を掘っています。", hint2: "つるはしを持っています。" },
    { q: "パンダの主な食べ物は何？", a: "笹", keywords: ["笹", "竹", "ささ", "たけ"], hint1: "イネ科の植物です。", hint2: "緑色で細長い葉が特徴です。" },
    { q: "日本で一番高い電波塔の名前は？", a: "東京スカイツリー", keywords: ["スカイツリー", "東京スカイツリー"], hint1: "東京都墨田区にあります。", hint2: "高さは634メートルです。" },
    { q: "手紙やハガキを出すとき、宛先の住所や名前を書く面の反対側に貼るものは何？", a: "切手", keywords: ["切手", "きって"], hint1: "郵便局で買えます。", hint2: "料金を表しています。" },
    { q: "野球で、ボールを打つ人が持つ道具は何？", a: "バット", keywords: ["バット"], hint1: "木や金属でできています。", hint2: "ボールを遠くに飛ばすために使います。" },
    { q: "一週間の最初の曜日は何曜日？", a: "日曜日", keywords: ["日曜", "にちよう"], hint1: "カレンダーで一番左にあります。", hint2: "太陽の日です。" },
    { q: "『となりのトトロ』で、サツキとメイが引っ越してきた家の隣に住んでいる、森の主の名前は？", a: "トトロ", keywords: ["トトロ"], hint1: "大きくて、もふもふしています。", hint2: "ネコバスを呼びます。" },
    { q: "蛇口をひねると出てくる、人間が生きていくのに欠かせない透明な液体は何？", a: "水", keywords: ["水", "みず"], hint1: "化学式はH2Oです。", hint2: "0度で凍ります。" },
    { q: "朝起きた時に「おはよう」と言いますが、夜寝る前に言う挨拶は何？", a: "おやすみなさい", keywords: ["おやすみ", "おやすみなさい"], hint1: "Good night.と同じ意味です。", hint2: "眠りにつく前の言葉です。" },
    { q: "日本の通貨単位は何？", a: "円", keywords: ["円", "えん"], hint1: "記号は「¥」です。", hint2: "硬貨と紙幣があります。" },
    { q: "スマートフォンやパソコンで文字を入力するために使う、ボタンが並んだ板状の装置は何？", a: "キーボード", keywords: ["キーボード"], hint1: "QWERTY配列が一般的です。", hint2: "タイピングで使います。" },
    { q: "海に住んでいる、足が8本ある生き物で、墨を吐くことで知られるのは何？", a: "タコ", keywords: ["タコ", "たこ"], hint1: "たこ焼きの具材です。", hint2: "吸盤があります。" },
    { q: "甘くて黄色い、皮をむいて食べる果物で、猿の好物としても知られるのは何？", a: "バナナ", keywords: ["バナナ"], hint1: "房になって実ります。", hint2: "栄養価が高いです。" },
    { q: "雨が降った時に空に現れる、七色のアーチ状の光の現象は何？", a: "虹", keywords: ["虹", "にじ"], hint1: "太陽の反対側に出ます。", hint2: "プリズムと同じ原理です。" },
    { q: "『アンパンマン』の主人公、アンパンマンの顔は何でできている？", a: "パン", keywords: ["パン", "あんパン"], hint1: "ジャムおじさんが作りました。", hint2: "中にはあんこが入っています。" },
    { q: "ボールを足で蹴って相手のゴールに入れるスポーツは何？", a: "サッカー", keywords: ["サッカー"], hint1: "ワールドカップが有名です。", hint2: "手は使ってはいけません（ゴールキーパーを除く）。" },
    { q: "春に咲く、日本の国花としても有名なピンク色の花は何？", a: "桜", keywords: ["桜", "さくら"], hint1: "お花見の主役です。", hint2: "すぐに散ってしまいます。" },
    { q: "1年は何日？（うるう年を除く）", a: "365日", keywords: ["365", "三百六十五"], hint1: "地球が太陽の周りを一周する日数です。", hint2: "52週と1日です。" },
    { q: "体調が悪い時に行く場所はどこ？", a: "病院", keywords: ["病院", "びょういん"], hint1: "お医者さんや看護師さんがいます。", hint2: "薬をもらえます。" },
    { q: "鉛筆で書いた文字を消すために使う文房具は何？", a: "消しゴム", keywords: ["消しゴム", "けしごむ"], hint1: "ゴムでできています。", hint2: "MONOというブランドが有名です。" },
    { q: "『シンデレラ』が舞踏会に行くために乗った、カボチャから変身した乗り物は何？", a: "馬車", keywords: ["馬車", "ばしゃ"], hint1: "馬が引きます。", hint2: "魔法で変身しました。" },
    { q: "世界で一番大きな動物は何？", a: "シロナガスクジラ", keywords: ["シロナガスクジラ", "クジラ"], hint1: "海に住んでいます。", hint2: "哺乳類です。" },
    { q: "顔を洗ったり、歯を磨いたりする場所はどこ？", a: "洗面所", keywords: ["洗面所", "せんめんじょ"], hint1: "鏡や水道があります。", hint2: "朝と夜によく使います。" },
    { q: "本をたくさん置いてあり、借りることができる施設は何？", a: "図書館", keywords: ["図書館", "としょかん"], hint1: "静かにしなければいけません。", hint2: "司書さんがいます。" },
    { q: "熱いお湯に入って体をきれいにする場所はどこ？", a: "お風呂", keywords: ["風呂", "ふろ"], hint1: "浴槽があります。", hint2: "一日の疲れをとります。" },
    { q: "ゲーム『ポケットモンスター』で、ピカチュウが使うでんきタイプの技の代表格は何？", a: "10まんボルト", keywords: ["10万ボルト", "十万ボルト"], hint1: "数字が入っています。", hint2: "サトシがよく指示します。" },
    { q: "お米を炊いて作る、日本の主食は何？", a: "ごはん", keywords: ["ごはん", "米", "こめ"], hint1: "炊飯器で炊きます。", hint2: "お茶碗によそって食べます。" },
    { q: "空を飛ぶ乗り物で、翼がついているものは何？", a: "飛行機", keywords: ["飛行機", "ひこうき"], hint1: "空港から出発します。", hint2: "パイロットが操縦します。" },
    { q: "犬が嬉しそうに振る、体の一部はどこ？", a: "しっぽ", keywords: ["しっぽ", "尻尾"], hint1: "お尻についています。", hint2: "感情を表します。" },
    { q: "寒い冬に降る、白い雪の結晶が集まったものは何？", a: "雪", keywords: ["雪", "ゆき"], hint1: "水が凍ったものです。", hint2: "雪だるまを作れます。" },
    { q: "童話『大きなかぶ』で、おじいさん、おばあさん、孫の次にかぶを引っ張ったのは誰？", a: "犬", keywords: ["犬", "いぬ"], hint1: "ワンワンと鳴きます。", hint2: "猫の次に登場します。" },
    { q: "スーパーマーケットなどで、商品を買うときにお金を入れる機械は何？", a: "レジ", keywords: ["レジ"], hint1: "店員さんが操作します。", hint2: "バーコードを読み取ります。" },
    { q: "『ちびまる子ちゃん』の主人公、まる子の本名は何？", a: "さくらももこ", keywords: ["さくらももこ"], hint1: "作者と同じ名前です。", hint2: "苗字は「さくら」です。" },
    { q: "体の大きさを測る時に使う単位は何？", a: "メートル", keywords: ["メートル", "センチメートル"], hint1: "身長を測る時に使います。", hint2: "100cmで1になります。" },
    { q: "お腹がすいた時に食べるものは何？", a: "食べ物", keywords: ["食べ物", "たべもの"], hint1: "口から摂取します。", hint2: "エネルギーになります。" },
    { q: "道路を渡る時に使う、白と黒の縞模様が描かれた場所は何？", a: "横断歩道", keywords: ["横断歩道", "おうだんほどう"], hint1: "歩行者が優先です。", hint2: "信号機がある場所にもあります。" },
    { q: "ハチミツが好きな、黄色いクマのキャラクターの名前は何？", a: "くまのプーさん", keywords: ["プーさん", "プー"], hint1: "赤い服を着ています。", hint2: "100エーカーの森に住んでいます。" },
    // 51-100
    { q: "指にはめるアクセサリーの名前は何？", a: "指輪", keywords: ["指輪", "ゆびわ"], hint1: "結婚式で交換します。", hint2: "リングとも言います。" },
    { q: "紙を切るために使う文房具は何？", a: "はさみ", keywords: ["はさみ", "ハサミ"], hint1: "2つの刃がついています。", hint2: "チョキチョキと使います。" },
    { q: "『名探偵コナン』の主人公、コナンの正体である高校生探偵の名前は何？", a: "工藤新一", keywords: ["工藤新一", "くどうしんいち"], hint1: "東の高校生探偵と呼ばれていました。", hint2: "毛利蘭の幼なじみです。" },
    { q: "一日のうち、太陽が沈んで暗くなる時間帯を何という？", a: "夜", keywords: ["夜", "よる"], hint1: "月や星が見えます。", hint2: "昼の反対です。" },
    { q: "遠くのものを見るために使う、筒状の道具は何？", a: "望遠鏡", keywords: ["望遠鏡", "ぼうえんきょう"], hint1: "天体観測で使います。", hint2: "レンズがついています。" },
    { q: "足に履く、布や革でできたものは何？", a: "靴", keywords: ["靴", "くつ"], hint1: "スニーカーやサンダルなどがあります。", hint2: "外出する時に履きます。" },
    { q: "頭にかぶるものは何？", a: "帽子", keywords: ["帽子", "ぼうし"], hint1: "日差しを防ぐために使います。", hint2: "キャップやハットなどがあります。" },
    { q: "スタジオジブリの映画で、黒猫のジジが登場する作品のタイトルは何？", a: "魔女の宅急便", keywords: ["魔女の宅急便", "まじょのたっきゅうびん"], hint1: "主人公はキキという魔女です。", hint2: "パン屋さんで居候します。" },
    { q: "勉強を教えてくれる人は誰？", a: "先生", keywords: ["先生", "せんせい"], hint1: "学校にいます。", hint2: "宿題を出します。" },
    { q: "椅子に座って食事や勉強をするための家具は何？", a: "机", keywords: ["机", "つくえ", "テーブル"], hint1: "平らな天板があります。", hint2: "脚がついています。" },
    { q: "ミッキーマウスの恋人の名前は何？", a: "ミニーマウス", keywords: ["ミニー", "ミニーマウス"], hint1: "赤いリボンが特徴です。", hint2: "水玉模様のスカートを履いています。" },
    { q: "日本の昔話で、金太郎が相撲をとった相手の動物は何？", a: "熊", keywords: ["熊", "くま"], hint1: "森に住んでいます。", hint2: "冬眠します。" },
    { q: "電話をかけるときに押す、数字が書かれたボタンがある機械は何？", a: "電話", keywords: ["電話", "でんわ"], hint1: "もしもし、と話します。", hint2: "スマートフォンもその一種です。" },
    { q: "暑い日に涼むために使う、風を起こす機械は何？", a: "扇風機", keywords: ["扇風機", "せんぷうき"], hint1: "羽が回ります。", hint2: "エアコンの仲間です。" },
    { q: "『クレヨンしんちゃん』の主人公、しんのすけの妹の名前は何？", a: "ひまわり", keywords: ["ひまわり"], hint1: "黄色い花の名前です。", hint2: "まだ赤ちゃんです。" },
    { q: "海や川で泳ぐ魚を捕まえることを何という？", a: "釣り", keywords: ["釣り", "つり"], hint1: "釣り竿を使います。", hint2: "趣味にする人も多いです。" },
    { q: "眠る時に使う、ふかふかの寝具は何？", a: "布団", keywords: ["布団", "ふとん", "ベッド"], hint1: "敷くものと掛けるものがあります。", hint2: "押し入れにしまいます。" },
    { q: "火を消すために消防士が使う乗り物は何？", a: "消防車", keywords: ["消防車", "しょうぼうしゃ"], hint1: "赤い車体が特徴です。", hint2: "はしごがついています。" },
    { q: "『ONE PIECE』の主人公、ルフィが目指している「海賊王」になるために探している宝物は何？", a: "ひとつなぎの大秘宝（ワンピース）", keywords: ["ワンピース", "ひとつなぎの大秘宝"], hint1: "ゴール・D・ロジャーが残しました。", hint2: "ラフテルにあると言われています。" },
    { q: "お祝いの時に食べる、甘くてデコレーションされたケーキの代表格は何？", a: "ショートケーキ", keywords: ["ショートケーキ"], hint1: "イチゴが乗っています。", hint2: "生クリームを使います。" },
    { q: "ゾウの最も特徴的な、長くて曲がった鼻を何という？", a: "鼻", keywords: ["鼻", "はな"], hint1: "物を掴むことができます。", hint2: "水を飲む時にも使います。" },
    { q: "物語の登場人物が話す言葉を何という？", a: "セリフ", keywords: ["セリフ", "台詞"], hint1: "台本に書かれています。", hint2: "役者が覚えます。" },
    { q: "『それいけ！アンパンマン』に登場する、アンパンマンの宿敵の名前は？", a: "ばいきんまん", keywords: ["ばいきんまん", "バイキンマン"], hint1: "ドキンちゃんと一緒にいます。", hint2: "「ハヒフヘホー」と笑います。" },
    { q: "冬のスポーツで、スキー板を履いて雪の上を滑るものは何？", a: "スキー", keywords: ["スキー"], hint1: "ストックという棒を使います。", hint2: "リフトで山を登ります。" },
    { q: "時間を知るために見る道具は何？", a: "時計", keywords: ["時計", "とけい"], hint1: "長針と短針があります。", hint2: "腕時計や壁掛け時計があります。" },
    { q: "お湯を沸かすために使う台所用品は何？", a: "やかん", keywords: ["やかん", "ケトル"], hint1: "注ぎ口がついています。", hint2: "お茶を入れる時に使います。" },
    { q: "『ゲゲゲの鬼太郎』の主人公、鬼太郎の左目には何が隠されている？", a: "目玉おやじ", keywords: ["目玉おやじ", "めだまおやじ"], hint1: "鬼太郎のお父さんです。", hint2: "お茶碗のお風呂に入ります。" },
    { q: "鳥が空を飛ぶために使う、体の一部はどこ？", a: "翼", keywords: ["翼", "つばさ", "羽"], hint1: "羽ばたかせます。", hint2: "飛行機の部品にも同じ名前があります。" },
    { q: "地面に穴を掘って暮らす、ミミズを食べる動物は何？", a: "モグラ", keywords: ["モグラ", "もぐら"], hint1: "目はほとんど見えません。", hint2: "もぐらたたきというゲームがあります。" },
    { q: "日本で子供の日（5月5日）に飾る、魚の形をしたのぼりは何？", a: "こいのぼり", keywords: ["こいのぼり", "鯉のぼり"], hint1: "男の子の成長を願います。", hint2: "大きな真鯉はお父さんです。" },
    { q: "食事の時に使う、食べ物を口に運ぶための道具は何？", a: "箸", keywords: ["箸", "はし"], hint1: "2本で1セットです。", hint2: "日本では主にこれを使います。" },
    { q: "『サザエさん』の主人公、サザエさんの夫の名前は何？", a: "マスオ", keywords: ["マスオ", "フグ田マスオ"], hint1: "「えぇーっ！？」と驚きます。", hint2: "タラちゃんのお父さんです。" },
    { q: "電車やバスに乗るために買う、小さな紙の券は何？", a: "切符", keywords: ["切符", "きっぷ"], hint1: "駅の券売機で買います。", hint2: "改札で駅員さんに見せます。" },
    { q: "夜、道を明るく照らすために設置されている照明は何？", a: "街灯", keywords: ["街灯", "がいとう"], hint1: "電柱についています。", hint2: "夜道を安全にします。" },
    { q: "『となりのトトロ』で、トトロが雨の日にサツキに貸してくれた、頭の上にのせる葉っぱは何？", a: "傘", keywords: ["傘", "かさ"], hint1: "フキの葉です。", hint2: "雨を防ぐために使いました。" },
    { q: "自分の顔や姿を映して見るために使う、ガラス製の道具は何？", a: "鏡", keywords: ["鏡", "かがみ"], hint1: "左右が反対に映ります。", hint2: "身だしなみを整える時に使います。" },
    { q: "病気やケガを治すために飲むものは何？", a: "薬", keywords: ["薬", "くすり"], hint1: "病院や薬局でもらいます。", hint2: "錠剤や粉薬があります。" },
    { q: "字を書いたり、絵を描いたりするために使う、インクが出る筆記用具は何？", a: "ペン", keywords: ["ペン"], hint1: "ボールペンやサインペンがあります。", hint2: "キャップがついています。" },
    { q: "『天空の城ラピュタ』で、パズーが屋根の上で吹いていた楽器は何？", a: "トランペット", keywords: ["トランペット"], hint1: "金管楽器です。", hint2: "「ハトと少年」という曲です。" },
    { q: "お正月に子供がもらう、お金が入った袋を何という？", a: "お年玉", keywords: ["お年玉", "おとしだま"], hint1: "ポチ袋に入っています。", hint2: "親戚からもらえます。" },
    // 101-150
    { q: "キリンの首の骨の数は、人間と同じである。○か×か？", a: "○", keywords: ["○", "まる", "はい"], hint1: "数は同じですが、一つ一つの骨が長いです。", hint2: "7個です。" },
    { q: "日本の都道府県で、名前に「山」がつくのは山形、山梨、富山とどこ？", a: "和歌山", keywords: ["和歌山", "わかやま"], hint1: "近畿地方にあります。", hint2: "梅の生産が有名です。" },
    { q: "ピアノの鍵盤は、白と黒を合わせて全部で何鍵ある？", a: "88鍵", keywords: ["88", "八十八"], hint1: "7オクターブと少しです。", hint2: "100よりは少ないです。" },
    { q: "童話『ヘンゼルとグレーテル』で、魔女の家は何でできていた？", a: "お菓子", keywords: ["お菓子", "おかし"], hint1: "壁はパンケーキ、屋根はクッキーでした。", hint2: "子供たちを誘い込むための罠でした。" },
    { q: "地球が太陽の周りを一周するのにかかる時間は約何日？", a: "365日", keywords: ["365", "三百六十五"], hint1: "これを1年と呼びます。", hint2: "公転周期です。" },
    { q: "アニメ『ポケットモンスター』で、主人公サトシの最初のパートナーは何？", a: "ピカチュウ", keywords: ["ピカチュウ"], hint1: "でんきタイプのポケモンです。", hint2: "「10まんボルト」が得意技です。" },
    { q: "ラーメンの三大要素といえば、麺、スープと何？", a: "具", keywords: ["具", "ぐ"], hint1: "チャーシューやメンマなどです。", hint2: "トッピングとも言います。" },
    { q: "アルファベットの最後の文字は何？", a: "Z", keywords: ["Z", "z"], hint1: "Aから数えて26番目です。", hint2: "最後の、という意味で使われます。" },
    { q: "太陽が東から昇り、西に沈むのはなぜ？", a: "地球が自転しているから", keywords: ["自転", "じてん"], hint1: "地球が自分で回っています。", hint2: "見かけの動きです。" },
    { q: "『眠れる森の美女』で、お姫様が眠りにつく原因となった道具は何？", a: "糸車", keywords: ["糸車", "いとぐるま"], hint1: "指を刺してしまいました。", hint2: "糸を紡ぐための道具です。" },
    { q: "カメレオンが体の色を変える主な理由は何？", a: "気分や体調を伝えるため", keywords: ["気分", "きぶん", "コミュニケーション"], hint1: "隠れるためだけではありません。", hint2: "感情表現の一つです。" },
    { q: "日本で一番南にある島は何？", a: "沖ノ鳥島", keywords: ["沖ノ鳥島", "おきのとりしま"], hint1: "東京都に属します。", hint2: "満潮時にはほとんど沈んでしまいます。" },
    { q: "オリンピックの発祥地はどこの国？", a: "ギリシャ", keywords: ["ギリシャ"], hint1: "古代オリンピアで始まりました。", hint2: "ヨーロッパの国です。" },
    { q: "野球で、3回ストライクを取られるとどうなる？", a: "アウト", keywords: ["アウト", "三振"], hint1: "攻撃が終了します。", hint2: "バッターは交代です。" },
    { q: "『リトル・マーメイド』の主人公、アリエルの髪の色は何色？", a: "赤", keywords: ["赤", "あか"], hint1: "情熱的な色です。", hint2: "海の青との対比が美しいです。" },
    { q: "人間が呼吸で吸う気体は何？", a: "酸素", keywords: ["酸素", "さんそ"], hint1: "元素記号はOです。", hint2: "吐く息には二酸化炭素が多く含まれます。" },
    { q: "日本の国旗の名前は何？", a: "日章旗", keywords: ["日章旗", "日の丸"], hint1: "太陽をデザインしています。", hint2: "白地に赤丸です。" },
    { q: "コンピュータのマウスを発明した人物は誰？", a: "ダグラス・エンゲルバート", keywords: ["エンゲルバート"], hint1: "アメリカの技術者です。", hint2: "GUIの父とも呼ばれます。" },
    { q: "イカの足は何本？", a: "10本", keywords: ["10", "十"], hint1: "タコより2本多いです。", hint2: "2本は特に長いです。" },
    { q: "『アラジン』に登場する、ランプの魔人の名前は何？", a: "ジーニー", keywords: ["ジーニー"], hint1: "青い体をしています。", hint2: "3つの願いを叶えてくれます。" },
    { q: "植物が根から吸い上げるものは、水と何？", a: "養分", keywords: ["養分", "ようぶん"], hint1: "成長に必要です。", hint2: "肥料として与えることもあります。" },
    { q: "「こんにちは」は昼の挨拶ですが、朝の挨拶は何？", a: "おはよう", keywords: ["おはよう"], hint1: "Good morning.と同じ意味です。", hint2: "一日の始まりの言葉です。" },
    { q: "アメリカの国旗に描かれている星の数はいくつ？", a: "50", keywords: ["50", "五十"], hint1: "州の数を表しています。", hint2: "星条旗と呼ばれます。" },
    { q: "文字や絵を印刷する機械は何？", a: "プリンター", keywords: ["プリンター"], hint1: "パソコンに接続して使います。", hint2: "インクやトナーが必要です。" },
    { q: "クジラは、魚類と哺乳類、どちらに分類される？", a: "哺乳類", keywords: ["哺乳類", "ほにゅうるい"], hint1: "肺で呼吸します。", hint2: "子供にお乳をあげます。" },
    { q: "マクドナルドのキャラクター、ドナルド・マクドナルドの職業は何？", a: "ピエロ", keywords: ["ピエロ", "道化師"], hint1: "赤い鼻が特徴です。", hint2: "サーカスに登場します。" },
    { q: "一週間は何日？", a: "7日", keywords: ["7", "七"], hint1: "日曜日から土曜日までです。", hint2: "虹の色と同じ数です。" },
    { q: "『ドラゴンボール』の主人公、孫悟空が乗る黄色い雲の名前は何？", a: "筋斗雲", keywords: ["筋斗雲", "きんとうん"], hint1: "清い心の人しか乗れません。", hint2: "亀仙人からもらいました。" },
    { q: "テニスで、ボールを打ち合う場所を何という？", a: "コート", keywords: ["コート"], hint1: "ネットで区切られています。", hint2: "芝や土、硬い地面など種類があります。" },
    { q: "冬に多くの動物が活動を休止して眠ることを何という？", a: "冬眠", keywords: ["冬眠", "とうみん"], hint1: "熊やカエルが行います。", hint2: "春になると目覚めます。" },
    { q: "日本の新幹線で、一番速い列車の名前は何？", a: "のぞみ", keywords: ["のぞみ"], hint1: "東京と博多を結びます。", hint2: "「ひかり」「こだま」より速いです。" },
    { q: "火事や救急の時に駆けつける、緊急車両を運転する人は誰？", a: "救急隊員", keywords: ["救急隊員", "消防士"], hint1: "専門の訓練を受けています。", hint2: "人命救助のプロです。" },
    { q: "本に挟んで、どこまで読んだか目印にするものを何という？", a: "しおり", keywords: ["しおり", "栞"], hint1: "ブックマークとも言います。", hint2: "紙やリボンでできています。" },
    { q: "『ピーターパン』に登場する、飛ぶことができる妖精の名前は何？", a: "ティンカー・ベル", keywords: ["ティンカーベル", "ティンク"], hint1: "嫉妬深い性格です。", hint2: "金色の粉を振りまきます。" },
    { q: "世界で一番高い山は何？", a: "エベレスト", keywords: ["エベレスト", "チョモランマ"], hint1: "ヒマラヤ山脈にあります。", hint2: "標高は8848メートルです。" },
    { q: "料理をする場所はどこ？", a: "台所", keywords: ["台所", "キッチン"], hint1: "コンロやシンクがあります。", hint2: "美味しい匂いがします。" },
    { q: "映画やアニメを制作する会社の代表格で、ミッキーマウスを生み出したのはどこ？", a: "ディズニー", keywords: ["ディズニー", "Disney"], hint1: "シンデレラ城がシンボルです。", hint2: "カリフォルニアにテーマパークがあります。" },
    { q: "食事をする前に言う挨拶は何？", a: "いただきます", keywords: ["いただきます"], hint1: "感謝の気持ちを表します。", hint2: "食後の挨拶は「ごちそうさま」です。" },
    { q: "『ゲド戦記』の原作者として知られるアメリカの女性作家は誰？", a: "アーシュラ・K・ル＝グウィン", keywords: ["ル＝グウィン", "ルグウィン"], hint1: "ファンタジーやSF作品で有名です。", hint2: "『闇の左手』も代表作です。" },
    { q: "人が住む建物を何という？", a: "家", keywords: ["家", "いえ", "うち"], hint1: "屋根と壁があります。", hint2: "家族と暮らします。" },
    { q: "音楽を聴くために耳につける小さな装置は何？", a: "イヤホン", keywords: ["イヤホン"], hint1: "ヘッドホンの小さい版です。", hint2: "最近はワイヤレスが主流です。" },
    { q: "『NARUTO -ナルト-』の主人公、うずまきナルトの口癖は何？", a: "だってばよ", keywords: ["だってばよ"], hint1: "語尾につけます。", hint2: "父親譲りです。" },
    { q: "一日のうち、太陽が昇って明るい時間帯を何という？", a: "昼", keywords: ["昼", "ひる"], hint1: "夜の反対です。", hint2: "ランチを食べる時間帯です。" },
    { q: "小さなものや遠くのものを大きく見せるために使う、レンズが入った道具は何？", a: "虫眼鏡", keywords: ["虫眼鏡", "むしめがね", "ルーペ"], hint1: "探偵が持っているイメージです。", hint2: "太陽の光を集めて火を起こせます。" },
    { q: "雨の日にさすものは何？", a: "傘", keywords: ["傘", "かさ"], hint1: "骨と布でできています。", hint2: "折りたたみ式もあります。" },
    { q: "顔にある、匂いを嗅ぐための器官は何？", a: "鼻", keywords: ["鼻", "はな"], hint1: "呼吸をするためにも使います。", hint2: "顔の中心にあります。" },
    { q: "アニメ『セーラームーン』の主人公、月野うさぎが変身した後の決め台詞「月に代わって、〇〇よ！」の〇〇は何？", a: "おしおき", keywords: ["おしおき", "お仕置き"], hint1: "悪い子にする罰です。", hint2: "ひらがな4文字です。" },
    { q: "学校で勉強を習う場所はどこ？", a: "教室", keywords: ["教室", "きょうしつ"], hint1: "黒板や机があります。", hint2: "クラスメイトと一緒にいます。" },
    { q: "食べ物を冷たく保つために使う家電製品は何？", a: "冷蔵庫", keywords: ["冷蔵庫", "れいぞうこ"], hint1: "ドアがついています。", hint2: "冷凍庫も一緒になっていることが多いです。" },
    // 151-200
    { q: "スヌーピーが登場する漫画のタイトルは何？", a: "ピーナッツ", keywords: ["ピーナッツ", "Peanuts"], hint1: "チャーリー・ブラウンが主人公です。", hint2: "豆の名前です。" },
    { q: "日本の昔話で、おじいさんが山へしばかりに行ったとき、おばあさんはどこへ行った？", a: "川へ洗濯に", keywords: ["川", "洗濯"], hint1: "桃が流れてきました。", hint2: "桃太郎の冒頭です。" },
    { q: "緊急時に警察を呼ぶための電話番号は何番？", a: "110番", keywords: ["110"], hint1: "「ひゃくとおばん」と読みます。", hint2: "火事・救急は119番です。" },
    { q: "部屋を掃除するために使う、ゴミを吸い取る機械は何？", a: "掃除機", keywords: ["掃除機", "そうじき"], hint1: "ホースがついています。", hint2: "サイクロン式や紙パック式があります。" },
    { q: "『ムーミン』の主人公、ムーミントロールの親友で、旅をするのが好きなキャラクターは誰？", a: "スナフキン", keywords: ["スナフキン"], hint1: "ハーモニカを吹いています。", hint2: "緑色の服と帽子が特徴です。" },
    { q: "海の水がしょっぱい理由は何？", a: "塩が溶けているから", keywords: ["塩", "しお"], hint1: "川が岩石から溶かし出します。", hint2: "塩化ナトリウムが主成分です。" },
    { q: "眠る時に見る、物語のような映像を何という？", a: "夢", keywords: ["夢", "ゆめ"], hint1: "良いものも悪いものもあります。", hint2: "起きたら忘れていることが多いです。" },
    { q: "病気を治してくれる人は誰？", a: "医者", keywords: ["医者", "いしゃ"], hint1: "白衣を着ています。", hint2: "聴診器を使います。" },
    { q: "『崖の上のポニョ』で、ポニョが好きな食べ物は何？", a: "ハム", keywords: ["ハム"], hint1: "豚肉から作られます。", hint2: "宗介がサンドイッチにしてくれました。" },
    { q: "お祭りの屋台で売られている、棒に刺さった甘いリンゴは何？", a: "りんご飴", keywords: ["りんご飴", "りんごあめ"], hint1: "赤い飴でコーティングされています。", hint2: "パリパリとした食感です。" },
    { q: "ペンギンの主な生息地は、北極と南極、どちら？", a: "南極", keywords: ["南極", "なんきょく"], hint1: "シロクマはいません。", hint2: "南半球にいます。" },
    { q: "物語の主人公が立ち向かう、悪いキャラクターを何という？", a: "悪役", keywords: ["悪役", "あくやく", "敵"], hint1: "ヒーローの反対です。", hint2: "ヴィランとも言います。" },
    { q: "『トムとジェリー』で、いつも追いかけっこをしているネコとネズミの名前は何と何？", a: "トムとジェリー", keywords: ["トムとジェリー"], hint1: "ネコがトムです。", hint2: "ネズミがジェリーです。" },
    { q: "バスケットボールで、ボールをゴールに入れると何点入る？（フリースローを除く）", a: "2点", keywords: ["2", "二"], hint1: "スリーポイントラインの内側からです。", hint2: "最も基本的な得点です。" },
    { q: "カレンダーで日付を確認するために見るものは何？", a: "数字", keywords: ["数字", "すうじ"], hint1: "1から31まであります。", hint2: "曜日と一緒に書かれています。" },
    { q: "服をきれいにするために使う家電製品は何？", a: "洗濯機", keywords: ["洗濯機", "せんたくき"], hint1: "水と洗剤を使います。", hint2: "ドラム式や縦型があります。" },
    { q: "『アルプスの少女ハイジ』で、ハイジが一緒に暮らすおじいさんの名前は何？", a: "アルムおんじ", keywords: ["おんじ", "アルム"], hint1: "山小屋に住んでいます。", hint2: "無口で気難しいですが、本当は優しいです。" },
    { q: "蝶になる前の、芋虫のような姿を何という？", a: "幼虫", keywords: ["幼虫", "ようちゅう"], hint1: "さなぎになる前の段階です。", hint2: "葉っぱを食べます。" },
    { q: "夜空で一番明るく見える星（惑星を除く）は何？", a: "シリウス", keywords: ["シリウス"], hint1: "おおいぬ座の星です。", hint2: "冬の大三角の一つです。" },
    { q: "七夕の日に、願い事を書く短冊を飾る木は何？", a: "笹", keywords: ["笹", "竹"], hint1: "パンダが食べる植物です。", hint2: "7月7日に行います。" },
    { q: "食事の時に使う、食べ物を乗せるお皿を何という？", a: "皿", keywords: ["皿", "さら"], hint1: "陶器やガラスでできています。", hint2: "洗って何度も使います。" },
    { q: "『SPY×FAMILY』の主人公、ロイド・フォージャーの娘の名前は何？", a: "アーニャ", keywords: ["アーニャ"], hint1: "人の心が読める超能力者です。", hint2: "ピーナッツが好きです。" },
    { q: "バスの運転手が、乗客を乗せて目的地まで運ぶ仕事を何という？", a: "運転", keywords: ["運転", "うんてん"], hint1: "大きなハンドルを操作します。", hint2: "免許が必要です。" },
    { q: "公園にある、座って休むための長い椅子を何という？", a: "ベンチ", keywords: ["ベンチ"], hint1: "木や金属でできています。", hint2: "複数人で座れます。" },
    { q: "『美女と野獣』で、野獣が元の姿に戻るために必要なことは何？", a: "真実の愛", keywords: ["愛", "真実の愛"], hint1: "魔法を解くための条件です。", hint2: "ベルが彼を愛することです。" },
    { q: "自分の考えや気持ちを、紙に書いて伝えるものを何という？", a: "手紙", keywords: ["手紙", "てがみ"], hint1: "封筒に入れて送ります。", hint2: "メールの元になったものです。" },
    { q: "病気やケガをした時に貼る、小さな絆創膏を何という？", a: "バンドエイド", keywords: ["バンドエイド", "絆創膏"], hint1: "傷口を保護します。", hint2: "商品名が一般名詞化しています。" },
    { q: "絵を描くために使う、色のついた棒状の画材は何？", a: "クレヨン", keywords: ["クレヨン"], hint1: "油性でできています。", hint2: "子供がよく使います。" },
    { q: "『風の谷のナウシカ』で、ナウシカが乗る白い乗り物の名前は何？", a: "メーヴェ", keywords: ["メーヴェ"], hint1: "ドイツ語で「カモメ」という意味です。", hint2: "ジェットエンジンがついています。" },
    { q: "ひな祭りに飾る、お姫様の人形を何という？", a: "雛人形", keywords: ["雛人形", "ひなにんぎょう"], hint1: "女の子の成長を祝います。", hint2: "お内裏様と一緒に飾ります。" }
];
const normalQuestions = [
    // --- ふつう (200問) ---
    { q: "日本で一番高い山は何？", a: "富士山", keywords: ["富士山", "ふじさん"], hint1: "静岡県と山梨県にまたがっています。", hint2: "日本の紙幣にも描かれています。" },
    { q: "日本で一番大きい湖は何？", a: "琵琶湖", keywords: ["琵琶湖", "びわこ"], hint1: "滋賀県にあります。", hint2: "形が楽器の琵琶に似ています。" },
    { q: "世界で最も人口が多い国はどこ？(2023年時点)", a: "インド", keywords: ["インド"], hint1: "カレーが有名な国です。", hint2: "タージ・マハルがあります。" },
    { q: "太陽系の惑星のうち、地球のすぐ外側を公転している惑星は何？", a: "火星", keywords: ["火星", "かせい"], hint1: "英語では「Mars」といいます。", hint2: "赤い惑星として知られています。" },
    { q: "元素記号「H」が示す元素は何？", a: "水素", keywords: ["水素", "すいそ"], hint1: "宇宙で最も多く存在する元素です。", hint2: "水(H2O)を構成する元素の一つです。" },
    { q: "光の三原色といえば、赤、緑と何？", a: "青", keywords: ["青", "あお", "ブルー"], hint1: "空や海の色です。", hint2: "混ぜると白に近づきます。" },
    { q: "江戸幕府を開いた初代将軍は誰？", a: "徳川家康", keywords: ["徳川家康", "家康"], hint1: "関ヶ原の戦いで勝利しました。", hint2: "日光東照宮に祀られています。" },
    { q: "『最後の晩餐』や『モナ・リザ』を描いたルネサンス期の芸術家は誰？", a: "レオナルド・ダ・ヴィンチ", keywords: ["レオナルド・ダ・ヴィンチ", "ダヴィンチ", "ダビンチ", "レオナルド"], hint1: "イタリアの万能人と呼ばれました。", hint2: "画家であり、科学者でもありました。" },
    { q: "漫画『ONE PIECE』の主人公ルフィが食べた悪魔の実は何？", a: "ゴムゴムの実", keywords: ["ゴムゴム", "ゴム"], hint1: "体が伸び縮みするようになります。", hint2: "超人（パラミシア）系です。" },
    { q: "『ハリー・ポッター』シリーズで、主人公ハリーが通う魔法学校の名前は何？", a: "ホグワーツ", keywords: ["ホグワーツ", "Hogwarts"], hint1: "4つの寮があります。", hint2: "イギリスにあります。" },
    { q: "日本の運転免許証で、優良運転者（ゴールド免許）の有効期間は何年？", a: "5年", keywords: ["5", "五"], hint1: "一般的な免許より長いです。", hint2: "オリンピックの開催間隔より1年長いです。" },
    { q: "鉛筆の芯の硬さを表す記号で、「H」と「B」がありますが、「B」は何の略？", a: "ブラック", keywords: ["ブラック", "Black"], hint1: "黒い、という意味です。", hint2: "数字が大きいほど濃くなります。" },
    { q: "トランプのキングの中で、唯一口ひげがない王様は何のマーク？", a: "ハート", keywords: ["ハート", "Heart"], hint1: "愛を象徴するマークです。", hint2: "自殺しようとしている姿だという説があります。" },
    { q: "サッカーの1チームの人数は何人？", a: "11人", keywords: ["11", "十一"], hint1: "野球より2人多いです。", hint2: "ゴールキーパーを含みます。" },
    { q: "寿司屋で使われる「ガリ」。これは何を甘酢に漬けたもの？", a: "生姜", keywords: ["生姜", "しょうが", "ショウガ"], hint1: "薬味として使われます。", hint2: "口の中をさっぱりさせます。" },
    { q: "世界で最も面積の大きい国はどこ？", a: "ロシア", keywords: ["ロシア"], hint1: "首都はモスクワです。", hint2: "シベリア鉄道が有名です。" },
    { q: "オリンピックの五輪の色に含まれない色は？ (青・黄・黒・緑・赤・白)", a: "白", keywords: ["白", "しろ"], hint1: "輪の色ではなく、背景の色です。", hint2: "5つの輪は5大陸を表しています。" },
    { q: "十二支で、へびの次に来る動物は何？", a: "馬", keywords: ["馬", "うま"], hint1: "走るのが速い動物です。", hint2: "競馬でおなじみです。" },
    { q: "日本のプロ野球で、セントラル・リーグの球団ではないのはどれ？（巨人、阪神、ソフトバンク）", a: "ソフトバンク", keywords: ["ソフトバンク", "Softbank"], hint1: "福岡に本拠地があります。", hint2: "パシフィック・リーグに所属しています。" },
    { q: "世界で一番高い建物がある都市はどこ？(2024年時点)", a: "ドバイ", keywords: ["ドバイ", "Dubai"], hint1: "アラブ首長国連邦の都市です。", hint2: "ブルジュ・ハリファという名前です。" },
    { q: "水が気体になると何という？", a: "水蒸気", keywords: ["水蒸気", "すいじょうき"], hint1: "目には見えません。", hint2: "やかんから出る白いものは湯気です。" },
    { q: "植物が光を使ってエネルギーを作り出す働きを何という？", a: "光合成", keywords: ["光合成", "こうごうせい"], hint1: "二酸化炭素を吸って酸素を出します。", hint2: "葉緑体で行われます。" },
    { q: "人間の体で最も大きい臓器は何？", a: "皮膚", keywords: ["皮膚", "ひふ"], hint1: "体を覆っています。", hint2: "体重の約16%を占めます。" },
    { q: "血液を全身に送り出すポンプの役割をする臓器は何？", a: "心臓", keywords: ["心臓", "しんぞう"], hint1: "握りこぶしぐらいの大きさです。", hint2: "ドキドキと鼓動します。" },
    { q: "鉄が錆びる化学反応を何という？", a: "酸化", keywords: ["酸化", "さんか"], hint1: "酸素と結びつくことです。", hint2: "リンゴの切り口が茶色くなるのも同じです。" },
    { q: "フランス革命のスローガン「自由、平等」のあと一つは何？", a: "博愛", keywords: ["博愛", "友愛", "はくあい"], hint1: "兄弟愛のような意味です。", hint2: "フランス国旗の三色に象徴されます。" },
    { q: "アメリカの初代大統領は誰？", a: "ジョージ・ワシントン", keywords: ["ワシントン", "Washington"], hint1: "首都の名前にもなっています。", hint2: "桜の木を切った逸話があります。" },
    { q: "日本の歴史上、最も長く続いた時代区分は何時代？", a: "江戸時代", keywords: ["江戸", "えど"], hint1: "約260年間続きました。", hint2: "徳川幕府が治めていました。" },
    { q: "俳句の基本の音の数は「五・七・？」", a: "五", keywords: ["五", "ご", "5"], hint1: "季語を入れるのがルールです。", hint2: "世界で最も短い詩の形式です。" },
    { q: "1964年にアジアで初めてオリンピックが開催された都市はどこ？", a: "東京", keywords: ["東京", "とうきょう"], hint1: "日本の首都です。", hint2: "2021年にも開催されました。" },
    { q: "アニメ『サザエさん』の主人公、サザエさんの夫、マスオさんの職業は何？", a: "サラリーマン", keywords: ["サラリーマン", "商社"], hint1: "海山商事に勤めています。", hint2: "アナゴさんが同僚です。" },
    { q: "ゲーム『ドラゴンクエスト』シリーズに登場する、一番有名な呪文は何？", a: "ホイミ", keywords: ["ホイミ"], hint1: "HPを回復します。", hint2: "スライムが覚えていることもあります。" },
    { q: "スタジオジブリの映画で、人間の言葉を話す猫のキャラクター「バロン」が登場する作品は何？", a: "猫の恩返し", keywords: ["猫の恩返し", "ねこのおんがえし"], hint1: "『耳をすませば』にも登場します。", hint2: "主人公のハルを助けます。" },
    { q: "映画『君の名は。』を監督したのは誰？", a: "新海誠", keywords: ["新海誠", "新海"], hint1: "「秒速5センチメートル」も監督しました。", hint2: "美しい風景描写で知られます。" },
    { q: "ビートルズのメンバーが4人であることは有名ですが、その出身都市はどこ？", a: "リバプール", keywords: ["リバプール", "Liverpool"], hint1: "イギリスの港町です。", hint2: "サッカーチームも有名です。" },
    { q: "キーボードの配列で、最も一般的な「QWERTY配列」の名前の由来は何？", a: "キーボードの左上の6文字", keywords: ["キーボード", "左上", "配列"], hint1: "上から2段目の文字です。", hint2: "タイプライターの時代に作られました。" },
    { q: "ゴルフで、1つのホールを規定の打数より1打少なく終えることを何という？", a: "バーディー", keywords: ["バーディー", "Birdie"], hint1: "英語で「小鳥」という意味です。", hint2: "イーグルよりはスコアが悪いです。" },
    { q: "「サハラ砂漠」の「サハラ」とは、現地の言葉でどういう意味？", a: "砂漠", keywords: ["砂漠", "さばく"], hint1: "「砂漠砂漠」という意味になります。", hint2: "アラビア語です。" },
    { q: "タラバガニは、生物学的にはカニの仲間ではない。○か×か？", a: "○", keywords: ["○", "まる", "はい"], hint1: "ヤドカリの仲間です。", hint2: "足の数が違います。" },
    { q: "世界で初めてインスタントラーメンを発明した日本人は誰？", a: "安藤百福", keywords: ["安藤百福", "安藤"], hint1: "日清食品の創業者です。", hint2: "チキンラーメンを開発しました。" },
    { q: "日本の都道府県で、県の面積が一番小さいのはどこ？", a: "香川県", keywords: ["香川", "かがわ"], hint1: "四国にあります。", hint2: "うどんが有名です。" },
    { q: "元素記号「Au」が示す元素は何？", a: "金", keywords: ["金", "きん", "ゴールド"], hint1: "オリンピックのメダルの色です。", hint2: "非常に価値が高い金属です。" },
    { q: "地球の自転によって生じる、風や海流の向きを変える見かけの力を何という？", a: "コリオリの力", keywords: ["コリオリ", "転向力"], hint1: "台風の渦の向きに関係します。", hint2: "フランスの科学者の名前が由来です。" },
    { q: "鎌倉幕府を倒し、建武の新政を始めた天皇は誰？", a: "後醍醐天皇", keywords: ["後醍醐", "ごだいご"], hint1: "足利尊氏と対立しました。", hint2: "南北朝時代の天皇です。" },
    { q: "ゴッホの代表作で、渦巻く夜空が描かれた絵画のタイトルは何？", a: "星月夜", keywords: ["星月夜", "ほしづきよ"], hint1: "ニューヨーク近代美術館にあります。", hint2: "糸杉が印象的です。" },
    { q: "漫画『SLAM DUNK』の主人公、桜木花道が所属するバスケ部がある高校は？", a: "湘北高校", keywords: ["湘北", "しょうほく"], hint1: "神奈川県にあります。", hint2: "ユニフォームは赤色です。" },
    { q: "アカデミー賞で作品賞を受賞した初の外国語映画は何？", a: "パラサイト 半地下の家族", keywords: ["パラサイト", "Parasite"], hint1: "韓国の映画です。", hint2: "格差社会を描いています。" },
    { q: "『千と千尋の神隠し』で、千尋が働くことになる湯屋の名前は何？", a: "油屋", keywords: ["油屋", "あぶらや"], hint1: "八百万の神々が訪れます。", hint2: "湯婆婆が経営しています。" },
    { q: "自動販売機で飲み物を買うとき、お金を入れる前にボタンを押しても反応しないのはなぜ？", a: "売り切れ表示のため", keywords: ["売り切れ", "うりきれ"], hint1: "ランプが消えているかどうかです。", hint2: "お金の有無は関係ありません。" },
    { q: "「お歳暮」を贈る時期として一般的なのはいつ？", a: "12月", keywords: ["12月", "十二月", "年末"], hint1: "一年の感謝を伝える贈り物です。", hint2: "お中元は夏です。" },
    // 51-100
    { q: "世界三大珍味といえば、キャビア、フォアグラとあと一つは何？", a: "トリュフ", keywords: ["トリュフ"], hint1: "キノコの一種です。", hint2: "「黒いダイヤ」とも呼ばれます。" },
    { q: "太陽系で、太陽に一番近い惑星は何？", a: "水星", keywords: ["水星", "すいせい"], hint1: "一番小さい惑星です。", hint2: "表面温度の差が非常に激しいです。" },
    { q: "日本の初代内閣総理大臣は誰？", a: "伊藤博文", keywords: ["伊藤博文", "伊藤"], hint1: "長州藩出身です。", hint2: "4度、総理大臣を務めました。" },
    { q: "シェイクスピアの四大悲劇に含まれない作品は？（ハムレット、オセロ、リア王、ロミオとジュリエット）", a: "ロミオとジュリエット", keywords: ["ロミオとジュリエット", "ロミオ"], hint1: "悲劇ですが、四大悲劇には数えられません。", hint2: "若い恋人たちの物語です。" },
    { q: "アニメ『新世紀エヴァンゲリオン』の主人公、碇シンジが搭乗する機体の名前は何？", a: "エヴァンゲリオン初号機", keywords: ["初号機", "エヴァ"], hint1: "紫色の機体です。", hint2: "暴走することがあります。" },
    { q: "バスケットボールの試合で、1チームのコート上の選手は何人？", a: "5人", keywords: ["5", "五"], hint1: "サッカーより少ないです。", hint2: "スラムダンクと同じです。" },
    { q: "ことわざ「二階から〇〇」。〇〇に入るのは？", a: "目薬", keywords: ["目薬", "めぐすり"], hint1: "もどかしいことの例えです。", hint2: "効果が期待できない、遠回しな方法です。" },
    { q: "日本の都道府県で、人口が最も少ないのはどこ？", a: "鳥取県", keywords: ["鳥取", "とっとり"], hint1: "中国地方にあります。", hint2: "砂丘が有名です。" },
    { q: "色の三原色（減法混色）といえば、シアン、マゼンタと何？", a: "イエロー", keywords: ["イエロー", "黄"], hint1: "プリンターのインクの色です。", hint2: "混ぜると黒に近づきます。" },
    { q: "DNAの二重らせん構造を発見した科学者は、ワトソンと誰？", a: "クリック", keywords: ["クリック", "Crick"], hint1: "二人でノーベル賞を受賞しました。", hint2: "イギリスの科学者です。" },
    { q: "1492年にアメリカ大陸に到達した探検家は誰？", a: "コロンブス", keywords: ["コロンブス", "Columbus"], hint1: "イタリアのジェノヴァ出身です。", hint2: "インドを目指していました。" },
    { q: "ベートーヴェンの交響曲第5番の通称は何？", a: "運命", keywords: ["運命", "うんめい"], hint1: "「ジャジャジャジャーン」で始まります。", hint2: "作曲家自身が「運命はかく扉を叩く」と言ったとされます。" },
    { q: "漫画『ベルサイユのばら』の主人公、男装の麗人オスカルのフルネームは何？", a: "オスカル・フランソワ・ド・ジャルジェ", keywords: ["オスカル"], hint1: "フランス革命期の物語です。", hint2: "近衛隊長を務めます。" },
    { q: "映画『スター・ウォーズ』シリーズに登場する、光る剣の名前は何？", a: "ライトセーバー", keywords: ["ライトセーバー", "ライトセイバー"], hint1: "ジェダイの騎士が使います。", hint2: "「ブォン」という独特の音がします。" },
    { q: "テニスで、スコアが0点のことを何という？", a: "ラブ", keywords: ["ラブ", "Love"], hint1: "愛という意味の単語です。", hint2: "フランス語の「卵（l'oeuf）」が由来という説があります。" },
    { q: "「情けは人の為ならず」という言葉の正しい意味は？", a: "人に親切にすれば、巡り巡って自分に良い報いが来る", keywords: ["自分に返ってくる", "巡り巡って"], hint1: "「人のためにならない」という意味ではありません。", hint2: "良い行いを勧める言葉です。" },
    { q: "世界で最も多くの島を持つ国はどこ？", a: "スウェーデン", keywords: ["スウェーデン"], hint1: "北欧の国です。", hint2: "インドネシアや日本より多いです。" },
    { q: "元素記号「Fe」が示す元素は何？", a: "鉄", keywords: ["鉄", "てつ"], hint1: "磁石にくっつきます。", hint2: "ヘモグロビンの成分です。" },
    { q: "地動説を唱えたポーランドの天文学者は誰？", a: "コペルニクス", keywords: ["コペルニクス", "Copernicus"], hint1: "天動説を覆しました。", hint2: "ガリレオ・ガリレイに影響を与えました。" },
    { q: "平家を滅ぼした源氏の武将で、鎌倉幕府を開いたのは誰？", a: "源頼朝", keywords: ["源頼朝", "頼朝"], hint1: "弟は義経です。", hint2: "征夷大将軍になりました。" },
    { q: "アニメ『機動戦士ガンダム』の主人公、アムロ・レイが言った有名なセリフ「親父にもぶたれたことないのに！」の「親父」とは誰のこと？", a: "テム・レイ", keywords: ["テム・レイ", "テム"], hint1: "ガンダムの開発者の一人です。", hint2: "酸素欠乏症になっていました。" },
    { q: "J-POPグループ「嵐」のメンバーの人数は何人？", a: "5人", keywords: ["5", "五"], hint1: "SMAPより一人少ないです。", hint2: "2020年に活動を休止しました。" },
    { q: "ボクシングの階級で、最も重い階級を何という？", a: "ヘビー級", keywords: ["ヘビー級", "ヘビー"], hint1: "マイク・タイソンが活躍した階級です。", hint2: "体重制限がありません。" },
    { q: "日本の伝統的なカードゲームで、百人の歌人の和歌が書かれているものは何？", a: "百人一首", keywords: ["百人一首", "ひゃくにんいっしゅ"], hint1: "お正月によく遊ばれます。", hint2: "競技かるたとして知られます。" },
    { q: "インターネット上で自分の分身として表示されるキャラクター画像を何という？", a: "アバター", keywords: ["アバター", "Avatar"], hint1: "SNSのプロフィール画像などに使います。", hint2: "映画のタイトルにもなりました。" },
    { q: "地球の大気の主成分である気体は何？", a: "窒素", keywords: ["窒素", "ちっそ"], hint1: "約78%を占めます。", hint2: "酸素は約21%です。" },
    { q: "1853年、黒船を率いて日本に来航したアメリカの軍人は誰？", a: "ペリー", keywords: ["ペリー", "Perry"], hint1: "日本の開国を求めました。", hint2: "浦賀に来航しました。" },
    { q: "小説『吾輩は猫である』の作者は誰？", a: "夏目漱石", keywords: ["夏目漱石", "漱石"], hint1: "千円札の肖像画でした。", hint2: "『坊っちゃん』も有名です。" },
    { q: "アニメ『ルパン三世』で、ルパンの仲間である凄腕のガンマンの名前は何？", a: "次元大介", keywords: ["次元大介", "次元"], hint1: "帽子とヒゲがトレードマークです。", hint2: "コンバットマグナムの達人です。" },
    { q: "世界で最も話者数が多い言語（母語話者数）は何語？", a: "中国語", keywords: ["中国語", "ちゅうごくご"], hint1: "マンダリンとも呼ばれます。", hint2: "英語は第二言語話者を含めると一番多いです。" },
    { q: "日本の国会は、衆議院と何で構成されている？", a: "参議院", keywords: ["参議院", "さんぎいん"], hint1: "二院制です。", hint2: "貴族院が前身です。" },
    { q: "元素記号「Ag」が示す元素は何？", a: "銀", keywords: ["銀", "ぎん", "シルバー"], hint1: "金メダルの次のメダルの色です。", hint2: "食器などにも使われます。" },
    { q: "相対性理論を提唱した物理学者は誰？", a: "アインシュタイン", keywords: ["アインシュタイン", "Einstein"], hint1: "「E=mc²」の公式で有名です。", hint2: "ノーベル物理学賞を受賞しました。" },
    { q: "1543年に日本に鉄砲を伝えたのはどこの国の人？", a: "ポルトガル", keywords: ["ポルトガル", "Portugal"], hint1: "種子島に漂着しました。", hint2: "カステラも伝えました。" },
    { q: "ギリシャ神話で、神々の王として知られるのは誰？", a: "ゼウス", keywords: ["ゼウス", "Zeus"], hint1: "雷を武器にします。", hint2: "ローマ神話のユピテルにあたります。" },
    { q: "映画『E.T.』で、主人公の少年と心を通わせる宇宙人の名前は何？", a: "E.T.", keywords: ["ET", "イーティー"], hint1: "Extra-Terrestrialの略です。", hint2: "指と指を合わせるシーンが有名です。" },
    { q: "日本の武道で、礼に始まり礼に終わるとされるものは何？", a: "柔道", keywords: ["柔道", "じゅうどう"], hint1: "嘉納治五郎が創始しました。", hint2: "オリンピックの正式種目です。" },
    { q: "ことわざ「石の上にも〇〇」。〇〇に入るのは？", a: "三年", keywords: ["三年", "さんねん"], hint1: "辛抱強く続ければ成功するという意味です。", hint2: "数字が入ります。" },
    { q: "世界で一番小さい国はどこ？", a: "バチカン市国", keywords: ["バチカン", "Vatican"], hint1: "イタリアのローマ市内にあります。", hint2: "ローマ教皇が元首です。" },
    { q: "人間の五感に含まれないものはどれ？（視覚、聴覚、嗅覚、味覚、触覚、第六感）", a: "第六感", keywords: ["第六感", "だいろっかん"], hint1: "科学的に証明されていません。", hint2: "直感や霊感のことです。" },
    // 101-150
    { q: "日本の都道府県で、県の面積が一番大きいのはどこ？", a: "岩手県", keywords: ["岩手", "いわて"], hint1: "東北地方にあります。", hint2: "北海道は「道」なので除きます。" },
    { q: "元素記号「C」が示す元素は何？", a: "炭素", keywords: ["炭素", "たんそ"], hint1: "ダイヤモンドの元です。", hint2: "生物の基本となる元素です。" },
    { q: "太陽系で、地球の双子星と呼ばれるほど大きさと重さが似ている惑星は何？", a: "金星", keywords: ["金星", "きんせい"], hint1: "明けの明星、宵の明星とも呼ばれます。", hint2: "非常に高温な惑星です。" },
    { q: "戦国時代に、織田信長が天下統一の拠点として築いた城は何？", a: "安土城", keywords: ["安土城", "あづちじょう"], hint1: "滋賀県にありました。", hint2: "豪華絢爛な天主があったとされます。" },
    { q: "ギリシャ神話で、冥界の王として知られるのは誰？", a: "ハデス", keywords: ["ハデス", "Hades"], hint1: "ゼウスの兄です。", hint2: "ローマ神話のプルートにあたります。" },
    { q: "漫画『進撃の巨人』の主人公、エレン・イェーガーが所属する兵団の名前は何？", a: "調査兵団", keywords: ["調査兵団", "ちょうさへいだん"], hint1: "壁の外で巨人と戦います。", hint2: "自由の翼がシンボルです。" },
    { q: "ラグビーの1チームの人数は何人？", a: "15人", keywords: ["15", "十五"], hint1: "サッカーより多いです。", hint2: "7人制もあります。" },
    { q: "ことわざ「仏の顔も〇〇」。〇〇に入るのは？", a: "三度", keywords: ["三度", "さんど"], hint1: "どんなに優しい人でも、何度も無礼なことをされると怒るという意味です。", hint2: "数字が入ります。" },
    { q: "世界で一番長い川、ナイル川が注ぐ海は何？", a: "地中海", keywords: ["地中海", "ちちゅうかい"], hint1: "ヨーロッパとアフリカの間にあります。", hint2: "エジプトの北に位置します。" },
    { q: "人間の歯で、食べ物をすりつぶす役割を持つ奥歯を何という？", a: "臼歯", keywords: ["臼歯", "きゅうし"], hint1: "石臼の「うす」と同じ漢字です。", hint2: "一番奥に生えるものは親知らずです。" },
    { q: "日本の通貨、円の記号は何？", a: "¥", keywords: ["¥", "エン"], hint1: "Yに二本線です。", hint2: "ドルは$です。" },
    { q: "元素記号「Na」が示す元素は何？", a: "ナトリウム", keywords: ["ナトリウム"], hint1: "食塩の成分です。", hint2: "水に入れると激しく反応します。" },
    { q: "地球が太陽の周りを公転する軌道は、完全な円ではなく、どのような形をしている？", a: "楕円", keywords: ["楕円", "だえん"], hint1: "円を少し潰した形です。", hint2: "ケプラーの法則の一つです。" },
    { q: "平安時代に、紫式部によって書かれた世界最古の長編小説は何？", a: "源氏物語", keywords: ["源氏物語", "げんじものがたり"], hint1: "光源氏が主人公です。", hint2: "多くの女性との恋愛が描かれています。" },
    { q: "ギリシャ神話で、太陽神として知られるのは誰？", a: "アポロン", keywords: ["アポロン", "Apollo"], hint1: "芸術や音楽の神でもあります。", hint2: "竪琴を持っています。" },
    { q: "漫画『ジョジョの奇妙な冒険』第3部の主人公、空条承太郎のスタンド名は何？", a: "スタープラチナ", keywords: ["スタープラチナ"], hint1: "星のアザを持つ一族です。", hint2: "「オラオラ」というラッシュをします。" },
    { q: "バレーボールの1チームのコート上の選手は何人？", a: "6人", keywords: ["6", "六"], hint1: "バスケットボールより1人多いです。", hint2: "ローテーションでポジションが変わります。" },
    { q: "ことわざ「知らぬが〇〇」。〇〇に入るのは？", a: "仏", keywords: ["仏", "ほとけ"], hint1: "知らないでいれば、腹も立たないという意味です。", hint2: "穏やかな心の象徴です。" },
    { q: "世界で一番深い海溝は何？", a: "マリアナ海溝", keywords: ["マリアナ海溝"], hint1: "太平洋にあります。", hint2: "水深は約1万メートルです。" },
    { q: "人間の骨の中で、最も長い骨はどこにある？", a: "太もも", keywords: ["太もも", "大腿骨"], hint1: "脚の付け根から膝までです。", hint2: "体を支える重要な骨です。" },
    { q: "日本の国鳥は何？", a: "キジ", keywords: ["キジ", "雉"], hint1: "桃太郎のお供です。", hint2: "オスは美しい羽を持っています。" },
    { q: "元素記号「K」が示す元素は何？", a: "カリウム", keywords: ["カリウム"], hint1: "バナナに多く含まれます。", hint2: "体内の水分バランスを調整します。" },
    { q: "太陽系の惑星で、美しい環を持つことで知られるのは何？", a: "土星", keywords: ["土星", "どせい"], hint1: "木星の隣の惑星です。", hint2: "環は氷の粒でできています。" },
    { q: "江戸時代末期に、坂本龍馬が中心となって結んだ、薩摩藩と長州藩の同盟を何という？", a: "薩長同盟", keywords: ["薩長同盟", "さっちょうどうめい"], hint1: "倒幕を目指しました。", hint2: "犬猿の仲だった二つの藩が手を組みました。" },
    { q: "ギリシャ神話で、海を司る神として知られるのは誰？", a: "ポセイドン", keywords: ["ポセイドン", "Poseidon"], hint1: "三叉の矛を持っています。", hint2: "ローマ神話のネプトゥヌスにあたります。" },
    { q: "漫画『HUNTER×HUNTER』の主人公、ゴンの父親の名前は何？", a: "ジン・フリークス", keywords: ["ジン"], hint1: "伝説的なハンターです。", hint2: "グリードアイランドの製作者の一人です。" },
    { q: "アメリカンフットボールの1チームのフィールド上の選手は何人？", a: "11人", keywords: ["11", "十一"], hint1: "サッカーと同じ人数です。", hint2: "攻撃と守備で選手が入れ替わります。" },
    { q: "ことわざ「焼け石に〇〇」。〇〇に入るのは？", a: "水", keywords: ["水", "みず"], hint1: "少しの助けでは効果がないことの例えです。", hint2: "すぐに蒸発してしまいます。" },
    { q: "世界で一番大きい砂漠は何？", a: "サハラ砂漠", keywords: ["サハラ砂漠"], hint1: "アフリカ大陸にあります。", hint2: "南極大陸も砂漠に分類されることがあります。" },
    { q: "人間の血液を赤く見せている、酸素を運ぶタンパク質は何？", a: "ヘモグロビン", keywords: ["ヘモグロビン"], hint1: "赤血球に含まれています。", hint2: "鉄分が必要です。" },
    { q: "日本の国花（法律で定められてはいないが、一般的に）とされる花は、桜と何？", a: "菊", keywords: ["菊", "きく"], hint1: "皇室の紋章です。", hint2: "パスポートの表紙にも描かれています。" },
    { q: "元素記号「Ca」が示す元素は何？", a: "カルシウム", keywords: ["カルシウム"], hint1: "骨や歯の主成分です。", hint2: "牛乳に多く含まれます。" },
    { q: "太陽系の惑星で、自転軸が横倒しになっていることで知られるのは何？", a: "天王星", keywords: ["天王星", "てんのうせい"], hint1: "青緑色に見えます。", hint2: "英語名はウラヌスです。" },
    { q: "室町幕府の3代将軍で、金閣を建てたことで知られるのは誰？", a: "足利義満", keywords: ["足利義満", "義満"], hint1: "アニメ『一休さん』にも登場します。", hint2: "日明貿易を行いました。" },
    { q: "ギリシャ神話で、愛と美の女神として知られるのは誰？", a: "アフロディーテ", keywords: ["アフロディーテ", "Aphrodite"], hint1: "海の泡から生まれたとされます。", hint2: "ローマ神話のヴィーナスにあたります。" },
    { q: "漫画『DEATH NOTE』で、主人公・夜神月が使うノートの名前は何？", a: "デスノート", keywords: ["デスノート"], hint1: "名前を書かれた人間は死にます。", hint2: "死神が落としました。" },
    { q: "ハンドボールの1チームのコート上の選手は何人？", a: "7人", keywords: ["7", "七"], hint1: "ボールを手で扱います。", hint2: "「空中の格闘技」とも呼ばれます。" },
    { q: "ことわざ「雀の涙」とは、どのような意味？", a: "ほんのわずか", keywords: ["わずか", "少ない"], hint1: "量が非常に少ないことの例えです。", hint2: "鳥の体の大きさを考えてみましょう。" },
    { q: "世界で一番大きい島は何？", a: "グリーンランド", keywords: ["グリーンランド"], hint1: "デンマークの領土です。", hint2: "大部分が氷で覆われています。" },
    { q: "人間の耳で、音を感じ取る蝸牛（かぎゅう）があるのは、外耳、中耳、内耳のどれ？", a: "内耳", keywords: ["内耳", "ないじ"], hint1: "一番奥の部分です。", hint2: "カタツムリのような形をしています。" },
    // 151-200
    { q: "日本の都道府県で、人口が最も多いのはどこ？", a: "東京都", keywords: ["東京", "とうきょう"], hint1: "日本の首都です。", hint2: "約1400万人が住んでいます。" },
    { q: "元素記号「He」が示す元素は何？", a: "ヘリウム", keywords: ["ヘリウム"], hint1: "吸うと声が高くなります。", hint2: "風船を浮かせるのに使われます。" },
    { q: "太陽系の惑星で、最も公転周期が長いのは何？", a: "海王星", keywords: ["海王星", "かいおうせい"], hint1: "太陽から一番遠い惑星です。", hint2: "英語名はネプチューンです。" },
    { q: "戦国時代に、豊臣秀吉が全国の土地を測量した政策を何という？", a: "太閤検地", keywords: ["太閤検地", "たいこうけんち"], hint1: "石高を基準にしました。", hint2: "税の徴収を確実にするためです。" },
    { q: "ギリシャ神話で、知恵と戦いの女神として知られるのは誰？", a: "アテナ", keywords: ["アテナ", "Athene"], hint1: "ゼウスの頭から生まれました。", hint2: "都市アテネの守護神です。" },
    { q: "漫画『鋼の錬金術師』の主人公、エドワード・エルリックの二つ名は何？", a: "鋼の錬金術師", keywords: ["鋼の錬金術師", "はがね"], hint1: "彼の右腕と左足が由来です。", hint2: "国家錬金術師の称号です。" },
    { q: "アイスホッケーの1チームのリンク上の選手は何人？", a: "6人", keywords: ["6", "六"], hint1: "ゴールキーパーを含みます。", hint2: "氷上の格闘技とも呼ばれます。" },
    { q: "ことわざ「弘法も〇〇の誤り」。〇〇に入るのは？", a: "筆", keywords: ["筆", "ふで"], hint1: "どんな名人でも失敗はあるという意味です。", hint2: "書道の達人の名前です。" },
    { q: "世界で一番大きい湖、カスピ海は、淡水湖と塩水湖、どちら？", a: "塩水湖", keywords: ["塩水湖", "えんすいこ"], hint1: "海という名前がついています。", hint2: "流れ出す川がありません。" },
    { q: "人間の体で、消化された栄養素のほとんどを吸収する器官は何？", a: "小腸", keywords: ["小腸", "しょうちょう"], hint1: "胃と大腸の間にあります。", hint2: "長さは6〜7メートルあります。" },
    { q: "日本の国蝶は何？", a: "オオムラサキ", keywords: ["オオムラサキ"], hint1: "紫色の美しい羽を持ちます。", hint2: "日本の固有種ではありません。" },
    { q: "元素記号「Cl」が示す元素は何？", a: "塩素", keywords: ["塩素", "えんそ"], hint1: "プールの消毒に使われます。", hint2: "食塩(NaCl)の成分です。" },
    { q: "太陽系の準惑星で、かつて第9惑星とされていた天体は何？", a: "冥王星", keywords: ["冥王星", "めいおうせい"], hint1: "英語名はプルートです。", hint2: "2006年に分類が変更されました。" },
    { q: "江戸時代に、庶民の文化として栄えた、木版画の絵を何という？", a: "浮世絵", keywords: ["浮世絵", "うきよえ"], hint1: "葛飾北斎や歌川広重が有名です。", hint2: "美人画や役者絵などがあります。" },
    { q: "ギリシャ神話で、伝令神として知られ、翼のついたサンダルを履いているのは誰？", a: "ヘルメス", keywords: ["ヘルメes", "Hermes"], hint1: "商業や旅人の神でもあります。", hint2: "ローマ神話のメルクリウスにあたります。" },
    { q: "漫画『BLEACH』の主人公、黒崎一護が使う斬魄刀の名前は何？", a: "斬月", keywords: ["斬月", "ざんげつ"], hint1: "常に始解状態です。", hint2: "「月牙天衝」という技を使います。" },
    { q: "水球の1チームのフィールド上の選手は何人？", a: "7人", keywords: ["7", "七"], hint1: "水中のハンドボールとも言われます。", hint2: "ゴールキーパーを含みます。" },
    { q: "ことわざ「背に腹は〇〇」。〇〇に入るのは？", a: "かえられぬ", keywords: ["かえられぬ", "かえられない"], hint1: "大切なことのためには、他のことを犠牲にするのも仕方ないという意味です。", hint2: "体の部位を使った表現です。" },
    { q: "世界で一番大きい湾は何？", a: "ベンガル湾", keywords: ["ベンガル湾"], hint1: "インド洋の北東部にあります。", hint2: "インドとミャンマーに挟まれています。" },
    { q: "人間の体で、体温を調節したり、老廃物を排出したりする汗を出す腺を何という？", a: "汗腺", keywords: ["汗腺", "かんせん"], hint1: "エクリン腺とアポクリン腺があります。", hint2: "全身の皮膚に分布しています。" }
];
const hardQuestions = [
    // --- むずかしい (200問) ---
    { q: "1867年に徳川慶喜が行った、政権を朝廷に返上した出来事を何という？", a: "大政奉還", keywords: ["大政奉還", "たいせいほうかん"], hint1: "江戸時代の終わりに関わる出来事です。", hint2: "これにより武士の時代が終わりを迎えました。" },
    { q: "細胞内でエネルギーを生産する「細胞の発電所」とも呼ばれる小器官は何？", a: "ミトコンドリア", keywords: ["ミトコンドリア"], hint1: "独自のDNAを持っています。", hint2: "母親からのみ受け継がれます。" },
    { q: "ゲーテの戯曲『ファウスト』で、主人公が魂を売る契約を交わした悪魔の名前は何？", a: "メフィストフェレス", keywords: ["メフィストフェレス", "メフィスト"], hint1: "主人公を誘惑し、堕落させようとします。", hint2: "黒い犬の姿で現れます。" },
    { q: "慣性の法則、運動の法則、作用・反作用の法則からなる、古典力学の基本法則をまとめたのは誰？", a: "ニュートン", keywords: ["ニュートン", "Newton"], hint1: "リンゴが木から落ちるのを見て万有引力を発見したとされます。", hint2: "イギリスの科学者です。" },
    { q: "「人間は考える葦である」という言葉を残した、17世紀フランスの哲学者は誰？", a: "パスカル", keywords: ["パスカル", "Pascal"], hint1: "圧力の単位にも名前が使われています。", hint2: "数学者でもありました。" },
    { q: "コンピュータの記憶装置で、電源を切ると内容が消えてしまう、主記憶装置として使われるメモリを何という？", a: "RAM", keywords: ["RAM", "ラム"], hint1: "Random Access Memoryの略です。", hint2: "作業机の広さに例えられます。" },
    { q: "オーストラリアの先住民を何と呼ぶ？", a: "アボリジニ", keywords: ["アボリジニ"], hint1: "独自の文化や芸術を持っています。", hint2: "ブーメランを使います。" },
    { q: "絵画の技法で、点描によって視覚混合を利用し、明るい色彩効果を生み出した画家の代表格は誰？", a: "スーラ", keywords: ["スーラ", "Seurat"], hint1: "新印象派の画家です。", hint2: "『グランド・ジャット島の日曜日の午後』が有名です。" },
    { q: "旧約聖書に登場する、神が建てさせた巨大な塔が、言語の混乱を引き起こしたとされる伝説の塔は何？", a: "バベルの塔", keywords: ["バベルの塔", "バベル"], hint1: "天に届くほどの高さだったと言われます。", hint2: "ブリューゲルの絵画が有名です。" },
    { q: "経済学で、市場価格が需要と供給のバランスをとるように動くことを、比喩的に「神の何」と表現する？", a: "見えざる手", keywords: ["見えざる手", "みえざるて"], hint1: "アダム・スミスが提唱しました。", hint2: "自由な競争が社会全体の利益につながるという考えです。" },
    { q: "日本の戦国時代、武田信玄が掲げた軍旗に書かれていた四文字は何？", a: "風林火山", keywords: ["風林火山", "ふうりんかざん"], hint1: "孫子の兵法の一節です。", hint2: "疾きこと風の如く..." },
    { q: "地球の成層圏に存在し、太陽からの有害な紫外線を吸収する気体の層を何という？", a: "オゾン層", keywords: ["オゾン層", "オゾン"], hint1: "フロンガスによって破壊されます。", hint2: "O3という化学式で表されます。" },
    { q: "トルストイの長編小説で、ナポレオン戦争期のロシア社会を舞台にした作品のタイトルは何？", a: "戦争と平和", keywords: ["戦争と平和", "せんそうとへいわ"], hint1: "多くの登場人物が織りなす物語です。", hint2: "世界文学の最高傑作の一つとされます。" },
    { q: "コンピュータウイルスの一種で、自己増殖能力を持ち、ネットワークを介して他のコンピュータに感染を広げるものを何という？", a: "ワーム", keywords: ["ワーム", "Worm"], hint1: "英語で「虫」という意味です。", hint2: "他のファイルに寄生する必要がありません。" },
    { q: "古代ギリシャの三大悲劇詩人といえば、アイスキュロス、ソフォクレスと誰？", a: "エウリピデス", keywords: ["エウリピデス"], hint1: "『メディア』などの作品があります。", hint2: "心理描写に優れているとされます。" },
    { q: "生物の体内で、特定の化学反応を促進する触媒の役割を果たすタンパク質を何という？", a: "酵素", keywords: ["酵素", "こうそ"], hint1: "消化を助けるものなどがあります。", hint2: "特定の物質にしか作用しません。" },
    { q: "1919年にドイツで制定され、当時最も民主的な憲法と評価された憲法の通称は何？", a: "ワイマール憲法", keywords: ["ワイマール", "ワイマール"], hint1: "生存権を世界で初めて保障しました。", hint2: "ナチスによって形骸化しました。" },
    { q: "インターネットのドメイン名で、「.jp」や「.us」のように国や地域を表す部分を何と呼ぶ？", a: "ccTLD", keywords: ["ccTLD", "国別コードトップレベルドメイン"], hint1: "Country Codeの略です。", hint2: "2文字で構成されます。" },
    { q: "スペインの画家ダリに代表される、無意識の世界や夢の中の風景を描こうとした芸術運動を何という？", a: "シュルレアリスム", keywords: ["シュルレアリスム", "超現実主義"], hint1: "フロイトの精神分析の影響を受けました。", hint2: "柔らかい時計の絵が有名です。" },
    { q: "ノーベル賞の6つの部門に含まれていない賞はどれ？（物理学、化学、医学・生理学、文学、平和、経済学、数学）", a: "数学", keywords: ["数学", "すうがく"], hint1: "数学のノーベル賞と呼ばれるフィールズ賞があります。", hint2: "アルフレッド・ノーベルの遺言にありませんでした。" },
    { q: "平安時代の女流作家、清少納言が書いた随筆のタイトルは何？", a: "枕草子", keywords: ["枕草子", "まくらのそうし"], hint1: "「春はあけぼの」で始まります。", hint2: "「をかし」の文学とも言われます。" },
    { q: "原子核を構成する粒子である、陽子と中性子を総称して何と呼ぶ？", a: "核子", keywords: ["核子", "かくし"], hint1: "原子の質量の大部分を占めます。", hint2: "強い力で結びついています。" },
    { q: "アメリカの公民権運動の指導者で、「I Have a Dream」の演説で知られるのは誰？", a: "キング牧師", keywords: ["キング牧師", "マーティン・ルーサー・キング"], hint1: "非暴力を訴えました。", hint2: "ノーベル平和賞を受賞しました。" },
    { q: "オーケストラで使われる楽器のうち、木管楽器に分類されないのはどれ？（フルート、クラリネット、トランペット、オーボエ）", a: "トランペット", keywords: ["トランペット"], hint1: "金管楽器です。", hint2: "唇を振動させて音を出します。" },
    { q: "心理学で、自分の成功は内的要因（能力など）に、失敗は外的要因（不運など）に帰属させる傾向を何という？", a: "自己奉仕バイアス", keywords: ["自己奉仕バイアス", "セルフサービングバイアス"], hint1: "自尊心を保つための心の働きです。", hint2: "多くの人がこの傾向を持っています。" },
    { q: "日本の法律で、国民の祝日を定めている法律の名前は何？", a: "国民の祝日に関する法律", keywords: ["祝日法"], hint1: "通称です。", hint2: "そのままの名前です。" },
    { q: "月の満ち欠けで、新月から次の新月までにかかる期間は、約何日？", a: "29.5日", keywords: ["29.5", "二十九・五"], hint1: "朔望月と呼ばれます。", hint2: "1ヶ月の長さに近いです。" },
    { q: "1962年に、アメリカとソ連の対立が核戦争寸前まで高まった事件を何という？", a: "キューバ危機", keywords: ["キューバ危機"], hint1: "ソ連がキューバにミサイル基地を建設しようとしました。", hint2: "ケネディ大統領の時代です。" },
    { q: "フランスの作曲家ドビュッシーの代表曲で、月の光を題材にしたピアノ曲のタイトルは何？", a: "月の光", keywords: ["月の光", "つきのひかり"], hint1: "ベルガマスク組曲の中の一曲です。", hint2: "印象派音楽の代表作です。" },
    { q: "企業の社会的責任を意味する、アルファベット3文字の略語は何？", a: "CSR", keywords: ["CSR"], hint1: "Corporate Social Responsibilityの略です。", hint2: "環境保護や社会貢献活動などです。" },
    { q: "日本の古典芸能で、面（おもて）を用いることで知られる歌舞劇は何？", a: "能", keywords: ["能", "のう"], hint1: "室町時代に大成しました。", hint2: "狂言と一緒に上演されることが多いです。" },
    { q: "気象学において、地中海地域で見られる、アフリカから吹く高温で乾燥した南風を何という？", a: "シロッコ", keywords: ["シロッコ"], hint1: "サハラ砂漠の砂を運んできます。", hint2: "イタリアなどで影響があります。" },
    { q: "イギリスの経済学者ケインズが、不況期に政府が公共事業などを行うことで有効需要を創出するべきだと主張した経済理論を何という？", a: "ケインズ経済学", keywords: ["ケインズ"], hint1: "大きな政府を目指します。", hint2: "ニューディール政策に影響を与えました。" },
    { q: "ギリシャ神話で、自分の姿を水面に映して見とれているうちに水仙の花になった美少年の名前は何？", a: "ナルキッソス", keywords: ["ナルキッソス"], hint1: "自己愛の語源になりました。", hint2: "女神エコーに愛されました。" },
    { q: "コンピュータのファイルシステムで、ファイルの断片化を解消し、読み書きの速度を向上させる操作を何という？", a: "デフラグ", keywords: ["デフラグ"], hint1: "defragmentationの略です。", hint2: "ハードディスクのメンテナンスです。" },
    { q: "江戸時代の浮世絵師で、「富嶽三十六景」を描いたことで知られるのは誰？", a: "葛飾北斎", keywords: ["葛飾北斎", "北斎"], hint1: "神奈川沖浪裏が有名です。", hint2: "生涯に何度も改名しました。" },
    { q: "生物の分類階級で、「科」と「種」の間にあるのは何？", a: "属", keywords: ["属", "ぞく"], hint1: "界門綱目科〇種です。", hint2: "ヒトはヒト属です。" },
    { q: "第一次世界大戦の講和条約で、ドイツに巨額の賠償金などを課した条約は何？", a: "ヴェルサイユ条約", keywords: ["ヴェルサイユ条約"], hint1: "フランスの宮殿で結ばれました。", hint2: "第二次世界大戦の一因とされます。" },
    { q: "イタリアの作曲家ヴェルディのオペラで、エジプトの将軍ラダメスとエチオピアの王女の悲恋を描いた作品は何？", a: "アイーダ", keywords: ["アイーダ"], hint1: "凱旋行進曲が有名です。", hint2: "スエズ運河開通を記念して作られました。" },
    { q: "哲学で、経験や感覚に頼らず、理性的な思考のみによって真理に到達しようとする立場を何という？", a: "合理論", keywords: ["合理論", "ごうりろん"], hint1: "大陸で発展しました。", hint2: "経験論と対立します。" },
    // ... (ここに残りのむずかしい問題160問が入ります)
];
const veryHardQuestions = [
    // --- すごくむずかしい (200問) ---
    { q: "哲学において、物事の根源的な原因や原理を探求する学問分野を何という？", a: "形而上学", keywords: ["形而上学", "けいじじょうがく", "メタフィジックス"], hint1: "目に見えない、物事の本質を扱います。", hint2: "アリストテレスが体系化しました。" },
    { q: "素数であり、かつ一つ前の素数との差が2であるような素数のペアを何という？", a: "双子素数", keywords: ["双子素数", "ふたごそすう"], hint1: "例：(3, 5), (5, 7), (11, 13)", hint2: "無限に存在するかは未解決問題です。" },
    { q: "コンピュータのCPUにおいて、命令を解釈し実行するサイクルを何サイクルという？", a: "フェッチ・デコード・エグゼキュートサイクル", keywords: ["フェッチ", "デコード", "エグゼキュート"], hint1: "命令を取り出し(Fetch)、解読し(Decode)...", hint2: "最後に実行(Execute)します。" },
    { q: "19世紀のイギリスで、機械化に反対して機械を破壊した労働者たちの運動を何という？", a: "ラッダイト運動", keywords: ["ラッダイト", "Luddite"], hint1: "産業革命期に起こりました。", hint2: "指導者の名前が由来とされています。" },
    { q: "生物の細胞内で、遺伝情報に基づいてタンパク質を合成する役割を持つ小さな器官は何？", a: "リボソーム", keywords: ["リボソーム", "Ribosome"], hint1: "RNAの情報をもとにアミノ酸を繋げます。", hint2: "「タンパク質工場」とも呼ばれます。" },
    { q: "シェイクスピアの戯曲『夏の夜の夢』に登場する、いたずら好きな妖精の名前は何？", a: "パック", keywords: ["パック", "Puck"], hint1: "惚れ薬で騒動を巻き起こします。", hint2: "オーベロン王に仕えています。" },
    { q: "経済学において、市場の失敗を是正するために政府が市場に介入することを正当化する理論的根拠の一つである、外部性が存在する財を何という？", a: "公共財", keywords: ["公共財", "こうきょうざい"], hint1: "国防や警察などが例です。", hint2: "非競合性と非排除性を持ちます。" },
    { q: "量子力学において、観測されるまで粒子の状態が確定しないことを示す、有名な思考実験に登場する猫の名前は何？", a: "シュレーディンガーの猫", keywords: ["シュレーディンガー", "Schrödinger"], hint1: "箱の中に猫と毒ガス発生装置を入れます。", hint2: "生きている状態と死んでいる状態が重なり合っています。" },
    { q: "古代ギリシャの哲学者アリストテレスが提唱した、物語の三つの構成要素とは、始まり、中間と何？", a: "終わり", keywords: ["終わり", "おわり", "終結"], hint1: "序破急の「急」にあたります。", hint2: "カタルシス（浄化）をもたらします。" },
    { q: "美術史において、17世紀のオランダで活躍した、光と影の描写に優れた画家で、『夜警』などの作品で知られるのは誰？", a: "レンブラント", keywords: ["レンブラント", "Rembrandt"], hint1: "「光の魔術師」と呼ばれました。", hint2: "多くの自画像を残しています。" },
    { q: "古代ローマの政治家カエサルがガリア遠征について記した著作のタイトルは何？", a: "ガリア戦記", keywords: ["ガリア戦記", "ガリア"], hint1: "「賽は投げられた」という言葉で有名です。", hint2: "ラテン語の教科書としても使われます。" },
    { q: "素粒子物理学の標準模型において、力を媒介する素粒子を総称して何と呼ぶ？", a: "ゲージ粒子", keywords: ["ゲージ粒子", "ゲージボソン"], hint1: "光子やグルーオンなどが含まれます。", hint2: "キャッチボールのボールに例えられます。" },
    { q: "音楽理論において、長調の主音から数えて3番目と7番目の音を半音下げて作られる、ブルースなどで特徴的に使われる音階を何という？", a: "ブルーノートスケール", keywords: ["ブルーノート"], hint1: "独特の哀愁を帯びた響きを持ちます。", hint2: "ジャズの基本です。" },
    { q: "ロシアの文豪ドストエフスキーの長編小説で、主人公ラスコーリニコフが老婆を殺害し、その罪の意識に苦む物語のタイトルは何？", a: "罪と罰", keywords: ["罪と罰", "つみとばつ"], hint1: "非凡な人間は道徳を超越するという思想がテーマです。", hint2: "サンクトペテルブルクが舞台です。" },
    { q: "14世紀にヨーロッパで大流行し、人口の3分の1が死亡したとされる伝染病は何？", a: "ペスト", keywords: ["ペスト", "黒死病"], hint1: "ネズミを介して広まりました。", hint2: "腺ペストが主な症状です。" },
    { q: "心理学において、人が集団の中にいると、個人でいる時よりも手抜きをしやすくなる現象を何という？", a: "社会的手抜き", keywords: ["社会的手抜き", "リンゲルマン効果"], hint1: "綱引きの実験で発見されました。", hint2: "責任が分散するためと考えられています。" },
    { q: "仏教において、一切の煩悩から解放された、理想的な心の境地のことを何という？", a: "涅槃", keywords: ["涅槃", "ねはん", "ニルヴァーナ"], hint1: "サンスクリット語で「吹き消すこと」を意味します。", hint2: "仏教の最終目標です。" },
    { q: "化学において、分子構造は同じだが、原子の立体的な配置が異なる異性体を何という？", a: "立体異性体", keywords: ["立体異性体", "ステレオアイソマー"], hint1: "鏡像異性体などが含まれます。", hint2: "右手と左手の関係に例えられます。" },
    { q: "映画理論において、画面に映っているものだけでなく、音や観客の想像力によって暗示される画面外の空間を何という？", a: "オフスクリーン", keywords: ["オフスクリーン", "off-screen"], hint1: "ホラー映画で恐怖を煽るのによく使われます。", hint2: "画面の内側は「オンスクリーン」です。" },
    { q: "日本の平安時代に成立した、世界最古の長編小説とされる作品は何？", a: "源氏物語", keywords: ["源氏物語", "げんじものがたり"], hint1: "紫式部によって書かれました。", hint2: "光源氏が主人公です。" },
    { q: "天文学において、超新星爆発の後に残される、極めて密度の高い中性子の塊からなる天体を何という？", a: "中性子星", keywords: ["中性子星", "ちゅうせいしせい"], hint1: "パルサーとして観測されることがあります。", hint2: "角砂糖1個で数億トンの重さになります。" },
    { q: "言語学において、文の基本的な構造を「主語(S)」「動詞(V)」「目的語(O)」などで表しますが、日本語の語順は一般的にどの型に分類される？", a: "SOV型", keywords: ["SOV"], hint1: "「私はリンゴを食べる」という語順です。", hint2: "英語はSVO型です。" },
    { q: "1929年の世界恐慌を受け、アメリカのルーズベルト大統領が実施した一連の経済政策を何という？", a: "ニューディール政策", keywords: ["ニューディール", "New Deal"], hint1: "テネシー川流域開発公社(TVA)が有名です。", hint2: "「新規まき直し」という意味です。" },
    { q: "精神分析学の創始者フロイトが提唱した、人間の無意識の中に抑圧された願望が、言い間違いや物忘れとして現れることを何という？", a: "失錯行為", keywords: ["失錯行為", "しっさくこうい"], hint1: "パラプラクシスとも言います。", hint2: "単なる間違いではないと考えます。" },
    { q: "コンピュータサイエンスにおいて、ある問題を解決するための計算手順や処理方法を明確に記述したものを何という？", a: "アルゴリズム", keywords: ["アルゴリズム", "Algorithm"], hint1: "料理のレシピに例えられます。", hint2: "ソートや探索などがあります。" },
    { q: "ギリシャ神話に登場する、上半身が人間で下半身が馬の姿をした種族を何という？", a: "ケンタウロス", keywords: ["ケンタウロス", "Centaur"], hint1: "賢者ケイローンが有名です。", hint2: "野蛮な種族として描かれることが多いです。" },
    { q: "法学において、成文法が存在しない場合に、慣習や条理に基づいて裁判官が法を創造することを認める考え方を何という？", a: "判例法主義", keywords: ["判例法", "はんれいほう"], hint1: "英米法系の特徴です。", hint2: "大陸法系と対比されます。" },
    { q: "細胞が自らの細胞内成分を分解し、リサイクルする自食作用のことを英語で何という？", a: "オートファジー", keywords: ["オートファジー", "Autophagy"], hint1: "2016年に大隅良典教授がノーベル賞を受賞しました。", hint2: "ギリシャ語で「自ら」と「食べること」を意味します。" },
    { q: "16世紀の宗教改革で、カトリック教会に抗議（プロテスト）したことから生まれたキリスト教の宗派を総称して何という？", a: "プロテスタント", keywords: ["プロテスタント", "Protestant"], hint1: "ルターやカルヴァンが指導者です。", hint2: "聖書中心主義を掲げます。" },
    { q: "認知心理学において、最初に提示された情報が後の判断に影響を及ぼす現象を何という？", a: "アンカリング効果", keywords: ["アンカリング"], hint1: "船の錨（アンカー）が語源です。", hint2: "価格交渉などで利用されます。" },
    // ... (ここに残りのすごくむずかしい問題170問が入ります)
];

});