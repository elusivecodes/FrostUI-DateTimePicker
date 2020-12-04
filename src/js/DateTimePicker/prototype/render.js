/**
 * DateTimePicker Render
 */

Object.assign(DateTimePicker.prototype, {

    /**
     * Refresh the date container.
     */
    _refreshDate() {
        dom.empty(this._dateContainer);

        switch (this._viewMode) {
            case 'years':
                this._renderYears();
                break;
            case 'months':
                this._renderMonths();
                break;
            case 'days':
                this._renderDays();
                break;
        }

        if (!this._settings.sideBySide && this._hasTime) {
            const table = this.constructor._createTable({
                body: tbody => {
                    const tr = dom.create('tr');
                    dom.append(tbody, tr);

                    const td = dom.create('td', {
                        html: `<span class="${this._settings.icons.time}"></>`,
                        class: [
                            this.constructor.classes.action,
                            this.constructor.classes.spacingNav
                        ],
                        attributes: {
                            colspan: 7,
                            title: this._settings.lang.selectTime
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

        if (!this._settings.inline && this._popper) {
            this._popper.update();
        }
    },

    /**
     * Refresh the time container.
     */
    _refreshTime() {
        dom.empty(this._timeContainer);

        if (!this._settings.sideBySide && this._hasDate) {
            const table = this.constructor._createTable({
                body: tbody => {
                    const row = dom.create('tr');
                    dom.append(tbody, row);

                    const td = dom.create('td', {
                        html: `<span class="${this._settings.icons.date}"></span>`,
                        class: [
                            this.constructor.classes.action,
                            this.constructor.classes.spacingNav
                        ],
                        attributes: {
                            colspan: 4,
                            title: this._settings.lang.selectDate
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
            case 'hours':
                this._renderHours();
                break;
            case 'minutes':
                this._renderMinutes();
                break;
            case 'seconds':
                this._renderSeconds();
                break;
            default:
                this._renderTime();
                break;
        }

        if (!this._settings.inline && this._popper) {
            this._popper.update();
        }
    },

    /**
     * Render the DateTimePicker.
     */
    _render() {
        this._menuNode = dom.create('div', {
            class: this.constructor.classes.menu,
            dataset: {
                trigger: '#' + dom.getAttribute(this._node, 'id')
            }
        });

        this._container = dom.create('div', {
            class: this.constructor.classes.container
        });
        dom.append(this._menuNode, this._container);

        if (this._hasDate) {
            this._dateContainer = dom.create('div', {
                class: this.constructor.classes.column
            });
            dom.append(this._container, this._dateContainer);

            this._refreshDate();
        }

        if (this._hasTime) {
            this._timeContainer = dom.create('div', {
                class: this.constructor.classes.column
            });
            dom.append(this._container, this._timeContainer);

            this._refreshTime();
        }

        if (this._hasDate && this._hasTime) {
            if (this._settings.sideBySide) {
                dom.addClass(this._menuNode, this.constructor.classes.menuWide)
                dom.addClass(this._container, this.constructor.classes.containerColumns)
            } else {
                dom.setStyle(this._timeContainer, 'display', 'none', true);
            }
        }

        if (this._settings.inline) {
            dom.addClass(this._menuNode, this.constructor.classes.menuInline);

            dom.after(this._node, this._menuNode);
            dom.hide(this._node);
        } else {
            dom.addClass(this._menuNode, this.constructor.classes.menuShadow);

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

    /**
     * Render the days picker.
     */
    _renderDays() {
        const start = this._viewDate.clone().startOf('month');
        const end = this._viewDate.clone().endOf('month');

        const current = start.clone().startOf('week');
        const last = end.clone().endOf('week');

        start.sub(1, 'second');
        end.add(1, 'second');

        let prev, next;

        if (this._isAfterMin(start)) {
            prev = {
                data: {
                    action: 'prev',
                    unit: 'month'
                },
                attr: {
                    title: this._settings.lang.prevMonth
                }
            };
        }

        if (this._isBeforeMax(end)) {
            next = {
                data: {
                    action: 'next',
                    unit: 'month'
                },
                attr: {
                    title: this._settings.lang.nextMonth
                }
            };
        }

        const table = this.constructor._createTable({
            icons: this._settings.icons,
            header: {
                title: this._viewDate.format('MMMM yyyy'),
                data: {
                    action: 'changeView',
                    view: 'months'
                },
                attr: {
                    title: this._settings.lang.selectMonth
                },
                prev,
                next
            },
            head: thead => {
                const tr = dom.create('tr');
                dom.append(thead, tr);

                const currentDay = current.clone();
                for (let i = 1; i <= 7; i++) {
                    currentDay.setWeekDay(i);
                    const th = dom.create('th', {
                        class: this.constructor.classes.title,
                        text: currentDay.dayName('narrow')
                    });
                    dom.append(tr, th);
                }
            },
            body: tbody => {
                let tr;
                const now = this._now();
                while (current.isSameOrBefore(last, 'day')) {
                    if (current.getWeekDay() === 1) {
                        tr = dom.create('tr');
                        dom.append(tbody, tr);
                    }

                    const td = dom.create('td', {
                        text: current.format('dd')
                    });
                    dom.append(tr, td);

                    if (this._isCurrent(current, 'day')) {
                        dom.addClass(td, this.constructor.classes.active);
                    } else if (!this._viewDate.isSame(current, 'month')) {
                        dom.addClass(td, this.constructor.classes.secondary);
                    }

                    if (!this._isValid(current, 'day')) {
                        dom.addClass(td, this.constructor.classes.disabled);
                    } else {
                        dom.addClass(td, this.constructor.classes.action);
                        dom.setDataset(td, {
                            action: this._settings.multiDate ?
                                'setDateMulti' :
                                'setDate',
                            year: current.getYear(),
                            month: current.getMonth(),
                            date: current.getDate()
                        });
                    }

                    if (now.isSame(current, 'day')) {
                        dom.addClass(td, this.constructor.classes.today);
                    }

                    if (this._settings.renderDay) {
                        this._settings.renderDay(current.clone(), td);
                    }

                    current.add(1, 'day');
                }
            }
        });

        dom.append(this._dateContainer, table);
    },

    /**
     * Render the hours picker.
     */
    _renderHours() {
        const initialDate = this._date ?
            this._date :
            this._now();

        const current = initialDate.clone().startOf('day');
        const last = initialDate.clone().endOf('day');

        const table = this.constructor._createTable({
            borderless: true,
            body: tbody => {
                const tr = dom.create('tr');
                dom.append(tbody, tr);

                const td = dom.create('td', {
                    class: this.constructor.classes.rowContainer,
                    attributes: {
                        colspan: 7
                    }
                });
                dom.append(tr, td);

                const row = dom.create('div', {
                    class: this.constructor.classes.row
                });
                dom.append(td, row);

                while (current.isSameOrBefore(last, 'hour')) {
                    const col = dom.create('div', {
                        text: current.format('HH'),
                        class: this.constructor.classes.timeColumn
                    });
                    dom.append(row, col);

                    if (!this._isValid(current, 'hour')) {
                        dom.addClass(col, this.constructor.classes.disabled);
                    } else {
                        dom.addClass(col, this.constructor.classes.action);
                        dom.setDataset(col, {
                            action: 'setHours',
                            hour: current.getHours()
                        });
                    }

                    current.add(1, 'hour');
                }
            }
        });

        dom.append(this._timeContainer, table);
    },

    /**
     * Render the minutes picker.
     */
    _renderMinutes() {
        const initialDate = this._date ?
            this._date :
            this._now();

        const current = initialDate.clone().startOf('hour');
        const last = initialDate.clone().endOf('hour');

        const table = this.constructor._createTable({
            borderless: true,
            body: tbody => {
                const tr = dom.create('tr');
                dom.append(tbody, tr);

                const td = dom.create('td', {
                    class: this.constructor.classes.rowContainer,
                    attributes: {
                        colspan: 7
                    }
                });
                dom.append(tr, td);

                const row = dom.create('div', {
                    class: this.constructor.classes.row
                });
                dom.append(td, row);

                const stepping = this._settings.stepping == 1 ?
                    5 :
                    this._settings.stepping;

                while (current.isSameOrBefore(last, 'minute')) {
                    const col = dom.create('span', {
                        text: current.format('mm'),
                        class: this.constructor.classes.timeColumn
                    });
                    dom.append(row, col);

                    if (!this._isValid(current, 'minute')) {
                        dom.addClass(col, this.constructor.classes.disabled);
                    } else {
                        dom.addClass(col, this.constructor.classes.action);
                        dom.setDataset(col, {
                            action: 'setMinutes',
                            minute: current.getMinutes()
                        });
                    }

                    current.add(stepping, 'minutes');
                }
            }
        });

        dom.append(this._timeContainer, table);
    },

    /**
     * Render the months picker.
     */
    _renderMonths() {
        const start = this._viewDate.clone().startOf('year');
        const end = this._viewDate.clone().endOf('year');

        const current = start.clone();
        const last = end.clone();

        start.sub(1, 'second');
        end.add(1, 'second');

        let prev, next;

        if (this._isAfterMin(start)) {
            prev = {
                data: {
                    action: 'prev',
                    unit: 'year'
                },
                attr: {
                    title: this._settings.lang.prevYear
                }
            };
        }

        if (this._isBeforeMax(end)) {
            next = {
                data: {
                    action: 'next',
                    unit: 'year'
                },
                attr: {
                    title: this._settings.lang.nextYear
                }
            };
        }

        const table = this.constructor._createTable({
            icons: this._settings.icons,
            header: {
                title: this._viewDate.format('yyyy'),
                wide: true,
                data: {
                    action: 'changeView',
                    view: 'years'
                },
                attr: {
                    title: this._settings.lang.selectYear
                },
                prev,
                next
            },
            body: tbody => {
                const tr = dom.create('tr');
                dom.append(tbody, tr);

                const td = dom.create('td', {
                    class: this.constructor.classes.rowContainer,
                    attributes: {
                        colspan: 7
                    }
                });
                dom.append(tr, td);

                const row = dom.create('div', {
                    class: this.constructor.classes.row
                });
                dom.append(td, row);

                while (current.isSameOrBefore(last, 'month')) {
                    const col = dom.create('div', {
                        text: current.format('MMM'),
                        class: this.constructor.classes.dateColumn
                    });
                    dom.append(row, col);

                    if (this._isCurrent(current, 'month')) {
                        dom.addClass(col, this.constructor.classes.active);
                    }

                    if (!this._isValid(current, 'month')) {
                        dom.addClass(col, this.constructor.classes.disabled);
                    } else {
                        dom.addClass(col, this.constructor.classes.action);
                        if (this._settings.minView === 'months') {
                            dom.setDataset(col, {
                                action: this._settings.multiDate ?
                                    'setDateMulti' :
                                    'setDate',
                                year: current.getYear(),
                                month: current.getMonth()
                            });
                        } else {
                            dom.setDataset(col, {
                                action: 'changeView',
                                view: 'days',
                                year: current.getYear(),
                                month: current.getMonth()
                            });
                        }
                    }

                    if (this._settings.renderMonth) {
                        this._settings.renderMonth(current.clone(), col);
                    }

                    current.add(1, 'month');
                }
            }
        });

        dom.append(this._dateContainer, table);
    },

    /**
     * Render the seconds picker.
     */
    _renderSeconds() {
        const initialDate = this._date ?
            this._date :
            this._now();

        const current = initialDate.clone().startOf('minute');
        const last = initialDate.clone().endOf('minute');

        const table = this.constructor._createTable({
            borderless: true,
            body: tbody => {
                const tr = dom.create('tr');
                dom.append(tbody, tr);

                const td = dom.create('td', {
                    class: this.constructor.classes.rowContainer,
                    attributes: {
                        colspan: 7
                    }
                });
                dom.append(tr, td);

                const row = dom.create('div', {
                    class: this.constructor.classes.row
                });
                dom.append(td, row);

                while (current.isSameOrBefore(last, 'second')) {
                    const col = dom.create('span', {
                        text: current.format('ss'),
                        class: this.constructor.classes.timeColumn
                    });
                    dom.append(row, col);

                    if (!this._isValid(current, 'second')) {
                        dom.addClass(col, this.constructor.classes.disabled);
                    } else {
                        dom.addClass(col, this.constructor.classes.action);
                        dom.setDataset(col, {
                            action: 'setSeconds',
                            second: current.getSeconds()
                        });
                    }

                    current.add(5, 'seconds');
                }
            }
        });

        dom.append(this._timeContainer, table);
    },

    /**
     * Render the time picker.
     */
    _renderTime() {
        const initialDate = this._date ?
            this._date :
            this._now();

        const table = this.constructor._createTable({
            borderless: true,
            body: tbody => {
                const separators = this._hasHours + this._hasMinutes + this._hasSeconds - 1;
                const columns = this._hasHours + this._hasMinutes + this._hasSeconds + this._useDayPeriod;
                const separatorWidth = 3;
                const cellWidth = (100 - (separators * separatorWidth)) / columns;

                const upTr = dom.create('tr');
                dom.append(tbody, upTr);

                const timeTr = dom.create('tr');
                dom.append(tbody, timeTr);

                const downTr = dom.create('tr');
                dom.append(tbody, downTr);

                if (this._hasHours) {
                    let increment, decrement;

                    const nextHour = initialDate.clone().add(1, 'hour');
                    if (this._isValid(nextHour, 'hour')) {
                        increment = {
                            data: {
                                action: 'nextTime',
                                unit: 'hour'
                            },
                            attr: {
                                title: this._settings.lang.incrementHour
                            }
                        };
                    }

                    const prevHour = initialDate.clone().sub(1, 'hour');
                    if (this._isValid(prevHour, 'hour')) {
                        decrement = {
                            data: {
                                action: 'prevTime',
                                unit: 'hour'
                            },
                            attr: {
                                title: this._settings.lang.decrementHour
                            }
                        };
                    }

                    this.constructor._renderTimeColumn({
                        icons: this._settings.icons,
                        increment,
                        select: {
                            text: initialDate.format(this._useDayPeriod ? 'hh' : 'HH'),
                            data: {
                                action: 'changeTimeView',
                                timeView: 'hours'
                            },
                            attr: {
                                title: this._settings.lang.selectHour
                            }
                        },
                        decrement,
                        cellWidth,
                        upTr,
                        timeTr,
                        downTr
                    });
                }

                if (this._hasHours && this._hasMinutes) {
                    this.constructor._renderTimeSeparator({ separatorWidth, upTr, timeTr, downTr });
                }

                if (this._hasMinutes) {
                    let increment, decrement;

                    const initialMinutes = initialDate.getMinutes();
                    const nextMinutes = Math.min(initialMinutes + this._settings.stepping, 60);
                    const nextMinute = initialDate.clone().setMinutes(nextMinutes);
                    if (this._isValid(nextMinute, 'minute')) {
                        increment = {
                            data: {
                                action: 'nextTime',
                                unit: 'minute'
                            },
                            attr: {
                                title: this._settings.lang.incrementMinute
                            }
                        };
                    }

                    const prevMinute = initialDate.clone().sub(this._settings.stepping, 'minute');
                    if (this._isValid(prevMinute, 'minute')) {
                        decrement = {
                            data: {
                                action: 'prevTime',
                                unit: 'minute'
                            },
                            attr: {
                                title: this._settings.lang.decrementMinute
                            }
                        };
                    }

                    this.constructor._renderTimeColumn({
                        icons: this._settings.icons,
                        increment,
                        select: {
                            text: initialDate.format('mm'),
                            data: {
                                action: 'changeTimeView',
                                timeView: 'minutes'
                            },
                            attr: {
                                title: this._settings.lang.selectMinute
                            }
                        },
                        decrement,
                        cellWidth,
                        upTr,
                        timeTr,
                        downTr
                    });
                }

                if ((this._hasHours || this._hasMinutes) && this._hasSeconds) {
                    this.constructor._renderTimeSeparator({ separatorWidth, upTr, timeTr, downTr });
                }

                if (this._hasSeconds) {
                    let increment, decrement;

                    const nextSecond = initialDate.clone().add(1, 'second');
                    if (this._isValid(nextSecond, 'second')) {
                        increment = {
                            data: {
                                action: 'nextTime',
                                unit: 'second'
                            },
                            attr: {
                                title: this._settings.lang.incrementSecond
                            }
                        };
                    }

                    const prevSecond = initialDate.clone().sub(1, 'second');
                    if (this._isValid(prevSecond, 'second')) {
                        decrement = {
                            data: {
                                action: 'prevTime',
                                unit: 'second'
                            },
                            attr: {
                                title: this._settings.lang.decrementSecond
                            }
                        };
                    }

                    this.constructor._renderTimeColumn({
                        icons: this._settings.icons,
                        increment,
                        select: {
                            text: initialDate.format('ss'),
                            data: {
                                action: 'changeTimeView',
                                timeView: 'seconds'
                            },
                            attr: {
                                title: this._settings.lang.selectSecond
                            }
                        },
                        decrement,
                        cellWidth,
                        upTr,
                        timeTr,
                        downTr
                    });
                }

                if (this._useDayPeriod) {
                    const periodUpTd = dom.create('td', {
                        style: {
                            width: `${cellWidth}%`
                        }
                    });
                    dom.append(upTr, periodUpTd);

                    const periodTd = dom.create('td');
                    dom.append(timeTr, periodTd);

                    const periodButton = dom.create('span', {
                        text: initialDate.format('aa').toUpperCase(),
                        class: this.constructor.classes.periodButton
                    });

                    const currentHours = initialDate.getHours();
                    const otherPeriod = initialDate.clone().setHours(
                        currentHours + (currentHours < 12 ? 12 : -12)
                    );
                    if (!this._isValid(otherPeriod, 'second')) {
                        dom.addClass(periodButton, this.constructor.classes.disabled);
                    } else {
                        dom.setDataset(periodButton, {
                            action: 'togglePeriod'
                        });
                        dom.setAttribute(periodButton, 'title', this._settings.lang.togglePeriod);
                    }

                    dom.append(periodTd, periodButton);

                    const periodDownCell = dom.create('td');
                    dom.append(downTr, periodDownCell);
                }
            }
        });

        dom.append(this._timeContainer, table);
    },

    /**
     * Render the years picker.
     */
    _renderYears() {
        const start = this._viewDate.clone().startOf('year');
        const end = this._viewDate.clone().endOf('year');
        const currentYear = start.getYear();
        const startYear = currentYear - (currentYear % 10);
        const endYear = startYear + 9;
        start.setYear(startYear);
        end.setYear(endYear);

        const current = start.clone().sub(1, 'year');
        const last = end.clone().add(1, 'year');

        start.sub(1, 'second');
        end.add(1, 'second');

        let prev, next;

        if (this._isAfterMin(start)) {
            prev = {
                data: {
                    action: 'prev',
                    unit: 'years',
                    amount: 10
                },
                attr: {
                    title: this._settings.lang.prevDecade
                }
            };
        }

        if (this._isBeforeMax(end)) {
            next = {
                data: {
                    action: 'next',
                    unit: 'years',
                    amount: 10
                },
                attr: {
                    title: this._settings.lang.nextDecade
                }
            };
        }

        const table = this.constructor._createTable({
            icons: this._settings.icons,
            header: {
                title: `${start.format('yyyy')} - ${end.format('yyyy')}`,
                wide: true,
                prev,
                next
            },
            body: tbody => {
                const tr = dom.create('tr');
                dom.append(tbody, tr);

                const td = dom.create('td', {
                    class: this.constructor.classes.rowContainer,
                    attributes: {
                        colspan: 7
                    }
                });
                dom.append(tr, td);

                const row = dom.create('div', {
                    class: this.constructor.classes.row
                });
                dom.append(td, row);

                while (current.isSameOrBefore(last, 'month')) {
                    const thisYear = current.getYear();

                    const col = dom.create('div', {
                        text: current.format('yyyy'),
                        class: this.constructor.classes.dateColumn
                    });
                    dom.append(row, col);

                    if (this._isCurrent(current, 'year')) {
                        dom.addClass(col, this.constructor.classes.active);
                    } else if (thisYear < startYear || thisYear > endYear) {
                        dom.addClass(col, this.constructor.classes.secondary);
                    }

                    if (!this._isValid(current, 'year')) {
                        dom.addClass(col, this.constructor.classes.disabled);
                    } else {
                        dom.addClass(col, this.constructor.classes.action);
                        if (this._settings.minView === 'years') {
                            dom.setDataset(col, {
                                action: this._settings.multiDate ?
                                    'setDateMulti' :
                                    'setDate',
                                year: thisYear
                            });
                        } else {
                            dom.setDataset(col, {
                                action: 'changeView',
                                view: 'months',
                                year: thisYear
                            });
                        }
                    }

                    if (this._settings.renderYear) {
                        this._settings.renderYear(current.clone(), col);
                    }

                    current.add(1, 'year');
                }
            }
        });

        dom.append(this._dateContainer, table);
    }

});
