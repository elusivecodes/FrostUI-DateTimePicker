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
                this._settings.format = this._settings.multiDate ?
                    this.constructor.getDefaultDateFormat(this._settings.locale, this._useDayPeriod) :
                    this.constructor.getDefaultFormat(this._settings.locale, this._useDayPeriod);
            }

            this._checkFormat();

            if (this._settings.multiDate && this._hasTime) {
                throw new Error('Time components cannot be used with multiDate option.');
            }

            if (this._settings.multiDate && !this._hasDate) {
                throw new Error('Date components must be used with multiDate option.');
            }

            this._dateOptions = {
                locale: this._settings.locale,
                timeZone: this._settings.timeZone
            };

            this._currentDate = null;
            this._dates = [];
            this._minDate = null;
            this._maxDate = null;
            this._enabledDates = null;
            this._disabledDates = null;
            this._disabledDays = null;
            this._disabledHours = null;
            this._disabledTimeIntervals = null;
            this._timeViewMode = null;

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

            this._now = DateTime.now(this._dateOptions);

            const value = dom.getValue(this._node);
            if (value) {
                this._currentDate = DateTime.fromFormat(this._settings.format, value, this._dateOptions);
            }

            if (!this._currentDate && this._settings.defaultDate) {
                this._currentDate = this._parseDate(this._settings.defaultDate);
            }

            if (!this._currentDate && this._settings.useCurrent) {
                this._currentDate = this._now.clone();
            }

            if (this._settings.multiDate && this._currentDate) {
                this._dates.push(this._currentDate);
                this._currentDate = null;
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

            if (this._settings.viewDate) {
                this._viewDate = this._parseDate(this._settings.viewDate);
            }

            if (!this._settings.viewDate && this._currentDate) {
                this._viewDate = this._currentDate.clone();
            }

            if (!this._settings.viewDate) {
                this._viewDate = this._now.clone();
            }

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
                this._settings.inline ||
                this._animating ||
                !dom.isConnected(this._menuNode) ||
                !dom.triggerOne(this._node, 'hide.frost.datetimepicker')
            ) {
                return;
            }

            this._animating = true;

            dom.fadeOut(this._menuNode, {
                duration: this._settings.duration
            }).then(_ => {
                dom.detach(this._menuNode);
                dom.setAttribute(this._node, 'aria-expanded', false);
                dom.triggerEvent(this._node, 'hidden.frost.datetimepicker');
            }).catch(_ => { }).finally(_ => {
                this._animating = false;
            });
        }

        show() {
            if (
                this._settings.inline ||
                this._animating ||
                dom.isConnected(this._menuNode) ||
                !dom.triggerOne(this._node, 'show.frost.datetimepicker')
            ) {
                return;
            }

            this._animating = true;
            dom.append(document.body, this._menuNode);
            this._popper.update();

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
            const menus = dom.find('.datetimepicker:not(.datetimepicker-inline)');

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

            if (this._settings.keyDown && !this._settings.inline && !this._settings.multiDate) {
                dom.addEvent(this._node, 'keydown', e => {
                    this._settings.keyDown.bind(this)(e);
                });
            }

            dom.addEvent(this._container, 'click mousedown', e => {
                e.preventDefault();
                e.stopPropagation();
            });

            dom.addEventDelegate(this._container, 'click', '[data-action]', e => {
                const element = e.currentTarget;
                const action = dom.getDataset(element, 'action');
                const hasCurrent = !!this._currentDate;

                switch (action) {
                    case 'setDate':
                        if (!hasCurrent) {
                            this._currentDate = this._now.clone();
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
                    case 'setDateMulti':
                        let date = this._now.clone().setYear(
                            dom.getDataset(element, 'year'),
                            dom.getDataset(element, 'month'),
                            dom.getDataset(element, 'date')
                        );

                        this._viewDate = date.clone();

                        if (this._isCurrent(date)) {
                            this._dates = this._dates.filter(currentDate => !currentDate.isSame(date, 'day'));
                        } else {
                            this._dates.push(date);
                        }

                        this._refreshDate();

                        this.update();

                        console.log(this);

                        break;
                    case 'nextTime':
                    case 'prevTime':
                        if (!this._currentDate) {
                            this._currentDate = this._now.clone();
                        }

                        const timeMethod = action === 'prevTime' ?
                            'sub' :
                            'add';
                        const unit = dom.getDataset(element, 'unit');
                        const oldDay = this._currentDate.getDay();
                        this._currentDate[timeMethod](
                            unit === 'hours' ?
                                this._settings.stepping :
                                1,
                            unit
                        );

                        if (!hasCurrent || oldDay !== this._currentDate.getDay()) {
                            this._refreshDate();
                        }
                        this._refreshTime();

                        this.update();

                        break;
                    case 'togglePeriod':
                        if (!this._currentDate) {
                            this._currentDate = this._now.clone();
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
                            this._currentDate = this._now.clone();
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
                            this._currentDate = this._now.clone();
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

        _dateString(date) {
            return date.clone().setLocale('en').format('yyyy-MM-dd');
        },

        _isCurrent(date, scope = 'day') {
            if (this._settings.multiDate) {
                return this._dates.find(currentDate => currentDate.isSame(date, scope));
            }

            return this._currentDate && this._currentDate.isSame(date, scope);
        },

        _isDateBetweenMinMax(date, scope = 'second') {
            if (this._minDate && date.isBefore(this._minDate, scope)) {
                return false;
            }

            if (this._maxDate && date.isAfter(this._maxDate, scope)) {
                return false;
            }

            return true;
        },

        _isDateOutsideDisabledInterval(date) {
            if (this._disabledTimeIntervals && this._disabledTimeIntervals.find(([start, end]) => date.isAfter(start) && date.isBefore(end))) {
                return false;
            }

            return true;
        },

        _isDateValid(date) {
            if (this._disabledDates && this._disabledDates.find(disabledDate => disabledDate.isSame(date, 'day'))) {
                return false;
            }

            if (this._enabledDates && !this._enabledDates.find(enabledDate => enabledDate.isSame(date, 'day'))) {
                return false;
            }

            return true;
        },

        _isDayValid(date) {
            if (this._disabledDays && this._disabledDays.includes(date.getDay())) {
                return false;
            }

            return true;
        },

        _isHourValid(date) {
            if (this._disabledHours && this._disabledHours.includes(date.getHour())) {
                return false;
            }

            return true;
        },

        _isValid(date, scope = 'day') {
            if (!this._isDateBetweenMinMax(date, scope)) {
                return false;
            }

            if (!this._isDayValid(date)) {
                return false;
            }

            if (!this._isDateValid(date)) {
                return false;
            }

            if (scope === 'day') {
                return true;
            }

            if (!this._isHourValid(date)) {
                return false;
            }

            if (!this._isDateOutsideDisabledInterval(date)) {
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


    Object.assign(DateTimePicker, {

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

        getDefaultDateFormat(locale) {
            if (!(locale in this._defaultDateFormats)) {
                const formatter = new Intl.DateTimeFormat(locale, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });

                this._defaultDateFormats[locale] = formatter.formatToParts(new Date)
                    .map(
                        part => {
                            switch (part.type) {
                                case 'year':
                                    return 'yyyy';
                                case 'month':
                                    return 'MM';
                                case 'day':
                                    return 'dd';
                            }

                            if (!/[a-z]/i.test(part.value)) {
                                return part.value;
                            }

                            return `'${part.value}'`;
                        }
                    ).join('');
            }


            return this._defaultDateFormats[locale];
        },

        getDefaultFormat(locale, hasDayPeriod) {
            if (!(locale in this._defaultFormats)) {
                const formatter = new Intl.DateTimeFormat(locale, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                this._defaultFormats[locale] = formatter.formatToParts(new Date)
                    .map(
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
                                case 'dayPeriod':
                                    return 'a';
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
            if (this._settings.multiDate) {
                return this._dates;
            }

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
            if (this._settings.multiDate) {
                this._dates = this._parseDates(date);

                if (!this._settings.keepInvalid) {
                    this._dates = this._dates.filter(newDate => this._isValid(newDate, 'second'));
                }

                if (this._dates.length) {
                    this._viewDate = this._dates[0].clone();
                }
            } else {
                const newDate = this._parseDate(date);

                if (newDate && !this._settings.keepInvalid && !this._isValid(newDate, 'second')) {
                    throw new Error('Invalid date supplied');
                }

                this._currentDate = newDate;

                if (newDate) {
                    this._viewDate = newDate.clone();
                }
            }

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
            let value = '';
            if (this._settings.multiDate) {
                value = this._dates
                    .sort((a, b) => a.isBefore(b) ? -1 : 1)
                    .map(currentDate => currentDate.format(this._settings.format))
                    .join(this._settings.multiSeparator);
            } else if (this._currentDate) {
                value = this._currentDate.format(this._settings.format);
            }

            dom.setValue(this._node, value);

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
        multiDate: false,
        multiDateSeparator: ',',
        icons: {
            up: 'icon-arrow-up',
            right: 'icon-arrow-right',
            down: 'icon-arrow-down',
            left: 'icon-arrow-left'
        },
        tooltips: {
            decrementHour: 'Decrement Hour',
            decrementMinute: 'Decrement Minute',
            incrementHour: 'Increment Hour',
            incrementMinute: 'Increment Minute',
            nextDecade: 'Next Decade',
            nextMonth: 'Next Month',
            nextYear: 'Next Year',
            prevDecade: 'Previous Decade',
            prevMonth: 'Previous Month',
            prevYear: 'Previous Year',
            selectDate: 'Select Date',
            selectHour: 'Select Hour',
            selectMinute: 'Select Minute',
            selectMonth: 'Select Month',
            selectTime: 'Select Time',
            selectYear: 'Select Year',
            togglePeriod: 'Toggle Period'
        },
        keyDown: function(e) {
            let date = this._currentDate ?
                this._currentDate :
                this._now.clone();

            switch (e.key) {
                case 'ArrowUp':
                    if (e.ctrlKey) {
                        date.sub(1, 'year');
                    } else {
                        date.sub(7, 'days');
                    }
                    break;
                case 'ArrowDown':
                    if (e.ctrlKey) {
                        date.add(1, 'year');
                    } else {
                        date.add(7, 'days');
                    }
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey) {
                        date.add(1, 'month');
                    } else {
                        date.add(1, 'day');
                    }
                    break;
                case 'ArrowLeft':
                    if (e.ctrlKey) {
                        date.sub(1, 'month');
                    } else {
                        date.sub(1, 'day');
                    }
                    break;
                case 'PageUp':
                    date.add(1, 'hour');
                    break;
                case 'PageDown':
                    date.sub(1, 'hour');
                    break;
                case 'Home':
                    date = this._now.clone()
                    break;
                case 'Delete':
                    date = null;
                    break;
                default:
                    return;
            }

            e.preventDefault();
            this.setDate(date);
        },
        renderDay: null,
        renderHour: null,
        renderMinute: null,
        renderMonth: null,
        renderYear: null,
        useCurrent: false,
        keepOpen: false,
        focusOnShow: false,
        minView: null,
        inline: false,
        sideBySide: false,
        keepInvalid: false,
        stepping: 1,

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
    DateTimePicker._dayPeriods = {};
    DateTimePicker._defaultDateFormats = {};
    DateTimePicker._defaultFormats = {};

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