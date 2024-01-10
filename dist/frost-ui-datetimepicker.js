(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@fr0st/query'), require('@fr0st/ui'), require('@fr0st/datetime')) :
    typeof define === 'function' && define.amd ? define(['exports', '@fr0st/query', '@fr0st/ui', '@fr0st/datetime'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.UI = global.UI || {}, global.fQuery, global.UI, global.DateTime));
})(this, (function (exports, $, ui, DateTime$1) { 'use strict';

    const dayPeriods = {};
    const defaultFormats = {};
    const defaultDateFormats = {};
    const defaultTimeFormats = {};

    /**
     * Check a locale for day period component (and cache).
     * @param {string} locale The locale to check.
     * @return {Boolean} Whether the locale uses a day period component.
     */
    function checkDayPeriod(locale) {
        if (!(locale in dayPeriods)) {
            const formatter = new Intl.DateTimeFormat(locale, {
                hour: '2-digit',
            });

            dayPeriods[locale] = !!formatter.formatToParts(new Date)
                .find((part) => part.type === 'dayPeriod');
        }

        return dayPeriods[locale];
    }
    /**
     * Get the default date format for a locale.
     * @param {string} locale The input locale.
     * @return {string} The default date format.
     */
    function getDefaultDateFormat(locale) {
        if (!(locale in defaultDateFormats)) {
            defaultDateFormats[locale] = formatFromParts(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
        }

        return defaultDateFormats[locale];
    }
    /**
     * Get the default format for a locale.
     * @param {string} locale The input locale.
     * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
     * @return {string} The default format.
     */
    function getDefaultFormat(locale, hasDayPeriod) {
        if (!(locale in defaultFormats)) {
            defaultFormats[locale] = formatFromParts(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }, hasDayPeriod);
        }

        return defaultFormats[locale];
    }
    /**
     * Get the default time format for a locale.
     * @param {string} locale The input locale.
     * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
     * @return {string} The default time format.
     */
    function getDefaultTimeFormat(locale, hasDayPeriod) {
        if (!(locale in defaultTimeFormats)) {
            defaultTimeFormats[locale] = formatFromParts(locale, {
                hour: '2-digit',
                minute: '2-digit',
            }, hasDayPeriod);
        }

        return defaultTimeFormats[locale];
    }
    /**
     * Create a date format from a locale and options.
     * @param {string} locale The input locale.
     * @param {object} options Options for the formatter.
     * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
     * @return {string} The date format.
     */
    function formatFromParts(locale, options, hasDayPeriod) {
        const formatter = new Intl.DateTimeFormat(locale, options);

        return formatter.formatToParts(new Date)
            .map(
                (part) => {
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
                },
            ).join('');
    }

    /**
     * DateTimePicker Class
     * @class
     */
    class DateTimePicker extends ui.BaseComponent {
        /**
         * New DateTimePicker constructor.
         * @param {HTMLElement} node The input node.
         * @param {object} [options] The options to create the DateTimePicker with.
         */
        constructor(node, options) {
            super(node, options);

            this._dateOptions = {
                locale: this._options.locale || DateTime.getDefaultLocale(),
                timeZone: this._options.timeZone || DateTime.getDefaultTimeZone(),
            };

            if (this._options.minDate) {
                this._minDate = this._parseDate(this._options.minDate);
            }

            if (this._options.maxDate) {
                this._maxDate = this._parseDate(this._options.maxDate);
            }

            this._useDayPeriod = checkDayPeriod(this._dateOptions.locale);

            if (!this._options.format) {
                this._options.format = this._options.multiDate ?
                    getDefaultDateFormat(this._dateOptions.locale, this._useDayPeriod) :
                    getDefaultFormat(this._dateOptions.locale, this._useDayPeriod);
            }

            this._checkFormat();

            const value = $.getValue(this._node);

            if (this._options.multiDate) {
                this._dates = [...new Set(value.split(this._options.multiDateSeparator))]
                    .map((val) => this._makeDate(val))
                    .filter((date) => date && this._isValid(date));
            } else {
                this._date = this._makeDate(value);

                if (!this._date && this._options.useCurrent) {
                    this._date = this._now();
                }

                if (this._date && !this._isValid(this._date)) {
                    this._date = null;
                }
            }

            if (this._options.defaultDate) {
                this._defaultDate = this._parseDate(this._options.defaultDate);
            }

            if (!this._defaultDate) {
                this._defaultDate = this._now();
            }

            if (this._hasHours && !this._isValid(this._defaultDate)) {
                let current = this._defaultDate.startOf('day');
                const endOfDay = this._defaultDate.endOf('day');

                while (current.isBefore(endOfDay)) {
                    if (this._isValid(current)) {
                        this._defaultDate = current;
                        break;
                    }

                    current = current.add(5, 'minutes');
                }
            }

            if (this._options.inline) {
                this._options.modal = false;
            } else if (!this._options.modal && this._options.mobileModal) {
                this._options.modal = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
            }

            if (
                this._date ||
                (this._options.multiDate && this._dates.length) ||
                (value && !this._options.keepInvalid)
            ) {
                this._updateValue();
            }

            this._render();
            this._events();
            this._resetView();

            if (this._options.modal) {
                this._renderModal();
                this._eventsModal();
            } else if (this._options.inline) {
                this._refresh();
            }

            this._refreshDisabled();

            $.setData(this._menuNode, { input: this._node });
        }

        /**
         * Disable the DateTimePicker.
         */
        disable() {
            $.setAttribute(this._node, { disabled: true });
            this._refreshDisabled();
            this._refresh();
        }

        /**
         * Clear the current value.
         */
        clear() {
            this.setDate(null);
        }

        /**
         * Dispose the DateTimePicker.
         */
        dispose() {
            if (this._popper) {
                this._popper.dispose();
                this._popper = null;
            }

            if (this._modal) {
                ui.Modal.init(this._modal).dispose();
                this._modal = null;
                this._setBtn = null;
                this._toolbarYear = null;
                this._toolbarDate = null;
                this._toolbarTime = null;
            }

            $.removeEvent(this._node, 'change.ui.datetimepicker');
            $.removeEvent(this._node, 'input.ui.datetimepicker');
            $.removeEvent(this._node, 'click.ui.datetimepicker');
            $.removeEvent(this._node, 'focus.ui.datetimepicker');
            $.removeEvent(this._node, 'keydown.ui.datetimepicker');
            $.removeEvent(this._node, 'keyup.ui.datetimepicker');

            $.remove(this._menuNode);

            this._date = null;
            this._dates = null;
            this._minDate = null;
            this._maxDate = null;
            this._viewDate = null;
            this._defaultDate = null;
            this._dateOptions = null;
            this._menuNode = null;
            this._container = null;
            this._dateContainer = null;
            this._timeContainer = null;
            this._showTimeTable = null;
            this._showDateTable = null;
            this._closeTable = null;

            super.dispose();
        }

        /**
         * Enable the DateTimePicker.
         */
        enable() {
            $.removeAttribute(this._node, 'disabled');
            this._refreshDisabled();
            this._refresh();
        }

        /**
         * Get the current date(s).
         * @return {DateTime|array} The current date(s).
         */
        getDate() {
            if (this._options.multiDate) {
                return this._dates.slice();
            }

            return this._date;
        }

        /**
         * Get the maximum date.
         * @return {DateTime|array} The maximum date.
         */
        getMaxDate() {
            if (!this._maxDate) {
                return null;
            }

            return this._maxDate;
        }

        /**
         * Get the minimum date.
         * @return {DateTime|array} The minimum date.
         */
        getMinDate() {
            if (!this._minDate) {
                return null;
            }

            return this._minDate;
        }

        /**
         * Get the view date.
         * @return {DateTime} The view date.
         */
        getViewDate() {
            return this._viewDate;
        }

        /**
         * Hide the DateTimePicker.
         */
        hide() {
            if (this._options.inline) {
                return;
            }

            if (this._options.modal) {
                ui.Modal.init(this._modal).hide();
                return;
            }

            if (
                !$.isConnected(this._menuNode) ||
                $.getDataset(this._menuNode, 'uiAnimating') ||
                !$.triggerOne(this._node, 'hide.ui.datetimepicker')
            ) {
                return;
            }

            $.setDataset(this._menuNode, { uiAnimating: 'out' });

            const focusableNodes = $.find('[tabindex]', this._menuNode);
            $.setAttribute(focusableNodes, { tabindex: -1 });

            $.fadeOut(this._menuNode, {
                duration: this._options.duration,
            }).then((_) => {
                this._popper.dispose();
                this._popper = null;

                $.detach(this._menuNode);
                $.removeDataset(this._menuNode, 'uiAnimating');
                $.triggerEvent(this._node, 'hidden.ui.datetimepicker');
            }).catch((_) => {
                if ($.getDataset(this._menuNode, 'uiAnimating') === 'out') {
                    $.removeDataset(this._menuNode, 'uiAnimating');
                }
            });
        }

        /**
         * Refresh the DateTimePicker.
         */
        refresh() {
            if (this._options.multiDate) {
                this._setDates(this._dates);
            } else {
                this._setDate(this._date);
            }
        }

        /**
         * Set the current date(s).
         * @param {string|number|array|Date|DateTime} date The input date(s).
         */
        setDate(date) {
            if (this._options.multiDate) {
                const dates = this._parseDates(date);
                this._setDates(dates);
            } else {
                date = this._parseDate(date);
                this._setDate(date);
            }
        }

        /**
         * Set the maximum date.
         * @param {string|number|array|Date|DateTime} maxDate The input date(s).
         */
        setMaxDate(maxDate) {
            this._maxDate = this._parseDate(maxDate);

            this.refresh();
        }

        /**
         * Set the minimum date.
         * @param {string|number|array|Date|DateTime} minDate The input date(s).
         */
        setMinDate(minDate) {
            this._minDate = this._parseDate(minDate);

            this.refresh();
        }

        /**
         * Show the DateTimePicker.
         */
        show() {
            if (
                this._options.inline ||
                $.isConnected(this._menuNode) ||
                !this._isEditable()
            ) {
                return;
            }

            if (this._options.modal) {
                if (this._options.appendTo) {
                    $.append(this._options.appendTo, this._modal);
                } else {
                    const parentModal = $.closest(this._node, '.modal').shift();

                    if (parentModal) {
                        $.after(parentModal, this._modal);
                    } else {
                        $.after(this._node, this._modal);
                    }
                }

                this._resetView();
                this._refresh();

                const modal = ui.Modal.init(this._modal);

                if (this._activeTarget) {
                    modal._activeTarget = this._activeTarget;
                }

                modal.show();
                return;
            }

            if (
                $.getDataset(this._menuNode, 'uiAnimating') ||
                !$.triggerOne(this._node, 'show.ui.datetimepicker')
            ) {
                return;
            }

            $.setDataset(this._menuNode, { uiAnimating: 'in' });

            if (this._options.appendTo) {
                $.append(this._options.appendTo, this._menuNode);
            } else {
                $.after(this._node, this._menuNode);
            }

            this._resetView();
            this._refresh();

            this._popper = new ui.Popper(
                this._menuNode,
                {
                    reference: this._node,
                    placement: this._options.placement,
                    position: this._options.position,
                    fixed: this._options.fixed,
                    spacing: this._options.spacing,
                    minContact: this._options.minContact,
                },
            );

            $.fadeIn(this._menuNode, {
                duration: this._options.duration,
            }).then((_) => {
                $.removeDataset(this._menuNode, 'uiAnimating');
                $.triggerEvent(this._node, 'shown.ui.datetimepicker');
            }).catch((_) => {
                if ($.getDataset(this._menuNode, 'uiAnimating') === 'in') {
                    $.removeDataset(this._menuNode, 'uiAnimating');
                }
            });
        }

        /**
         * Toggle the DateTimePicker.
         */
        toggle() {
            if ($.isConnected(this._menuNode)) {
                this.hide();
            } else {
                this.show();
            }
        }

        /**
         * Update the DateTimePicker position.
         */
        update() {
            if (this._popper) {
                this._popper.update();
            }
        }
    }

    /**
     * Test if a date is after another date (day).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is after the other date, otherwise FALSE.
     */
    function isAfterDay(a, b) {
        return isAfterMonth(a, b) || (isSameMonth(a, b) && a.getDate() > b.getDate());
    }
    /**
     * Test if a date is after another date (month).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is after the other date, otherwise FALSE.
     */
    function isAfterMonth(a, b) {
        return isAfterYear(a, b) || (isSameYear(a, b) && a.getMonth() > b.getMonth());
    }
    /**
     * Test if a date is after another date (second).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is after the other date, otherwise FALSE.
     */
    function isAfterSecond(a, b) {
        return a.getTimestamp() > b.getTimestamp();
    }
    /**
     * Test if a date is after another date (year).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is after the other date, otherwise FALSE.
     */
    function isAfterYear(a, b) {
        return a.getYear() > b.getYear();
    }
    /**
     * Test if a date is before another date (day).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is before the other date, otherwise FALSE.
     */
    function isBeforeDay(a, b) {
        return isBeforeMonth(a, b) || (isSameMonth(a, b) && a.getDate() < b.getDate());
    }
    /**
     * Test if a date is before another date (month).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is before the other date, otherwise FALSE.
     */
    function isBeforeMonth(a, b) {
        return isBeforeYear(a, b) || (isSameYear(a, b) && a.getMonth() < b.getMonth());
    }
    /**
     * Test if a date is before another date (second).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is before the other date, otherwise FALSE.
     */
    function isBeforeSecond(a, b) {
        return a.getTimestamp() < b.getTimestamp();
    }
    /**
     * Test if a date is before another date (year).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is before the other date, otherwise FALSE.
     */
    function isBeforeYear(a, b) {
        return a.getYear() < b.getYear();
    }
    /**
     * Test if a date is equal to another date (day).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
     */
    function isSameDay(a, b) {
        return isSameMonth(a, b) && a.getDate() === b.getDate();
    }
    /**
     * Test if a date is equal to another date (month).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
     */
    function isSameMonth(a, b) {
        return isSameYear(a, b) && a.getMonth() === b.getMonth();
    }
    /**
     * Test if a date is equal to another date (second).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
     */
    function isSameSecond(a, b) {
        return a.getTimestamp() === b.getTimestamp();
    }
    /**
     * Test if a date is equal to another date (year).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @return {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
     */
    function isSameYear(a, b) {
        return a.getYear() === b.getYear();
    }

    /**
     * Attach events for the DateTimePicker.
     */
    function _events() {
        $.addEvent(this._node, 'change.ui.datetimepicker', (e) => {
            if (e.skipUpdate) {
                return;
            }

            const value = $.getValue(this._node);
            if (this._options.multiDate) {
                const dates = value.split(this._options.multiDateSeparator);

                const validDates = [...new Set(dates)]
                    .map((val) => this._makeDate(val))
                    .filter((date) => date && this._isValid(date));

                if (validDates.length === dates.length) {
                    this._setDates(validDates);
                } else if (!this._options.keepInvalid && value) {
                    if (validDates.length) {
                        this._setDates(validDates);
                    } else {
                        this._setDates(this._dates);
                    }
                } else {
                    this._dates = validDates;
                    this._refresh();
                }
            } else {
                const date = this._makeDate(value);

                if (date && this._isValid(date)) {
                    this._setDate(date);
                } else if (!this._options.keepInvalid && value) {
                    this._setDate(this._date);
                } else {
                    this._date = null;
                    this._refresh();
                }
            }
        });

        if (this._hasYear) {
            this._eventsDate();
        }

        if (this._hasHours) {
            this._eventsTime();
        }

        $.addEvent(this._menuNode, 'click.ui.datetimepicker', (e) => {
            // prevent menu node from closing modal
            e.stopPropagation();
        });

        if (this._options.inline) {
            return;
        }

        $.addEvent(this._node, 'input.ui.datetimepicker', (_) => {
            const value = $.getValue(this._node);
            if (this._options.multiDate) {
                const dates = value.split(this._options.multiDateSeparator);

                const validDates = [...new Set(dates)]
                    .map((val) => this._makeDate(val))
                    .filter((date) => date && this._isValid(date));

                if (validDates.length) {
                    this._dates = validDates;
                    this._refresh();
                }
            } else {
                const date = this._makeDate(value);

                if (date && this._isValid(date)) {
                    this._date = date;
                    this._refresh();
                }
            }
        });

        $.addEvent(this._node, 'click.ui.datetimepicker', (_) => {
            if ($.getDataset(this._menuNode, 'uiAnimating') === 'in') {
                return;
            }

            if (!this._options.modal) {
                $.stop(this._menuNode);
                $.removeDataset(this._menuNode, 'uiAnimating');
            } else {
                this._activeTarget = this._node;
            }

            this.show();
        });

        if (!this._options.modal) {
            $.addEvent(this._node, 'focus.ui.datetimepicker', (_) => {
                if (!$.isSame(this._node, document.activeElement)) {
                    return;
                }

                $.stop(this._menuNode);
                $.removeDataset(this._menuNode, 'uiAnimating');

                this.show();
            });

            $.addEvent(this._menuNode, 'keydown.ui.datetimepicker', (e) => {
                if (e.code !== 'Tab') {
                    return;
                }

                const focusableNodes = $.find('[tabindex="0"]', this._menuNode);
                const focusIndex = $.indexOf(focusableNodes, e.target);

                if (e.shiftKey && focusIndex === 0) {
                    e.preventDefault();

                    $.focus(this._node);
                } else if (!e.shiftKey && focusIndex === focusableNodes.length - 1) {
                    $.focus(this._node);

                    this.hide();
                }
            });
        }

        $.addEvent(this._node, 'keydown.ui.datetimepicker', (e) => {
            switch (e.code) {
                case 'Enter':
                case 'NumpadEnter':
                    e.preventDefault();

                    this.toggle();
                    break;
                case 'Escape':
                    if ($.isConnected(this._menuNode)) {
                        // prevent node from closing modal
                        e.stopPropagation();

                        this.hide();
                    }
                    break;
                case 'Tab':
                    if (
                        e.shiftKey &&
                        !this._options.modal &&
                        $.isConnected(this._menuNode)
                    ) {
                        this.hide();
                    } else if (
                        !e.shiftKey &&
                        !this._options.modal &&
                        $.isConnected(this._menuNode) &&
                        !$.getDataset(this._menuNode, 'uiAnimating')
                    ) {
                        e.preventDefault();

                        const focusNode = $.findOne('[tabindex="0"]', this._menuNode);
                        $.focus(focusNode);
                    }
                    break;
            }
        });
    }
    /**
     * Attach time events for the DateTimePicker.
     */
    function _eventsTime() {
        const updateValue = !this._options.modal;

        const switchPeriod = (date) => {
            const currentHours = date.getHours();
            return date.setHours(
                currentHours + (currentHours < 12 ? 12 : -12),
            );
        };

        const handleAction = (e) => {
            e.preventDefault();

            const element = e.currentTarget;
            const action = $.getDataset(element, 'uiAction');
            let tempDate = this._date ?
                this._date :
                this._defaultDate;
            let focusSelector;

            switch (action) {
                case 'setHours':
                    tempDate = tempDate.setHours(
                        $.getDataset(element, 'uiHour'),
                    );

                    this._timeViewMode = null;

                    this._setDate(tempDate, { updateValue });

                    if (this._hasMinutes) {
                        focusSelector = '[data-ui-action="changeView"][data-ui-time-view="minutes"]';
                    } else if (this._useDayPeriod) {
                        focusSelector = '[data-ui-action="togglePeriod"]';
                    }

                    break;
                case 'setMinutes':
                    tempDate = tempDate.setMinutes(
                        $.getDataset(element, 'uiMinute'),
                    );

                    this._timeViewMode = null;

                    this._setDate(tempDate, { updateValue });

                    if (this._useDayPeriod) {
                        focusSelector = '[data-ui-action="togglePeriod"]';
                    }

                    break;
                case 'togglePeriod':
                    tempDate = switchPeriod(tempDate);

                    this._setDate(tempDate, { updateValue });

                    focusSelector = '[data-ui-action="togglePeriod"]';

                    break;
                case 'changeView':
                    this._timeViewMode = $.getDataset(element, 'uiTimeView');

                    this._refreshTime();

                    focusSelector = '[data-ui-focus="true"]';

                    break;
                case 'next':
                case 'prev':
                    const unit = $.getDataset(element, 'uiUnit');
                    const amount = unit === 'minute' ?
                        this._options.minuteStepping :
                        1;

                    if (action === 'prev') {
                        tempDate = tempDate.sub(amount, unit);
                    } else {
                        tempDate = tempDate.add(amount, unit);
                    }

                    this._setDate(tempDate, { updateValue });

                    focusSelector = `[data-ui-action="${action}"][data-ui-unit="${unit}"]`;

                    break;
                case 'showDate':
                    $.insertBefore(this._dateContainer, this._timeContainer);
                    $.setStyle(this._dateContainer, { display: '' });
                    $.squeezeIn(this._dateContainer, {
                        duration: 100,
                    });
                    $.squeezeOut(this._timeContainer, {
                        duration: 100,
                    }).then((_) => {
                        $.detach(this._timeContainer);
                        this.update();

                        const focusDate = $.findOne('[data-ui-focus="true"]', this._dateContainer);
                        $.focus(focusDate);
                    });
                    break;
                case 'close':
                    if (!this._date && !this._hasDate) {
                        this._setDate(this._viewDate);
                    }

                    this.hide();
                    $.focus(this._node);
                    break;
            }

            if (focusSelector) {
                const focusNode = $.findOne(focusSelector, this._timeContainer);
                $.focus(focusNode);
            }
        };

        $.addEventDelegate(this._timeContainer, 'click.ui.datetimepicker', '[data-ui-action]', (e) => {
            if (e.button) {
                return;
            }

            handleAction(e);
        });

        $.addEventDelegate(this._timeContainer, 'keydown.ui.datetimepicker', '[data-ui-action]', (e) => {
            switch (e.code) {
                case 'Enter':
                case 'NumpadEnter':
                case 'Space':
                    handleAction(e);
                    return;
            }

            const action = $.getDataset(e.currentTarget, 'uiAction');

            let tempDate = this._date ?
                this._date :
                this._defaultDate;
            let focusSelector;

            switch (action) {
                case 'setHours':
                    break;
                case 'togglePeriod':
                    switch (e.code) {
                        case 'ArrowUp':
                        case 'ArrowDown':
                            tempDate = switchPeriod(tempDate);

                            focusSelector = `[data-ui-action="${action}"]`;
                            break;
                        default:
                            return;
                    }
                    break;
                default:
                    let timeView;
                    switch (action) {
                        case 'changeView':
                            timeView = $.getDataset(e.currentTarget, 'uiTimeView');
                            break;
                        case 'prev':
                        case 'next':
                            const unit = $.getDataset(e.currentTarget, 'uiUnit');
                            switch (unit) {
                                case 'hour':
                                    timeView = 'hours';
                                    break;
                                case 'minute':
                                    timeView = 'minutes';
                                    break;
                            }
                            break;
                        default:
                            if (this._timeViewMode) {
                                return;
                            }

                            timeView = 'hours';
                            break;
                    }

                    switch (e.code) {
                        case 'ArrowUp':
                            switch (timeView) {
                                case 'hours':
                                    tempDate = tempDate.add(1, 'hour');
                                    break;
                                case 'minutes':
                                    tempDate = tempDate.add(this._options.minuteStepping, 'minute');
                                    break;
                            }

                            break;
                        case 'ArrowDown':
                            switch (timeView) {
                                case 'hours':
                                    tempDate = tempDate.sub(1, 'hour');
                                    break;
                                case 'minutes':
                                    tempDate = tempDate.sub(this._options.minuteStepping, 'minute');
                                    break;
                            }

                            break;
                        default:
                            return;
                    }

                    focusSelector = `[data-ui-action="changeView"][data-ui-time-view="${timeView}"]`;
                    break;
            }

            const newDate = !this._date || !tempDate.isSame(this._date);

            if (newDate || focusSelector) {
                e.preventDefault();
            }

            if (newDate) {
                this._setDate(tempDate, { updateValue });
            }

            if (focusSelector) {
                const focusNode = $.findOne(focusSelector, this._timeContainer);
                $.focus(focusNode);
            }
        });

        $.addEventDelegate(this._timeContainer, 'mousedown.ui.datetimepicker', '[data-ui-focus="false"]', (e) => {
            const focusNode = e.currentTarget;
            const oldFocusNode = $.findOne('[data-ui-focus="true"]', this._timeContainer);

            if (!$.isSame(focusNode, oldFocusNode)) {
                $.setAttribute(oldFocusNode, { tabindex: -1 });
                $.setDataset(oldFocusNode, { uiFocus: false });
                $.setAttribute(focusNode, { tabindex: 0 });
                $.setDataset(focusNode, { uiFocus: true });
            }

            $.focus(focusNode);
        });

        $.addEvent(this._timeContainer, 'keydown.ui.datetimepicker', (e) => {
            let focusNode;

            switch (this._timeViewMode) {
                case 'hours':
                case 'minutes':
                    const nodes = $.find('[data-ui-focus]', this._timeContainer);
                    const focusedIndex = $.indexOf(nodes, '[data-ui-focus="true"]') || 0;
                    switch (e.code) {
                        case 'ArrowUp':
                            focusNode = nodes[focusedIndex - 4];
                            break;
                        case 'ArrowRight':
                            focusNode = nodes[focusedIndex + 1];
                            break;
                        case 'ArrowDown':
                            focusNode = nodes[focusedIndex + 4];
                            break;
                        case 'ArrowLeft':
                            focusNode = nodes[focusedIndex - 1];
                            break;
                        default:
                            return;
                    }

                    break;
                default:
                    return;
            }

            e.preventDefault();

            if (!focusNode) {
                return;
            }

            const oldFocusNode = $.findOne('[data-ui-focus="true"]', this._timeContainer);

            if (!$.isSame(focusNode, oldFocusNode)) {
                $.setAttribute(oldFocusNode, { tabindex: -1 });
                $.setDataset(oldFocusNode, { uiFocus: false });
                $.setAttribute(focusNode, { tabindex: 0 });
                $.setDataset(focusNode, { uiFocus: true });
            }

            $.focus(focusNode);
        });
    }
    /**
     * Attach date events for the DateTimePicker.
     */
    function _eventsDate() {
        const updateValue = !this._options.modal;

        const focusTime = (_) => {
            let focusSelector;
            if (this._hasHours) {
                focusSelector = '[data-ui-action="changeView"][data-ui-time-view="hours"]';
            } else if (this._hasMinutes) {
                focusSelector = '[data-ui-action="changeView"][data-ui-time-view="minutes"]';
            } else if (this._useDayPeriod) {
                focusSelector = '[data-ui-action="togglePeriod"]';
            }

            if (focusSelector) {
                const focusNode = $.findOne(focusSelector, this._timeContainer);
                $.focus(focusNode);
            }
        };

        const showTime = (_) => {
            this._timeViewMode = null;
            this._refreshTime();

            $.insertAfter(this._timeContainer, this._dateContainer);
            $.setStyle(this._timeContainer, { display: '' });
            $.squeezeIn(this._timeContainer, {
                duration: 100,
            });
            $.squeezeOut(this._dateContainer, {
                duration: 100,
            }).then((_) => {
                $.detach(this._dateContainer);
                this.update();

                focusTime();
            });
        };

        const handleAction = (e) => {
            e.preventDefault();

            const element = e.currentTarget;
            const action = $.getDataset(element, 'uiAction');
            let tempDate = this._date ?
                this._date :
                this._defaultDate;

            switch (action) {
                case 'setDate':
                    tempDate = tempDate.setYear(
                        $.getDataset(element, 'uiYear'),
                        $.getDataset(element, 'uiMonth'),
                        $.getDataset(element, 'uiDate'),
                    );

                    if (this._options.multiDate) {
                        let dates;
                        let granularity;

                        switch (this._minView) {
                            case 'years':
                                granularity = 'year';
                                break;
                            case 'months':
                                granularity = 'month';
                                break;
                            default:
                                granularity = 'day';
                                break;
                        }

                        if (this._isCurrent(tempDate, { granularity })) {
                            dates = this._dates.filter((date) => !isSameDay(date, tempDate));
                        } else {
                            dates = this._dates.concat([tempDate]);
                        }

                        this._viewDate = tempDate;

                        this._setDates(dates, { updateValue });
                    } else {
                        tempDate = this._clampDate(tempDate);

                        if (this._hasHours && !this._isValid(tempDate)) {
                            let current = tempDate.startOf('day');
                            const endOfDay = tempDate.endOf('day');

                            while (current.isBefore(endOfDay)) {
                                if (this._isValid(current)) {
                                    tempDate = current;
                                    break;
                                }

                                current = current.add(5, 'minutes');
                            }
                        }

                        this._viewDate = tempDate;

                        this._setDate(tempDate, { updateValue });

                        if (this._hasHours) {
                            if (this._options.sideBySide) {
                                focusTime();
                            } else {
                                showTime();
                            }
                        } else if (!this._options.keepOpen && !this._options.modal && !this._options.inline) {
                            this.hide();
                            $.focus(this._node);
                        }
                    }

                    break;
                case 'changeView':
                    this._viewMode = $.getDataset(element, 'uiView');

                    if ($.hasDataset(element, 'uiYear')) {
                        this._viewDate = this._viewDate.setYear(
                            $.getDataset(element, 'uiYear'),
                            $.getDataset(element, 'uiMonth'),
                            $.getDataset(element, 'uiDate'),
                        );
                    }

                    this._refreshDate();

                    const focusDate = $.findOne('[data-ui-focus="true"]', this._dateContainer);
                    $.focus(focusDate);

                    break;
                case 'showTime':
                    showTime();
                    break;
                case 'next':
                case 'prev':
                    const amount = $.getDataset(element, 'uiAmount') || 1;
                    const unit = $.getDataset(element, 'uiUnit');

                    if (action === 'prev') {
                        this._viewDate = this._viewDate.sub(amount, unit);
                    } else {
                        this._viewDate = this._viewDate.add(amount, unit);
                    }

                    this._refreshDate();

                    const focusAction = $.findOne(`[data-ui-action="${action}"]`, this._dateContainer);
                    $.focus(focusAction);

                    break;
                case 'close':
                    this.hide();
                    $.focus(this._node);
                    break;
            }
        };

        const refreshDate = () => {
            const year = this._viewDate.getYear();
            const month = this._viewDate.getMonth();
            const date = this._viewDate.getDate();

            let focusSelector;

            switch (this._viewMode) {
                case 'days':
                    focusSelector = `[data-ui-year="${year}"][data-ui-month="${month}"][data-ui-date="${date}"]`;
                    break;
                case 'months':
                    focusSelector = `[data-ui-year="${year}"][data-ui-month="${month}"]`;
                    break;
                case 'years':
                    focusSelector = `[data-ui-year="${year}"]`;
                    break;
            }

            let focusNode = $.findOne(focusSelector, this._dateContainer);

            if (!focusNode) {
                this._refreshDate();
                focusNode = $.findOne(focusSelector, this._dateContainer);
            } else {
                const oldFocusNode = $.findOne('[data-ui-focus="true"]', this._dateContainer);

                if (!$.isSame(focusNode, oldFocusNode)) {
                    $.setAttribute(oldFocusNode, { tabindex: -1 });
                    $.setDataset(oldFocusNode, { uiFocus: false });
                    $.setAttribute(focusNode, { tabindex: 0 });
                    $.setDataset(focusNode, { uiFocus: true });
                }
            }

            $.focus(focusNode);
        };

        $.addEventDelegate(this._dateContainer, 'click.ui.datetimepicker', '[data-ui-action]', (e) => {
            if (e.button) {
                return;
            }

            handleAction(e);
        });

        $.addEventDelegate(this._dateContainer, 'keydown.ui.datetimepicker', '[data-ui-action]', (e) => {
            switch (e.code) {
                case 'Enter':
                case 'NumpadEnter':
                case 'Space':
                    handleAction(e);
                    return;
            }
        });

        $.addEventDelegate(this._dateContainer, 'mousedown.ui.datetimepicker', '[data-ui-focus="false"]', (e) => {
            let tempView = this._viewDate;

            tempView = tempView.setYear(
                $.getDataset(e.currentTarget, 'uiYear'),
                $.getDataset(e.currentTarget, 'uiMonth'),
                $.getDataset(e.currentTarget, 'uiDate'),
            );

            if (tempView.isSame(this._viewDate)) {
                return;
            }

            this._viewDate = tempView;

            refreshDate();
        });

        $.addEvent(this._dateContainer, 'keydown.ui.datetimepicker', (e) => {
            let tempView = this._viewDate;

            switch (e.code) {
                case 'ArrowUp':
                    switch (this._viewMode) {
                        case 'days':
                            if (e.ctrlKey) {
                                tempView = tempView.sub(1, 'year');
                            } else {
                                tempView = tempView.sub(1, 'week');
                            }
                            break;
                        case 'months':
                            tempView = tempView.sub(3, 'months');
                            break;
                        case 'years':
                            tempView = tempView.sub(3, 'years');
                            break;
                    }
                    break;
                case 'ArrowRight':
                    switch (this._viewMode) {
                        case 'days':
                            if (e.ctrlKey) {
                                tempView = tempView.add(1, 'month');
                            } else {
                                tempView = tempView.add(1, 'day');
                            }
                            break;
                        case 'months':
                            tempView = tempView.add(1, 'month');
                            break;
                        case 'years':
                            tempView = tempView.add(1, 'year');
                            break;
                    }
                    break;
                case 'ArrowDown':
                    switch (this._viewMode) {
                        case 'days':
                            if (e.ctrlKey) {
                                tempView = tempView.add(1, 'year');
                            } else {
                                tempView = tempView.add(1, 'week');
                            }
                            break;
                        case 'months':
                            tempView = tempView.add(3, 'months');
                            break;
                        case 'years':
                            tempView = tempView.add(3, 'years');
                            break;
                    }
                    break;
                case 'ArrowLeft':
                    switch (this._viewMode) {
                        case 'days':
                            if (e.ctrlKey) {
                                tempView = tempView.sub(1, 'month');
                            } else {
                                tempView = tempView.sub(1, 'day');
                            }
                            break;
                        case 'months':
                            tempView = tempView.sub(1, 'month');
                            break;
                        case 'years':
                            tempView = tempView.sub(1, 'year');
                            break;
                    }
                    break;
                case 'Home':
                    switch (this._viewMode) {
                        case 'days':
                            tempView = tempView.startOf('week');
                            break;
                    }
                    break;
                case 'End':
                    switch (this._viewMode) {
                        case 'days':
                            tempView = tempView.endOf('week');
                            break;
                    }
                    break;
                case 'PageUp':
                    switch (this._viewMode) {
                        case 'days':
                            tempView = tempView.sub(1, 'month');
                            break;
                    }
                    break;
                case 'PageDown':
                    switch (this._viewMode) {
                        case 'days':
                            tempView = tempView.add(1, 'month');
                            break;
                    }
                    break;
                default:
                    return;
            }

            e.preventDefault();

            if (tempView.isSame(this._viewDate)) {
                return;
            }

            if (!this._isBeforeMax(tempView, { allowSame: true }) || !this._isAfterMin(tempView, { allowSame: true })) {
                return;
            }

            this._viewDate = tempView;

            refreshDate();
        });
    }
    /**
     * Attach events for the Modal.
     */
    function _eventsModal() {
        let originalDate;
        this._keepDate = false;

        $.addEvent(this._modal, 'show.ui.modal', (_) => {
            if (!$.triggerOne(this._node, 'show.ui.datetimepicker')) {
                return false;
            }

            if (this._options.multiDate) {
                originalDate = this._dates;
            } else {
                originalDate = this._date;
            }
        });

        $.addEvent(this._modal, 'shown.ui.modal', (_) => {
            $.triggerEvent(this._node, 'shown.ui.datetimepicker');
        });

        $.addEvent(this._modal, 'hide.ui.modal', (_) => {
            if (!$.triggerOne(this._node, 'hide.ui.datetimepicker')) {
                this._keepDate = false;
                return false;
            }

            this._activeTarget = null;

            if (this._keepDate) {
                if (this._options.multiDate) {
                    this._setDates(this._dates);
                } else {
                    this._setDate(this._date);
                }
            }
        });

        $.addEvent(this._modal, 'hidden.ui.modal', (_) => {
            if (!this._keepDate) {
                if (this._options.multiDate) {
                    this._setDates(originalDate);
                } else {
                    this._setDate(originalDate);
                }
                originalDate = null;
            }

            this._keepDate = false;
            $.detach(this._modal);
            $.triggerEvent(this._node, 'hidden.ui.datetimepicker');
        });

        $.addEvent(this._setBtn, 'click.ui.modal', (_) => {
            this._keepDate = true;
        });
    }

    /**
     * Check the format for date and time components.
     */
    function _checkFormat() {
        this._hasYear = false;
        this._hasMonth = false;
        this._hasDate = false;
        this._hasHours = false;
        this._hasMinutes = false;

        const tokens = this._options.format.matchAll(/([a-z])\1*|'[^']*'/ig);
        for (const token of tokens) {
            if (!token[1]) {
                continue;
            }

            switch (token[1]) {
                case 'y':
                case 'Y':
                    this._hasYear = true;
                    break;
                case 'M':
                case 'L':
                    this._hasMonth = true;
                    break;
                case 'd':
                case 'D':
                    this._hasDate = true;
                    break;
                case 'h':
                case 'H':
                case 'K':
                case 'k':
                    this._hasHours = true;
                    break;
                case 'm':
                    this._hasMinutes = true;
                    break;
            }
        }

        if (this._hasDate && !this._hasMonth) {
            throw new Error('Date selector requires a month.');
        }

        if (this._hasMonth && !this._hasYear) {
            throw new Error('Month selector requires a year.');
        }

        if (this._hasMinutes && !this._hasHours) {
            throw new Error('Minute selector requires hours.');
        }

        if (this._hasHours && this._hasYear && !this._hasDate) {
            throw new Error('Date/time selector requires a day of month.');
        }

        if (this._hasHours && this._options.multiDate) {
            throw new Error('Time selector cannot be used with multiDate option.');
        }

        if (this._hasDate) {
            this._minView = 'days';
        } else if (this._hasMonth) {
            this._minView = 'months';
        } else if (this._hasYear) {
            this._minView = 'years';
        }
    }
    /**
     * Clamp a date between min and max dates.
     * @param {DateTime} date The input date.
     * @return {DateTime} The clamped date.
     */
    function _clampDate(date) {
        if (!this._isAfterMin(date)) {
            date = date.setTimestamp(this._minDate.getTimestamp());
        }

        if (!this._isBeforeMax(date)) {
            date = date.setTimestamp(this._maxDate.getTimestamp());
        }

        return date;
    }
    /**
     * Clamp a date to the nearest stepping interval.
     * @param {DateTime} date The input date.
     * @return {DateTime} The clamped date.
     */
    function _clampStepping(date) {
        if (!this._hasMinutes || this._options.minuteStepping == 1) {
            return date;
        }

        const minutes = date.getMinutes();
        const stepMinutes = Math.min(
            $._toStep(minutes, this._options.minuteStepping),
            60,
        );

        if (minutes !== stepMinutes) {
            return date.setMinutes(stepMinutes);
        }

        return date;
    }
    /**
     * Format a date.
     * @param {DateTime} [date] The date to format.
     * @return {string} The formatted date.
     */
    function _formatDate(date) {
        if (!date) {
            return '';
        }

        return date.format(this._options.format);
    }
    /**
     * Format multiple dates.
     * @param {array} [dates] The dates to format.
     * @return {string} The formatted dates.
     */
    function _formatDates(dates) {
        return dates
            .map((date) => date.format(this._options.format))
            .join(this._options.multiDateSeparator);
    }
    /**
     * Determine whether a date is between min/max dates.
     * @param {DateTime} date The date to test.
     * @param {object} [options] The options for how to compare the dates.
     * @param {string} [options.granularity] The level of granularity to use for comparison.
     * @param {Boolean} [options.allowSame=false] Whether to also allow same check.
     * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
     */
    function _isAfterMin(date, { granularity = null, allowSame = false } = {}) {
        if (!this._minDate) {
            return true;
        }

        switch (granularity) {
            case 'day':
                return (allowSame && isSameDay(date, this._minDate)) || isAfterDay(date, this._minDate);
            case 'month':
                return (allowSame && isSameMonth(date, this._minDate)) || isAfterMonth(date, this._minDate);
            case 'year':
                return (allowSame && isSameYear(date, this._minDate)) || isAfterYear(date, this._minDate);
            default:
                return (allowSame && isSameSecond(date, this._minDate)) || isAfterSecond(date, this._minDate);
        }
    }
    /**
     * Determine whether a date is between min/max dates.
     * @param {DateTime} date The date to test.
     * @param {object} [options] The options for how to compare the dates.
     * @param {string} [options.granularity] The level of granularity to use for comparison.
     * @param {Boolean} [options.allowSame=false] Whether to also allow same check.
     * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
     */
    function _isBeforeMax(date, { granularity = null, allowSame = false } = {}) {
        if (!this._maxDate) {
            return true;
        }

        switch (granularity) {
            case 'day':
                return (allowSame && isSameDay(date, this._maxDate)) || isBeforeDay(date, this._maxDate);
            case 'month':
                return (allowSame && isSameMonth(date, this._maxDate)) || isBeforeMonth(date, this._maxDate);
            case 'year':
                return (allowSame && isSameYear(date, this._maxDate)) || isBeforeYear(date, this._maxDate);
            default:
                return (allowSame && isSameSecond(date, this._maxDate)) || isBeforeSecond(date, this._maxDate);
        }
    }
    /**
     * Determine whether a date is a "current" date.
     * @param {DateTime} date The date to test.
     * @param {object} [options] The options for how to compare the dates.
     * @param {string} [options.granularity] The level of granularity to use for comparison.
     * @return {Boolean} TRUE if the date is a "current" date, otherwise FALSE.
     */
    function _isCurrent(date, { granularity = null } = {}) {
        let callback;
        switch (granularity) {
            case 'month':
                callback = isSameMonth;
                break;
            case 'year':
                callback = isSameYear;
                break;
            default:
                callback = isSameDay;
                break;
        }

        if (this._options.multiDate) {
            return !!this._dates.find((currentDate) => callback(date, currentDate));
        }

        return this._date && callback(date, this._date);
    }
    /**
     * Determine whether the input is editable.
     * @return {Boolean} TRUE if the input is editable, otherwise FALSE.
     */
    function _isEditable() {
        return !$.is(this._node, ':disabled') && (this._options.ignoreReadonly || !$.is(this._node, ':read-only'));
    }
    /**
     * Determine whether a date is valid.
     * @param {DateTime} date The date to test.
     * @param {object} [options] The options for how to compare the dates.
     * @param {string} [options.granularity=second] The level of granularity to use for comparison.
     * @return {Boolean} TRUE if the date is valid, otherwise FALSE.
     */
    function _isValid(date, { granularity = 'second' } = {}) {
        let minMaxGranularity;
        switch (granularity) {
            case 'year':
            case 'month':
            case 'day':
                minMaxGranularity = granularity;
                break;
        }

        if (!this._isAfterMin(date, { granularity: minMaxGranularity, allowSame: true })) {
            return false;
        }

        if (!this._isBeforeMax(date, { granularity: minMaxGranularity, allowSame: true })) {
            return false;
        }

        if (this._options.isValidYear && !this._options.isValidYear(date)) {
            return false;
        }

        if (granularity === 'year') {
            return true;
        }

        if (this._options.isValidMonth && !this._options.isValidMonth(date)) {
            return false;
        }

        if (granularity === 'month') {
            return true;
        }

        if (this._options.isValidDay && !this._options.isValidDay(date)) {
            return false;
        }

        if (granularity === 'day' || !this._hasHours) {
            return true;
        }

        if (this._options.isValidTime && !this._options.isValidTime(date)) {
            return false;
        }

        return true;
    }
    /**
     * Create a new DateTime object from format.
     * @param {string} date The date string.
     * @return {DateTime|null} The new DateTime.
     */
    function _makeDate(date) {
        if (date === null) {
            return date;
        }

        date = `${date}`.trim();

        if (date === '') {
            return null;
        }

        const formats = [this._options.format, ...this._options.altFormats];

        for (const format of formats) {
            try {
                const newDate = DateTime$1.fromFormat(format, date, this._dateOptions);

                if (!newDate.isValid) {
                    continue;
                }

                return this._clampStepping(newDate);
            } catch (e) { }
        }

        return null;
    }
    /**
     * Create a new DateTime object set to the current date/time.
     * @return {DateTime} The new DateTime.
     */
    function _now() {
        return this._clampStepping(DateTime$1.now(this._dateOptions));
    }
    /**
     * Parse a DateTime from any value.
     * @param {string|number|array|Date|DateTime} date The date to parse.
     * @return {DateTime} The parsed DateTime.
     */
    function _parseDate(date) {
        if (!date) {
            return null;
        }

        if (date instanceof DateTime$1) {
            return DateTime$1.fromTimestamp(
                date.getTimestamp(),
                this._dateOptions,
            );
        }

        if ($._isString(date)) {
            try {
                return this._makeDate(date);
            } catch (e) {
                return new DateTime$1(date, this._dateOptions);
            }
        }

        if (date instanceof Date) {
            return DateTime$1.fromDate(date, this._dateOptions);
        }

        if ($._isNumber(date)) {
            return DateTime$1.fromTimestamp(date, this._dateOptions);
        }

        if ($._isArray(date)) {
            return DateTime$1.fromArray(date, this._dateOptions);
        }

        return null;
    }
    /**
     * Parse DateTime objects from an array of values.
     * @param {array} dates The dates to parse.
     * @return {array} An array of parsed DateTime objects.
     */
    function _parseDates(dates) {
        if (!dates) {
            return null;
        }

        return dates
            .map((date) => this._parseDate(date))
            .filter((date) => !!date);
    }
    /**
     * Refresh the date and time UI elements.
     */
    function _refresh() {
        if (this._options.showToolbar) {
            if (this._date) {
                if (this._hasYear) {
                    $.setText(this._toolbarYear, this._date.format('yyyy'));
                }

                if (this._hasDate) {
                    $.setText(this._toolbarDate, this._date.format('MMM d'));
                } else if (this._hasMonth) {
                    $.setText(this._toolbarDate, this._date.format('MMM'));
                }

                if (this._hasHours) {
                    const timeFormat = getDefaultTimeFormat(this._dateOptions.locale, this._useDayPeriod);
                    $.setText(this._toolbarTime, this._date.format(timeFormat));
                }
            } else {
                if (this._hasYear) {
                    $.setText(this._toolbarYear, '-');
                }

                if (this._hasDate) {
                    $.setText(this._toolbarDate, '- -');
                } else if (this._hasMonth) {
                    $.setText(this._toolbarDate, '-');
                }

                if (this._hasHours) {
                    const timeFormat = this._useDayPeriod ? '-:- -' : '-:-';
                    $.setText(this._toolbarTime, timeFormat);
                }
            }
        }

        if (this._hasYear && $.isConnected(this._dateContainer)) {
            this._refreshDate();
        }

        if (this._hasHours && $.isConnected(this._timeContainer)) {
            this._refreshTime();
        }

        if (this._hasYear && this._hasHours && !this._options.sideBySide && this._isEditable()) {
            const showDate = $.findOne('[data-ui-action="showDate"]', this._showDateTable);
            const showTime = $.findOne('[data-ui-action="showTime"]', this._showTimeTable);

            $.setAttribute(showDate, { tabindex: 0 });
            $.setAttribute(showTime, { tabindex: 0 });
        }
    }
    /**
     * Refresh the date container.
     */
    function _refreshDate() {
        $.empty(this._dateContainer);

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

        if (this._hasHours && !this._options.sideBySide) {
            if (this._options.modal) {
                $.prepend(this._dateContainer, this._showTimeTable);
            } else {
                $.append(this._dateContainer, this._showTimeTable);
            }
        }

        if (this._options.showClose && !this._options.modal && !this._options.inline && !this._hasHours) {
            $.append(this._dateContainer, this._closeTable);
        }

        if (!this._isEditable()) {
            const focusableNodes = $.find('[tabindex]', this._dateContainer);
            $.setAttribute(focusableNodes, { tabindex: -1 });
        }

        this.update();

        $.triggerEvent(this._node, 'refresh.ui.datetimepicker', {
            detail: {
                view: 'date',
                viewMode: this._viewMode,
                viewDate: this._viewDate,
            },
        });
    }
    /**
     * Refresh the toggle disabled.
     */
    function _refreshDisabled() {
        if ($.is(this._node, ':disabled')) {
            $.addClass(this._menuNode, this.constructor.classes.disabled);
        } else {
            $.removeClass(this._menuNode, this.constructor.classes.disabled);
        }
    }
    /**
     * Refresh the time container.
     */
    function _refreshTime() {
        $.empty(this._timeContainer);

        if (this._hasDate && !this._options.sideBySide) {
            $.append(this._timeContainer, this._showDateTable);
        }

        switch (this._timeViewMode) {
            case 'hours':
                this._renderHours();
                break;
            case 'minutes':
                this._renderMinutes();
                break;
            default:
                this._renderTime();
                break;
        }

        if (this._options.showClose && !this._options.modal && !this._options.inline) {
            $.append(this._timeContainer, this._closeTable);
        }

        if (!this._isEditable()) {
            const focusableNodes = $.find('[tabindex]', this._timeContainer);
            $.setAttribute(focusableNodes, { tabindex: -1 });
        }

        this.update();

        $.triggerEvent(this._node, 'refresh.ui.datetimepicker', {
            detail: {
                view: 'time',
                viewMode: this._timeViewMode,
                viewDate: this._viewDate,
            },
        });
    }
    /**
     * Reset the view.
     */
    function _resetView() {
        this._viewMode = this._minView;
        this._timeViewMode = null;

        if (this._options.multiDate && this._dates.length) {
            this._viewDate = this._dates[0];
        } else if (this._date) {
            this._viewDate = this._date;
        } else {
            this._viewDate = this._defaultDate;
        }

        if (this._hasDate && this._hasHours && !this._options.sideBySide) {
            $.detach(this._timeContainer);
            $.append(this._container, this._dateContainer);
        }
    }
    /**
     * Set the current date.
     * @param {DateTime|null} [date] The input date.
     * @param {object} options The options for setting the date.
     * @param {Boolean} [options.updateValue=true] Whether to update the value.
     */
    function _setDate(date, { updateValue = true } = {}) {
        if (!this._isEditable()) {
            return;
        }

        if (date) {
            date = this._clampStepping(date);
        }

        if (date && !this._isValid(date)) {
            date = null;
        }

        const oldDate = this._date;
        this._date = date;

        this._refresh();

        const oldValue = $.getValue(this._node);
        const newValue = this._formatDate(date);

        if (!updateValue || oldValue === newValue) {
            return;
        }

        this._updateValue();

        $.triggerEvent(this._node, 'change.ui.datetimepicker', {
            data: {
                skipUpdate: true,
            },
            detail: {
                old: oldDate,
                new: this._date,
            },
        });
    }
    /**
     * Set the current dates.
     * @param {array} dates The input dates.
     * @param {object} options The options for setting the date.
     * @param {Boolean} [options.updateValue=true] Whether to update the value.
     */
    function _setDates(dates, { updateValue = true } = {}) {
        if (!this._isEditable()) {
            return;
        }

        dates = dates
            .filter((date) => this._isValid(date))
            .sort((a, b) => isBeforeSecond(a, b) ? -1 : 1);

        const oldDates = this._dates;
        this._dates = dates;

        this._refresh();

        const oldValue = $.getValue(this._node);
        const newValue = this._formatDates(dates);

        if (!updateValue || oldValue === newValue) {
            return;
        }

        this._updateValue();

        $.triggerEvent(this._node, 'change.ui.datetimepicker', {
            data: {
                skipUpdate: true,
            },
            detail: {
                old: oldDates,
                new: this._dates.slice(),
            },
        });
    }
    /**
     * Update the input value to the current date.
     */
    function _updateValue() {
        let value;
        if (this._options.multiDate) {
            value = this._formatDates(this._dates);
        } else {
            value = this._formatDate(this._date);
        }

        $.setValue(this._node, value);
    }

    /**
     * Render the DateTimePicker.
     */
    function _render() {
        this._menuNode = $.create('div', {
            class: this.constructor.classes.menu,
        });

        if (this._options.showToolbar) {
            this._renderToolbar();
        }

        this._container = $.create('div', {
            class: this.constructor.classes.container,
        });
        $.append(this._menuNode, this._container);

        if (this._hasYear) {
            this._dateContainer = $.create('div', {
                class: this.constructor.classes.column,
            });

            if (!this._hasHours || this._options.sideBySide) {
                $.append(this._container, this._dateContainer);
            }
        }

        if (this._hasHours) {
            this._timeContainer = $.create('div', {
                class: this.constructor.classes.column,
            });

            if (!this._hasDate || this._options.sideBySide) {
                $.append(this._container, this._timeContainer);
            }
        }

        if (this._hasDate && this._hasHours) {
            if (!this._options.sideBySide) {
                this._showTimeTable = this.constructor._createTable({
                    body: (tbody) => {
                        const tr = $.create('tr');
                        $.append(tbody, tr);

                        const td = $.create('td', {
                            html: this.constructor.icons.time,
                            class: [
                                this.constructor.classes.action,
                                this.constructor.classes.navigation,
                                this.constructor.classes.spacingNav,
                            ],
                            attributes: {
                                'colspan': 7,
                                'role': 'button',
                                'tabindex': 0,
                                'aria-label': this.constructor.lang.selectTime,
                            },
                            dataset: {
                                uiAction: 'showTime',
                            },
                        });

                        $.append(tr, td);
                    },
                });

                this._showDateTable = this.constructor._createTable({
                    body: (tbody) => {
                        const row = $.create('tr');
                        $.append(tbody, row);

                        const td = $.create('td', {
                            html: this.constructor.icons.date,
                            class: [
                                this.constructor.classes.action,
                                this.constructor.classes.navigation,
                                this.constructor.classes.spacingNav,
                            ],
                            attributes: {
                                'colspan': 4,
                                'role': 'button',
                                'tabindex': 0,
                                'aria-label': this.constructor.lang.selectDate,
                            },
                            dataset: {
                                uiAction: 'showDate',
                            },
                        });

                        $.append(row, td);
                    },
                });
            } else if (!this._options.vertical) {
                $.addClass(this._menuNode, this.constructor.classes.menuWide);
                $.addClass(this._container, this.constructor.classes.containerColumns);
            }
        }

        if (this._options.showClose && !this._options.modal && !this._options.inline) {
            this._closeTable = this.constructor._createTable({
                body: (tbody) => {
                    const row = $.create('tr');
                    $.append(tbody, row);

                    const td = $.create('td', {
                        html: this.constructor.icons.close,
                        class: [
                            this.constructor.classes.action,
                            this.constructor.classes.navigation,
                            this.constructor.classes.spacingNav,
                        ],
                        attributes: {
                            'colspan': 4,
                            'role': 'button',
                            'tabindex': 0,
                            'aria-label': this.constructor.lang.close,
                        },
                        dataset: {
                            uiAction: 'close',
                        },
                    });

                    $.append(row, td);
                },
            });
        }

        if (this._options.modal) {
            $.addClass(this._menuNode, 'datetimepicker-modal');
        } else if (this._options.inline) {
            $.addClass(this._menuNode, this.constructor.classes.menuInline);

            $.after(this._node, this._menuNode);
            $.hide(this._node);
        } else {
            $.addClass(this._menuNode, this.constructor.classes.menuShadow);
            $.setAttribute(this._menuNode, {
                'role': 'dialog',
                'aria-modal': true,
            });
        }
    }
    /**
     * Render the days picker.
     */
    function _renderDays() {
        const start = this._viewDate.startOf('month');
        const end = this._viewDate.endOf('month');

        let current = start.startOf('week');
        const last = end.endOf('week');

        let prev; let next;

        if (this._isAfterMin(start)) {
            prev = {
                dataset: {
                    uiAction: 'prev',
                    uiUnit: 'month',
                },
                attributes: {
                    'aria-label': this.constructor.lang.prevMonth,
                },
            };
        }

        if (this._isBeforeMax(end)) {
            next = {
                dataset: {
                    uiAction: 'next',
                    uiUnit: 'month',
                },
                attributes: {
                    'aria-label': this.constructor.lang.nextMonth,
                },
            };
        }

        const table = this.constructor._createTable({
            header: {
                title: this._viewDate.format('MMMM yyyy'),
                dataset: {
                    uiAction: 'changeView',
                    uiView: 'months',
                },
                attributes: {
                    'aria-label': this.constructor.lang.selectMonth,
                    'aria-live': 'polite',
                },
                prev,
                next,
            },
            head: (thead) => {
                const tr = $.create('tr');
                $.append(thead, tr);

                for (let i = 1; i <= 7; i++) {
                    const currentDay = current.setWeekDay(i);
                    const th = $.create('th', {
                        class: this.constructor.classes.days,
                        text: currentDay.dayName('short'),
                        attributes: {
                            scope: 'col',
                            abbr: currentDay.dayName('long'),
                        },
                    });
                    $.append(tr, th);
                }
            },
            body: (tbody) => {
                let tr;
                const now = this._now();

                while (current.isSameOrBefore(last, 'day')) {
                    if (current.getWeekDay() === 1) {
                        tr = $.create('tr');
                        $.append(tbody, tr);
                    }

                    const td = $.create('td', {
                        text: current.format('dd'),
                        attributes: {
                            role: 'button',
                        },
                        dataset: {
                            uiYear: current.getYear(),
                            uiMonth: current.getMonth(),
                            uiDate: current.getDate(),
                        },
                    });

                    if (this._options.ariaFormat) {
                        $.setAttribute(td, {
                            'aria-label': current.format(this._options.ariaFormat),
                        });
                    }

                    $.append(tr, td);

                    if (!this._isValid(current, { granularity: 'day' })) {
                        $.addClass(td, this.constructor.classes.disabled);
                        $.setAttribute(td, { 'aria-disabled': true });
                    } else {
                        $.addClass(td, this.constructor.classes.action);
                        $.setDataset(td, {
                            uiAction: 'setDate',
                        });
                    }

                    if (this._viewDate.isSame(current, { granularity: 'day' })) {
                        $.setAttribute(td, {
                            tabindex: 0,
                        });
                        $.setDataset(td, {
                            uiFocus: true,
                        });
                    } else {
                        $.setAttribute(td, {
                            tabindex: -1,
                        });
                        $.setDataset(td, {
                            uiFocus: false,
                        });
                    }

                    if (this._isCurrent(current, { granularity: 'day' })) {
                        $.addClass(td, this.constructor.classes.active);
                        $.setAttribute(td, { 'aria-selected': true });
                    } else if (!this._viewDate.isSame(current, { granularity: 'month' })) {
                        $.addClass(td, this.constructor.classes.tertiary);
                    }

                    if (now.isSame(current, { granularity: 'day' })) {
                        $.addClass(td, this.constructor.classes.today);
                    }

                    if (this._options.renderDay) {
                        this._options.renderDay(current, td);
                    }

                    current = current.add(1, 'day');
                }
            },
        });

        $.append(this._dateContainer, table);
    }
    /**
     * Render the hours picker.
     */
    function _renderHours() {
        const initialDate = this._date ?
            this._date :
            this._defaultDate;

        let current = initialDate.startOf('day');
        const last = initialDate.endOf('day');

        const table = this.constructor._createTable({
            borderless: true,
            body: (tbody) => {
                const tr = $.create('tr');
                $.append(tbody, tr);

                const td = $.create('td', {
                    class: this.constructor.classes.rowContainer,
                    attributes: {
                        colspan: 7,
                    },
                });
                $.append(tr, td);

                const row = $.create('div', {
                    class: this.constructor.classes.row,
                });
                $.append(td, row);

                while (current.isSameOrBefore(last, { granularity: 'hour' })) {
                    const hourString = current.format('HH');
                    const col = $.create('div', {
                        text: hourString,
                        class: this.constructor.classes.hourColumn,
                        attributes: {
                            'aria-label': hourString,
                        },
                    });
                    $.append(row, col);

                    if (!this._isValid(current, { granularity: 'hour' })) {
                        $.addClass(col, this.constructor.classes.disabled);
                    } else {
                        $.addClass(col, this.constructor.classes.action);
                        $.setDataset(col, {
                            uiAction: 'setHours',
                            uiHour: current.getHours(),
                        });
                        $.setAttribute(col, { role: 'button ' });
                    }

                    if (initialDate.isSame(current, { granularity: 'hour' })) {
                        $.setAttribute(col, {
                            tabindex: 0,
                        });
                        $.setDataset(col, {
                            uiFocus: true,
                        });
                    } else {
                        $.setAttribute(col, {
                            tabindex: -1,
                        });
                        $.setDataset(col, {
                            uiFocus: false,
                        });
                    }

                    if (this._date && this._date.isSame(current, { granularity: 'hour' })) {
                        $.addClass(col, this.constructor.classes.active);
                        $.setAttribute(col, { 'aria-selected': true });
                    }

                    current = current.add(1, 'hour');
                }
            },
        });

        $.append(this._timeContainer, table);
    }
    /**
     * Render the minutes picker.
     */
    function _renderMinutes() {
        const initialDate = this._date ?
            this._date :
            this._defaultDate;

        let current = initialDate.startOf('hour');
        const last = initialDate.endOf('hour');

        const table = this.constructor._createTable({
            borderless: true,
            body: (tbody) => {
                const tr = $.create('tr');
                $.append(tbody, tr);

                const td = $.create('td', {
                    class: this.constructor.classes.rowContainer,
                    attributes: {
                        colspan: 7,
                    },
                });
                $.append(tr, td);

                const row = $.create('div', {
                    class: this.constructor.classes.row,
                });
                $.append(td, row);

                const stepping = this._options.minuteStepping == 1 ?
                    5 :
                    this._options.minuteStepping;

                while (current.isSameOrBefore(last, { granularity: 'minute' })) {
                    const minuteString = current.format('mm');
                    const col = $.create('span', {
                        text: minuteString,
                        class: this.constructor.classes.timeColumn,
                    });
                    $.append(row, col);

                    if (!this._isValid(current, { granularity: 'minute' })) {
                        $.addClass(col, this.constructor.classes.disabled);
                    } else {
                        $.addClass(col, this.constructor.classes.action);
                        $.setDataset(col, {
                            uiAction: 'setMinutes',
                            uiMinute: current.getMinutes(),
                        });
                        $.setAttribute(col, {
                            'role': 'button',
                            'aria-label': minuteString,
                        });
                    }

                    if (initialDate.isSame(current, { granularity: 'minute' })) {
                        $.setAttribute(col, {
                            tabindex: 0,
                        });
                        $.setDataset(col, {
                            uiFocus: true,
                        });
                    } else {
                        $.setAttribute(col, {
                            tabindex: -1,
                        });
                        $.setDataset(col, {
                            uiFocus: false,
                        });
                    }

                    if (this._date && this._date.isSame(current, { granularity: 'minute' })) {
                        $.addClass(col, this.constructor.classes.active);
                        $.setAttribute(col, { 'aria-selected': true });
                    }

                    current = current.add(stepping, 'minutes');
                }

                if (!$.findOne('[data-ui-focus="true"]', row)) {
                    const col = $.findOne('[data-ui-focus="false"]', row);
                    $.setAttribute(col, {
                        tabindex: 0,
                    });
                    $.setDataset(col, {
                        uiFocus: true,
                    });
                }
            },
        });

        $.append(this._timeContainer, table);
    }
    /**
     * Render the Modal.
     */
    function _renderModal() {
        this._modal = $.create('div', {
            class: this.constructor.classes.modal,
            attributes: {
                'tabindex': -1,
                'role': 'dialog',
                'aria-modal': true,
            },
        });

        const modalDialog = $.create('div', {
            class: this.constructor.classes.modalDialog,
        });

        $.append(this._modal, modalDialog);

        const modalContent = $.create('div', {
            class: this.constructor.classes.modalContent,
        });

        $.append(modalDialog, modalContent);

        const modalHeader = $.create('div', {
            class: this.constructor.classes.modalHeader,
        });

        $.append(modalContent, modalHeader);

        let titleText;
        if (!this._hasHours) {
            titleText = this.constructor.lang.selectDate;
        } else if (!this._hasDate) {
            titleText = this.constructor.lang.selectTime;
        } else {
            titleText = this.constructor.lang.selectDateTime;
        }

        const modalTitle = $.create('h6', {
            class: this.constructor.classes.modalTitle,
            text: titleText,
        });

        $.append(modalHeader, modalTitle);

        const modalBody = $.create('div', {
            class: this.constructor.classes.modalBody,
        });

        $.append(modalContent, modalBody);

        $.append(modalBody, this._menuNode);

        const btnContainer = $.create('div', {
            class: this.constructor.classes.modalBtnContainer,
        });

        $.append(modalBody, btnContainer);

        const cancelBtn = $.create('button', {
            class: this.constructor.classes.modalBtnSecondary,
            text: this.constructor.lang.cancel,
            attributes: {
                'type': 'button',
                'data-ui-dismiss': 'modal',
            },
        });

        $.append(btnContainer, cancelBtn);

        this._setBtn = $.create('button', {
            class: this.constructor.classes.modalBtnPrimary,
            text: this.constructor.lang.set,
            attributes: {
                'type': 'button',
                'data-ui-dismiss': 'modal',
                'data-ui-set-color': 'true',
            },
        });

        $.append(btnContainer, this._setBtn);
    }
    /**
     * Render the months picker.
     */
    function _renderMonths() {
        const start = this._viewDate.startOf('year');
        const end = this._viewDate.endOf('year');

        let current = start;

        let prev; let next;

        if (this._isAfterMin(start)) {
            prev = {
                dataset: {
                    uiAction: 'prev',
                    uiUnit: 'year',
                },
                attributes: {
                    'aria-label': this.constructor.lang.prevYear,
                },
            };
        }

        if (this._isBeforeMax(end)) {
            next = {
                dataset: {
                    uiAction: 'next',
                    uiUnit: 'year',
                },
                attributes: {
                    'aria-label': this.constructor.lang.nextYear,
                },
            };
        }

        const table = this.constructor._createTable({
            header: {
                title: this._viewDate.format('yyyy'),
                wide: true,
                dataset: {
                    uiAction: 'changeView',
                    uiView: 'years',
                },
                attributes: {
                    'aria-label': this.constructor.lang.selectYear,
                },
                prev,
                next,
            },
            body: (tbody) => {
                const tr = $.create('tr');
                $.append(tbody, tr);

                const td = $.create('td', {
                    class: this.constructor.classes.rowContainer,
                    attributes: {
                        colspan: 7,
                    },
                });
                $.append(tr, td);

                const row = $.create('div', {
                    class: this.constructor.classes.row,
                });
                $.append(td, row);

                while (current.isSameOrBefore(end, { granularity: 'month' })) {
                    const col = $.create('div', {
                        text: current.format('MMM'),
                        class: this.constructor.classes.dateColumn,
                    });
                    $.append(row, col);

                    if (this._viewDate.isSame(current, { granularity: 'month' })) {
                        $.setAttribute(col, {
                            tabindex: 0,
                        });
                        $.setDataset(col, {
                            uiFocus: true,
                        });
                    } else {
                        $.setAttribute(col, {
                            tabindex: -1,
                        });
                        $.setDataset(col, {
                            uiFocus: false,
                        });
                    }

                    if (this._isCurrent(current, { granularity: 'month' })) {
                        $.addClass(col, this.constructor.classes.active);
                    }

                    if (!this._isValid(current, { granularity: 'month' })) {
                        $.addClass(col, this.constructor.classes.disabled);
                    } else {
                        $.addClass(col, this.constructor.classes.action);
                        if (this._minView === 'months') {
                            $.setDataset(col, {
                                uiAction: 'setDate',
                                uiYear: current.getYear(),
                                uiMonth: current.getMonth(),
                            });
                        } else {
                            $.setDataset(col, {
                                uiAction: 'changeView',
                                uiView: 'days',
                                uiYear: current.getYear(),
                                uiMonth: current.getMonth(),
                            });
                        }
                    }

                    if (this._options.renderMonth) {
                        this._options.renderMonth(current, col);
                    }

                    current = current.add(1, 'month');
                }
            },
        });

        $.append(this._dateContainer, table);
    }
    /**
     * Render the time picker.
     */
    function _renderTime() {
        const initialDate = this._date ?
            this._date :
            this._defaultDate;

        const table = this.constructor._createTable({
            borderless: true,
            body: (tbody) => {
                const separators = this._hasHours + this._hasMinutes - 1;
                const columns = this._hasHours + this._hasMinutes + this._useDayPeriod;
                const separatorWidth = 3;
                const cellWidth = (100 - (separators * separatorWidth)) / columns;

                const upTr = $.create('tr');
                $.append(tbody, upTr);

                const timeTr = $.create('tr');
                $.append(tbody, timeTr);

                const downTr = $.create('tr');
                $.append(tbody, downTr);

                if (this._hasHours) {
                    let increment; let decrement;

                    const nextHour = initialDate.add(1, 'hour');
                    if (this._isValid(nextHour, { granularity: 'hour' })) {
                        increment = {
                            dataset: {
                                uiAction: 'next',
                                uiUnit: 'hour',
                            },
                            attributes: {
                                'aria-label': this.constructor.lang.incrementHour,
                            },
                        };
                    }

                    const prevHour = initialDate.sub(1, 'hour');
                    if (this._isValid(prevHour, { granularity: 'hour' })) {
                        decrement = {
                            dataset: {
                                uiAction: 'prev',
                                uiUnit: 'hour',
                            },
                            attributes: {
                                'aria-label': this.constructor.lang.decrementHour,
                            },
                        };
                    }

                    this.constructor._renderTimeColumn({
                        increment,
                        select: {
                            text: initialDate.format(this._useDayPeriod ? 'hh' : 'HH'),
                            dataset: {
                                uiAction: 'changeView',
                                uiTimeView: 'hours',
                            },
                            attributes: {
                                'aria-label': this.constructor.lang.selectHour,
                            },
                        },
                        decrement,
                        cellWidth,
                        upTr,
                        timeTr,
                        downTr,
                    });
                }

                if (this._hasHours && this._hasMinutes) {
                    this.constructor._renderTimeSeparator({ separatorWidth, upTr, timeTr, downTr });
                }

                if (this._hasMinutes) {
                    let increment; let decrement;

                    const initialMinutes = initialDate.getMinutes();
                    const nextMinutes = Math.min(initialMinutes + this._options.minuteStepping, 60);
                    const nextMinute = initialDate.setMinutes(nextMinutes);
                    if (this._isValid(nextMinute, { granularity: 'minute' })) {
                        increment = {
                            dataset: {
                                uiAction: 'next',
                                uiUnit: 'minute',
                            },
                            attributes: {
                                'aria-label': this.constructor.lang.incrementMinute,
                            },
                        };
                    }

                    const prevMinute = initialDate.sub(this._options.minuteStepping, 'minute');
                    if (this._isValid(prevMinute, { granularity: 'minute' })) {
                        decrement = {
                            dataset: {
                                uiAction: 'prev',
                                uiUnit: 'minute',
                            },
                            attributes: {
                                'aria-label': this.constructor.lang.decrementMinute,
                            },
                        };
                    }

                    this.constructor._renderTimeColumn({
                        increment,
                        select: {
                            text: initialDate.format('mm'),
                            dataset: {
                                uiAction: 'changeView',
                                uiTimeView: 'minutes',
                            },
                            attributes: {
                                'aria-label': this.constructor.lang.selectMinute,
                            },
                        },
                        decrement,
                        cellWidth,
                        upTr,
                        timeTr,
                        downTr,
                    });
                }

                if (this._useDayPeriod) {
                    const periodUpTd = $.create('td', {
                        style: {
                            width: `${cellWidth}%`,
                        },
                    });
                    $.append(upTr, periodUpTd);

                    const periodTd = $.create('td');
                    $.append(timeTr, periodTd);

                    const periodButton = $.create('span', {
                        text: initialDate.format('aa').toUpperCase(),
                        class: this.constructor.classes.periodButton,
                        attributes: {
                            'role': 'button',
                            'tabindex': 0,
                            'aria-label': this.constructor.lang.togglePeriod,
                        },
                    });

                    const currentHours = initialDate.getHours();
                    const otherPeriod = initialDate.setHours(
                        currentHours + (currentHours < 12 ? 12 : -12),
                    );
                    if (!this._isValid(otherPeriod)) {
                        $.addClass(periodButton, this.constructor.classes.disabled);
                        $.setAttribute(periodButton, {
                            'aria-disabled': true,
                        });
                    } else {
                        $.setDataset(periodButton, {
                            uiAction: 'togglePeriod',
                        });
                    }

                    $.append(periodTd, periodButton);

                    const periodDownCell = $.create('td');
                    $.append(downTr, periodDownCell);
                }
            },
        });

        $.append(this._timeContainer, table);
    }
    /**
     * Render the toolbar.
     */
    function _renderToolbar() {
        const toolbarRow = $.create('div', {
            class: this.constructor.classes.toolbarRow,
        });

        if (!this._options.modal) {
            $.addClass(toolbarRow, this.constructor.classes.toolbarPadding);
        }

        $.append(this._menuNode, toolbarRow);

        if (this._hasYear) {
            const toolbarDateContainer = $.create('div');

            $.append(toolbarRow, toolbarDateContainer);

            this._toolbarYear = $.create('div', {
                class: this.constructor.classes.toolbarYear,
            });

            $.append(toolbarDateContainer, this._toolbarYear);

            if (this._hasMonth) {
                this._toolbarDate = $.create('div', {
                    class: this.constructor.classes.toolbarDate,
                });

                $.append(toolbarDateContainer, this._toolbarDate);
            }
        }

        if (this._hasHours) {
            const toolbarTimeContainer = $.create('div');

            $.append(toolbarRow, toolbarTimeContainer);

            this._toolbarTime = $.create('span', {
                class: this.constructor.classes.toolbarTime,
            });

            $.append(toolbarTimeContainer, this._toolbarTime);
        }
    }
    /**
     * Render the years picker.
     */
    function _renderYears() {
        const viewYear = this._viewDate.getYear();
        const startYear = viewYear - (viewYear % 10);
        const endYear = startYear + 9;

        const start = this._viewDate.setYear(startYear).startOf('year');
        const end = this._viewDate.setYear(endYear).endOf('year');

        let current = start.sub(1, 'year');
        const last = end.add(1, 'year');

        let prev; let next;

        if (this._isAfterMin(start)) {
            prev = {
                dataset: {
                    uiAction: 'prev',
                    uiUnit: 'years',
                    uiAmount: 10,
                },
                attributes: {
                    'aria-label': this.constructor.lang.prevDecade,
                },
            };
        }

        if (this._isBeforeMax(end)) {
            next = {
                dataset: {
                    uiAction: 'next',
                    uiUnit: 'years',
                    uiAmount: 10,
                },
                attributes: {
                    'aria-label': this.constructor.lang.nextDecade,
                },
            };
        }

        const table = this.constructor._createTable({
            header: {
                title: `${start.format('yyyy')} - ${end.format('yyyy')}`,
                wide: true,
                prev,
                next,
            },
            body: (tbody) => {
                const tr = $.create('tr');
                $.append(tbody, tr);

                const td = $.create('td', {
                    class: this.constructor.classes.rowContainer,
                    attributes: {
                        colspan: 7,
                    },
                });
                $.append(tr, td);

                const row = $.create('div', {
                    class: this.constructor.classes.row,
                });
                $.append(td, row);

                while (current.isSameOrBefore(last, 'year')) {
                    const currentYear = current.getYear();

                    const yearString = current.format('yyyy');
                    const col = $.create('div', {
                        text: yearString,
                        class: this.constructor.classes.dateColumn,
                        attributes: {
                            'aria-label': yearString,
                        },
                    });
                    $.append(row, col);

                    if (this._viewDate.isSame(current, { granularity: 'year' })) {
                        $.setAttribute(col, {
                            tabindex: 0,
                        });
                        $.setDataset(col, {
                            uiFocus: true,
                        });
                    } else {
                        $.setAttribute(col, {
                            tabindex: -1,
                        });
                        $.setDataset(col, {
                            uiFocus: false,
                        });
                    }

                    if (this._isCurrent(current, { granularity: 'year' })) {
                        $.addClass(col, this.constructor.classes.active);
                    } else if (currentYear < startYear || currentYear > endYear) {
                        $.addClass(col, this.constructor.classes.tertiary);
                    }

                    if (!this._isValid(current, { granularity: 'year' })) {
                        $.addClass(col, this.constructor.classes.disabled);
                    } else {
                        $.addClass(col, this.constructor.classes.action);
                        if (this._minView === 'years') {
                            $.setDataset(col, {
                                uiAction: 'setDate',
                                uiYear: currentYear,
                            });
                        } else {
                            $.setDataset(col, {
                                uiAction: 'changeView',
                                uiView: 'months',
                                uiYear: currentYear,
                            });
                        }
                        $.setAttribute(col, { role: 'button ' });
                    }

                    if (this._options.renderYear) {
                        this._options.renderYear(current, col);
                    }

                    current = current.add(1, 'year');
                }
            },
        });

        $.append(this._dateContainer, table);
    }

    /**
     * Create a table.
     * @param {object} options Options for rendering the table.
     * @return {HTMLElement} The new table.
     */
    function _createTable(options) {
        const table = $.create('table', {
            class: this.classes.table,
        });

        if (options.header) {
            const thead = $.create('thead');
            $.append(table, thead);

            const tr = $.create('tr');
            $.append(thead, tr);

            const prevTd = $.create('th', {
                html: this.icons.left,
                class: this.classes.navigation,
            });

            if (!options.header.prev) {
                $.addClass(prevTd, this.classes.disabled);
            } else {
                $.addClass(prevTd, this.classes.action);
                $.setDataset(prevTd, options.header.prev.dataset);
                $.setAttribute(prevTd, {
                    role: 'button',
                    tabindex: 0,
                    ...options.header.prev.attributes,
                });
            }

            $.append(tr, prevTd);

            const titleTd = $.create('th', {
                class: this.classes.title,
                text: options.header.title,
                attributes: {
                    colspan: 5,
                    ...options.header.attributes,
                },
            });

            if (options.header.dataset) {
                $.addClass(titleTd, this.classes.action);
                $.setDataset(titleTd, options.header.dataset);
                $.setAttribute(titleTd, {
                    role: 'button',
                    tabindex: 0,
                });
            }

            if (options.header.wide) {
                $.addClass(titleTd, this.classes.titleWide);
            }

            $.append(tr, titleTd);

            const nextTd = $.create('th', {
                html: this.icons.right,
                class: this.classes.navigation,
            });

            if (!options.header.next) {
                $.addClass(nextTd, this.classes.disabled);
            } else {
                $.addClass(nextTd, this.classes.action);
                $.setDataset(nextTd, options.header.next.dataset);
                $.setAttribute(nextTd, {
                    role: 'button',
                    tabindex: 0,
                    ...options.header.next.attributes,
                });
            }

            $.append(tr, nextTd);

            if (options.head) {
                options.head(thead);
            }
        }

        const tbody = $.create('tbody');
        $.append(table, tbody);

        options.body(tbody);

        return table;
    }
    /**
     * Render a time column.
     * @param {object} options Options for rendering the column.
     */
    function _renderTimeColumn(options) {
        const upTd = $.create('td', {
            html: this.icons.up,
            class: [
                this.classes.navigation,
                this.classes.time,
                this.classes.spacingTimeNav,
            ],
            style: {
                width: `${options.cellWidth}%`,
            },
        });

        if (!options.increment) {
            $.addClass(upTd, this.classes.disabled);
        } else {
            $.addClass(upTd, this.classes.action);
            $.setDataset(upTd, options.increment.dataset);
            $.setAttribute(upTd, {
                role: 'button',
                tabindex: 0,
                ...options.increment.attributes,
            });
        }

        $.append(options.upTr, upTd);

        const selectTd = $.create('td', {
            text: options.select.text,
            class: [
                this.classes.action,
                this.classes.time,
                this.classes.spacingTime,
            ],
            dataset: options.select.dataset,
            attributes: {
                role: 'button',
                tabindex: 0,
                ...options.select.attributes,
            },
        });
        $.append(options.timeTr, selectTd);

        const downTd = $.create('td', {
            html: this.icons.down,
            class: [
                this.classes.navigation,
                this.classes.time,
                this.classes.spacingTimeNav,
            ],
        });

        if (!options.decrement) {
            $.addClass(downTd, this.classes.disabled);
        } else {
            $.addClass(downTd, this.classes.action);
            $.setDataset(downTd, options.decrement.dataset);
            $.setAttribute(downTd, {
                role: 'button',
                tabindex: 0,
                ...options.decrement.attributes,
            });
        }

        $.append(options.downTr, downTd);
    }
    /**
     * Render a time separator column.
     * @param {object} options Options for rendering the separator column.
     */
    function _renderTimeSeparator(options) {
        const seperatorUpTd = $.create('td', {
            style: {
                width: `${options.separatorWidth}%`,
            },
        });
        $.append(options.upTr, seperatorUpTd);

        const separatorTd = $.create('td', {
            text: ':',
            class: [
                this.classes.time,
                this.classes.spacingSeparator,
            ],
        });
        $.append(options.timeTr, separatorTd);

        const separatorDownTd = $.create('td');
        $.append(options.downTr, separatorDownTd);
    }

    // DateTimePicker default options
    DateTimePicker.defaults = {
        format: null,
        altFormats: [],
        ariaFormat: 'MMMM d, yyyy',
        timeZone: null,
        locale: null,
        defaultDate: null,
        minDate: null,
        maxDate: null,
        isValidDay: null,
        isValidMonth: null,
        isValidTime: null,
        isValidYear: null,
        renderDay: null,
        renderMonth: null,
        renderYear: null,
        multiDate: false,
        multiDateSeparator: ',',
        minuteStepping: 1,
        useCurrent: false,
        keepOpen: false,
        inline: false,
        sideBySide: false,
        vertical: false,
        showToolbar: false,
        showClose: false,
        keepInvalid: false,
        ignoreReadonly: false,
        modal: false,
        mobileModal: true,
        duration: 100,
        appendTo: null,
        placement: 'bottom',
        position: 'start',
        fixed: false,
        spacing: 0,
        minContact: false,
    };

    // DateTimePicker classes
    DateTimePicker.classes = {
        action: 'datetimepicker-action',
        active: 'datetimepicker-active',
        column: 'col d-flex flex-column',
        container: 'row row-cols-1 g-2',
        containerColumns: 'row-cols-lg-2',
        dateColumn: 'col-4 px-1 py-2',
        days: 'text-primary small fw-light',
        disabled: 'datetimepicker-disabled',
        hourColumn: 'col-3 p-1',
        menu: 'datetimepicker',
        menuInline: 'datetimepicker-inline',
        menuShadow: 'shadow-sm',
        menuWide: 'datetimepicker-wide',
        modal: 'modal',
        modalBody: 'modal-body',
        modalBtnContainer: 'text-end mt-4',
        modalBtnPrimary: 'btn btn-primary ripple ms-2',
        modalBtnSecondary: 'btn btn-secondary ripple ms-2',
        modalContent: 'modal-content',
        modalDialog: 'modal-dialog modal-sm',
        modalHeader: 'modal-header',
        modalTitle: 'modal-title',
        navigation: 'text-primary fs-5 lh-1',
        periodButton: 'btn btn-primary d-block',
        row: 'row g-0',
        rowContainer: 'p-0',
        spacingNav: 'py-2',
        spacingSeparator: 'py-2',
        spacingTime: 'py-2 px-0',
        spacingTimeNav: 'py-4 px-0',
        table: 'table table-borderless table-sm text-center mx-0 my-auto',
        tertiary: 'text-body-tertiary',
        time: 'datetimepicker-time',
        timeColumn: 'col-3 px-1 py-2',
        title: 'fw-bold',
        titleWide: 'w-100',
        today: 'datetimepicker-today',
        toolbarDate: 'fs-3 mb-0',
        toolbarRow: 'd-flex align-items-end justify-content-between',
        toolbarPadding: 'p-3',
        toolbarTime: 'fs-3 mb-0',
        toolbarYear: 'small text-body-secondary mb-0',
    };

    // DateTimePicker Lang
    DateTimePicker.lang = {
        cancel: 'Cancel',
        close: 'Close',
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
        selectDateTime: 'Select Date & Time',
        selectHour: 'Select Hour',
        selectMinute: 'Select Minute',
        selectMonth: 'Select Month',
        selectTime: 'Select Time',
        selectYear: 'Select Year',
        set: 'Set',
        togglePeriod: 'Toggle Period',
    };

    // DateTimePicker icons
    DateTimePicker.icons = {
        close: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" viewBox="0 0 24 24"><title>check</title><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" fill="currentColor" /></svg>',
        date: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1" fill="currentColor"/></svg>',
        down: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6l1.41-1.42z" fill="currentColor"/></svg>',
        left: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M15.41 16.58L10.83 12l4.58-4.59L14 6l-6 6l6 6l1.41-1.42z" fill="currentColor"/></svg>',
        right: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.42z" fill="currentColor"/></svg>',
        time: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7h1.5z" fill="currentColor"/></svg>',
        up: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6l-6 6l1.41 1.41z" fill="currentColor"/></svg>',
    };

    // DateTimePicker static
    DateTimePicker._createTable = _createTable;
    DateTimePicker._renderTimeColumn = _renderTimeColumn;
    DateTimePicker._renderTimeSeparator = _renderTimeSeparator;

    // DateTimePicker prototype
    const proto = DateTimePicker.prototype;

    proto._checkFormat = _checkFormat;
    proto._clampDate = _clampDate;
    proto._clampStepping = _clampStepping;
    proto._events = _events;
    proto._eventsDate = _eventsDate;
    proto._eventsModal = _eventsModal;
    proto._eventsTime = _eventsTime;
    proto._formatDate = _formatDate;
    proto._formatDates = _formatDates;
    proto._isAfterMin = _isAfterMin;
    proto._isBeforeMax = _isBeforeMax;
    proto._isCurrent = _isCurrent;
    proto._isEditable = _isEditable;
    proto._isValid = _isValid;
    proto._makeDate = _makeDate;
    proto._now = _now;
    proto._parseDate = _parseDate;
    proto._parseDates = _parseDates;
    proto._refresh = _refresh;
    proto._refreshDate = _refreshDate;
    proto._refreshDisabled = _refreshDisabled;
    proto._refreshTime = _refreshTime;
    proto._resetView = _resetView;
    proto._render = _render;
    proto._renderDays = _renderDays;
    proto._renderHours = _renderHours;
    proto._renderMinutes = _renderMinutes;
    proto._renderModal = _renderModal;
    proto._renderMonths = _renderMonths;
    proto._renderTime = _renderTime;
    proto._renderToolbar = _renderToolbar;
    proto._renderYears = _renderYears;
    proto._setDate = _setDate;
    proto._setDates = _setDates;
    proto._updateValue = _updateValue;

    // DateTimePicker init
    ui.initComponent('datetimepicker', DateTimePicker);

    // DateTimePicker events
    $.addEvent(document, 'mousedown.ui.datetimepicker', (e) => {
        const target = ui.getClickTarget(e);
        const nodes = $.find('.datetimepicker:not(.datetimepicker-inline):not(.datetimepicker-modal)');

        for (const node of nodes) {
            const input = $.getData(node, 'input');
            const datetimepicker = DateTimePicker.init(input);

            if (
                $.isSame(datetimepicker._node, target) ||
                $.isSame(datetimepicker._menuNode, target) ||
                $.hasDescendent(datetimepicker._menuNode, target)
            ) {
                continue;
            }

            datetimepicker.hide();
        }
    }, { capture: true });

    $.addEvent(document, 'keydown.ui.datetimepicker', (e) => {
        if (e.code !== 'Escape') {
            return;
        }

        let stopped = false;
        const nodes = $.find('.datetimepicker:not(.datetimepicker-inline):not(.datetimepicker-modal)');

        for (const [i, node] of nodes.entries()) {
            const input = $.getData(node, 'input');
            const datetimepicker = DateTimePicker.init(input);

            if (!stopped) {
                stopped = true;
                e.stopPropagation();
            }

            datetimepicker.hide();

            if (i == 0) {
                $.focus(input);
            }
        }
    }, { capture: true });

    exports.DateTimePicker = DateTimePicker;

}));
//# sourceMappingURL=frost-ui-datetimepicker.js.map
