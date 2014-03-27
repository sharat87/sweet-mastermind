var HotkeyHandler = (function () {
    function handler(e) {
        stack[stack.length - 1].fire('hotkey', e);
    }

    function add(ractive) {
        stack.push(ractive);
        ractive.on('teardown', function () {
            stack.pop();
        });
    }

    var stack = [];
    document.body.addEventListener('keydown', handler);
    return {add: add};
}());

var Modal = Ractive.extend({
    el: document.body,
    append: true,
    template: '#modal-tpl',
    init: function () {
        HotkeyHandler.add(this);
        this.on('close', function () {
            this.teardown();
        });
        this.on('bg-click', function (event) {
            if (event.original.target.classList.contains('modal-bg'))
                this.fire('close');
        });
    }
});

var NewGameModal = Modal.extend({
    partials: {content: document.getElementById('new-game-tpl').textContent},

    data: {
        range: 9,
        size: 4,
        maxTrials: 8
    },

    init: function () {
        this._super();
        this.on('hotkey', function (e) {
            if (e.which == 27) {
                // ESC key
                this.teardown();
            } else if (e.which == 13) {
                // Enter key
                this.fire('new-game');
            }
        });
        this.on('new-game', function () {
            this.teardown();
        });
    }
});

var Game = Ractive.extend({
    el: '#stage',
    template: '#game-tpl',

    data: {
        dummyArray: function (size) {
            return new Array(size);
        }
    },

    init: function (options) {
        // options has keys `range`, `maxTrials`, `size`.
        var pool = '1234567890ABCDEF'.slice(0, options.range),
            secret = options.secret || this.mkCode(pool, options.size, false);

        this.set({
            secret: secret,
            maxTrials: options.maxTrials,
            pool: pool,
            trials: [],
            currentInput: this.blankInput(secret),
            currentIndex: 0,
            checkable: false,
            gameOver: false,
            won: false
        });

        console.debug('Secret is', this.get('secret'));

        HotkeyHandler.add(this);

        this.on('check', function checkHandler() {
            if (!this.get('checkable') || this.get('gameOver')) return;
            var input = this.get('currentInput'),
                feedback = this.codeFeedback(input);
            this.get('trials').push({
                input: input,
                blacks: feedback.blacks,
                whites: feedback.whites
            });
            if (feedback.blacks == input.length) {
                this.set({gameOver: true, won: true});
            } else if (this.get('trials').length >= this.get('maxTrials')) {
                this.set({gameOver: true, won: false});
            } else {
                this.set({currentIndex: 0, currentInput: this.blankInput()});
            }
        });

        this.observe('currentInput', function (value) {
            this.set('checkable', value.indexOf('∙') < 0);
        });

        this.on('hotkey', function (e) {
            if (e.ctrlKey || e.altKey) return;
            if (e.which == 13) {
                // Enter key
                this.fire('check');
            } else if (e.which == 37) {
                // Left key
                this.set('currentIndex', Math.max(0, this.get('currentIndex') - 1));
            } else if (e.which == 39) {
                // Right key
                this.set('currentIndex', Math.min(this.get('secret').length, this.get('currentIndex') + 1));
            } else if (e.which == 8) {
                // Backspace key
                if (this.get('currentIndex') > 0) {
                    this.set('currentIndex', Math.max(0, this.get('currentIndex') - 1));
                    this.set('currentInput.' + this.get('currentIndex'), '∙');
                }
            } else if (e.which == 78) {
                // `n` key
                var self = this, newGameModal = new NewGameModal({
                    range: this.get('pool').length,
                    size: this.get('secret').length,
                    maxTrials: this.get('maxTrials')
                });
                newGameModal.on('new-game', function () {
                    self.fire('new-game', this.data);
                });
            } else {
                var key = String.fromCharCode(e.which);
                if (key.match(/^[0-9A-F]$/)) {
                    this.set('currentInput.' + this.get('currentIndex'), key);
                    this.set('currentIndex', (this.get('currentIndex') + 1) % this.get('secret').length);
                }
            }
            e.stopPropagation();
            return false;
        });


    },

    mkCode: function (pool, size, allowRepeats) {
        var value = '';
        while (value.length < size) {
            var c = pool[Math.floor(Math.random() * pool.length)];
            if (allowRepeats || value.indexOf(c) < 0)
                value += c;
        }
        return value;
    },

    blankInput: function (secret) {
        return (secret || this.get('secret')).replace(/./g, '∙').split('');
    },

    codeFeedback: function (code) {
        var secret = this.get('secret');
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
});

function mkNewGame(options) {
    var app = new Game(options);
    app.on('new-game', function (options) {
        app.teardown();
        mkNewGame(options);
    });
}

mkNewGame({range: 9, maxTrials: 8, size: 4});
