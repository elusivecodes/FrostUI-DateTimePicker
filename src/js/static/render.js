import $ from '@fr0st/query';

/**
 * Create a table.
 * @param {object} options Options for rendering the table.
 * @return {HTMLElement} The new table.
 */
export function _createTable(options) {
    const table = $.create('table', {
        class: this.classes.table,
    });

    if (options.header) {
        const thead = $.create('thead');
        $.append(table, thead);

        const tr = $.create('tr');
        $.append(thead, tr);

        const prevTd = $.create('th', {
            html: this.icons.left,
            class: this.classes.navigation,
        });

        if (!options.header.prev) {
            $.addClass(prevTd, this.classes.disabled);
        } else {
            $.addClass(prevTd, this.classes.action);
            $.setDataset(prevTd, options.header.prev.dataset);
            $.setAttribute(prevTd, {
                role: 'button',
                tabindex: 0,
                ...options.header.prev.attributes,
            });
        }

        $.append(tr, prevTd);

        const titleTd = $.create('th', {
            class: this.classes.title,
            text: options.header.title,
            attributes: {
                colspan: 5,
                ...options.header.attributes,
            },
        });

        if (options.header.dataset) {
            $.addClass(titleTd, this.classes.action);
            $.setDataset(titleTd, options.header.dataset);
            $.setAttribute(titleTd, {
                role: 'button',
                tabindex: 0,
            });
        }

        if (options.header.wide) {
            $.addClass(titleTd, this.classes.titleWide);
        }

        $.append(tr, titleTd);

        const nextTd = $.create('th', {
            html: this.icons.right,
            class: this.classes.navigation,
        });

        if (!options.header.next) {
            $.addClass(nextTd, this.classes.disabled);
        } else {
            $.addClass(nextTd, this.classes.action);
            $.setDataset(nextTd, options.header.next.dataset);
            $.setAttribute(nextTd, {
                role: 'button',
                tabindex: 0,
                ...options.header.next.attributes,
            });
        }

        $.append(tr, nextTd);

        if (options.head) {
            options.head(thead);
        }
    }

    const tbody = $.create('tbody');
    $.append(table, tbody);

    options.body(tbody);

    return table;
};

/**
 * Render a time column.
 * @param {object} options Options for rendering the column.
 */
export function _renderTimeColumn(options) {
    const upTd = $.create('td', {
        html: this.icons.up,
        class: [
            this.classes.navigation,
            this.classes.time,
            this.classes.spacingTimeNav,
        ],
        style: {
            width: `${options.cellWidth}%`,
        },
    });

    if (!options.increment) {
        $.addClass(upTd, this.classes.disabled);
    } else {
        $.addClass(upTd, this.classes.action);
        $.setDataset(upTd, options.increment.dataset);
        $.setAttribute(upTd, {
            role: 'button',
            tabindex: 0,
            ...options.increment.attributes,
        });
    }

    $.append(options.upTr, upTd);

    const selectTd = $.create('td', {
        text: options.select.text,
        class: [
            this.classes.action,
            this.classes.time,
            this.classes.spacingTime,
        ],
        dataset: options.select.dataset,
        attributes: {
            role: 'button',
            tabindex: 0,
            ...options.select.attributes,
        },
    });
    $.append(options.timeTr, selectTd);

    const downTd = $.create('td', {
        html: this.icons.down,
        class: [
            this.classes.navigation,
            this.classes.time,
            this.classes.spacingTimeNav,
        ],
    });

    if (!options.decrement) {
        $.addClass(downTd, this.classes.disabled);
    } else {
        $.addClass(downTd, this.classes.action);
        $.setDataset(downTd, options.decrement.dataset);
        $.setAttribute(downTd, {
            role: 'button',
            tabindex: 0,
            ...options.decrement.attributes,
        });
    }

    $.append(options.downTr, downTd);
};

/**
 * Render a time separator column.
 * @param {object} options Options for rendering the separator column.
 */
export function _renderTimeSeparator(options) {
    const seperatorUpTd = $.create('td', {
        style: {
            width: `${options.separatorWidth}%`,
        },
    });
    $.append(options.upTr, seperatorUpTd);

    const separatorTd = $.create('td', {
        text: ':',
        class: [
            this.classes.time,
            this.classes.spacingSeparator,
        ],
    });
    $.append(options.timeTr, separatorTd);

    const separatorDownTd = $.create('td');
    $.append(options.downTr, separatorDownTd);
};
