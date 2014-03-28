var model = {
    secret: '',
    maxTrials: 0,
    pool: '',
    trials: [],
    currentInput: '',
    currentIndex: 0,
    checkable: false,
    gameOver: false,
    won: false,
    newGameProps: {
        range: 9,
        size: 4,
        maxTrials: 8
    },
    showHelp: false,
    showNewGame: false
};

function startNewGame() {
    closeNewGame();
    var pool = '1234567890ABCDEF'.slice(0, model.newGameProps.range()),
        secret = mkCode(pool, model.newGameProps.size(), false);
    console.debug('secret is', secret);
    model.secret(secret)
        .maxTrials(model.newGameProps.maxTrials())
        .pool(pool)
        .trials([])
        .currentInput(blankInput(secret))
        .currentIndex(0)
        .gameOver(false)
        .won(false);
}

function mkCode(pool, size, allowRepeats) {
    var value = '';
    while (value.length < size) {
        var c = pool[Math.floor(Math.random() * pool.length)];
        if (allowRepeats || value.indexOf(c) < 0)
            value += c;
    }
    return value;
}

function check() {
    if (!model.checkable() || model.gameOver()) return;

    var input = model.currentInput(),
        feedback = codeFeedback(input);

    feedback.input = input;
    model.trials.push(feedback);

    if (feedback.blacks == input.length) {
        model.gameOver(true);
        model.won(true);
    } else if (model.trials().length >= model.maxTrials()) {
        model.gameOver(true);
        model.won(false);
    } else {
        model.currentIndex(0);
        model.currentInput(blankInput());
    }
}

function codeFeedback(code) {
    var secret = model.secret();
    code = code.slice(0);

    if (code.join('') == secret)
        return {blacks: 4, whites: 0};

    var blacks = 0, whites = 0;

    for (var i = 0, len = secret.length; i < len; ++i) {
        if (code[i] == secret[i]) {
            ++blacks;
            code[i] = null;
        }
    }

    for (i = 0, len = secret.length; i < len; ++i) {
        if (!code[i]) continue;
        var pos = code.indexOf(secret[i]);
        if (pos >= 0) {
            ++whites;
            code[pos] = null;
        }
    }

    return {blacks: blacks, whites: whites};
}

function blankInput(secret) {
    return (secret || model.secret()).replace(/./g, '∙').split('');
}

function dummyArray(size) {
    return new Array(size);
}

function onHotkey(data, event) {
    if (model.showNewGame())
        newGameHotkeyHandle(event);
    else if (model.showHelp())
        helpHotkeyHandle(event);
    else
        gameHotkeyHandle(event);
    return true; // ko will prevent default without this!
}

function gameHotkeyHandle(event) {
    if (event.ctrlKey || event.altKey) return;
    if (event.which == 13) {
        // Enter key
        check();
    } else if (event.which == 37) {
        // Left key
        model.currentIndex(Math.max(0, model.currentIndex() - 1));
    } else if (event.which == 39) {
        // Right key
        model.currentIndex(Math.min(model.secret().length - 1, model.currentIndex() + 1));
    } else if (event.which == 8) {
        // Backspace key
        if (model.currentIndex() > 0) {
            model.currentIndex(model.currentIndex() - 1);
            model.currentInput()[model.currentIndex()] = '∙';
            model.currentInput.valueHasMutated();
        }
    } else if (event.which == 78) {
        // `n` key
        model.newGameProps.range(model.pool().length);
        model.newGameProps.size(model.secret().length);
        model.newGameProps.maxTrials(model.maxTrials());
        model.showNewGame(true);
    } else if (event.which == 88) {
        // `x` key
        if (confirm('Give up game?'))
            model.gameOver(true).won(false);
    } else if (event.which == 191 && event.shiftKey) {
        model.showHelp(true);
    } else {
        var key = String.fromCharCode(event.which - (event.which >= 96 ? 48 : 0));
        if (key.match(/^[0-9A-F]$/)) {
            model.currentInput()[model.currentIndex()] = key;
            model.currentInput.valueHasMutated();
            model.currentIndex((model.currentIndex() + 1) % model.secret().length);
        }
    }
    event.stopPropagation();
}

function newGameHotkeyHandle(event) {
    if (event.which == 27) {
        closeNewGame();
    } else if (event.which == 13) {
        startNewGame();
    }
}

function closeNewGame() {
    model.showNewGame(false);
}

function helpHotkeyHandle(event) {
    if (event.which == 27)
        closeHelp();
}

function closeHelp() {
    model.showHelp(false);
}

function mkObservables(obj) {
    for (var key in obj)
        if (obj[key] instanceof Array) obj[key] = ko.observableArray(obj[key]);
        else if (obj[key] instanceof Object) mkObservables(obj[key]);
        else obj[key] = ko.observable(obj[key]);
}

mkObservables(model);
model.currentInput.subscribe(function (value) {
    model.checkable(value.indexOf('∙') < 0);
});

startNewGame();
ko.applyBindings(model);
