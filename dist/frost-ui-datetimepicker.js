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

            this._useDayPeriod = this.constructor.checkDayPeriod(this._settings.locale);

            if (!this._settings.format) {
                this._settings.format = this.constructor.getDefaultFormat(this._settings.locale, this._useDayPeriod);
            }

            this._checkFormat();

            this._dateOptions = {
                locale: this._settings.locale,
                timeZone: this._settings.timeZone
            };

            this._today = DateTime.now(this._dateOptions);

            const value = dom.getValue(this._node);
            if (value) {
                this._currentDate = DateTime.fromFormat(this._settings.format, value, this._dateOptions);
            } else if (this._settings.defaultDate) {
                this._currentDate = this._parseDate(this._settings.defaultDate);
            } else if (this._settings.useCurrent) {
                this._currentDate = this._today.clone();
            }

            if (this._settings.viewDate) {
                this._viewDate = this._parseDate(this._settings.viewDate);
            } else {
                this._viewDate = this._today.clone();
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

            if (this._settings.disabledDays) {
                this._disabledDays = this._settings.disabledDays;
            }

            if (this._settings.disabledHours) {
                this._disabledHours = this._settings.disabledHours;
            }

            if (this._settings.disabledTimeIntervals) {
                this._disabledTimeIntervals = this._settings.disabledTimeIntervals.map(
                    intervals => this._parseDates(intervals)
                ).filter(intervals => intervals.length === 2);
            }

            switch (this._settings.minView) {
                case 'decade':
                    this._viewMode = 'decade';
                    break;
                case 'year':
                    this._viewMode = 'year';
                    break;
                default:
                    this._viewMode = 'month';
                    break;
            }

            this._timeViewMode = null;

            this.update();
            this._render();
            this._events();

            dom.setData(this._node, 'datetimepicker', this);
        }

        destroy() {

            dom.removeData(this._node, 'dropdown');
        }

        hide() {
            if (
                this._animating ||
                !dom.hasClass(this._menuNode, 'show') ||
                !dom.triggerOne(this._node, 'hide.frost.datetimepicker')
            ) {
                return;
            }

            this._animating = true;

            dom.fadeOut(this._menuNode, {
                duration: this._settings.duration
            }).then(_ => {
                dom.removeClass(this._menuNode, 'show');
                dom.setAttribute(this._node, 'aria-expanded', false);
                dom.triggerEvent(this._node, 'hidden.frost.datetimepicker');
            }).catch(_ => { }).finally(_ => {
                this._animating = false;
            });
        }

        show() {
            if (
                this._animating ||
                dom.hasClass(this._menuNode, 'show') ||
                !dom.triggerOne(this._node, 'show.frost.datetimepicker')
            ) {
                return;
            }

            this._animating = true;
            dom.addClass(this._menuNode, 'show');

            dom.fadeIn(this._menuNode, {
                duration: this._settings.duration
            }).then(_ => {
                dom.setAttribute(this._node, 'aria-expanded', true);
                dom.triggerEvent(this._node, 'shown.frost.datetimepicker');

                if (this._settings.focusOnShow) {
                    dom.focus(this._node);
                }
            }).catch(_ => { }).finally(_ => {
                this._animating = false;
            });
        }

        toggle() {
            dom.hasClass(this._menuNode, 'show') ?
                this.hide() :
                this.show();
        }

        static autoHide(target) {
            const menus = dom.find('.datetimepicker.show');

            for (const menu of menus) {
                const selector = dom.getDataset(menu, 'trigger');
                const trigger = dom.findOne(selector);

                if (trigger === target) {
                    continue;
                }

                const datetimepicker = this.init(trigger);
                datetimepicker.hide();
            }
        }

        static init(node, settings) {
            return dom.hasData(node, 'datetimepicker') ?
                dom.getData(node, 'datetimepicker') :
                new this(node, settings);
        }

    }


    Object.assign(DateTimePicker.prototype, {

        _events() {
            dom.addEvent(this._node, 'focus', _ => {
                this.show();
            });

            dom.addEvent(this._container, 'click', e => {
                e.stopPropagation();
            });

            dom.addEventDelegate(this._container, 'click', '[data-action]', e => {
                const element = e.currentTarget;
                const action = dom.getDataset(element, 'action');
                const hasCurrent = !!this._currentDate;

                switch (action) {
                    case 'setDate':
                        if (!hasCurrent) {
                            this._currentDate = this._today.clone();
                        }

                        this._currentDate.setYear(
                            dom.getDataset(element, 'year'),
                            dom.getDataset(element, 'month'),
                            dom.getDataset(element, 'date')
                        );

                        this._viewDate = this._currentDate.clone();

                        this._refreshDate();
                        if (!hasCurrent) {
                            this._refreshTime();
                        }

                        this.update();

                        if (!this._hasTime && !this._settings.keepOpen) {
                            this.hide();
                        }

                        break;
                    case 'nextTime':
                    case 'prevTime':
                        if (!this._currentDate) {
                            this._currentDate = this._today.clone();
                        }

                        const timeMethod = action === 'prevTime' ?
                            'sub' :
                            'add';
                        const oldDay = this._currentDate.getDay();
                        this._currentDate[timeMethod](
                            1,
                            dom.getDataset(element, 'unit')
                        );

                        if (!hasCurrent || oldDay !== this._currentDate.getDay()) {
                            this._refreshDate();
                        }
                        this._refreshTime();

                        this.update();

                        break;
                    case 'dayPeriod':
                        if (!this._currentDate) {
                            this._currentDate = this._today.clone();
                        }

                        const currentHours = this._currentDate.getHours();
                        this._currentDate.setHours(
                            currentHours + (currentHours < 12 ? 12 : -12)
                        );

                        if (!hasCurrent) {
                            this._refreshDate();
                        }
                        this._refreshTime();

                        this.update();

                        break;
                    case 'setHours':
                        if (!this._currentDate) {
                            this._currentDate = this._today.clone();
                        }

                        this._currentDate.setHours(
                            dom.getDataset(element, 'hour')
                        );

                        this._timeViewMode = null;

                        if (!hasCurrent) {
                            this._refreshDate();
                        }
                        this._refreshTime();

                        this.update();

                        break;
                    case 'setMinutes':
                        if (!this._currentDate) {
                            this._currentDate = this._today.clone();
                        }

                        this._currentDate.setMinutes(
                            dom.getDataset(element, 'minute')
                        );

                        this._timeViewMode = null;

                        if (!hasCurrent) {
                            this._refreshDate();
                        }
                        this._refreshTime();

                        this.update();

                        break;
                    case 'changeView':
                        this._viewMode = dom.getDataset(element, 'view');

                        if (dom.hasDataset(element, 'year')) {
                            this._viewDate.setYear(
                                dom.getDataset(element, 'year'),
                                dom.getDataset(element, 'month') || 1,
                                dom.getDataset(element, 'date') || 1
                            );
                        }

                        this._refreshDate();

                        break;
                    case 'changeTimeView':
                        this._timeViewMode = dom.getDataset(element, 'timeView');

                        this._refreshTime();

                        break;
                    case 'showTime':
                        dom.setStyle(this._timeContainer, 'display', '');
                        dom.squeezeIn(this._timeContainer, {
                            duration: 100
                        });
                        dom.squeezeOut(this._dateContainer, {
                            duration: 100
                        }).then(_ => {
                            dom.setStyle(this._dateContainer, 'display', 'none', true);
                        });
                        break;
                    case 'showDate':
                        dom.setStyle(this._dateContainer, 'display', '');
                        dom.squeezeIn(this._dateContainer, {
                            duration: 100
                        });
                        dom.squeezeOut(this._timeContainer, {
                            duration: 100
                        }).then(_ => {
                            dom.setStyle(this._timeContainer, 'display', 'none', true);
                        });
                        break;
                    case 'next':
                    case 'prev':
                        const dateMethod = action === 'prev' ?
                            'sub' :
                            'add';
                        this._viewDate[dateMethod](
                            dom.getDataset(element, 'amount') || 1,
                            dom.getDataset(element, 'unit')
                        );

                        this._refreshDate();

                        break;
                }
            });
        }

    });

    dom.addEvent(document, 'click.frost.datetimepicker', e => {
        DateTimePicker.autoHide(e.target);
    });

    dom.addEvent(document, 'keyup.frost.datetimepicker', e => {
        switch (e.key) {
            case 'Tab':
                DateTimePicker.autoHide(e.target, true);
            case 'Escape':
                DateTimePicker.autoHide();
        }
    });


    Object.assign(DateTimePicker.prototype, {

        _checkFormat() {
            this._hasDate = false;
            this._hasTime = false;

            const tokens = this._settings.format.matchAll(this.constructor._formatTokenRegExp);
            for (const token of tokens) {
                if (!token[1]) {
                    continue;
                }

                if (!this._hasDate && this.constructor._dateTokenRegExp.test(token[1])) {
                    this._hasDate = true;
                }

                if (!this._hasTime && this.constructor._timeTokenRegExp.test(token[1])) {
                    this._hasTime = true;
                }

                if (this._hasDate && this._hasTime) {
                    break;
                }
            }
        },

        _isDateBetween(date, scope = 'second') {
            if (this._minDate && date.isBefore(this._minDate, scope)) {
                return false;
            }

            if (this._maxDate && date.isAfter(this._maxDate, scope)) {
                return false;
            }

            return true;
        },

        _isDateValid(date) {
            if (!this._isDateBetween(date, 'day')) {
                return false;
            }

            if (this._disabledDays && this._disabledDays.includes(date.getDay())) {
                return false;
            }

            if (this._disabledDates && this._disabledDates.find(disabledDate => disabledDate.isSame(date, 'day'))) {
                return false;
            }

            if (this._enabledDates && !this._enabledDates.find(enabledDate => enabledDate.isSame(date, 'day'))) {
                return false;
            }

            if (this._disabledTimeIntervals) {
                const startOfDay = date.clone().startOf('day');
                const endOfDay = date.clone().endOf('day');

                if (this._disabledTimeIntervals.find(([start, end]) => endOfDay.isSameOrAfter(start) && startOfDay.isSameOrBefore(end))) {
                    return false;
                }
            }

            return true;
        },

        _isTimeValid(date) {
            if (!this._isDateBetween(date, 'second')) {
                return false;
            }

            if (this._disabledHours && this._disabledHours.includes(date.getHour())) {
                return false;
            }

            if (this._disabledDays && this._disabledDays.includes(date.getDay())) {
                return false;
            }

            if (this._disabledDates && this._disabledDates.find(disabledDate => disabledDate.isSame(date, 'day'))) {
                return false;
            }

            if (this._enabledDates && !this._enabledDates.find(enabledDate => enabledDate.isSame(date, 'day'))) {
                return false;
            }

            if (this._disabledTimeIntervals && this._disabledTimeIntervals.find(([start, end]) => date.isSameOrAfter(start) && date.isSameOrBefore(end))) {
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
            if (!dates) {
                return null;
            }

            return dates
                .map(date => this._parseDate(date))
                .filter(date => !!date);
        }

    });


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

                this._defaultFormats[locale] = formatter.formatToParts(new Date)
                    .map(
                        (part, i, parts) => {
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
                                    return '';
                                case 'dayPeriod':
                                    return 'a';
                            }

                            if (i < parts.length - 1 && parts[i + 1].type === 'second') {
                                return '';
                            }

                            if (part.value === ', ') {
                                return ' ';
                            }

                            if (!/[a-z]/i.test(part.value)) {
                                return part.value;
                            }

                            return `'${part.value}'`;
                        }
                    ).join('');
            }

            return this._defaultFormats[locale];
        }

    });


    Object.assign(DateTimePicker.prototype, {

        getDate() {
            if (!this._currentDate) {
                return null;
            }

            return this._currentDate.clone();
        },

        getDisabledDates() {
            return this._disabledDates;
        },

        getDisabledDays() {
            return this._disabledDays;
        },

        getDisabledHours() {
            return this._disabledHours;
        },

        getDisabledTimeIntervals() {
            return this._disabledTimeIntervals;
        },

        getEnabledDates() {
            return this._enabledDates;
        },

        setDate(date) {
            this._currentDate = this._parseDate(date);

            this.update();
            this.refresh();

            return this;
        },

        setDisabledDates(disabledDates) {
            this._disabledDates = this._parseDates(disabledDates);
            this._enabledDates = null;

            this.update();
            this.refresh();

            return this;
        },

        setDisabledDays(disabledDays) {
            this._disabledDays = disabledDays;

            this.update();
            this.refresh();

            return this;
        },

        setDisabledHours(disabledHours) {
            this._disabledHours = disabledHours;

            this.update();
            this.refresh();

            return this;
        },

        setDisabledTimeIntervals() {
            this._disabledTimeIntervals = disabledTimeIntervals;

            this.update();
            this.refresh();

            return this;
        },

        setEnabledDates(enabledDates) {
            this._enabledDates = this._parseDates(enabledDates);
            this._disabledDates = null;

            this.update();
            this.refresh();

            return this;
        },

        setMaxDate(maxDate) {
            this._maxDate = this._parseDate(maxDate);

            this.update();
            this.refresh();

            return this;
        },

        setMinDate(minDate) {
            this._minDate = this._parseDate(minDate);

            this.update();
            this.refresh();

            return this;
        },

        setViewDate(viewDate) {
            this._viewDate = this._parseDate(viewDate);

            this.refresh();

            return this;
        },

        update() {
            if (!this._currentDate) {
                return this;
            }

            dom.setValue(
                this._node,
                this._currentDate.format(this._settings.format)
            );

            return this;
        }

    });


    // DateTimePicker default options
    DateTimePicker.defaults = {
        format: null,
        locale: DateFormatter.defaultLocale,
        timeZone: DateTime.defaultTimeZone,
        defaultDate: null,
        minDate: null,
        maxDate: null,
        enabledDates: null,
        disabledDates: null,
        enabledDays: null,
        disabledDays: null,
        enabledHours: null,
        disabledHours: null,
        disabledTimeIntervals: null,
        // multiDate: false,
        // multiDateSeparator: ',',
        icons: {
            up: 'icon-arrow-up',
            right: 'icon-arrow-right',
            down: 'icon-arrow-down',
            left: 'icon-arrow-left'
        },
        buttons: {},
        keyBinds: {},
        useCurrent: false,
        keepOpen: false,
        focusOnShow: false,
        minView: null,

        inline: false,
        sideBySide: false,

        display: 'dynamic',
        duration: 100,
        placement: 'bottom',
        position: 'start',
        fixed: false,
        spacing: 3,
        minContact: false
    };

    DateTimePicker._formatTokenRegExp = /([a-z])\1*|'[^']*'/ig;
    DateTimePicker._dateTokenRegExp = /[GyYqQMLwWdDFEec]/;
    DateTimePicker._timeTokenRegExp = /[ahHKkmsS]/;

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