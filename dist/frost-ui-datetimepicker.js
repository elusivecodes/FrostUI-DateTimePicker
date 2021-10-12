/**
 * FrostUI-DateTimePicker v1.2.5
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
    const UI = window.UI;
    const DateTime = window.DateTime;
    const document = window.document;

    /**
     * DateTimePicker Class
     * @class
     */
    class DateTimePicker extends UI.BaseComponent {

        /**
         * New DateTimePicker constructor.
         * @param {HTMLElement} node The input node.
         * @param {object} [settings] The options to create the DateTimePicker with.
         * @returns {DateTimePicker} A new DateTimePicker object.
         */
        constructor(node, settings) {
            super(node, settings);

            this._date = null;
            this._dates = [];
            this._minDate = null;
            this._maxDate = null;
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

            this._useDayPeriod = this.constructor._checkDayPeriod(this._settings.locale);

            if (!this._settings.format) {
                this._settings.format = this._settings.multiDate ?
                    this.constructor._getDefaultDateFormat(this._settings.locale, this._useDayPeriod) :
                    this.constructor._getDefaultFormat(this._settings.locale, this._useDayPeriod);
            }

            this._native = this._settings.mobileNative &&
                !this._settings.multiDate &&
                !this._settings.isValidDay &&
                !this._settings.isValidMonth &&
                !this._settings.isValidTime &&
                !this._settings.isValidYear &&
                !this._settings.inline &&
                !this._settings.minView &&
                /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

            this._checkFormat();
            this._parseSettings();
            this._updateValue();

            if (this._native) {
                this._parseNativeType();
                this._renderNative();
                this._eventsNative();
            } else {
                this._render();
                this._events();
            }

            this._refreshDisabled();
        }

        /**
         * Disable the DateTimePicker.
         * @returns {DateTimePicker} The DateTimePicker.
         */
        disable() {
            dom.setAttribute(this._node, 'disabled', true);
            this._refreshDisabled();

            return this;
        }

        /**
         * Clear the current value.
         * @returns {DateTimePicker} The DateTimePicker.
         */
        clear() {
            return this.setDate(null);
        }

        /**
         * Dispose the DateTimePicker.
         */
        dispose() {
            this._date = null;
            this._dates = null;
            this._minDate = null;
            this._maxDate = null;
            this._viewDate = null;

            if (this._native) {
                return this._disposeNative();
            }

            if (this._popper) {
                this._popper.destroy();
                this._popper = null;
            }

            dom.removeEvent(this._node, 'change.ui.datetimepicker')
            dom.removeEvent(this._node, 'blur.ui.datetimepicker');
            dom.removeEvent(this._node, 'focus.ui.datetimepicker');
            dom.removeEvent(this._node, 'keydown.ui.datetimepicker')
            dom.removeEvent(this._node, 'keyup.ui.datetimepicker')
            dom.remove(this._menuNode);

            this._menuNode = null;
            this._container = null;
            this._dateContainer = null;
            this._timeContainer = null;

            super.dispose();
        }

        /**
         * Enable the DateTimePicker.
         * @returns {DateTimePicker} The DateTimePicker.
         */
        enable() {
            dom.removeAttribute(this._node, 'disabled');
            this._refreshDisabled();

            return this;
        }

        /**
         * Hide the DateTimePicker.
         * @returns {DateTimePicker} The DateTimePicker.
         */
        hide() {
            if (
                this._native ||
                this._settings.inline ||
                this._animating ||
                !dom.isConnected(this._menuNode) ||
                !dom.triggerOne(this._node, 'hide.ui.datetimepicker')
            ) {
                return this;
            }

            this._animating = true;

            dom.fadeOut(this._menuNode, {
                duration: this._settings.duration
            }).then(_ => {
                this._popper.dispose();
                this._popper = null;

                dom.detach(this._menuNode);
                dom.triggerEvent(this._node, 'hidden.ui.datetimepicker');
            }).catch(_ => { }).finally(_ => {
                this._animating = false;
            });

            return this;
        }

        /**
         * Show the DateTimePicker.
         * @returns {DateTimePicker} The DateTimePicker.
         */
        show() {
            if (
                this._native ||
                this._settings.inline ||
                this._animating ||
                dom.isConnected(this._menuNode) ||
                !this._isEditable() ||
                !dom.triggerOne(this._node, 'show.ui.datetimepicker')
            ) {
                return this;
            }

            this._animating = true;

            if (this._settings.appendTo) {
                dom.append(this._settings.appendTo, this._menuNode);
            } else {
                dom.after(this._node, this._menuNode);
            }

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

            dom.fadeIn(this._menuNode, {
                duration: this._settings.duration
            }).then(_ => {
                dom.triggerEvent(this._node, 'shown.ui.datetimepicker');
            }).catch(_ => { }).finally(_ => {
                this._animating = false;
            });

            return this;
        }

        /**
         * Toggle the DateTimePicker.
         * @returns {DateTimePicker} The DateTimePicker.
         */
        toggle() {
            return dom.isConnected(this._menuNode) ?
                this.hide() :
                this.show();
        }

        /**
         * Update the DateTimePicker position.
         * @returns {DateTimePicker} The DateTimePicker.
         */
        update() {
            if (this._popper) {
                this._popper.update();
            }

            return this;
        }

    }


    /**
     * DateTimePicker API
     */

    Object.assign(DateTimePicker.prototype, {

        /**
         * Get the current date(s).
         * @return {DateTime|array} The current date(s).
         */
        getDate() {
            if (this._settings.multiDate) {
                return this._dates.map(date => date.clone());
            }

            if (!this._date) {
                return null;
            }

            return this._date.clone();
        },

        /**
         * Get the maximum date.
         * @return {DateTime|array} The maximum date.
         */
        getMaxDate() {
            if (!this._maxDate) {
                return null;
            }

            return this._maxDate.clone();
        },

        /**
         * Get the minimum date.
         * @return {DateTime|array} The minimum date.
         */
        getMinDate() {
            if (!this._minDate) {
                return null;
            }

            return this._minDate.clone();
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
                const dates = this._parseDates(date);
                this._setDates(dates);
            } else {
                date = this._parseDate(date);
                this._setDate(date);
            }

            return this;
        },

        /**
         * Set the maximum date.
         * @param {string|number|array|Date|DateTime} date The input date(s).
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setMaxDate(maxDate) {
            this._maxDate = this._parseDate(maxDate);

            const date = this.getDate();
            if (this._settings.multiDate) {
                this._setDates(date);
            } else {
                this._setDate(date);
            }

            return this;
        },

        /**
         * Set the minimum date.
         * @param {string|number|array|Date|DateTime} date The input date(s).
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setMinDate(minDate) {
            this._minDate = this._parseDate(minDate);

            const date = this.getDate();
            if (this._settings.multiDate) {
                this._setDates(date);
            } else {
                this._setDate(date);
            }

            return this;
        },

        /**
         * Set the view date.
         * @param {string|number|array|Date|DateTime} date The input date(s).
         * @returns {DateTimePicker} The DateTimePicker object.
         */
        setViewDate(viewDate) {
            this._viewDate = this._parseDate(viewDate);

            this._refresh();

            return this;
        }

    });


    /**
     * DateTimePicker Events
     */

    Object.assign(DateTimePicker.prototype, {

        /**
         * Attach events for the DateTimePicker.
         */
        _events() {
            dom.addEvent(this._menuNode, 'contextmenu.ui.datetimepicker', e => {
                // prevent menu node from showing right click menu
                e.preventDefault();
            });

            const showTime = _ => {
                dom.setStyle(this._timeContainer, 'display', '');
                dom.squeezeIn(this._timeContainer, {
                    duration: 100
                });
                dom.squeezeOut(this._dateContainer, {
                    duration: 100
                }).then(_ => {
                    dom.setStyle(this._dateContainer, 'display', 'none', true);
                    this.update();
                });
            };

            dom.addEventDelegate(this._menuNode, 'click.ui.datetimepicker', '[data-ui-action]', e => {
                if (e.button) {
                    return;
                }

                const element = e.currentTarget;
                const action = dom.getDataset(element, 'uiAction');
                const tempDate = this._date ?
                    this._date.clone() :
                    this._now();

                switch (action) {
                    case 'setDate':
                        tempDate.setYear(
                            dom.getDataset(element, 'uiYear'),
                            dom.getDataset(element, 'uiMonth'),
                            dom.getDataset(element, 'uiDate')
                        );

                        this._setDate(tempDate);

                        if (this._settings.inline) {
                            return;
                        }

                        if (this._hasTime) {
                            showTime();
                        } else if (!this._settings.keepOpen) {
                            this.hide();
                        }

                        break;
                    case 'setDateMulti':
                        tempDate.setYear(
                            dom.getDataset(element, 'uiYear'),
                            dom.getDataset(element, 'uiMonth'),
                            dom.getDataset(element, 'uiDate')
                        );

                        let dates;
                        if (this._isCurrent(tempDate, 'day')) {
                            dates = this._dates.filter(date => !this.constructor._isSameDay(date, tempDate));
                        } else {
                            dates = this._dates.concat([tempDate])
                                .sort((a, b) => this.constructor._isBeforeSecond(a, b) ? -1 : 1);
                        }

                        this._viewDate = tempDate.clone();

                        this._setDates(dates);

                        break;
                    case 'nextTime':
                    case 'prevTime':
                        const timeMethod = action === 'prevTime' ?
                            'sub' :
                            'add';
                        const unit = dom.getDataset(element, 'uiUnit');
                        tempDate[timeMethod](
                            unit === 'minute' ?
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
                            dom.getDataset(element, 'uiHour')
                        );

                        this._timeViewMode = null;

                        this._setDate(tempDate);

                        break;
                    case 'setMinutes':
                        tempDate.setMinutes(
                            dom.getDataset(element, 'uiMinute')
                        );

                        this._timeViewMode = null;

                        this._setDate(tempDate);

                        break;
                    case 'setSeconds':
                        tempDate.setSeconds(
                            dom.getDataset(element, 'uiSecond')
                        );

                        this._timeViewMode = null;

                        this._setDate(tempDate);

                        break;
                    case 'changeView':
                        this._viewMode = dom.getDataset(element, 'uiView');

                        if (dom.hasDataset(element, 'uiYear')) {
                            this._viewDate.setYear(
                                dom.getDataset(element, 'uiYear'),
                                dom.getDataset(element, 'uiMonth') || 1,
                                dom.getDataset(element, 'uiDate') || 1
                            );
                        }

                        this._refreshDate();

                        break;
                    case 'changeTimeView':
                        this._timeViewMode = dom.getDataset(element, 'uiTimeView');

                        this._refreshTime();

                        break;
                    case 'showTime':
                        showTime();
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
                            this.update();
                        });
                        break;
                    case 'next':
                    case 'prev':
                        const dateMethod = action === 'prev' ?
                            'sub' :
                            'add';
                        this._viewDate[dateMethod](
                            dom.getDataset(element, 'uiAmount') || 1,
                            dom.getDataset(element, 'uiUnit')
                        );

                        this._refreshDate();

                        break;
                }
            });

            dom.addEvent(this._node, 'change.ui.datetimepicker', _ => {
                if (this._noChange) {
                    return;
                }

                const value = dom.getValue(this._node);
                if (this._settings.multiDate) {
                    const values = value.split(this._settings.multiDateSeparator).filter(val => !!val);
                    const dates = [];
                    for (const val of values) {
                        const date = this._makeDate(val);
                        if (date && date.isValid && this._isValid(date, 'second')) {
                            dates.push(date);
                        }
                    }
                    if (dates.length === values.length) {
                        this._setDates(dates);
                    } else if (!this._settings.keepInvalid) {
                        this._setDates(this._dates);
                    }
                } else if (value) {
                    const date = this._makeDate(value);
                    if (date && date.isValid && this._isValid(date, 'second')) {
                        this._setDate(date);
                    } else if (!this._settings.keepInvalid) {
                        this._setDate(this._date);
                    }
                } else {
                    this._setDate(null);
                }
            });

            if (this._settings.inline) {
                return;
            }

            dom.addEvent(this._menuNode, 'click.ui.datetimepicker', e => {
                // prevent menu node from closing modal
                e.stopPropagation();
            });

            dom.addEvent(this._menuNode, 'mousedown.ui.datetimepicker', e => {
                // prevent menu node from triggering blur event
                e.preventDefault();
            });

            dom.addEvent(this._node, 'focus.ui.datetimepicker', _ => {
                if (!dom.isSame(this._node, document.activeElement)) {
                    return;
                }

                dom.stop(this._menuNode);
                this._animating = false;

                this.show();
            });

            dom.addEvent(this._node, 'blur.ui.datetimepicker', _ => {
                if (dom.isSame(this._node, document.activeElement)) {
                    return;
                }

                dom.stop(this._menuNode);
                this._animating = false;

                this.hide();
            });

            if (!this._settings.multiDate) {
                const keyDown = this._settings.keyDown.bind(this);
                dom.addEvent(this._node, 'keydown.ui.datetimepicker', keyDown);

                const keyUp = this._settings.keyUp.bind(this);
                dom.addEvent(this._node, 'keyup.ui.datetimepicker', keyUp);
            }
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

                switch (token[1]) {
                    case 'G':
                    case 'y':
                    case 'Y':
                    case 'q':
                    case 'Q':
                    case 'M':
                    case 'L':
                    case 'w':
                    case 'W':
                    case 'd':
                    case 'D':
                    case 'F':
                    case 'E':
                    case 'e':
                    case 'c':
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
                    case 's':
                        this._hasSeconds = true;
                        break;
                }
            }

            this._hasTime = this._hasHours || this._hasMinutes || this._hasSeconds;

            if (this._settings.multiDate && this._hasTime) {
                throw new Error('Time components cannot be used with multiDate option.');
            }
        },

        /**
         * Clamp a date between min and max dates.
         * @param {DateTime} date The input date.
         */
        _clampDate(date) {
            if (!this._isAfterMin(date)) {
                date.setTimestamp(this._minDate.getTimestamp());
            }

            if (!this._isBeforeMax(date)) {
                date.setTimestamp(this._maxDate.getTimestamp());
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
         * Format a date.
         * @param {DateTime} [date] The date to format.
         * @returns The formatted date.
         */
        _formatDate(date) {
            if (!date) {
                return '';
            }

            return date.format(this._settings.format);
        },

        /**
         * Format multiple dates.
         * @param {array} [dates] The dates to format.
         * @returns The formatted dates.
         */
        _formatDates(dates) {
            return dates
                .map(date => date.format(this._settings.format))
                .join(this._settings.multiDateSeparator);
        },

        /**
         * Determine whether a date is between min/max dates.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity] The level of granularity to use for comparison.
         * @param {Boolean} [allowSame=false] Whether to also allow same check.
         * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
         */
        _isAfterMin(date, granularity, allowSame = false) {
            if (!this._minDate) {
                return true;
            }

            switch (granularity) {
                case 'day':
                    return (allowSame && this.constructor._isSameDay(date, this._minDate)) ||
                        this.constructor._isAfterDay(date, this._minDate);
                case 'month':
                    return (allowSame && this.constructor._isSameMonth(date, this._minDate)) ||
                        this.constructor._isAfterMonth(date, this._minDate);
                case 'year':
                    return (allowSame && this.constructor._isSameYear(date, this._minDate)) ||
                        this.constructor._isAfterYear(date, this._minDate);
                default:
                    return (allowSame && this.constructor._isSameSecond(date, this._minDate)) ||
                        this.constructor._isAfterSecond(date, this._minDate);
            }
        },

        /**
         * Determine whether a date is between min/max dates.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity] The level of granularity to use for comparison.
         * @param {Boolean} [allowSame=false] Whether to also allow same check.
         * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
         */
        _isBeforeMax(date, granularity, allowSame = false) {
            if (!this._maxDate) {
                return true;
            }

            switch (granularity) {
                case 'day':
                    return (allowSame && this.constructor._isSameDay(date, this._maxDate)) ||
                        this.constructor._isBeforeDay(date, this._maxDate);
                case 'month':
                    return (allowSame && this.constructor._isSameMonth(date, this._maxDate)) ||
                        this.constructor._isBeforeMonth(date, this._maxDate);
                case 'year':
                    return (allowSame && this.constructor._isSameYear(date, this._maxDate)) ||
                        this.constructor._isBeforeYear(date, this._maxDate);
                default:
                    return (allowSame && this.constructor._isSameSecond(date, this._maxDate)) ||
                        this.constructor._isBeforeSecond(date, this._maxDate);
            }
        },

        /**
         * Determine whether a date is a "current" date.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity] The level of granularity to use for comparison.
         * @return {Boolean} TRUE if the date is a "current" date, otherwise FALSE.
         */
        _isCurrent(date, granularity) {
            let method;
            switch (granularity) {
                case 'month':
                    method = '_isSameMonth';
                    break;
                case 'year':
                    method = '_isSameYear';
                    break;
                default:
                    method = '_isSameDay';
                    break;
            }

            if (this._settings.multiDate) {
                return !!this._dates.find(currentDate => this.constructor[method](date, currentDate));
            }

            return this._date && this.constructor[method](date, this._date);
        },

        /**
         * Determine whether the input is editable.
         * @returns {Boolean} TRUE if the input is editable, otherwise FALSE.
         */
        _isEditable() {
            return !dom.is(this._node, ':disabled') && (this._settings.ignoreReadonly || !dom.is(this._node, ':read-only'));
        },

        /**
         * Determine whether a date is valid.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity=second] The level of granularity to use for comparison.
         * @return {Boolean} TRUE if the date is valid, otherwise FALSE.
         */
        _isValid(date, granularity = 'second') {
            let minMaxGranularity;
            switch (granularity) {
                case 'year':
                case 'month':
                case 'day':
                    minMaxGranularity = granularity;
                    break;
            }

            if (!this._isAfterMin(date, minMaxGranularity, true)) {
                return false;
            }

            if (!this._isBeforeMax(date, minMaxGranularity, true)) {
                return false;
            }

            if (this._settings.isValidYear && !this._settings.isValidYear(date)) {
                return false;
            }

            if (granularity === 'year') {
                return true;
            }

            if (this._settings.isValidMonth && !this._settings.isValidMonth(date)) {
                return false;
            }

            if (granularity === 'month') {
                return true;
            }

            if (this._settings.isValidDay && !this._settings.isValidDay(date)) {
                return false;
            }

            if (granularity === 'day' || !this._hasTime) {
                return true;
            }

            if (this._settings.isValidTime && !this._settings.isValidTime(date)) {
                return false;
            }

            return true;
        },

        /**
         * Create a new DateTime object from format.
         * @returns {DateTime|null} The new DateTime.
         */
        _makeDate(date) {
            try {
                return DateTime.fromFormat(this._settings.format, date, this._dateOptions);
            } catch (e) {
                return null;
            }
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
                    return this._makeDate(date);
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
                if (this._settings.multiDate) {
                    this._dates = value.split(this._settings.multiDateSeparator).map(val => this._makeDate(val));
                } else {
                    this._date = this._makeDate(value);
                }
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

            if (this._settings.viewDate) {
                this._viewDate = this._parseDate(this._settings.viewDate);
            }

            if (!this._viewDate && this._date) {
                this._viewDate = this.getDate();
            }

            if (!this._viewDate) {
                this._viewDate = this._now();
            }
        },

        /**
         * Refresh the toggle disabled.
         */
        _refreshDisabled() {
            if (this._native) {
                return;
            }

            if (dom.is(this._node, ':disabled')) {
                dom.addClass(this._menuNode, this.constructor.classes.disabled);
            } else {
                dom.removeClass(this._menuNode, this.constructor.classes.disabled);
            }
        },

        /**
         * Set the current date.
         * @param {DateTime|null} [date] The input date.
         */
        _setDate(date) {
            if (!this._isEditable()) {
                return;
            }

            if (date) {
                this._clampDate(date);
            }

            if (!this._settings.keepInvalid && date && !this._isValid(date)) {
                date = null;
            }

            if (this._formatDate(date) === dom.getValue(this._node)) {
                return this._refresh();
            }

            this._noChange = true;

            dom.triggerEvent(this._node, 'change.ui.datetimepicker', {
                detail: {
                    old: this.getDate(),
                    new: date ? date.clone() : null
                }
            });

            this._noChange = false;
            this._date = date;

            if (this._date) {
                this._viewDate = this.getDate();
            }

            this._updateValue();
            this._refresh();
        },

        /**
         * Set the current dates.
         * @param {array} date The input dates.
         */
        _setDates(dates) {
            if (!this._isEditable()) {
                return;
            }

            if (!this._settings.keepInvalid) {
                dates = dates.filter(date => this._isValid(date));
            }

            if (this._formatDates(dates) === dom.getValue(this._node)) {
                return this._refresh();
            }

            this._noChange = true;

            dom.triggerEvent(this._node, 'change.ui.datetimepicker', {
                old: this.getDate(),
                new: dates.map(date => date.clone())
            });

            this._noChange = false;
            this._dates = dates;

            this._updateValue();
            this._refresh();
        },

        /**
         * Update the input value to the current date.
         */
        _updateValue() {
            let value;
            if (this._settings.multiDate) {
                value = this._formatDates(this._dates);
            } else {
                value = this._formatDate(this._date);
            }

            dom.setValue(this._node, value);

            if (this._native && this._date) {
                this._updateNativeDate();
            }

            return this;
        }

    });


    /**
     * DateTimePicker Native
     */

    Object.assign(DateTimePicker.prototype, {

        /**
         * Dispose a native DateTimePicker.
         */
        _disposeNative() {
            const id = dom.getAttribute(this._nativeInput, 'id');

            if (id) {
                dom.setAttribute(this._node, id);
            }

            dom.remove(this._nativeInput);
            dom.show(this._node);

            super.dispose();
        },

        /**
         * Attach events for a native DateTimePicker.
         */
        _eventsNative() {
            dom.addEvent(this._nativeInput, 'change.ui.datetimepicker', _ => {
                const value = dom.getValue(this._nativeInput);
                const date = value ?
                    DateTime.fromFormat(this._nativeFormat, value) :
                    null;
                this._setDate(date);
            });
        },

        /**
         * Parse the native type and format.
         */
        _parseNativeType() {
            if (this._hasDate && !this._hasTime) {
                this._nativeType = 'date';
                this._nativeFormat = 'yyyy-MM-dd';
            } else if (this._hasTime && !this._hasDate) {
                this._nativeType = 'time';
                this._nativeFormat = 'HH:mm';
            } else {
                this._nativeType = 'datetime-local';
                this._nativeFormat = 'yyyy-MM-dd\'T\'HH:mm';
            }
        },

        /**
         * Render a native DateTimePicker.
         */
        _renderNative() {
            const attributes = { type: this._nativeType };

            const id = dom.getAttribute(this._node, 'id');

            if (id) {
                attributes.id = id;
                dom.removeAttribute(this._node, 'id');
            }

            if (this._minDate) {
                attributes.min = this._minDate.format(this._nativeFormat);
            }

            if (this._maxDate) {
                attributes.max = this._maxDate.format(this._nativeFormat);
            }

            this._nativeInput = dom.create('input', {
                class: dom.getAttribute(this._node, 'class'),
                attributes
            });

            if (this._date) {
                this._updateNativeDate();
            }

            dom.before(this._node, this._nativeInput);
            dom.hide(this._node);
        },

        /**
         * Update the native date.
         */
        _updateNativeDate() {
            dom.setValue(this._nativeInput, this._date.format(this._nativeFormat));
        }

    });


    /**
     * DateTimePicker Render
     */

    Object.assign(DateTimePicker.prototype, {

        /**
         * Refresh the date and time UI elements.
         */
        _refresh() {
            if (this._native) {
                return;
            }

            if (this._hasDate) {
                this._refreshDate();
            }

            if (this._hasTime) {
                this._refreshTime();
            }
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

            if (!this._settings.sideBySide && this._hasTime) {
                const table = this.constructor._createTable({
                    body: tbody => {
                        const tr = dom.create('tr');
                        dom.append(tbody, tr);

                        const td = dom.create('td', {
                            html: this.constructor.icons.time,
                            class: [
                                this.constructor.classes.action,
                                this.constructor.classes.navigation,
                                this.constructor.classes.spacingNav
                            ],
                            attributes: {
                                colspan: 7,
                                title: this._settings.lang.selectTime
                            },
                            dataset: {
                                uiAction: 'showTime'
                            }
                        });

                        dom.append(tr, td);
                    }
                });

                dom.append(this._dateContainer, table);
            }

            this.update();
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
                            html: this.constructor.icons.date,
                            class: [
                                this.constructor.classes.action,
                                this.constructor.classes.navigation,
                                this.constructor.classes.spacingNav
                            ],
                            attributes: {
                                colspan: 4,
                                title: this._settings.lang.selectDate
                            },
                            dataset: {
                                uiAction: 'showDate'
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

            this.update();
        },

        /**
         * Render the DateTimePicker.
         */
        _render() {
            this._menuNode = dom.create('div', {
                class: this.constructor.classes.menu
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
            }

            if (this._hasTime) {
                this._timeContainer = dom.create('div', {
                    class: this.constructor.classes.column
                });
                dom.append(this._container, this._timeContainer);
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
            }

            if (this._hasDate) {
                this._refreshDate();
            }

            if (this._hasTime) {
                this._refreshTime();
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
                        uiAction: 'prev',
                        uiUnit: 'month'
                    },
                    attr: {
                        title: this._settings.lang.prevMonth
                    }
                };
            }

            if (this._isBeforeMax(end)) {
                next = {
                    data: {
                        uiAction: 'next',
                        uiUnit: 'month'
                    },
                    attr: {
                        title: this._settings.lang.nextMonth
                    }
                };
            }

            const table = this.constructor._createTable({
                header: {
                    title: this._viewDate.format('MMMM yyyy'),
                    data: {
                        uiAction: 'changeView',
                        uiView: 'months'
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
                            class: this.constructor.classes.days,
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
                                uiAction: this._settings.multiDate ?
                                    'setDateMulti' :
                                    'setDate',
                                uiYear: current.getYear(),
                                uiMonth: current.getMonth(),
                                uiDate: current.getDate()
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
                            class: this.constructor.classes.hourColumn
                        });
                        dom.append(row, col);

                        if (!this._isValid(current, 'hour')) {
                            dom.addClass(col, this.constructor.classes.disabled);
                        } else {
                            dom.addClass(col, this.constructor.classes.action);
                            dom.setDataset(col, {
                                uiAction: 'setHours',
                                uiHour: current.getHours()
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
                                uiAction: 'setMinutes',
                                uiMinute: current.getMinutes()
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
                        uiAction: 'prev',
                        uiUnit: 'year'
                    },
                    attr: {
                        title: this._settings.lang.prevYear
                    }
                };
            }

            if (this._isBeforeMax(end)) {
                next = {
                    data: {
                        uiAction: 'next',
                        uiUnit: 'year'
                    },
                    attr: {
                        title: this._settings.lang.nextYear
                    }
                };
            }

            const table = this.constructor._createTable({
                header: {
                    title: this._viewDate.format('yyyy'),
                    wide: true,
                    data: {
                        uiAction: 'changeView',
                        uiView: 'years'
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
                                    uiAction: this._settings.multiDate ?
                                        'setDateMulti' :
                                        'setDate',
                                    uiYear: current.getYear(),
                                    uiMonth: current.getMonth()
                                });
                            } else {
                                dom.setDataset(col, {
                                    uiAction: 'changeView',
                                    uiView: 'days',
                                    uiYear: current.getYear(),
                                    uiMonth: current.getMonth()
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
                                uiAction: 'setSeconds',
                                uiSecond: current.getSeconds()
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
                                    uiAction: 'nextTime',
                                    uiUnit: 'hour'
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
                                    uiAction: 'prevTime',
                                    uiUnit: 'hour'
                                },
                                attr: {
                                    title: this._settings.lang.decrementHour
                                }
                            };
                        }

                        this.constructor._renderTimeColumn({
                            increment,
                            select: {
                                text: initialDate.format(this._useDayPeriod ? 'hh' : 'HH'),
                                data: {
                                    uiAction: 'changeTimeView',
                                    uiTimeView: 'hours'
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
                                    uiAction: 'nextTime',
                                    uiUnit: 'minute'
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
                                    uiAction: 'prevTime',
                                    uiUnit: 'minute'
                                },
                                attr: {
                                    title: this._settings.lang.decrementMinute
                                }
                            };
                        }

                        this.constructor._renderTimeColumn({
                            increment,
                            select: {
                                text: initialDate.format('mm'),
                                data: {
                                    uiAction: 'changeTimeView',
                                    uiTimeView: 'minutes'
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
                                    uiAction: 'nextTime',
                                    uiUnit: 'second'
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
                                    uiAction: 'prevTime',
                                    uiUnit: 'second'
                                },
                                attr: {
                                    title: this._settings.lang.decrementSecond
                                }
                            };
                        }

                        this.constructor._renderTimeColumn({
                            increment,
                            select: {
                                text: initialDate.format('ss'),
                                data: {
                                    uiAction: 'changeTimeView',
                                    uiTimeView: 'seconds'
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
                                uiAction: 'togglePeriod'
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
                        uiAction: 'prev',
                        uiUnit: 'years',
                        uiAmount: 10
                    },
                    attr: {
                        title: this._settings.lang.prevDecade
                    }
                };
            }

            if (this._isBeforeMax(end)) {
                next = {
                    data: {
                        uiAction: 'next',
                        uiUnit: 'years',
                        uiAmount: 10
                    },
                    attr: {
                        title: this._settings.lang.nextDecade
                    }
                };
            }

            const table = this.constructor._createTable({
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
                                    uiAction: this._settings.multiDate ?
                                        'setDateMulti' :
                                        'setDate',
                                    uiYear: thisYear
                                });
                            } else {
                                dom.setDataset(col, {
                                    uiAction: 'changeView',
                                    uiView: 'months',
                                    uiYear: thisYear
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
     * DateTimePicker (Static) Comparisons
     */

    Object.assign(DateTimePicker, {

        /**
         * Test if a date is after another date (day).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is after the other date, otherwise FALSE.
         */
        _isAfterDay(a, b) {
            return this._isAfterMonth(a, b) || (this._isSameMonth(a, b) && a.getDate() > b.getDate());
        },

        /**
         * Test if a date is after another date (month).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is after the other date, otherwise FALSE.
         */
        _isAfterMonth(a, b) {
            return this._isAfterYear(a, b) || (this._isSameYear(a, b) && a.getMonth() > b.getMonth());
        },

        /**
         * Test if a date is after another date (second).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is after the other date, otherwise FALSE.
         */
        _isAfterSecond(a, b) {
            return a.getTimestamp() > b.getTimestamp();
        },

        /**
         * Test if a date is after another date (year).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is after the other date, otherwise FALSE.
         */
        _isAfterYear(a, b) {
            return a.getYear() > b.getYear();
        },

        /**
         * Test if a date is before another date (day).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is before the other date, otherwise FALSE.
         */
        _isBeforeDay(a, b) {
            return this._isBeforeMonth(a, b) || (this._isSameMonth(a, b) && a.getDate() < b.getDate());
        },

        /**
         * Test if a date is before another date (month).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is before the other date, otherwise FALSE.
         */
        _isBeforeMonth(a, b) {
            return this._isBeforeYear(a, b) || (this._isSameYear(a, b) && a.getMonth() < b.getMonth());
        },

        /**
         * Test if a date is before another date (second).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is before the other date, otherwise FALSE.
         */
        _isBeforeSecond(a, b) {
            return a.getTimestamp() < b.getTimestamp();
        },

        /**
         * Test if a date is before another date (year).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is before the other date, otherwise FALSE.
         */
        _isBeforeYear(a, b) {
            return a.getYear() < b.getYear();
        },

        /**
         * Test if a date is equal to another date (day).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
         */
        _isSameDay(a, b) {
            return this._isSameMonth(a, b) && a.getDate() === b.getDate();
        },

        /**
         * Test if a date is equal to another date (month).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
         */
        _isSameMonth(a, b) {
            return this._isSameYear(a, b) && a.getMonth() === b.getMonth();
        },

        /**
         * Test if a date is equal to another date (second).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
         */
        _isSameSecond(a, b) {
            return a.getTimestamp() === b.getTimestamp();
        },

        /**
         * Test if a date is equal to another date (year).
         * @param {DateTime} a The date to test.
         * @param {DateTime} b The date to compare against.
         * @returns {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
         */
        _isSameYear(a, b) {
            return a.getYear() === b.getYear();
        }

    });


    /**
     * DateTimePicker (Static) Helpers
     */

    Object.assign(DateTimePicker, {

        /**
         * Check a locale for day period component (and cache).
         * @param {string} locale The locale to check.
         * @returns {Boolean} Whether the locale uses a day period component.
         */
        _checkDayPeriod(locale) {
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
        _getDefaultDateFormat(locale) {
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
        _getDefaultFormat(locale, hasDayPeriod) {
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
                class: this.classes.table
            });

            if (options.header) {
                const thead = dom.create('thead');
                dom.append(table, thead);

                const tr = dom.create('tr');
                dom.append(thead, tr);

                const prevTd = dom.create('th', {
                    html: this.icons.left,
                    class: this.classes.navigation
                });

                if (!options.header.prev) {
                    dom.addClass(prevTd, this.classes.disabled);
                } else {
                    dom.addClass(prevTd, this.classes.action);
                    dom.setDataset(prevTd, options.header.prev.data);
                    dom.setAttribute(prevTd, options.header.prev.attr);
                }

                dom.append(tr, prevTd);

                const titleTd = dom.create('th', {
                    class: this.classes.title,
                    text: options.header.title,
                    attributes: {
                        colspan: 5,
                        ...options.header.attr
                    },
                    dataset: options.header.data
                });
                dom.append(tr, titleTd);

                if (options.header.data) {
                    dom.addClass(titleTd, this.classes.action);
                }

                if (options.header.wide) {
                    dom.addClass(titleTd, this.classes.titleWide);
                }

                const nextTd = dom.create('th', {
                    html: this.icons.right,
                    class: this.classes.navigation
                });

                if (!options.header.next) {
                    dom.addClass(nextTd, this.classes.disabled);
                } else {
                    dom.addClass(nextTd, this.classes.action);
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
                html: this.icons.up,
                class: [
                    this.classes.navigation,
                    this.classes.time,
                    this.classes.spacingTimeNav
                ],
                style: {
                    width: `${options.cellWidth}%`
                }
            });

            if (!options.increment) {
                dom.addClass(upTd, this.classes.disabled);
            } else {
                dom.addClass(upTd, this.classes.action);
                dom.setDataset(upTd, options.increment.data);
                dom.setAttribute(upTd, options.increment.attr);
            }

            dom.append(options.upTr, upTd);

            const selectTd = dom.create('td', {
                text: options.select.text,
                class: [
                    this.classes.action,
                    this.classes.time,
                    this.classes.spacingTime
                ],
                dataset: options.select.data,
                attributes: options.select.attr
            });
            dom.append(options.timeTr, selectTd);

            const downTd = dom.create('td', {
                html: this.icons.down,
                class: [
                    this.classes.navigation,
                    this.classes.time,
                    this.classes.spacingTimeNav
                ]
            });

            if (!options.decrement) {
                dom.addClass(downTd, this.classes.disabled);
            } else {
                dom.addClass(downTd, this.classes.action);
                dom.setDataset(downTd, options.decrement.data);
                dom.setAttribute(downTd, options.decrement.attr);
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
                class: [
                    this.classes.time,
                    this.classes.spacingSeparator
                ]
            });
            dom.append(options.timeTr, separatorTd);

            const separatorDownTd = dom.create('td');
            dom.append(options.downTr, separatorDownTd);
        }

    });


    /**
     * @callback DateTimePicker~validCallback
     * @param {DateTime} date The date to test.
     */

    /**
     * @callback DateTimePicker~renderCallback
     * @param {DateTime} date The date being rendered.
     * @param {HTMLElement} element The element being rendered.
     */

    // DateTimePicker default options
    DateTimePicker.defaults = {
        format: null,
        locale: DateTime._defaultLocale,
        timeZone: DateTime._defaultTimeZone,
        defaultDate: null,
        minDate: null,
        maxDate: null,
        lang: {
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
        isValidDay: null,
        isValidMonth: null,
        isValidTime: null,
        isValidYear: null,
        renderDay: null,
        renderMonth: null,
        renderYear: null,
        keyDown(e) {
            let date = this._date ?
                this._date.clone() :
                this._now();

            switch (e.code) {
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
                    date.add(1, 'day');
                    break;
                case 'ArrowLeft':
                    date.sub(1, 'day');
                    break;
                case 'PageUp':
                    date.add(1, 'month');
                    break;
                case 'PageDown':
                    date.sub(1, 'month');
                    break;
                case 'Home':
                    date = this._now()
                    break;
                case 'Delete':
                    date = null;
                    break;
                case 'Enter':
                    e.preventDefault();

                    return this.toggle();
                default:
                    return;
            }

            e.preventDefault();

            this.show();

            if (!date || this._isValid(date, 'second')) {
                this._setDate(date);
            }
        },
        keyUp(e) {
            if (e.code !== 'Escape' || !dom.isConnected(this._menuNode)) {
                return;
            }

            e.stopPropagation();

            this.hide();
        },
        multiDate: false,
        multiDateSeparator: ',',
        useCurrent: false,
        keepOpen: false,
        inline: false,
        sideBySide: false,
        keepInvalid: false,
        ignoreReadonly: false,
        mobileNative: true,
        minView: null,
        stepping: 1,
        duration: 100,
        appendTo: null,
        placement: 'bottom',
        position: 'start',
        fixed: false,
        spacing: 0,
        minContact: false
    };

    // Default classes
    DateTimePicker.classes = {
        action: 'datetimepicker-action',
        active: 'datetimepicker-active',
        column: 'col d-flex flex-column',
        container: 'row row-cols-1 gy-0 gx-2',
        containerColumns: 'row-cols-md-2',
        dateColumn: 'col-4 px-1 py-2',
        days: 'text-primary fw-light',
        disabled: 'datetimepicker-disabled',
        hourColumn: 'col-3 p-1',
        menu: 'datetimepicker',
        menuInline: 'datetimepicker-inline',
        menuShadow: 'shadow-sm',
        menuWide: 'datetimepicker-wide',
        navigation: 'text-primary fs-5 lh-1',
        periodButton: 'btn btn-primary d-block',
        row: 'row g-0',
        rowContainer: 'p-0',
        secondary: 'text-secondary',
        spacingNav: 'py-2',
        spacingSeparator: 'py-2',
        spacingTime: 'py-2 px-0',
        spacingTimeNav: 'py-4 px-0',
        table: 'table table-borderless table-sm text-center mx-0 my-auto',
        time: 'datetimepicker-time',
        timeColumn: 'col-3 px-1 py-2',
        title: 'fw-bold',
        titleWide: 'w-100',
        today: 'datetimepicker-today'
    };

    // Default icons
    DateTimePicker.icons = {
        date: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1" fill="currentColor"/></svg>',
        down: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6l1.41-1.42z" fill="currentColor"/></svg>',
        left: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M15.41 16.58L10.83 12l4.58-4.59L14 6l-6 6l6 6l1.41-1.42z" fill="currentColor"/></svg>',
        right: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.42z" fill="currentColor"/></svg>',
        time: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7h1.5z" fill="currentColor"/></svg>',
        up: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6l-6 6l1.41 1.41z" fill="currentColor"/></svg>'
    };

    // Format token RegExp
    DateTimePicker._formatTokenRegExp = /([a-z])\1*|'[^']*'/ig;

    // Cache values
    DateTimePicker._dayPeriods = {};
    DateTimePicker._defaultDateFormats = {};
    DateTimePicker._defaultFormats = {};

    UI.initComponent('datetimepicker', DateTimePicker);

    UI.DateTimePicker = DateTimePicker;

});