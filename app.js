(function(){

    // --- Private variables --- //

    var NUM_ROWS = 8;
    var NUM_COLS = 8;
    var NUM_MINES = 10;

    var gameOver = true;

    var gameItems;
    var mineIndexes;
    var flaggedIndexes;

    var bodyEl = (function() {
        var els = document.getElementsByTagName('body');
        return (els && els[0]) || false;
    })();

    var flagsEl = document.getElementById('num-flags');

    // Assign click handlers and start waiting
    if (bodyEl) {
        bodyEl.addEventListener('click', onBodyClicked);
        bodyEl.addEventListener('contextmenu', onRightMouse);
    }
    else {
        throw Error('No body element found! Please check your HTML!')
    }


    // --- GameItem object --- //

    function GameItem(itemIndex) {
        this.itemIndex = itemIndex;
        this.adjacentMineCount = null;
        this.isFlagged = false;
    }

    GameItem.prototype.getElement = function() {
        var text;

        if (!this.element) {
            this.element = document.createElement('td');

            // Add an empty text node because table cells are like that
            text = document.createTextNode('');

            this.element.appendChild(text);
            this.element.className = 'game-item';

            // Assign attributes
            this.element.setAttribute('index', this.itemIndex);
        }

        return this.element;
    };

    GameItem.prototype.setFlag = function() {
        var el = this.getElement(),
            classList, index;

        if (this.adjacentMineCount === null) {
            classList = el.className.split(' ');
            index = classList.indexOf('flagged');

            if (index === -1) {
                classList.push('flagged');
                this.isFlagged = true;
            }
            else {
                classList.splice(index, 1);
                this.isFlagged = false;
            }

            el.className = classList.join(' ');
        }
    }

    GameItem.prototype.setCount = function(count) {
        var el = this.getElement();

        el.innerText = count;
        el.className += ' count-' + count;
        this.adjacentMineCount = count;
    }


    // --- Initialization --- //

    function initMineIndexes() {
        var indexes = [],
            len = NUM_COLS * NUM_ROWS,
            i;

        // Initialize the mines array
        for (i = 0; i < len; i++) {
            indexes.push(i);
        }

        // Randomize the order of the array
        indexes = shuffleArray(indexes);

        // Grab the first NUM_MINES
        mineIndexes = indexes.splice(0, NUM_MINES);
        console.log(mineIndexes);
    }

    function initGameBoard() {
        var gameBoard = document.getElementById('gameboard'),
            itemIndex = 0,
            gameItem, row, i, j;

        // Rest arrays
        gameItems = [];
        flaggedIndexes = [];
        initMineIndexes();

        // Clear all existing game items (this feels like cheating)
        gameBoard.innerHTML = '';

        // Add new items (this can be done more efficiently)
        for (i = 0; i < NUM_ROWS; i++) {
            for (j = 0; j < NUM_COLS; j++) {
                row = document.createElement('tr');

                for (var i = 0; i < NUM_COLS; i++) {
                    gameItem = new GameItem(itemIndex++);
                    gameItems.push(gameItem);

                    row.appendChild(gameItem.getElement());
                }

                gameBoard.appendChild(row);
            }
        }

        gameOver = false;
    }


    // --- Event Handlers --- //

    function onBodyClicked(e) {
        var target = e.target;

        if (target.id === 'new-game') {
            initGameBoard();
        }
        else if (!gameOver && arrayHasItem(target.className.split(' '), 'game-item')) {
            onGameItemClicked(target);
        }
    }

    function onRightMouse(e) {
        var el = e.target,
            item = getElementItem(el);

        if (item) {
            item.setFlag();

            if (item.isFlagged) {
                flaggedIndexes.push(item.itemIndex);

                updateMinesCount();
                checkGameOver();
            }
        }

        e.preventDefault();
    }

    function onGameItemClicked(el) {
        var index = getElementIndex(el),
            hasMine = arrayHasItem(mineIndexes, index),
            adjacentItems = [],
            mineCount = 0,
            gameItem;

        if (hasMine) {
            revealMines();
            itsOver('Sorry. You lose.');
        }
        else {
            adjacentItems = getAdjacentCells(el);
            mineCount = getItemsMineCount(adjacentItems);

            gameItem = gameItems[index];
            gameItem.setCount(mineCount);

            if (mineCount === 0) {
                clearEmptyAdjacentCells(adjacentItems);
            }
        }
    }


    // --- Helper functions --- //

    function getElementIndex(el) {
        return parseInt(el.getAttribute('index'), 10);
    }

    function getElementItem(el) {
        var index = getElementIndex(el);

        return gameItems[index];
    }

    function getAdjacentCells(cellEl) {
        var items = [],
            colIndex = getElementIndex(cellEl) % NUM_COLS,
            rows, row, cells, i;

        if (cellEl.parentNode) {
            // Push the rows we'll be testing onto the stack
            rows = [
                cellEl.parentNode.previousSibling,
                cellEl.parentNode,
                cellEl.parentNode.nextSibling
            ];

            // Iterate over each row
            while (rows.length) {
                row = rows.pop();
                cells = row && row.children;

                if (cells) {
                    for (i = colIndex - 1; i <= colIndex + 1; i++) {
                        items.push(cells[i]);
                    }
                }
            }
        }

        return items;
    }

    function getItemsMineCount(items) {
        var count = 0,
            i;

        for (i = 0; i < items.length; i++) {
            if (hasMine(items[i])) {
                count++;
            }
        }

        return count;
    }

    function clearEmptyAdjacentCells(cells) {
        var cell, gameItem, adjacentCells, mineCount;

        while (cells.length) {
            cell = cells.pop();

            if (cell) {
                gameItem = getElementItem(cell);

                if (gameItem.adjacentMineCount === null) {
                    adjacentCells = getAdjacentCells(cell);
                    mineCount = getItemsMineCount(adjacentCells);

                    gameItem.setCount(mineCount);

                    if (mineCount === 0) {
                        clearEmptyAdjacentCells(adjacentCells);
                    }
                }
            }
        }
    }

    function hasMine(el) {
        var hasMine = false,
            index;

        if (el) {
            index = parseInt(el.getAttribute('index'), 10);
            hasMine = arrayHasItem(mineIndexes, index);
        }

        return hasMine;
    }

    function revealMines() {
        var mineItem, mineIndex, i, len;

        for (i = 0, len = mineIndexes.length; i < len; i++) {
            mineIndex = mineIndexes[i];
            mineItem = gameItems[mineIndex];
            mineItem.getElement().className += ' mine';
        }
    }

    function shuffleArray(array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    function arrayHasItem(array, item) {
        return array.indexOf(item) !== -1;
    }

    function updateMinesCount() {
        if (flagsEl) {
            flagsEl.innerText = 'Mines remaining: ' + (NUM_MINES - flaggedIndexes.length);
        }
    }

    function checkGameOver() {
        var flags, flag;

        if (flaggedIndexes.length === NUM_MINES) {
            flags = flaggedIndexes.slice(0);

            while (flags.length) {
                flag = flags.pop();
                if (!arrayHasItem(mineIndexes, flag)) {
                    return false;
                }
            }

           itsOver('Congratulations! You win!');
        }
    }

    function itsOver(msg) {
        gameOver = true;
        alert(msg);
    }
})();