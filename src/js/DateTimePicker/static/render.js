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
            class: 'table table-sm text-center m-0'
        });

        if (options.borderless) {
            dom.addClass(table, 'table-borderless');
        }

        if (options.header) {
            const thead = dom.create('thead');
            dom.append(table, thead);

            const tr = dom.create('tr');
            dom.append(thead, tr);

            const prevTd = dom.create('td', {
                html: `<span class="${options.icons.left}"></span>`,
                class: 'action text-primary fw-bold'
            });

            if (!options.header.prev) {
                dom.addClass(prevTd, 'disabled');
            } else {
                dom.setDataset(prevTd, options.header.prev.data);
                dom.setAttribute(prevTd, options.header.prev.attr);
            }

            dom.append(tr, prevTd);

            const titleTd = dom.create('td', {
                class: 'fw-bold',
                text: options.header.title,
                attributes: {
                    colspan: 5,
                    ...options.header.attr
                },
                dataset: options.header.data
            });
            dom.append(tr, titleTd);

            if (options.header.data) {
                dom.addClass(titleTd, 'action');
            }

            if (options.header.wide) {
                dom.addClass(titleTd, 'w-100');
            }

            const nextTd = dom.create('td', {
                html: `<span class="${options.icons.right}"></span>`,
                class: 'action text-primary fw-bold'
            });

            if (!options.header.next) {
                dom.addClass(nextTd, 'disabled');
            } else {
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
            html: `<span class="${options.icons.up}"></span>`,
            class: 'text-primary bw-bold py-4 px-0',
            style: {
                width: `${options.cellWidth}%`
            }
        });

        if (options.increment) {
            dom.setDataset(upTd, options.increment.data);
            dom.setAttribute(upTd, options.increment.attr);
        } else {
            dom.addClass(upTd, 'disabled');
        }

        dom.append(options.upTr, upTd);

        const selectTd = dom.create('td', {
            text: options.select.text,
            class: 'time-display py-2 px-0',
            dataset: options.select.data,
            attributes: options.select.attr
        });
        dom.append(options.timeTr, selectTd);

        const downTd = dom.create('td', {
            html: `<span class="${options.icons.down}"></span>`,
            class: 'text-primary bw-bold py-4 px-0'
        });

        if (options.decrement) {
            dom.setDataset(downTd, options.decrement.data);
            dom.setAttribute(downTd, options.decrement.attr);
        } else {
            dom.addClass(downTd, 'disabled');
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
            class: 'time py-2'
        });
        dom.append(options.timeTr, separatorTd);

        const separatorDownTd = dom.create('td');
        dom.append(options.downTr, separatorDownTd);
    }

});
