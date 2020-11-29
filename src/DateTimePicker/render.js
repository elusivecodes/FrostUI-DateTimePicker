Object.assign(DateTimePicker.prototype, {

    refresh() {
        if (this._hasDate) {
            this._refreshDate();
        }

        if (this._hasTime) {
            this._refreshTime();
        }
    },

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
                html: `<span class="${this._settings.icons.left}"></span>`,
                class: 'action text-primary fw-bold',
                dataset: options.header.prev
            });

            if (!options.header.prev) {
                dom.addClass(prevTd, 'disabled');
            }

            dom.append(tr, prevTd);

            const titleTd = dom.create('td', {
                class: 'fw-bold',
                text: options.header.title,
                attributes: {
                    colspan: 5
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
                html: `<span class="${this._settings.icons.right}"></span>`,
                class: 'action text-primary fw-bold',
                dataset: options.header.next
            });

            if (!options.header.next) {
                dom.addClass(nextTd, 'disabled');
            }

            dom.append(tr, nextTd);

            if (options.head) {
                options.head(thead);
            }
        }

        const tbody = dom.create('tbody');
        dom.append(table, tbody);

        if (options.timeActions) {
            const row = dom.create('tr');
            dom.append(tbody, row);

            const td = dom.create('td', {
                html: '<span class="icon-calendar"></span>',
                class: 'action',
                attributes: {
                    colspan: 4
                },
                dataset: {
                    action: 'showDate'
                }
            });
            dom.append(row, td);
        }

        options.body(tbody);

        if (options.dateActions) {
            const tr = dom.create('tr');
            dom.append(tbody, tr);

            const td = dom.create('td', {
                html: '<span. class="icon-clock"></>',
                class: 'action',
                attributes: {
                    colspan: 7
                },
                dataset: {
                    action: 'showTime'
                }
            });
            dom.append(tr, td);
        }

        return table;
    },

    _refreshDate() {
        dom.empty(this._dateContainer);

        switch (this._viewMode) {
            case 'decade':
                this._renderDecade();
                break;
            case 'year':
                this._renderYear();
                break;
            case 'month':
                this._renderMonth();
                break;
        }
    },

    _refreshTime() {
        dom.empty(this._timeContainer);

        switch (this._timeViewMode) {
            case 'day':
                this._renderDay();
                break;
            case 'hour':
                this._renderHour();
                break;
            default:
                this._renderTime();
        }
    },

    _render() {
        this._menuNode = dom.create('div', {
            class: 'datetimepicker',
            dataset: {
                trigger: '#' + dom.getAttribute(this._node, 'id')
            }
        });

        this._container = dom.create('div', {
            class: 'row row-cols-1 gy-0 gx-2'
        });
        dom.append(this._menuNode, this._container);

        if (this._hasDate) {
            this._dateContainer = dom.create('div', {
                class: 'col d-flex align-items-center'
            });
            dom.append(this._container, this._dateContainer);

            this._refreshDate();
        }

        if (this._hasTime) {
            this._timeContainer = dom.create('div', {
                class: 'col d-flex align-items-center'
            });
            dom.append(this._container, this._timeContainer);

            this._refreshTime();
        }

        if (this._hasDate && this._hasTime) {
            if (this._settings.sideBySide) {
                dom.addClass(this._menuNode, 'full')
                dom.addClass(this._container, 'row-cols-md-2')
            } else {
                dom.setStyle(this._timeContainer, 'display', 'none', true);
            }
        }

        if (this._settings.inline) {
            dom.addClass(this._menuNode, 'inline');

            dom.after(this._node, this._menuNode);
            dom.hide(this._node);
        } else {
            dom.addClass(this._menuNode, 'shadow-sm');

            dom.append(document.body, this._menuNode);

            this._popper = new UI.Popper(
                this._menuNode,
                {
                    reference: this._node,
                    placement: this._settings.placement,
                    position: this._settings.position,
                    fixed: this._settings.fixed,
                    spacing: this._settings.spacing,
                    minContact: this._settings.minContact
                }
            );
        }
    },

    _renderDay() {
        const initialDate = this._currentDate ?
            this._currentDate :
            this._today;

        const currentDate = initialDate.clone().startOf('day');
        const lastDate = initialDate.clone().endOf('day');

        const table = this._createTable({
            borderless: true,
            body: tbody => {
                const tr = dom.create('tr');
                dom.append(tbody, tr);

                const td = dom.create('td', {
                    class: 'p-0',
                    attributes: {
                        colspan: 7
                    }
                });
                dom.append(tr, td);

                const row = dom.create('div', {
                    class: 'row'
                });
                dom.append(td, row);

                while (currentDate.isSameOrBefore(lastDate, 'hour')) {
                    const col = dom.create('div', {
                        text: currentDate.format('HH'),
                        class: 'action col-3 p-1',
                        dataset: {
                            action: 'setHours',
                            hour: currentDate.getHours()
                        }
                    });
                    dom.append(row, col);

                    if (!this._isTimeValid(currentDate)) {
                        dom.addClass(col, 'disabled');
                    }

                    currentDate.add(1, 'hour');
                }
            }
        });

        dom.append(this._timeContainer, table);
    },

    _renderDecade() {
        const startOfDecade = this._viewDate.clone().startOf('year');
        const endOfDecade = this._viewDate.clone().endOf('year');
        const currentYear = startOfDecade.getYear();
        const startYear = currentYear - (currentYear % 10);
        const endYear = startYear + 9;
        startOfDecade.setYear(startYear);
        endOfDecade.setYear(endYear);

        const currentDate = startOfDecade.clone().sub(1, 'year');
        const lastDate = endOfDecade.clone().add(1, 'year');

        startOfDecade.sub(1, 'second');
        endOfDecade.add(1, 'second');

        const table = this._createTable({
            header: {
                title: `${startOfDecade.format('yyyy')} - ${endOfDecade.format('yyyy')}`,
                wide: true,
                prev: this._isDateBetween(startOfDecade) ?
                    {
                        action: 'prev',
                        unit: 'years',
                        amount: 10
                    } :
                    false,
                next: this._isDateBetween(endOfDecade) ?
                    {
                        action: 'next',
                        unit: 'years',
                        amount: 10
                    } :
                    false
            },
            dateActions: !this._settings.sideBySide && this._hasTime,
            body: tbody => {
                const tr = dom.create('tr');
                dom.append(tbody, tr);

                const td = dom.create('td', {
                    class: 'p-0',
                    attributes: {
                        colspan: 7
                    }
                });
                dom.append(tr, td);

                const row = dom.create('div', {
                    class: 'row g-0'
                });
                dom.append(td, row);

                while (currentDate.isSameOrBefore(lastDate, 'month')) {
                    const thisYear = currentDate.getYear();

                    const col = dom.create('div', {
                        text: currentDate.format('yyyy'),
                        class: 'action col-4 p-1',
                        dataset: this._settings.minView === 'decade' ?
                            {
                                action: 'setDate',
                                year: thisYear
                            } :
                            {
                                action: 'changeView',
                                view: 'year',
                                year: thisYear
                            }
                    });
                    dom.append(row, col);

                    if (this._currentDate && this._currentDate.isSame(currentDate, 'year')) {
                        dom.addClass(col, 'active');
                    } else if (thisYear < startYear || thisYear > endYear) {
                        dom.addClass(col, 'text-secondary');
                    }

                    if (!this._isDateBetween(currentDate, 'year')) {
                        dom.addClass(col, 'disabled');
                    }

                    currentDate.add(1, 'year');
                }
            }
        });

        dom.append(this._dateContainer, table);
    },

    _renderHour() {
        const initialDate = this._currentDate ?
            this._currentDate :
            this._today;

        const currentDate = initialDate.clone().startOf('hour');
        const lastDate = initialDate.clone().endOf('hour');

        const table = this._createTable({
            borderless: true,
            body: tbody => {
                const tr = dom.create('tr');
                dom.append(tbody, tr);

                const td = dom.create('td', {
                    class: 'p-0',
                    attributes: {
                        colspan: 7
                    }
                });
                dom.append(tr, td);

                const row = dom.create('div', {
                    class: 'row'
                });
                dom.append(td, row);

                while (currentDate.isSameOrBefore(lastDate, 'minute')) {
                    const col = dom.create('span', {
                        text: currentDate.format('mm'),
                        class: 'action col-3 p-1',
                        dataset: {
                            action: 'setMinutes',
                            minute: currentDate.getMinutes()
                        }
                    });
                    dom.append(row, col);

                    if (!this._isTimeValid(currentDate)) {
                        dom.addClass(col, 'disabled');
                    }

                    currentDate.add(5, 'minute');
                }
            }
        });

        dom.append(this._timeContainer, table);
    },

    _renderMonth() {
        const startOfMonth = this._viewDate.clone().startOf('month');
        const endOfMonth = this._viewDate.clone().endOf('month');

        const currentDate = startOfMonth.clone().startOf('week');
        const lastDate = endOfMonth.clone().endOf('week');

        startOfMonth.sub(1, 'second');
        endOfMonth.add(1, 'second');

        const table = this._createTable({
            header: {
                title: this._viewDate.format('MMMM yyyy'),
                data: {
                    action: 'changeView',
                    view: 'year'
                },
                prev: this._isDateBetween(startOfMonth) ?
                    {
                        action: 'prev',
                        unit: 'month'
                    } :
                    false,
                next: this._isDateBetween(endOfMonth) ?
                    {
                        action: 'next',
                        unit: 'month'
                    } :
                    false
            },
            dateActions: !this._settings.sideBySide && this._hasTime,
            head: thead => {
                const tr = dom.create('tr');
                dom.append(thead, tr);

                const currentDay = currentDate.clone();
                for (let i = 1; i <= 7; i++) {
                    currentDay.setWeekDay(i);
                    const th = dom.create('th', {
                        class: 'fw-bold',
                        text: currentDay.dayName('narrow')
                    });
                    dom.append(tr, th);
                }
            },
            body: tbody => {
                let tr;
                while (currentDate.isSameOrBefore(lastDate, 'day')) {
                    if (currentDate.getWeekDay() === 1) {
                        tr = dom.create('tr');
                        dom.append(tbody, tr);
                    }

                    const td = dom.create('td', {
                        text: currentDate.format('dd'),
                        class: 'action',
                        dataset: {
                            action: 'setDate',
                            year: currentDate.getYear(),
                            month: currentDate.getMonth(),
                            date: currentDate.getDate()
                        }
                    });
                    dom.append(tr, td);

                    if (this._currentDate && this._currentDate.isSame(currentDate, 'day')) {
                        dom.addClass(td, 'active');
                    } else if (!this._viewDate.isSame(currentDate, 'month')) {
                        dom.addClass(td, 'text-secondary');
                    }

                    if (!this._isDateValid(currentDate)) {
                        dom.addClass(td, 'disabled');
                    }

                    if (this._today.isSame(currentDate, 'day')) {
                        dom.addClass(td, 'today');
                    }

                    currentDate.add(1, 'day');
                }
            }
        });

        dom.append(this._dateContainer, table);
    },

    _renderTime() {
        const initialDate = this._currentDate ?
            this._currentDate :
            this._today;

        const table = this._createTable({
            borderless: true,
            timeActions: !this._settings.sideBySide && this._hasDate,
            body: tbody => {
                const upTr = dom.create('tr');
                dom.append(tbody, upTr);

                const timeTr = dom.create('tr');
                dom.append(tbody, timeTr);

                const downTr = dom.create('tr');
                dom.append(tbody, downTr);

                const nextHour = initialDate.clone().add(1, 'hour');
                const nextHourData = this._isTimeValid(nextHour) ?
                    {
                        action: 'nextTime',
                        unit: 'hour'
                    } :
                    false;

                const hourUpTd = dom.create('td', {
                    html: `<span class="${this._settings.icons.up}"></span>`,
                    class: 'action text-primary bw-bold py-4 px-0',
                    dataset: nextHourData
                });

                if (!nextHourData) {
                    dom.addClass(hourUpTd, 'disabled');
                }

                dom.append(upTr, hourUpTd);

                const hourTd = dom.create('td', {
                    text: initialDate.format(this._useDayPeriod ? 'hh' : 'HH'),
                    class: 'action time py-2 px-0',
                    style: {
                        width: '35%'
                    },
                    dataset: {
                        action: 'changeTimeView',
                        timeView: 'day'
                    }
                });
                dom.append(timeTr, hourTd);

                const prevHour = initialDate.clone().sub(1, 'hour');
                const prevHourData = this._isTimeValid(prevHour) ?
                    {
                        action: 'prevTime',
                        unit: 'hour'
                    } :
                    false;

                const hourDownTd = dom.create('td', {
                    html: `<span class="${this._settings.icons.down}"></span>`,
                    class: 'action text-primary bw-bold py-4 px-0',
                    dataset: prevHourData
                });

                if (!prevHourData) {
                    dom.addClass(hourDownTd, 'disabled');
                }

                dom.append(downTr, hourDownTd);

                const seperatorUpTd = dom.create('td', {
                    style: {
                        width: '5%'
                    }
                });
                dom.append(upTr, seperatorUpTd);

                const separatorTd = dom.create('td', {
                    text: ':',
                    class: 'time py-2'
                });
                dom.append(timeTr, separatorTd);

                const separatorDownTd = dom.create('td');
                dom.append(downTr, separatorDownTd);

                const nextMinute = initialDate.clone().add(1, 'minute');
                const nextMinuteData = this._isTimeValid(nextMinute) ?
                    {
                        action: 'nextTime',
                        unit: 'minute'
                    } :
                    false

                const minuteUpTd = dom.create('td', {
                    html: `<span class="${this._settings.icons.up}"></span>`,
                    class: 'action text-primary bw-bold py-4 px-0',
                    style: {
                        width: '35%'
                    },
                    dataset: nextMinuteData
                });

                if (!nextMinuteData) {
                    dom.addClass(minuteUpTd, 'disabled');
                }

                dom.append(upTr, minuteUpTd);

                const minuteTd = dom.create('td', {
                    text: initialDate.format('mm'),
                    class: 'action time py-2 px-0',
                    dataset: {
                        action: 'changeTimeView',
                        timeView: 'hour'
                    }
                });
                dom.append(timeTr, minuteTd);

                const prevMinute = initialDate.clone().sub(1, 'minute');
                const prevMinuteData = this._isTimeValid(prevMinute) ?
                    {
                        action: 'prevTime',
                        unit: 'minute'
                    } :
                    false

                const minuteDownTd = dom.create('td', {
                    html: `<span class="${this._settings.icons.down}"></span>`,
                    class: 'action text-primary bw-bold py-4 px-0',
                    dataset: prevMinuteData
                });

                if (!prevMinuteData) {
                    dom.addClass(minuteDownTd, 'disabled');
                }

                dom.append(downTr, minuteDownTd);

                if (this._useDayPeriod) {
                    const periodUpTd = dom.create('td', {
                        style: {
                            width: '25%'
                        }
                    });
                    dom.append(upTr, periodUpTd);

                    const periodTd = dom.create('td');
                    dom.append(timeTr, periodTd);

                    const currentHours = initialDate.getHours();
                    const otherPeriod = initialDate.clone().setHours(
                        currentHours + (currentHours < 12 ? 12 : -12)
                    );
                    const otherPeriodData = this._isTimeValid(otherPeriod) ?
                        {
                            action: 'dayPeriod'
                        } :
                        false;

                    const periodButton = dom.create('span', {
                        text: initialDate.format('aa').toUpperCase(),
                        class: 'btn btn-primary d-block',
                        dataset: otherPeriodData
                    });

                    if (!otherPeriodData) {
                        dom.addClass(periodButton, 'disabled');
                    }

                    dom.append(periodTd, periodButton);

                    const periodDownCell = dom.create('td');
                    dom.append(downTr, periodDownCell);
                }
            }
        });

        dom.append(this._timeContainer, table);
    },

    _renderYear() {
        const startOfYear = this._viewDate.clone().startOf('year');
        const endOfYear = this._viewDate.clone().endOf('year');

        const currentDate = startOfYear.clone();
        const lastDate = endOfYear.clone();

        startOfYear.sub(1, 'second');
        endOfYear.add(1, 'second');

        const table = this._createTable({
            header: {
                title: this._viewDate.format('yyyy'),
                wide: true,
                data: {
                    action: 'changeView',
                    view: 'decade'
                },
                prev: this._isDateBetween(startOfYear) ?
                    {
                        action: 'prev',
                        unit: 'year'
                    } :
                    false,
                next: this._isDateBetween(endOfYear) ?
                    {
                        action: 'next',
                        unit: 'year'
                    } :
                    false
            },
            dateActions: !this._settings.sideBySide && this._hasTime,
            body: tbody => {
                const tr = dom.create('tr');
                dom.append(tbody, tr);

                const td = dom.create('td', {
                    class: 'p-0',
                    attributes: {
                        colspan: 7
                    }
                });
                dom.append(tr, td);

                const row = dom.create('div', {
                    class: 'row g-0'
                });
                dom.append(td, row);

                while (currentDate.isSameOrBefore(lastDate, 'month')) {
                    const col = dom.create('div', {
                        text: currentDate.format('MMM'),
                        class: 'action col-4 p-1',
                        dataset: this._settings.minView === 'year' ?
                            {
                                action: 'setDate',
                                year: currentDate.getYear(),
                                month: currentDate.getMonth()
                            } :
                            {
                                action: 'changeView',
                                view: 'month',
                                year: currentDate.getYear(),
                                month: currentDate.getMonth()
                            }
                    });
                    dom.append(row, col);

                    if (this._currentDate && this._currentDate.isSame(currentDate, 'month')) {
                        dom.addClass(col, 'active');
                    }

                    if (!this._isDateBetween(currentDate, 'month')) {
                        dom.addClass(col, 'disabled');
                    }

                    currentDate.add(1, 'month');
                }
            }
        });

        dom.append(this._dateContainer, table);
    }

});
