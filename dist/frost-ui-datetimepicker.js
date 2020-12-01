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

    /**
     * DateTimePicker Class
     * @class
     */
    class DateTimePicker {

        /**
         * New DateTimePicker constructor.
         * @param {HTMLElement} node The input node.
         * @param {object} [settings] The options to create the DateTimePicker with.
         * @param {number} [settings.duration=100] The duration of the animation.
         * @param {string} [settings.placement=bottom] The placement of the datetimepicker relative to the toggle.
         * @param {string} [settings.position=start] The position of the datetimepicker relative to the toggle.
         * @param {Boolean} [settings.fixed=false] Whether the datetimepicker position is fixed.
         * @param {number} [settings.spacing=2] The spacing between the datetimepicker and the toggle.
         * @param {number} [settings.minContact=false] The minimum amount of contact the datetimepicker must make with the toggle.
         * @returns {DateTimePicker} A new DateTimePicker object.
         */
        constructor(node, settings) {
            this._node = node;

            this._settings = Core.extend(
                {},
                this.constructor.defaults,
                dom.getDataset(this._node),
                settings
            );

            this._date = null;
            this._dates = [];
            this._minDate = null;
            this._maxDate = null;
            this._enabledDates = null;
            this._disabledDates = null;
            this._disabledDays = null;
            this._disabledHours = null;
            this._disabledTimeIntervals = null;
            this._timeViewMode = null;
            this._hasDate = false;
            this._hasHours = false;
            this._hasMinutes = false;
            this._hasSeconds = false;
            this._hasTime = false;

            this._dateOptions = {
                locale: this._settings.locale,
                timeZone: this._settings.timeZone
            };

            this._useDayPeriod = this.constructor.checkDayPeriod(this._settings.locale);

            if (!this._settings.format) {
                this._settings.format = this._settings.multiDate ?
                    this.constructor.getDefaultDateFormat(this._settings.locale, this._useDayPeriod) :
                    this.constructor.getDefaultFormat(this._settings.locale, this._useDayPeriod);
            }

            this._checkFormat();
            this._parseSettings();
            this._render();
            this._events();
            this._update();

            dom.setData(this._node, 'datetimepicker', this);
        }

        /**
         * Clear the current value.
         */
        clear() {
            return this.setDate(null);
        }

        /**
         * Destroy the DateTimePicker.
         */
        destroy() {
            if (this._popper) {
                this._popper.destroy();
            }

            dom.remove(this._menuNode);
            dom.removeEvent(this._node, 'focus.frost.datetimepicker');
            dom.removeEvent(this._node, 'keydown.frost.datetimepicker');
            dom.removeData(this._node, 'datetimepicker');
        }

        /**
         * Hide the DateTimePicker.
         */
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

        /**
         * Show the DateTimePicker.
         */
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

        /**
         * Toggle the DateTimePicker.
         */
        toggle() {
            dom.hasClass(this._menuNode, 'show') ?
                this.hide() :
                this.show();
        }

        /**
         * Auto-hide all visible datetimepickers (non-inline).
         * @param {HTMLElement} [target] The target node.
         */
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


        /**
         * Initialize a DateTimePicker.
         * @param {HTMLElement} node The input node.
         * @param {object} [settings] The options to create the DateTimePicker with.
         * @param {number} [settings.duration=100] The duration of the animation.
         * @param {string} [settings.placement=bottom] The placement of the datetimepicker relative to the toggle.
         * @param {string} [settings.position=start] The position of the datetimepicker relative to the toggle.
         * @param {Boolean} [settings.fixed=false] Whether the datetimepicker position is fixed.
         * @param {number} [settings.spacing=2] The spacing between the datetimepicker and the toggle.
         * @param {number} [settings.minContact=false] The minimum amount of contact the datetimepicker must make with the toggle.
         * @returns {DateTimePicker} A new DateTimePicker object.
         */
        static init(node, settings) {
            return dom.hasData(node, 'datetimepicker') ?
                dom.getData(node, 'datetimepicker') :
                new this(node, settings);
        }

    }


    /**
     * DateTimePicker Events
     */

    Object.assign(DateTimePicker.prototype, {

        /**
         * Attach events for the DateTimePicker.
         */
        _events() {
            dom.addEvent(this._node, 'input.frost.datetimepicker', _ => {
                const value = dom.getValue(this._node);
                try {
                    if (this._settings.multiDate) {
                        const dates = value.split(this._settings.multiSeparator).map(date =>
                            DateTime.fromFormat(this._settings.format, date, this._dateOptions)
                        );
                        if (!dates.find(date => !date.isValid)) {
                            this._setDates(dates);
                        }
                    } else {
                        const date = DateTime.fromFormat(this._settings.format, value, this._dateOptions);
                        if (date.isValid) {
                            this._setDate(date);
                        }
                    }
                } catch (e) { }
            });

            dom.addEvent(this._node, 'focus.frost.datetimepicker', _ => {
                this.show();
            });

            if (this._settings.keyDown && !this._settings.inline && !this._settings.multiDate) {
                dom.addEvent(this._node, 'keydown.frost.datetimepicker', e => {
                    this._settings.keyDown(e, this);
                });
            }

            dom.addEvent(this._container, 'click.frost.datetimepicker mousedown.frost.datetimepicker', e => {
                e.preventDefault();
                e.stopPropagation();
            });

            dom.addEventDelegate(this._container, 'click.frost.datetimepicker', '[data-action]', e => {
                const element = e.currentTarget;
                const action = dom.getDataset(element, 'action');
                const tempDate = this._date ?
                    this._date.clone() :
                    this._now();

                switch (action) {
                    case 'setDate':
                        tempDate.setYear(
                            dom.getDataset(element, 'year'),
                            dom.getDataset(element, 'month'),
                            dom.getDataset(element, 'date')
                        );

                        this._setDate(tempDate);

                        if (!this._hasTime && !this._settings.keepOpen) {
                            this.hide();
                        }

                        break;
                    case 'setDateMulti':
                        tempDate.setYear(
                            dom.getDataset(element, 'year'),
                            dom.getDataset(element, 'month'),
                            dom.getDataset(element, 'date')
                        );

                        if (this._isCurrent(tempDate)) {
                            this._dates = this._dates.filter(date => !date.isSame(tempDate, 'day'));
                        } else {
                            this._dates.push(tempDate);
                        }

                        this._setDates(this._dates);

                        this._viewDate = tempDate.clone();

                        break;
                    case 'nextTime':
                    case 'prevTime':
                        const timeMethod = action === 'prevTime' ?
                            'sub' :
                            'add';
                        const unit = dom.getDataset(element, 'unit');
                        tempDate[timeMethod](
                            unit === 'hours' ?
                                this._settings.stepping :
                                1,
                            unit
                        );

                        this._setDate(tempDate);

                        break;
                    case 'togglePeriod':
                        const currentHours = tempDate.getHours();
                        tempDate.setHours(
                            currentHours + (currentHours < 12 ? 12 : -12)
                        );

                        this._setDate(tempDate);

                        break;
                    case 'setHours':
                        tempDate.setHours(
                            dom.getDataset(element, 'hour')
                        );

                        this._timeViewMode = null;

                        this._setDate(tempDate);

                        break;
                    case 'setMinutes':
                        tempDate.setMinutes(
                            dom.getDataset(element, 'minute')
                        );

                        this._timeViewMode = null;

                        this._setDate(tempDate);

                        break;
                    case 'setSeconds':
                        tempDate.setSeconds(
                            dom.getDataset(element, 'second')
                        );

                        this._timeViewMode = null;

                        this._setDate(tempDate);

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
                DateTimePicker.autoHide(e.target);
            case 'Escape':
                DateTimePicker.autoHide();
        }
    });


    /**
     * DateTimePicker Helpers
     */

    Object.assign(DateTimePicker.prototype, {

        /**
         * Check the format for date and time components.
         */
        _checkFormat() {
            const tokens = this._settings.format.matchAll(this.constructor._formatTokenRegExp);
            for (const token of tokens) {
                if (!token[1]) {
                    continue;
                }

                if (!this._hasDate && this.constructor._dateTokenRegExp.test(token[1])) {
                    this._hasDate = true;
                }

                if (!this._hasHours && this.constructor._hourTokenRegExp.test(token[1])) {
                    this._hasHours = true;
                }

                if (!this._hasMinutes && this.constructor._minuteTokenRegExp.test(token[1])) {
                    this._hasMinutes = true;
                }

                if (!this._hasSeconds && this.constructor._secondTokenRegExp.test(token[1])) {
                    this._hasSeconds = true;
                }
            }

            this._hasTime = this._hasHours || this._hasMinutes || this._hasSeconds;

            if (this._settings.multiDate && this._hasTime) {
                throw new Error('Time components cannot be used with multiDate option.');
            }

            if (this._settings.multiDate && !this._hasDate) {
                throw new Error('Date components must be used with multiDate option.');
            }
        },

        /**
         * Clamp a date to the nearest stepping interval.
         * @param {DateTime} date The input date.
         */
        _clampStepping(date) {
            const minutes = date.getMinutes();
            const stepMinutes = Math.min(
                Core.toStep(minutes, this._settings.stepping),
                60
            );

            if (minutes !== stepMinutes) {
                date.setMinutes(stepMinutes);
            }

            if (this._settings.stepping > 1) {
                date.setSeconds(0);
            }
        },

        /**
         * Determine whether a date is a "current" date.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity=day] The level of granularity to use for comparison.
         * @return {Boolean} TRUE if the date is a "current" date, otherwise FALSE.
         */
        _isCurrent(date, granularity = 'day') {
            if (this._settings.multiDate) {
                return this._dates.find(date => date.isSame(date, granularity));
            }

            return this._date && this._date.isSame(date, granularity);
        },

        /**
         * Determine whether a date is between min/max dates.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity=day] The level of granularity to use for comparison.
         * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
         */
        _isDateBetweenMinMax(date, granularity = 'second') {
            if (this._minDate && date.isBefore(this._minDate, granularity)) {
                return false;
            }

            if (this._maxDate && date.isAfter(this._maxDate, granularity)) {
                return false;
            }

            return true;
        },

        /**
         * Determine whether a date is outside disabled intervals.
         * @param {DateTime} date The date to test.
         * @return {Boolean} TRUE if the date is outside disabled intervals, otherwise FALSE.
         */
        _isDateOutsideDisabledInterval(date) {
            if (this._disabledTimeIntervals && this._disabledTimeIntervals.find(([start, end]) => date.isAfter(start) && date.isBefore(end))) {
                return false;
            }

            return true;
        },

        /**
         * Determine whether a date is enabled (or not disabled).
         * @param {DateTime} date The date to test.
         * @return {Boolean} TRUE if the date is enabled (or not disabled), otherwise FALSE.
         */
        _isDateValid(date) {
            if (this._disabledDates && this._disabledDates.find(disabledDate => disabledDate.isSame(date, 'day'))) {
                return false;
            }

            if (this._enabledDates && !this._enabledDates.find(enabledDate => enabledDate.isSame(date, 'day'))) {
                return false;
            }

            return true;
        },

        /**
         * Determine whether a date is not a disabled day.
         * @param {DateTime} date The date to test.
         * @return {Boolean} TRUE if the date is not a disabled day, otherwise FALSE.
         */
        _isDayValid(date) {
            if (this._disabledDays && this._disabledDays.includes(date.getDay())) {
                return false;
            }

            return true;
        },

        /**
         * Determine whether a date is not a disabled hour.
         * @param {DateTime} date The date to test.
         * @return {Boolean} TRUE if the date is not a disabled hour, otherwise FALSE.
         */
        _isHourValid(date) {
            if (this._disabledHours && this._disabledHours.includes(date.getHour())) {
                return false;
            }

            return true;
        },

        /**
         * Determine whether a date is valid.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity=day] The level of granularity to use for comparison.
         * @return {Boolean} TRUE if the date is valid, otherwise FALSE.
         */
        _isValid(date, granularity = 'day') {
            if (!this._isDateBetweenMinMax(date, granularity)) {
                return false;
            }

            if (!this._isDayValid(date)) {
                return false;
            }

            if (!this._isDateValid(date)) {
                return false;
            }

            if (['year', 'month', 'day'].includes(granularity)) {
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

        /**
         * Create a new DateTime object set to the current date/time.
         * @returns {DateTime} The new DateTime.
         */
        _now() {
            return DateTime.now(this._dateOptions);
        },

        /**
         * Parse a DateTime from any value.
         * @param {string|number|array|Date|DateTime} date The date to parse.
         * @return {DateTime} The parsed DateTime.
         */
        _parseDate(date) {
            if (!date) {
                return null;
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

        /**
         * Parse DateTime objects from an array of values.
         * @param {array} dates The dates to parse.
         * @return {array} An array of parsed DateTime objects.
         */
        _parseDates(dates) {
            if (!dates) {
                return null;
            }

            return dates
                .map(date => this._parseDate(date))
                .filter(date => !!date);
        },

        /**
         * Parse settings.
         */
        _parseSettings() {
            switch (this._settings.minView) {
                case 'years':
                    this._viewMode = 'years';
                    break;
                case 'months':
                    this._viewMode = 'months';
                    break;
                default:
                    this._viewMode = 'days';
                    break;
            }

            const value = dom.getValue(this._node);
            if (value) {
                this._date = DateTime.fromFormat(this._settings.format, value, this._dateOptions);
            }

            if (!this._date && this._settings.defaultDate) {
                this._date = this._parseDate(this._settings.defaultDate);
            }

            if (!this._date && this._settings.useCurrent) {
                this._date = this._now();
            }

            if (this._settings.multiDate && this._date) {
                this._dates.push(this._date);
                this._date = null;
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
                ).filter(intervals => intervals && intervals.length === 2);
            }

            if (this._settings.viewDate) {
                this._viewDate = this._parseDate(this._settings.viewDate);
            }

            if (!this._settings.viewDate && this._date) {
                this._viewDate = this._date.clone();
            }

            if (!this._settings.viewDate) {
                this._viewDate = this._now();
            }
        },

        /**
         * Set the current date.
         * @param {DateTime} date The input date.
         */
        _setDate(date) {
            if (date) {
                this._clampStepping(date);

                this._viewDate = date.clone();
            }

            if (date && !this._isValid(date, 'second')) {
                // emit error?
            }

            dom.triggerEvent(this._node, 'update.frost.datetimepicker', {
                old: this._date ?
                    this._date.clone() :
                    null,
                new: date ?
                    date.clone() :
                    null
            });

            this._date = date;

            this._update();
            this.refresh();
        },

        /**
         * Set the current dates.
         * @param {array} date The input dates.
         */
        _setDates(dates) {
            for (const date of dates) {
                this._clampStepping(date);
            }

            dates = dates.sort((a, b) => a.isBefore(b) ? -1 : 1);

            if (dates.find(date => !this._isValid(date, 'second'))) {
                // emit error?
            }

            dom.triggerEvent(this._node, 'update.frost.datetimepicker', {
                old: this._dates.map(date => date.clone()),
                new: dates.map(date => date.clone())
            });

            this._dates = dates;

            this._update();
            this.refresh();
        },

        /**
         * Update the input value to the current date.
         */
        _update() {
            let value = '';
            if (this._settings.multiDate) {
                value = this._dates
                    .map(date => date.format(this._settings.format))
                    .join(this._settings.multiSeparator);
            } else if (this._date) {
                value = this._date.format(this._settings.format);
            }

            dom.setValue(this._node, value);

            return this;
        }

    });


    /**
     * DateTimePicker Render
     */

    Object.assign(DateTimePicker.prototype, {

        /**
         * Refresh the views.
         */
        refresh() {
            if (this._hasDate) {
                this._refreshDate();
            }

            if (this._hasTime) {
                this._refreshTime();
            }
        },

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

        /**
         * Refresh the time container.
         */
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
        },

        /**
         * Render the DateTimePicker.
         */
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

            const table = this._createTable({
                header: {
                    title: this._viewDate.format('MMMM yyyy'),
                    data: {
                        action: 'changeView',
                        view: 'months'
                    },
                    attr: {
                        title: this._settings.tooltips.selectMonth
                    },
                    prev: this._isDateBetweenMinMax(start) ?
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
                    next: this._isDateBetweenMinMax(end) ?
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

                    const currentDay = current.clone();
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
                            dom.addClass(td, 'active');
                        } else if (!this._viewDate.isSame(current, 'month')) {
                            dom.addClass(td, 'text-secondary');
                        }

                        if (!this._isValid(current, 'day')) {
                            dom.addClass(td, 'disabled');
                        } else {
                            dom.addClass(td, 'action');
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
                            dom.addClass(td, 'today');
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
                        class: 'row g-0'
                    });
                    dom.append(td, row);

                    while (current.isSameOrBefore(last, 'hour')) {
                        const col = dom.create('div', {
                            text: current.format('HH'),
                            class: 'col-3 px-1 py-2'
                        });
                        dom.append(row, col);

                        if (!this._isValid(current, 'second')) {
                            dom.addClass(col, 'disabled');
                        } else {
                            dom.addClass(col, 'action');
                            dom.setDataset(col, {
                                action: 'setHours',
                                hour: current.getHours()
                            });
                        }

                        if (this._settings.renderHour) {
                            this._settings.renderHour(current.clone(), col);
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
                        class: 'row g-0'
                    });
                    dom.append(td, row);

                    const stepping = this._settings.stepping == 1 ?
                        5 :
                        this._settings.stepping;

                    while (current.isSameOrBefore(last, 'minute')) {
                        const col = dom.create('span', {
                            text: current.format('mm'),
                            class: 'col-3 px-1 py-2'
                        });
                        dom.append(row, col);

                        if (!this._isValid(current, 'second')) {
                            dom.addClass(col, 'disabled');
                        } else {
                            dom.addClass(col, 'action');
                            dom.setDataset(col, {
                                action: 'setMinutes',
                                minute: current.getMinutes()
                            });
                        }

                        if (this._settings.renderMinute) {
                            this._settings.renderMinute(current.clone(), col);
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

            const table = this._createTable({
                header: {
                    title: this._viewDate.format('yyyy'),
                    wide: true,
                    data: {
                        action: 'changeView',
                        view: 'years'
                    },
                    attr: {
                        title: this._settings.tooltips.selectYear
                    },
                    prev: this._isDateBetweenMinMax(start) ?
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
                    next: this._isDateBetweenMinMax(end) ?
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

                    while (current.isSameOrBefore(last, 'month')) {
                        const col = dom.create('div', {
                            text: current.format('MMM'),
                            class: 'col-4 px-1 py-2'
                        });
                        dom.append(row, col);

                        if (this._isCurrent(current, 'month')) {
                            dom.addClass(col, 'active');
                        }

                        if (!this._isDateBetweenMinMax(current, 'month')) {
                            dom.addClass(col, 'disabled');
                        } else {
                            dom.addClass(col, 'action');

                            if (this._settings.minView === 'year') {
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
                        class: 'row g-0'
                    });
                    dom.append(td, row);

                    while (current.isSameOrBefore(last, 'second')) {
                        const col = dom.create('span', {
                            text: current.format('ss'),
                            class: 'col-3 px-1 py-2'
                        });
                        dom.append(row, col);

                        if (!this._isValid(current, 'second')) {
                            dom.addClass(col, 'disabled');
                        } else {
                            dom.addClass(col, 'action');
                            dom.setDataset(col, {
                                action: 'setSeconds',
                                second: current.getSeconds()
                            });
                        }

                        if (this._settings.renderSecond) {
                            this._settings.renderSecond(current.clone(), col);
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

            const table = this._createTable({
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
                        const hourUpTd = dom.create('td', {
                            html: `<span class="${this._settings.icons.up}"></span>`,
                            class: 'text-primary bw-bold py-4 px-0',
                            style: {
                                width: `${cellWidth}%`
                            }
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
                            dataset: {
                                action: 'changeTimeView',
                                timeView: 'hours'
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
                    }

                    if (this._hasHours && this._hasMinutes) {
                        const seperatorUpTd = dom.create('td', {
                            style: {
                                width: `${separatorWidth}%`
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
                    }

                    if (this._hasMinutes) {
                        const minuteUpTd = dom.create('td', {
                            html: `<span class="${this._settings.icons.up}"></span>`,
                            class: 'text-primary bw-bold py-4 px-0',
                            style: {
                                width: `${cellWidth}%`
                            }
                        });

                        const initialMinutes = initialDate.getMinutes();
                        const nextMinutes = Math.min(initialMinutes + this._settings.stepping, 60);
                        const nextMinute = initialDate.clone().setMinutes(nextMinutes);
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
                                timeView: 'minutes'
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

                        const prevMinute = initialDate.clone().sub(this._settings.stepping, 'minute');
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
                    }

                    if ((this._hasHours || this._hasMinutes) && this._hasSeconds) {
                        const seperatorUpTd = dom.create('td', {
                            style: {
                                width: `${separatorWidth}%`
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
                    }

                    if (this._hasSeconds) {
                        const secondUpTd = dom.create('td', {
                            html: `<span class="${this._settings.icons.up}"></span>`,
                            class: 'text-primary bw-bold py-4 px-0',
                            style: {
                                width: `${cellWidth}%`
                            }
                        });

                        const nextSecond = initialDate.clone().add(1, 'second');
                        if (!this._isValid(nextSecond, 'second')) {
                            dom.addClass(secondUpTd, 'disabled');
                        } else {
                            dom.addClass(secondUpTd, 'action');
                            dom.setDataset(secondUpTd, {
                                action: 'nextTime',
                                unit: 'second'
                            });
                            dom.setAttribute(secondUpTd, 'title', this._settings.tooltips.incrementSecond);
                        }

                        dom.append(upTr, secondUpTd);

                        const secondTd = dom.create('td', {
                            text: initialDate.format('ss'),
                            class: 'action time py-2 px-0',
                            dataset: {
                                action: 'changeTimeView',
                                timeView: 'seconds'
                            },
                            attributes: {
                                title: this._settings.tooltips.selectSecond
                            }
                        });
                        dom.append(timeTr, secondTd);

                        const secondDownTd = dom.create('td', {
                            html: `<span class="${this._settings.icons.down}"></span>`,
                            class: 'action text-primary bw-bold py-4 px-0'
                        });

                        const prevSecond = initialDate.clone().sub(1, 'second');
                        if (!this._isValid(prevSecond, 'second')) {
                            dom.addClass(secondDownTd, 'disabled');
                        } else {
                            dom.addClass(secondDownTd, 'action');
                            dom.setDataset(secondDownTd, {
                                action: 'prevTime',
                                unit: 'second'
                            });
                            dom.setAttribute(secondDownTd, 'title', this._settings.tooltips.decrementSecond);
                        }

                        dom.append(downTr, secondDownTd);
                    }

                    if (this._useDayPeriod) {
                        const periodUpTd = dom.create('td', {
                            style: {
                                width: '22%'
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

            const table = this._createTable({
                header: {
                    title: `${start.format('yyyy')} - ${end.format('yyyy')}`,
                    wide: true,
                    prev: this._isDateBetweenMinMax(start) ?
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
                    next: this._isDateBetweenMinMax(end) ?
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

                    while (current.isSameOrBefore(last, 'month')) {
                        const thisYear = current.getYear();

                        const col = dom.create('div', {
                            text: current.format('yyyy'),
                            class: 'col-4 px-1 py-2'
                        });
                        dom.append(row, col);

                        if (this._isCurrent(current, 'year')) {
                            dom.addClass(col, 'active');
                        } else if (thisYear < startYear || thisYear > endYear) {
                            dom.addClass(col, 'text-secondary');
                        }

                        if (!this._isDateBetweenMinMax(current, 'year')) {
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


    /**
     * DateTimePicker (Static)
     */

    Object.assign(DateTimePicker, {

        /**
         * Check a locale for day period component (and cache).
         * @param {string} locale The locale to check.
         * @returns {Boolean} Whether the locale uses a day period component.
         */
        checkDayPeriod(locale) {
            if (!(locale in this._dayPeriods)) {
                const formatter = new Intl.DateTimeFormat(locale, {
                    hour: '2-digit'
                });

                this._dayPeriods[locale] = !!formatter.formatToParts(new Date)
                    .find(part => part.type === 'dayPeriod');
            }

            return this._dayPeriods[locale];
        },

        /**
         * Get the default date format for a locale.
         * @param {string} locale The input locale.
         * @returns {string} The default date format.
         */
        getDefaultDateFormat(locale) {
            if (!(locale in this._defaultDateFormats)) {
                this._defaultDateFormats[locale] = this._formatFromParts(locale, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            }

            return this._defaultDateFormats[locale];
        },

        /**
         * Get the default format for a locale.
         * @param {string} locale The input locale.
         * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
         * @returns {string} The default format.
         */
        getDefaultFormat(locale, hasDayPeriod) {
            if (!(locale in this._defaultFormats)) {
                this._defaultFormats[locale] = this._formatFromParts(locale, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }, hasDayPeriod);
            }

            return this._defaultFormats[locale];
        },

        /**
         * Create a date format from a locale and options.
         * @param {string} locale The input locale.
         * @param {object} options Options for the formatter.
         * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
         * @returns {string} The date format.
         */
        _formatFromParts(locale, options, hasDayPeriod) {
            const formatter = new Intl.DateTimeFormat(locale, options);

            return formatter.formatToParts(new Date)
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
                                return hasDayPeriod ?
                                    'hh' :
                                    'HH';
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

    });


    /**
     * DateTimePicker Utility
     */

    Object.assign(DateTimePicker.prototype, {

        /**
         * Get the current date(s).
         * @return {DateTime|array} The current date(s).
         */
        getDate() {
            if (this._settings.multiDate) {
                return this._dates;
            }

            if (!this._date) {
                return null;
            }

            return this._date.clone();
        },

        /**
         * Get the disabled dates.
         * @return {array} The disabled dates.
         */
        getDisabledDates() {
            if (!this._disabledDates) {
                return null;
            }

            return this._disabledDates.map(date => date.clone());
        },

        /**
         * Get the disabled days.
         * @return {array} The disabled days.
         */
        getDisabledDays() {
            if (!this._disabledDays) {
                return null;
            }

            return this._disabledDays.slice();
        },

        /**
         * Get the disabled hours.
         * @return {array} The disabled hours.
         */
        getDisabledHours() {
            if (!this._disabledHours) {
                return null;
            }

            return this._disabledHours.slice();
        },

        /**
         * Get the disabled time intervals.
         * @return {array} The disabled time intervals.
         */
        getDisabledTimeIntervals() {
            if (!this._disabledTimeIntervals) {
                return null;
            }

            return this._disabledTimeIntervals.map(interval => interval.map(date => date.clone()));
        },

        /**
         * Get the enabled dates.
         * @return {array} The enabled dates.
         */
        getEnabledDates() {
            if (!this._enabledDates) {
                return null;
            }

            return this._enabledDates.map(date => date.clone());
        },

        /**
         * Get the view date.
         * @return {DateTime} The view date.
         */
        getViewDate() {
            return this._viewDate.clone();
        },

        /**
         * Set the current date(s).
         * @param {string|number|array|Date|DateTime} date The input date(s).
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setDate(date) {
            if (this._settings.multiDate) {
                date = this._parseDates(date);
            } else {
                date = this._parseDate(date);
            }

            this._setDate(date);

            return this;
        },

        /**
         * Set the disabled dates.
         * @param {array} disabledDates The input dates.
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setDisabledDates(disabledDates) {
            this._disabledDates = this._parseDates(disabledDates);
            this._enabledDates = null;

            this._update();
            this.refresh();

            return this;
        },

        /**
         * Set the disabled days.
         * @param {number[]} disabledDays The input days.
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setDisabledDays(disabledDays) {
            this._disabledDays = disabledDays;

            this._update();
            this.refresh();

            return this;
        },

        /**
         * Set the disabled hours.
         * @param {number[]} disabledHours The input hours.
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setDisabledHours(disabledHours) {
            this._disabledHours = disabledHours;

            this._update();
            this.refresh();

            return this;
        },

        /**
         * Set the disabled time intervals.
         * @param {array} disabledTimeIntervals The input intervals.
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setDisabledTimeIntervals(disabledTimeIntervals) {
            this._disabledTimeIntervals = disabledTimeIntervals.map(
                intervals => this._parseDates(intervals)
            ).filter(intervals => intervals && intervals.length === 2);

            this._update();
            this.refresh();

            return this;
        },

        /**
         * Set the enabled dates.
         * @param {array} enabledDates The input dates.
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setEnabledDates(enabledDates) {
            this._enabledDates = this._parseDates(enabledDates);
            this._disabledDates = null;

            this._update();
            this.refresh();

            return this;
        },

        /**
         * Set the maximum date.
         * @param {string|number|array|Date|DateTime} date The input date(s).
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setMaxDate(maxDate) {
            this._maxDate = this._parseDate(maxDate);

            this._update();
            this.refresh();

            return this;
        },

        /**
         * Set the minimum date.
         * @param {string|number|array|Date|DateTime} date The input date(s).
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setMinDate(minDate) {
            this._minDate = this._parseDate(minDate);

            this._update();
            this.refresh();

            return this;
        },

        /**
         * Set the view date.
         * @param {string|number|array|Date|DateTime} date The input date(s).
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setViewDate(viewDate) {
            this._viewDate = this._parseDate(viewDate);

            this.refresh();

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
            decrementSecond: 'Decrement Second',
            incrementHour: 'Increment Hour',
            incrementMinute: 'Increment Minute',
            incrementSecond: 'Increment Second',
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
            selectSecond: 'Select Second',
            selectTime: 'Select Time',
            selectYear: 'Select Year',
            togglePeriod: 'Toggle Period'
        },
        keyDown: (e, dtp) => {
            let date = dtp._date ?
                dtp._date :
                dtp._now();

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
                    date = dtp._now()
                    break;
                case 'Delete':
                    date = null;
                    break;
                default:
                    return;
            }

            e.preventDefault();
            dtp._setDate(date);
        },
        renderDay: null,
        renderHour: null,
        renderMinute: null,
        renderMonth: null,
        renderSecond: null,
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
    DateTimePicker._hourTokenRegExp = /[hHKk]/;
    DateTimePicker._minuteTokenRegExp = /[m]/;
    DateTimePicker._secondTokenRegExp = /[s]/;
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