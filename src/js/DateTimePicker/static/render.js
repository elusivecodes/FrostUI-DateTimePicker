/**
 * DateTimePicker (Static) Render
 */

Object.assign(DateTimePicker, {

    /**
     * Create a table.
     * @param {object} options Options for rendering the table.
     * @return {HTMLElement} The new table.
     */
    _createTable(options) {
        const table = dom.create('table', {
            class: this.classes.table
        });

        if (options.borderless) {
            dom.addClass(table, this.classes.borderless);
        }

        if (options.header) {
            const thead = dom.create('thead');
            dom.append(table, thead);

            const tr = dom.create('tr');
            dom.append(thead, tr);

            const prevTd = dom.create('td', {
                html: options.icons.left,
                class: this.classes.navigation
            });

            if (!options.header.prev) {
                dom.addClass(prevTd, this.classes.disabled);
            } else {
                dom.addClass(prevTd, this.classes.action);
                dom.setDataset(prevTd, options.header.prev.data);
                dom.setAttribute(prevTd, options.header.prev.attr);
            }

            dom.append(tr, prevTd);

            const titleTd = dom.create('td', {
                class: this.classes.title,
                text: options.header.title,
                attributes: {
                    colspan: 5,
                    ...options.header.attr
                },
                dataset: options.header.data
            });
            dom.append(tr, titleTd);

            if (options.header.data) {
                dom.addClass(titleTd, this.classes.action);
            }

            if (options.header.wide) {
                dom.addClass(titleTd, this.classes.titleWide);
            }

            const nextTd = dom.create('td', {
                html: options.icons.right,
                class: this.classes.navigation
            });

            if (!options.header.next) {
                dom.addClass(nextTd, this.classes.disabled);
            } else {
                dom.addClass(nextTd, this.classes.action);
                dom.setDataset(nextTd, options.header.next.data);
                dom.setAttribute(nextTd, options.header.next.attr);
            }

            dom.append(tr, nextTd);

            if (options.head) {
                options.head(thead);
            }
        }

        const tbody = dom.create('tbody');
        dom.append(table, tbody);

        options.body(tbody);

        return table;
    },

    /**
     * Render a time column.
     * @param {object} options Options for rendering the column.
     */
    _renderTimeColumn(options) {
        const upTd = dom.create('td', {
            html: options.icons.up,
            class: [
                this.classes.navigation,
                this.classes.time,
                this.classes.spacingTimeNav
            ],
            style: {
                width: `${options.cellWidth}%`
            }
        });

        if (!options.increment) {
            dom.addClass(upTd, this.classes.disabled);
        } else {
            dom.addClass(upTd, this.classes.action);
            dom.setDataset(upTd, options.increment.data);
            dom.setAttribute(upTd, options.increment.attr);
        }

        dom.append(options.upTr, upTd);

        const selectTd = dom.create('td', {
            text: options.select.text,
            class: [
                this.classes.action,
                this.classes.time,
                this.classes.spacingTime
            ],
            dataset: options.select.data,
            attributes: options.select.attr
        });
        dom.append(options.timeTr, selectTd);

        const downTd = dom.create('td', {
            html: options.icons.down,
            class: [
                this.classes.navigation,
                this.classes.time,
                this.classes.spacingTimeNav
            ]
        });

        if (!options.decrement) {
            dom.addClass(downTd, this.classes.disabled);
        } else {
            dom.addClass(downTd, this.classes.action);
            dom.setDataset(downTd, options.decrement.data);
            dom.setAttribute(downTd, options.decrement.attr);
        }

        dom.append(options.downTr, downTd);
    },

    /**
     * Render a time separator column.
     * @param {object} options Options for rendering the separator column.
     */
    _renderTimeSeparator(options) {
        const seperatorUpTd = dom.create('td', {
            style: {
                width: `${options.separatorWidth}%`
            }
        });
        dom.append(options.upTr, seperatorUpTd);

        const separatorTd = dom.create('td', {
            text: ':',
            class: [
                this.classes.time,
                this.classes.spacingSeparator
            ]
        });
        dom.append(options.timeTr, separatorTd);

        const separatorDownTd = dom.create('td');
        dom.append(options.downTr, separatorDownTd);
    }

});
