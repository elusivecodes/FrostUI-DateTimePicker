Object.assign(DateTimePicker.prototype, {

    refresh() {

    },

    _render() {
        this._dateContainer = dom.create('div', {
            class: 'datepicker'
        });
        dom.append(document.body, this._dateContainer);

        this._timeContainer = dom.create('div', {
            class: 'timepicker'
        });
        dom.append(document.body, this._timeContainer);

        this._renderView();
    },

    _renderView() {
        dom.empty(this._dateContainer);
        dom.empty(this._timeContainer);

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

        this._renderTime();
    },

    _renderDecade() {
        const table = dom.create('table', {
            class: 'table table-sm text-center'
        });

        const currentDate = this._viewDate.clone().startOf('year');
        const currentYear = currentDate.getYear();
        const startOfDecade = currentYear - (currentYear % 10);
        const endOfDecade = startOfDecade + 9;
        currentDate.setYear(startOfDecade);
        const lastDate = this._viewDate.clone().endOf('year').setYear(endOfDecade);

        const thead = dom.create('thead');
        dom.append(table, thead);

        const navRow = dom.create('tr');
        dom.append(thead, navRow);

        const prevCell = dom.create('td', {
            html: '<span class="icon-arrow-left"></span>',
            class: 'action text-primary fw-bold',
            dataset: {
                action: 'prev',
                unit: 'years',
                amount: 10
            }
        });
        dom.append(navRow, prevCell);

        const yearCell = dom.create('td', {
            class: 'change-view fw-bold',
            text: `${currentDate.format('yyyy')} - ${lastDate.format('yyyy')}`,
            attributes: {
                colspan: 5
            }
        });
        dom.append(navRow, yearCell);

        const nextCell = dom.create('td', {
            html: '<span class="icon-arrow-right"></span>',
            class: 'action text-primary fw-bold',
            dataset: {
                action: 'next',
                unit: 'years',
                amount: 10
            }
        });
        dom.append(navRow, nextCell);

        const tbody = dom.create('tbody');
        dom.append(table, tbody);

        const yearsTr = dom.create('tr');
        dom.append(tbody, yearsTr);

        const yearsTd = dom.create('td', {
            class: 'p-0',
            attributes: {
                colspan: 7
            }
        });
        dom.append(yearsTr, yearsTd);

        const yearsRow = dom.create('div', {
            class: 'row'
        });
        dom.append(yearsTd, yearsRow);

        currentDate.sub(1, 'year');
        lastDate.add(1, 'year');

        while (currentDate.isSameOrBefore(lastDate, 'month')) {
            const thisYear = currentDate.getYear();

            const yearCol = dom.create('div', {
                text: currentDate.format('yyyy'),
                class: 'action col-4 p-1',
                dataset: {
                    action: 'changeView',
                    view: 'year',
                    year: thisYear
                }
            });
            dom.append(yearsRow, yearCol);

            if (this._currentDate.isSame(currentDate, 'year')) {
                dom.addClass(yearCol, 'active');
            }

            if (!this._isYearValid(currentDate)) {
                dom.addClass(yearCol, 'disabled');
            }

            if (thisYear < startOfDecade || thisYear > endOfDecade) {
                dom.addClass(yearCol, 'text-secondary');
            }

            currentDate.add(1, 'year');
        }

        dom.append(this._dateContainer, table);
    },

    _renderMonth() {
        const table = dom.create('table', {
            class: 'table table-sm text-center'
        });

        const currentDate = this._viewDate.clone().startOf('month').startOf('week');
        const lastDate = this._viewDate.clone().endOf('month').endOf('week');

        const thead = dom.create('thead');
        dom.append(table, thead);

        const navRow = dom.create('tr');
        dom.append(thead, navRow);

        const prevCell = dom.create('td', {
            html: '<span class="icon-arrow-left"></span>',
            class: 'action text-primary fw-bold',
            dataset: {
                action: 'prev',
                unit: 'month'
            }
        });
        dom.append(navRow, prevCell);

        const monthCell = dom.create('td', {
            text: this._viewDate.format('MMMM yyyy'),
            class: 'action fw-bold',
            attributes: {
                colspan: 5
            },
            dataset: {
                action: 'changeView',
                view: 'year',
                year: currentDate.getYear()
            }
        });
        dom.append(navRow, monthCell);

        const nextCell = dom.create('td', {
            html: '<span class="icon-arrow-right"></span>',
            class: 'action text-primary fw-bold',
            dataset: {
                action: 'next',
                unit: 'month'
            }
        });
        dom.append(navRow, nextCell);

        const dayRow = dom.create('tr');
        dom.append(thead, dayRow);

        const currentDay = currentDate.clone();
        for (let i = 1; i <= 7; i++) {
            currentDay.setWeekDay(i);
            const dayCell = dom.create('th', {
                class: 'fw-bold',
                text: currentDay.dayName('narrow')
            });
            dom.append(dayRow, dayCell);
        }

        const tbody = dom.create('tbody');
        dom.append(table, tbody);

        let weekRow;

        while (currentDate.isSameOrBefore(lastDate, 'day')) {
            if (currentDate.getWeekDay() === 1) {
                weekRow = dom.create('tr');
                dom.append(tbody, weekRow);
            }

            const dateCell = dom.create('td', {
                text: currentDate.format('dd'),
                class: 'action',
                dataset: {
                    action: 'setDate',
                    year: currentDate.getYear(),
                    month: currentDate.getMonth(),
                    date: currentDate.getDate()
                }
            });
            dom.append(weekRow, dateCell);

            if (this._currentDate.isSame(currentDate, 'day')) {
                dom.addClass(dateCell, 'active');
            }

            if (this._today.isSame(currentDate, 'day')) {
                dom.addClass(dateCell, 'today');
            }

            if (!this._isDateValid(currentDate)) {
                dom.addClass(dateCell, 'disabled');
            }

            if (!this._viewDate.isSame(currentDate, 'month')) {
                dom.addClass(dateCell, 'text-secondary');
            }

            currentDate.add(1, 'day');
        }

        dom.append(this._dateContainer, table);
    },

    _renderDay() {
        const table = dom.create('table', {
            class: 'table table-sm text-center'
        });

        const currentDate = this._currentDate.clone().startOf('day');
        const lastDate = this._currentDate.clone().endOf('day');

        const tbody = dom.create('tbody');
        dom.append(table, tbody);

        const hoursRow = dom.create('tr');
        dom.append(tbody, hoursRow);

        const hoursCell = dom.create('td', {
            class: 'p-0',
            attributes: {
                colspan: 7
            }
        });
        dom.append(hoursRow, hoursCell);

        while (currentDate.isSameOrBefore(lastDate, 'hour')) {
            const hourCell = dom.create('span', {
                text: currentDate.format('HH'),
                class: 'action',
                dataset: {
                    action: 'setHours',
                    hour: currentDate.getHours()
                }
            });
            dom.append(hoursCell, hourCell);

            if (!this._isTimeValid(currentDate)) {
                dom.addClass(hourCell, 'disabled');
            }

            currentDate.add(1, 'hour');
        }

        dom.append(this._dateContainer, table);
    },

    _renderHour() {
        const table = dom.create('table', {
            class: 'table table-sm text-center'
        });

        const currentDate = this._currentDate.clone().startOf('hour');
        const lastDate = this._currentDate.clone().endOf('hour');

        const tbody = dom.create('tbody');
        dom.append(table, tbody);

        const minutesRow = dom.create('tr');
        dom.append(tbody, minutesRow);

        const minutesCell = dom.create('td', {
            class: 'p-0',
            attributes: {
                colspan: 7
            }
        });
        dom.append(minutesRow, minutesCell);

        while (currentDate.isSameOrBefore(lastDate, 'minute')) {
            const minuteCell = dom.create('span', {
                text: currentDate.format('HH'),
                class: 'action',
                dataset: {
                    action: 'setMinutes',
                    hour: currentDate.getMinutes()
                }
            });
            dom.append(minutesCell, minuteCell);

            if (!this._isTimeValid(currentDate)) {
                dom.addClass(minuteCell, 'disabled');
            }

            currentDate.add(1, 'minute');
        }

        dom.append(this._dateContainer, table);
    },

    _renderTime() {
        const table = dom.create('table', {
            class: 'table table-sm table-borderless text-center'
        });

        const tbody = dom.create('tbody');
        dom.append(table, tbody);

        const upRow = dom.create('tr');
        dom.append(tbody, upRow);

        const timeRow = dom.create('tr');
        dom.append(tbody, timeRow);

        const downRow = dom.create('tr');
        dom.append(tbody, downRow);

        const hourUpCell = dom.create('td', {
            html: '<span class="icon-arrow-up text-primary bw-bold"></span>',
            class: 'action py-4 px-0',
            dataset: {
                action: 'nextTime',
                unit: 'hour'
            }
        });
        dom.append(upRow, hourUpCell);

        const spacerUpCell = dom.create('td');
        dom.append(upRow, spacerUpCell);

        const minuteUpCell = dom.create('td', {
            html: '<span class="icon-arrow-up text-primary bw-bold"></span>',
            class: 'action py-4 px-0',
            dataset: {
                action: 'nextTime',
                unit: 'minute'
            }
        });
        dom.append(upRow, minuteUpCell);

        const hourCell = dom.create('td', {
            text: this._currentDate.format('hh'),
            class: 'action time py-2 px-0',
            dataset: {
                action: 'changeTimeView',
                timeView: 'hours'
            }
        });
        dom.append(timeRow, hourCell);

        const separatorCell = dom.create('td', {
            text: ':',
            class: 'time py-2'
        });
        dom.append(timeRow, separatorCell);

        const minuteCell = dom.create('td', {
            text: this._currentDate.format('mm'),
            class: 'action time py-2 px-0',
            dataset: {
                action: 'changeTimeView',
                timeView: 'minutes'
            }
        });
        dom.append(timeRow, minuteCell);

        const periodCell = dom.create('td');
        dom.append(timeRow, periodCell);

        const periodButton = dom.create('span', {
            text: this._currentDate.format('aa').toUpperCase(),
            class: 'btn btn-primary d-block',
            dataset: {
                action: 'dayPeriod'
            }
        });
        dom.append(periodCell, periodButton);

        const hourDownCell = dom.create('td', {
            html: '<span class="icon-arrow-down text-primary bw-bold"></span>',
            class: 'action py-4 px-0',
            dataset: {
                action: 'prevTime',
                unit: 'hour'
            }
        });
        dom.append(downRow, hourDownCell);

        const spacerDownCell = dom.create('td');
        dom.append(downRow, spacerDownCell);

        const minuteDownCell = dom.create('td', {
            html: '<span class="icon-arrow-down text-primary bw-bold"></span>',
            class: 'action py-4 px-0',
            dataset: {
                action: 'prevTime',
                unit: 'minute'
            }
        });
        dom.append(downRow, minuteDownCell);

        dom.append(this._timeContainer, table);
    },

    _renderYear() {
        const table = dom.create('table', {
            class: 'table table-sm text-center'
        });

        const currentDate = this._viewDate.clone().startOf('year');
        const lastDate = this._viewDate.clone().endOf('year');

        const thead = dom.create('thead');
        dom.append(table, thead);

        const navRow = dom.create('tr');
        dom.append(thead, navRow);

        const prevCell = dom.create('td', {
            html: '<span class="icon-arrow-left"></span>',
            class: 'action text-primary fw-bold',
            dataset: {
                action: 'prev',
                unit: 'year'
            }
        });
        dom.append(navRow, prevCell);

        const yearCell = dom.create('td', {
            text: this._viewDate.format('yyyy'),
            class: 'action fw-bold',
            attributes: {
                colspan: 5
            },
            dataset: {
                action: 'changeView',
                view: 'decade'
            }
        });
        dom.append(navRow, yearCell);

        const nextCell = dom.create('td', {
            html: '<span class="icon-arrow-right"></span>',
            class: 'action text-primary fw-bold',
            dataset: {
                action: 'next',
                unit: 'year'
            }
        });
        dom.append(navRow, nextCell);

        const tbody = dom.create('tbody');
        dom.append(table, tbody);

        const monthsTr = dom.create('tr');
        dom.append(tbody, monthsTr);

        const monthsTd = dom.create('td', {
            class: 'p-0',
            attributes: {
                colspan: 7
            }
        });
        dom.append(monthsTr, monthsTd);

        const monthsRow = dom.create('div', {
            class: 'row'
        });
        dom.append(monthsTd, monthsRow);

        while (currentDate.isSameOrBefore(lastDate, 'month')) {
            const monthCol = dom.create('div', {
                text: currentDate.format('MMM'),
                class: 'action col-4 p-1',
                dataset: {
                    action: 'changeView',
                    view: 'month',
                    year: currentDate.getYear(),
                    month: currentDate.getMonth()
                }
            });
            dom.append(monthsRow, monthCol);

            if (this._currentDate.isSame(currentDate, 'month')) {
                dom.addClass(monthCol, 'active');
            }

            if (!this._isMonthValid(currentDate)) {
                dom.addClass(monthCol, 'disabled');
            }

            currentDate.add(1, 'month');
        }

        dom.append(this._dateContainer, table);
    }

});
