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
                html: `<span class="${this._settings.icons.right}"></span>`,
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

        if (!this._settings.sideBySide && this._hasDate) {
            const table = this._createTable({
                body: tbody => {
                    const tr = dom.create('tr');
                    dom.append(tbody, tr);

                    const td = dom.create('td', {
                        html: '<span. class="icon-clock"></>',
                        class: 'action py-2',
                        attributes: {
                            colspan: 7,
                            title: this._settings.tooltips.selectTime
                        },
                        dataset: {
                            action: 'showTime'
                        }
                    });
                    dom.append(tr, td);
                }
            });

            dom.append(this._dateContainer, table);
        }
    },

    _refreshTime() {
        dom.empty(this._timeContainer);

        if (!this._settings.sideBySide && this._hasTime) {
            const table = this._createTable({
                body: tbody => {
                    const row = dom.create('tr');
                    dom.append(tbody, row);

                    const td = dom.create('td', {
                        html: '<span class="icon-calendar"></span>',
                        class: 'action py-2',
                        attributes: {
                            colspan: 4,
                            title: this._settings.tooltips.selectDate
                        },
                        dataset: {
                            action: 'showDate'
                        }
                    });
                    dom.append(row, td);
                }
            });

            dom.append(this._timeContainer, table);
        }

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
                class: 'col d-flex flex-column align-items-center'
            });
            dom.append(this._container, this._dateContainer);

            this._refreshDate();
        }

        if (this._hasTime) {
            this._timeContainer = dom.create('div', {
                class: 'col d-flex flex-column align-items-center'
            });
            dom.append(this._container, this._timeContainer);

            this._refreshTime();
        }

        if (this._hasDate && this._hasTime) {
            if (this._settings.sideBySide) {
                dom.addClass(this._menuNode, 'datetimepicker-full')
                dom.addClass(this._container, 'row-cols-md-2')
            } else {
                dom.setStyle(this._timeContainer, 'display', 'none', true);
            }
        }

        if (this._settings.inline) {
            dom.addClass(this._menuNode, 'datetimepicker-inline');

            dom.after(this._node, this._menuNode);
            dom.hide(this._node);
        } else {
            dom.addClass(this._menuNode, 'shadow-sm');

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
            this._now;

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
                        class: 'col-3 p-1'
                    });
                    dom.append(row, col);

                    if (!this._isValid(currentDate, 'second')) {
                        dom.addClass(col, 'disabled');
                    } else {
                        dom.addClass(col, 'action');
                        dom.setDataset(col, {
                            action: 'setHours',
                            hour: currentDate.getHours()
                        });
                    }

                    if (this._settings.renderHour) {
                        this._settings.renderHour(currentDate.clone(), col);
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
                prev: this._isDateBetweenMinMax(startOfDecade) ?
                    {
                        data: {
                            action: 'prev',
                            unit: 'years',
                            amount: 10
                        },
                        attr: {
                            title: this._settings.tooltips.prevDecade
                        }
                    } :
                    false,
                next: this._isDateBetweenMinMax(endOfDecade) ?
                    {
                        data: {
                            action: 'next',
                            unit: 'years',
                            amount: 10
                        },
                        attr: {
                            title: this._settings.tooltips.nextDecade
                        }
                    } :
                    false
            },
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
                        class: 'col-4 px-1 py-3'
                    });
                    dom.append(row, col);

                    if (this._isCurrent(currentDate, 'year')) {
                        dom.addClass(col, 'active');
                    } else if (thisYear < startYear || thisYear > endYear) {
                        dom.addClass(col, 'text-secondary');
                    }

                    if (!this._isDateBetweenMinMax(currentDate, 'year')) {
                        dom.addClass(col, 'disabled');
                    } else {
                        dom.addClass(col, 'action');

                        if (this._settings.minView === 'decade') {
                            dom.setDataset(col, {
                                action: this._settings.multiDate ?
                                    'setDateMulti' :
                                    'setDate',
                                year: thisYear
                            });
                        } else {
                            dom.setDataset(col, {
                                action: 'changeView',
                                view: 'year',
                                year: thisYear
                            });
                        }
                    }

                    if (this._settings.renderYear) {
                        this._settings.renderYear(currentDate.clone(), col);
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
            this._now;

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
                        class: 'col-3 p-1'
                    });
                    dom.append(row, col);

                    if (!this._isValid(currentDate, 'second')) {
                        dom.addClass(col, 'disabled');
                    } else {
                        dom.addClass(col, 'action');
                        dom.setDataset(col, {
                            action: 'setMinutes',
                            minute: currentDate.getMinutes()
                        });
                    }

                    if (this._settings.renderMinute) {
                        this._settings.renderMinute(currentDate.clone(), col);
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
                attr: {
                    title: this._settings.tooltips.selectMonth
                },
                prev: this._isDateBetweenMinMax(startOfMonth) ?
                    {
                        data: {
                            action: 'prev',
                            unit: 'month'
                        },
                        attr: {
                            title: this._settings.tooltips.prevMonth
                        }
                    } :
                    false,
                next: this._isDateBetweenMinMax(endOfMonth) ?
                    {
                        data: {
                            action: 'next',
                            unit: 'month'
                        },
                        attr: {
                            title: this._settings.tooltips.nextMonth
                        }
                    } :
                    false
            },
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
                        text: currentDate.format('dd')
                    });
                    dom.append(tr, td);

                    if (this._isCurrent(currentDate, 'day')) {
                        dom.addClass(td, 'active');
                    } else if (!this._viewDate.isSame(currentDate, 'month')) {
                        dom.addClass(td, 'text-secondary');
                    }

                    if (!this._isValid(currentDate, 'day')) {
                        dom.addClass(td, 'disabled');
                    } else {
                        dom.addClass(td, 'action');
                        dom.setDataset(td, {
                            action: this._settings.multiDate ?
                                'setDateMulti' :
                                'setDate',
                            year: currentDate.getYear(),
                            month: currentDate.getMonth(),
                            date: currentDate.getDate()
                        });
                    }

                    if (this._now.isSame(currentDate, 'day')) {
                        dom.addClass(td, 'today');
                    }

                    if (this._settings.renderDay) {
                        this._settings.renderDay(currentDate.clone(), td);
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
            this._now;

        const table = this._createTable({
            borderless: true,
            body: tbody => {
                const upTr = dom.create('tr');
                dom.append(tbody, upTr);

                const timeTr = dom.create('tr');
                dom.append(tbody, timeTr);

                const downTr = dom.create('tr');
                dom.append(tbody, downTr);

                const hourUpTd = dom.create('td', {
                    html: `<span class="${this._settings.icons.up}"></span>`,
                    class: 'text-primary bw-bold py-4 px-0'
                });

                const nextHour = initialDate.clone().add(1, 'hour');
                if (!this._isValid(nextHour, 'second')) {
                    dom.addClass(hourUpTd, 'disabled');
                } else {
                    dom.addClass(hourUpTd, 'action');
                    dom.setDataset(hourUpTd, {
                        action: 'nextTime',
                        unit: 'hour'
                    });
                    dom.setAttribute(hourUpTd, 'title', this._settings.tooltips.incrementHour);
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
                    },
                    attributes: {
                        title: this._settings.tooltips.selectHour
                    }
                });
                dom.append(timeTr, hourTd);

                const hourDownTd = dom.create('td', {
                    html: `<span class="${this._settings.icons.down}"></span>`,
                    class: 'text-primary bw-bold py-4 px-0'
                });

                const prevHour = initialDate.clone().sub(1, 'hour');
                if (!this._isValid(prevHour, 'second')) {
                    dom.addClass(hourDownTd, 'disabled');
                } else {
                    dom.addClass(hourDownTd, 'action');
                    dom.setDataset(hourDownTd, {
                        action: 'prevTime',
                        unit: 'hour'
                    });
                    dom.setAttribute(hourDownTd, 'title', this._settings.tooltips.decrementHour);
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

                const minuteUpTd = dom.create('td', {
                    html: `<span class="${this._settings.icons.up}"></span>`,
                    class: 'text-primary bw-bold py-4 px-0',
                    style: {
                        width: '35%'
                    }
                });

                const nextMinute = initialDate.clone().add(1, 'minute');
                if (!this._isValid(nextMinute, 'second')) {
                    dom.addClass(minuteUpTd, 'disabled');
                } else {
                    dom.addClass(minuteUpTd, 'action');
                    dom.setDataset(minuteUpTd, {
                        action: 'nextTime',
                        unit: 'minute'
                    });
                    dom.setAttribute(minuteUpTd, 'title', this._settings.tooltips.incrementMinute);
                }

                dom.append(upTr, minuteUpTd);

                const minuteTd = dom.create('td', {
                    text: initialDate.format('mm'),
                    class: 'action time py-2 px-0',
                    dataset: {
                        action: 'changeTimeView',
                        timeView: 'hour'
                    },
                    attributes: {
                        title: this._settings.tooltips.selectMinute
                    }
                });
                dom.append(timeTr, minuteTd);

                const minuteDownTd = dom.create('td', {
                    html: `<span class="${this._settings.icons.down}"></span>`,
                    class: 'action text-primary bw-bold py-4 px-0'
                });

                const prevMinute = initialDate.clone().sub(1, 'minute');
                if (!this._isValid(prevMinute, 'second')) {
                    dom.addClass(minuteDownTd, 'disabled');
                } else {
                    dom.addClass(minuteDownTd, 'action');
                    dom.setDataset(minuteDownTd, {
                        action: 'prevTime',
                        unit: 'minute'
                    });
                    dom.setAttribute(minuteDownTd, 'title', this._settings.tooltips.decrementMinute);
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

                    const periodButton = dom.create('span', {
                        text: initialDate.format('aa').toUpperCase(),
                        class: 'btn btn-primary d-block'
                    });

                    const currentHours = initialDate.getHours();
                    const otherPeriod = initialDate.clone().setHours(
                        currentHours + (currentHours < 12 ? 12 : -12)
                    );
                    if (!this._isValid(otherPeriod, 'second')) {
                        dom.addClass(periodButton, 'disabled');
                    } else {
                        dom.setDataset(periodButton, {
                            action: 'togglePeriod'
                        });
                        dom.setAttribute(periodButton, 'title', this._settings.tooltips.togglePeriod);
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
                attr: {
                    title: this._settings.tooltips.selectYear
                },
                prev: this._isDateBetweenMinMax(startOfYear) ?
                    {
                        data: {
                            action: 'prev',
                            unit: 'year'
                        },
                        attr: {
                            title: this._settings.tooltips.prevYear
                        }
                    } :
                    false,
                next: this._isDateBetweenMinMax(endOfYear) ?
                    {
                        data: {
                            action: 'next',
                            unit: 'year'
                        },
                        attr: {
                            title: this._settings.tooltips.nextYear
                        }
                    } :
                    false
            },
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
                        class: 'col-4 px-1 py-3'
                    });
                    dom.append(row, col);

                    if (this._isCurrent(currentDate, 'month')) {
                        dom.addClass(col, 'active');
                    }

                    if (!this._isDateBetweenMinMax(currentDate, 'month')) {
                        dom.addClass(col, 'disabled');
                    } else {
                        dom.addClass(col, 'action');

                        if (this._settings.minView === 'year') {
                            dom.setDataset(col, {
                                action: 'changeView',
                                view: 'month',
                                year: currentDate.getYear(),
                                month: currentDate.getMonth()
                            });
                        } else {
                            dom.setDataset(col, {
                                action: 'changeView',
                                view: 'month',
                                year: currentDate.getYear(),
                                month: currentDate.getMonth()
                            });
                        }
                    }

                    if (this._settings.renderMonth) {
                        this._settings.renderMonth(currentDate.clone(), col);
                    }

                    currentDate.add(1, 'month');
                }
            }
        });

        dom.append(this._dateContainer, table);
    }

});
