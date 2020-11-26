/**
 * FrostUI-DateTimePicker v1.0
 * https://github.com/elusivecodes/FrostUI-DateTimePicker
 */
(function(global, factory) {
    'use strict';

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory;
    } else {
        factory(global);
    }

})(window, function(window) {
    'use strict';

    if (!window) {
        throw new Error('FrostUI-DateTimePicker requires a Window.');
    }

    if (!('UI' in window)) {
        throw new Error('FrostUI-DateTimePicker requires FrostUI.');
    }

    if (!('DateTime' in window)) {
        throw new Error('FrostUI-DateTimePicker requires FrostDateTime.');
    }

    const Core = window.Core;
    const dom = window.dom;
    const QuerySet = window.QuerySet;
    const UI = window.UI;
    const DateTime = window.DateTime;
    const document = window.document;

    class DateTimePicker {

        constructor(node, settings) {
            this._node = node;

            this._settings = Core.extend(
                {},
                this.constructor.defaults,
                dom.getDataset(this._node),
                settings
            );

            this._hasDayPeriod = this.constructor.checkDayPeriod(this._settings.locale);

            if (!this._settings.format) {
                this._settings.format = this.constructor.getDefaultFormat(this._settings.locale, this._hasDayPeriod);
            }

            this._dateOptions = {
                locale: this._settings.locale,
                timeZone: this._settings.timeZone
            };

            if (this._settings.date) {
                this._currentDate = this._parseDate(this._settings.date);
            } else {
                const value = dom.getValue(this._node);
                this._currentDate = this._parseDate(value);
            }

            if (!this._currentDate) {
                this._currentDate = DateTime.now(this._dateOptions);
            }

            if (this._settings.viewDate) {
                this._viewDate = this._parseDate(this._settings.viewDate);
            } else if (this._currentDate) {
                this._viewDate = this._currentDate.clone();
            }

            if (this._settings.minDate) {
                this._minDate = this._parseDate(this._settings.minDate);
            }

            if (this._settings.maxDate) {
                this._maxDate = this._parseDate(this._settings.maxDate);
            }

            if (this._settings.enabledDates) {
                this._enabledDates = this._parseDates(this._settings.enabledDates);
            } else if (this._settings.disabledDates) {
                this._disabledDates = this._parseDates(this._settings.disabledDates);
            }

            if (this._settings.enabledDays) {
                this._enabledDays = this._settings.enabledDays;
            } else if (this._settings.disabledDays) {
                this._disabledDays = this._settings.disabledDays;
            }

            if (this._settings.enabledHours) {
                this._enabledHours = this._settings.enabledHours;
            } else if (this._settings.disabledHours) {
                this._disabledHours = this._settings.disabledHours;
            }

            this._today = DateTime.now(this._dateOptions);

            this._viewMode = 'month';

            this.update();
            this._render();
            this._events();

            dom.setData(this._node, 'DateTimePicker', this);
        }

        destroy() {

        }

        hide() {

        }

        show() {

        }

        toggle() {

        }

    }


    Object.assign(DateTimePicker.prototype, {

        _events() {
            dom.addEventDelegate([this._dateContainer, this._timeContainer], 'click', '[data-action]', e => {
                const element = e.currentTarget;
                const action = dom.getDataset(element, 'action');

                switch (action) {
                    case 'nextTime':
                        this._currentDate.add(
                            1,
                            dom.getDataset(element, 'unit')
                        );

                        this.update();
                        this._renderView();

                        break;
                    case 'prevTime':
                        this._currentDate.sub(
                            1,
                            dom.getDataset(element, 'unit')
                        );

                        this.update();
                        this._renderView();

                        break;
                    case 'dayPeriod':
                        const currentHours = this._currentDate.getHours();
                        this._currentDate.setHours(
                            currentHours + (currentHours < 12 ? 12 : -12)
                        );

                        this.update();
                        this._renderView();

                        break;
                    case 'next':
                        this._viewDate.add(
                            dom.getDataset(element, 'amount') || 1,
                            dom.getDataset(element, 'unit')
                        );

                        this._renderView();

                        break;

                    case 'prev':
                        this._viewDate.sub(
                            dom.getDataset(element, 'amount') || 1,
                            dom.getDataset(element, 'unit')
                        );

                        this._renderView();

                        break;

                    case 'changeView':
                        this._viewMode = dom.getDataset(element, 'view');

                        if (dom.hasAttribute(element, 'data-year')) {
                            this._viewDate.setYear(
                                dom.getDataset(element, 'year'),
                                dom.getDataset(element, 'month') || 1,
                                dom.getDataset(element, 'date') || 1
                            );
                        }

                        this._renderView();

                        break;

                    case 'setDate':
                        this._currentDate.setYear(
                            dom.getDataset(element, 'year'),
                            dom.getDataset(element, 'month'),
                            dom.getDataset(element, 'date')
                        );

                        this._viewDate = this._currentDate.clone();

                        this.update();
                        this._renderView();

                        break;
                }
            });
        },

        _isDateValid(date) {
            if (this._minDate && date.isBefore(this._minDate)) {
                return false;
            }

            if (this._maxDate && date.isAfter(this._maxDate)) {
                return false;
            }

            if (this._disabledDates && this._disabledDates.find(disabledDate => disabledDate.isSame(date, 'day'))) {
                return false;
            }

            if (this._enabledDates && !this._enabledDates.find(enabledDate => enabledDate.isSame(date, 'day'))) {
                return false;
            }

            if (this._disabledDays && this._disabledDays.includes(date.getDay())) {
                return false;
            }

            if (this._enabledDays && !this._enabledDays.includes(date.getDay())) {
                return false;
            }

            return true;
        },

        _isMonthValid(date) {
            if (this._minDate && date.isBefore(this._minDate, 'month')) {
                return false;
            }

            if (this._maxDate && date.isAfter(this._maxDate, 'month')) {
                return false;
            }

            return true;
        },

        _isYearValid(date) {
            if (this._minDate && date.isBefore(this._minDate, 'year')) {
                return false;
            }

            if (this._maxDate && date.isAfter(this._maxDate, 'year')) {
                return false;
            }

            return true;
        },

        _isTimeValid(date) {
            if (!this._isDateValid(date)) {
                return false;
            }

            if (this._disabledHours && this._disabledHours.includes(date.getHour())) {
                return false;
            }

            if (this._enabledHours && !this._enabledHours.includes(date.getHour())) {
                return false;
            }

            return true;
        },

        _parseDate(date) {
            if (!date) {
                return date;
            }

            if (date instanceof DateTime) {
                return DateTime.fromTimestamp(
                    date.getTimestamp(),
                    this._dateOptions
                );
            }

            if (Core.isString(date)) {
                try {
                    return DateTime.fromFormat(
                        this._settings.format,
                        date,
                        this._dateOptions
                    );
                } catch (e) {
                    return new DateTime(date, this._dateOptions);
                }
            }

            if (date instanceof Date) {
                return DateTime.fromDate(date, this._dateOptions);
            }

            if (Core.isNumber(date)) {
                return DateTime.fromTimestamp(date, this._dateOptions);
            }

            if (Core.isArray(date)) {
                return DateTime.fromArray(date, this._dateOptions);
            }

            return null;
        },

        _parseDates(dates) {
            return dates
                .map(date => this._parseDate(date))
                .filter(date => !!date);
        }

    });


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


    Object.assign(DateTimePicker, {

        _dayPeriods: {},
        _defaultFormats: {},

        checkDayPeriod(locale) {
            if (!(locale in this._dayPeriods)) {
                const formatter = new Intl.DateTimeFormat(locale, {
                    hour: '2-digit'
                });

                this._dayPeriods[locale] = formatter.formatToParts(new Date)
                    .find(part => part.type === 'dayPeriod');
            }

            return this._dayPeriods[locale];
        },

        getDefaultFormat(locale, hasDayPeriod) {
            if (!(locale in this._defaultFormats)) {
                const formatter = new Intl.DateTimeFormat(locale, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                this._defaultFormats[locale] = formatter.formatToParts(new Date).map(
                    part => {
                        switch (part.type) {
                            case 'year':
                                return 'yyyy';
                            case 'month':
                                return 'MM';
                            case 'day':
                                return 'dd';
                            case 'hour':
                                return hasDayPeriod ? 'hh' : 'HH';
                            case 'minute':
                                return 'mm';
                            case 'second':
                                return 'ss';
                            default:
                                return part.value === ', ' ?
                                    ' ' :
                                    `'${part.value}'`;
                        }
                    }
                ).join('');
            }

            return this._defaultFormats[locale];
        }

    });


    Object.assign(DateTimePicker.prototype, {

        disableDates(disabledDates) {
            this._disabledDates = this._parseDates(disabledDates);
            this._enabledDates = null;

            this.update();
            this.refresh();

            return this;
        },

        disableDays(disabledDays) {
            this._disabledDays = disabledDays;
            this._enabledDays = null;

            this.update();
            this.refresh();

            return this;
        },

        disableHours(disabledHours) {
            this._disabledHours = disabledHours;
            this._enabledHours = null;

            this.update();
            this.refresh();

            return this;
        },

        // disableTimeIntervals() {
        //     this._disabledTimeIntervals = disabledTimeIntervals;

        //     this.update();
        //     this.refresh();

        //     return this;
        // },

        enableDates(enabledDates) {
            this._enabledDates = this._parseDates(enabledDates);
            this._disabledDates = null;

            this.update();
            this.refresh();

            return this;
        },

        enableDays(enabledDays) {
            this._enabledDays = enabledDays;
            this._disabledDays = null;

            this.update();
            this.refresh();

            return this;
        },

        enableHours(enabledHours) {
            this._enabledHours = enabledHours;
            this._disabledDays = null;

            this.update();
            this.refresh();

            return this;
        },

        maxDate(maxDate) {
            this._maxDate = this._parseDate(maxDate);

            this.update();
            this.refresh();

            return this;
        },

        minDate(minDate) {
            this._minDate = this._parseDate(minDate);

            this.update();
            this.refresh();

            return this;
        },

        getDate() {
            return this._currentDate.clone();
        },

        setDate(date) {
            this._currentDate = this._parseDate(date);

            this.update();
            this.refresh();

            return this;
        },

        update() {
            if (!this._currentDate) {
                return this;
            }

            if (this._minDate && this._currentDate.isBefore(this._minDate)) {
                this._currentDate = this._minDate.clone();
            }

            if (this._maxDate && this._currentDate.isAfter(this._maxDate)) {
                this._currentDate = this._maxDate.clone();
            }

            const dateString = this._currentDate.format(this._settings.format);
            dom.setValue(
                this._node,
                dateString
            );

            return this;
        },

        viewDate(viewDate) {
            this._viewDate = this._parseDate(viewDate);

            this.refresh();

            return this;
        }

    });


    // DateTimePicker default options
    DateTimePicker.defaults = {
        date: null,
        format: null,
        locale: DateFormatter.defaultLocale,
        timeZone: DateTime.defaultTimeZone,
        minDate: null,
        maxDate: null,
        enabledDates: null,
        disabledDates: null,
        enabledDays: null,
        disabledDays: null,
        enabledHours: null,
        disabledHours: null,
        // disabledTimeIntervals: null,
        // multiDate: false,
        // multiDateSeparator: ',',
        icons: {},
        buttons: {},
        keepOpen: false,
        focusOnShow: false,

        inline: false,
        display: 'dynamic',
        duration: 100,
        placement: 'bottom',
        position: 'start',
        fixed: false,
        spacing: 3,
        minContact: false
    };

    // DateTimePicker QuerySet method
    if (QuerySet) {
        QuerySet.prototype.dateTimePicker = function(a, ...args) {
            let settings, method;

            if (Core.isObject(a)) {
                settings = a;
            } else if (Core.isString(a)) {
                method = a;
            }

            for (const node of this) {
                if (!Core.isElement(node)) {
                    continue;
                }

                const dateTimePicker = DateTimePicker.init(node, settings);

                if (method) {
                    dateTimePicker[method](...args);
                }
            }

            return this;
        };
    }

    UI.DateTimePicker = DateTimePicker;

});