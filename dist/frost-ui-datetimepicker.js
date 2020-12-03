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
         * @param {string} [settings.format] The format string.
         * @param {string} [settings.locale] The locale to use.
         * @param {string} [setting.timeZone] The timeZone to use.
         * @param {string|number|array|Date|DateTime} [settings.defaultDate] The default date to use.
         * @param {string|number|array|Date|DateTime} [settings.minDate] The minimum allowed date.
         * @param {string|number|array|Date|DateTime} [settings.maxDate] The maximum allowed date.
         * @param {DateTimePicker~validCallback} [settings.isValidDay] The valid day callback.
         * @param {DateTimePicker~validCallback} [settings.isValidMonth] The valid month callback.
         * @param {DateTimePicker~validCallback} [settings.isValidTime] The valid time callback.
         * @param {DateTimePicker~validCallback} [settings.isValidYear] The valid year callback.
         * @param {DateTimePicker~renderCallback} [settings.renderDay] The render day callback
         * @param {DateTimePicker~renderCallback} [settings.renderMonth] The render month callback
         * @param {DateTimePicker~renderCallback} [settings.renderYear] The render year callback
         * @param {object} [settings.icons] Class names to use for icons.
         * @param {object} [settings.tooltips] Tooltips to use for actions.
         * @param {function} [settings.keyDown] The keydown callback.
         * @param {Boolean} [settings.multiDate=false] Whether to allow selecting multiple dates.
         * @param {string} [settings.multiDateSeparator=,] The multiple date separator.
         * @param {Boolean} [settings.useCurrent=false] Whether to use the current time as the default date.
         * @param {Boolean} [settings.keepOpen=false] Whether to keep the date picker open after selecting a date.
         * @param {Boolean} [settings.focusOnShow=true] Whether to focus the input when the date picker is shown.
         * @param {Boolean} [settings.inline=false] Whether to render the date picker inline.
         * @param {Boolean} [settings.sideBySide=false] Whether to render the date and time pickers side by side.
         * @param {Boolean} [settings.keepInvalid=false] Whether to keep invalid date inputs.
         * @param {string} [settings.minView] The minimum date view to display.
         * @param {number} [settings.stepping=1] The minute stepping interval.
         * @param {number} [settings.duration=100] The duration of the animation.
         * @param {string} [settings.placement=bottom] The placement of the datetimepicker relative to the toggle.
         * @param {string} [settings.position=start] The position of the datetimepicker relative to the toggle.
         * @param {Boolean} [settings.fixed=false] Whether the datetimepicker position is fixed.
         * @param {number} [settings.spacing=2] The spacing between the datetimepicker and the toggle.
         * @param {number} [settings.minContact=false] The minimum amount of contact the datetimepicker must make with the toggle.
         * @param {Boolean} [autoInit=false] Whether the date picker was initialized from a toggle event.
         * @returns {DateTimePicker} A new DateTimePicker object.
         */
        constructor(node, settings, autoInit = false) {
            this._node = node;

            this._settings = Core.extend(
                {},
                this.constructor.defaults,
                dom.getDataset(this._node),
                settings
            );

            this._autoInit = autoInit;
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

            this._checkFormat();
            this._parseSettings();
            this._update();
            this._render();
            this._events();

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

            dom.removeEvent(this._node, 'focus.frost.datetimepicker blur.frost.datetimepicker input.frost.datetimepicker keydown.frost.datetimepicker');
            dom.remove(this._menuNode);
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
                dom.is(this._node, ':disabled') ||
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
            const menus = dom.find('.datetimepicker:not(.dtp-inline)');

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
         * @param {string} [settings.format] The format string.
         * @param {string} [settings.locale] The locale to use.
         * @param {string} [setting.timeZone] The timeZone to use.
         * @param {string|number|array|Date|DateTime} [settings.defaultDate] The default date to use.
         * @param {string|number|array|Date|DateTime} [settings.minDate] The minimum allowed date.
         * @param {string|number|array|Date|DateTime} [settings.maxDate] The maximum allowed date.
         * @param {DateTimePicker~validCallback} [settings.isValidDay] The valid day callback.
         * @param {DateTimePicker~validCallback} [settings.isValidMonth] The valid month callback.
         * @param {DateTimePicker~validCallback} [settings.isValidTime] The valid time callback.
         * @param {DateTimePicker~validCallback} [settings.isValidYear] The valid year callback.
         * @param {DateTimePicker~renderCallback} [settings.renderDay] The render day callback
         * @param {DateTimePicker~renderCallback} [settings.renderMonth] The render month callback
         * @param {DateTimePicker~renderCallback} [settings.renderYear] The render year callback
         * @param {object} [settings.icons] Class names to use for icons.
         * @param {object} [settings.tooltips] Tooltips to use for actions.
         * @param {function} [settings.keyDown] The keydown callback.
         * @param {Boolean} [settings.multiDate=false] Whether to allow selecting multiple dates.
         * @param {string} [settings.multiDateSeparator=,] The multiple date separator.
         * @param {Boolean} [settings.useCurrent=false] Whether to use the current time as the default date.
         * @param {Boolean} [settings.keepOpen=false] Whether to keep the date picker open after selecting a date.
         * @param {Boolean} [settings.focusOnShow=true] Whether to focus the input when the date picker is shown.
         * @param {Boolean} [settings.inline=false] Whether to render the date picker inline.
         * @param {Boolean} [settings.sideBySide=false] Whether to render the date and time pickers side by side.
         * @param {Boolean} [settings.keepInvalid=false] Whether to keep invalid date inputs.
         * @param {string} [settings.minView] The minimum date view to display.
         * @param {number} [settings.stepping=1] The minute stepping interval.
         * @param {number} [settings.duration=100] The duration of the animation.
         * @param {string} [settings.placement=bottom] The placement of the datetimepicker relative to the toggle.
         * @param {string} [settings.position=start] The position of the datetimepicker relative to the toggle.
         * @param {Boolean} [settings.fixed=false] Whether the datetimepicker position is fixed.
         * @param {number} [settings.spacing=2] The spacing between the datetimepicker and the toggle.
         * @param {number} [settings.minContact=false] The minimum amount of contact the datetimepicker must make with the toggle.
         * @param {Boolean} [autoInit=false] Whether the date picker was initialized from a toggle event.
         * @returns {DateTimePicker} A new DateTimePicker object.
         */
        static init(node, settings, autoInit = false) {
            return dom.hasData(node, 'datetimepicker') ?
                dom.getData(node, 'datetimepicker') :
                new this(node, settings, autoInit);
        }

    }


    // DateTimePicker events
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

    dom.addEventDelegate(document, 'click.frost.datetimepicker', '[data-toggle="datetimepicker"]', e => {
        e.preventDefault();

        const target = UI.getTarget(e.currentTarget);
        const datetimepicker = DateTimePicker.init(target, {}, true);
        datetimepicker.toggle(e.currentTarget);
    });

    /**
     * DateTimePicker Events
     */

    Object.assign(DateTimePicker.prototype, {

        /**
         * Attach events for the DateTimePicker.
         */
        _events() {
            if (!this._autoInit) {
                dom.addEvent(this._node, 'focus.frost.datetimepicker', _ => {
                    this.show();
                });
            }

            dom.addEvent(this._node, 'blur.frost.datetimepicker', _ => {
                const value = dom.getValue(this._node);
                if (this._settings.multiDate) {
                    const values = value.split(this._settings.multiDateSeparator);
                    const dates = [];
                    let error = false;
                    for (const val of values) {
                        try {
                            const date = this._makeDate(val);
                            if (date.isValid && this._isValid(date, 'second')) {
                                dates.push(date);
                            } else {
                                error = true;
                            }
                        } catch (e) {
                            error = true;
                        }

                        if (error) {
                            break;
                        }
                    }
                    if (!error) {
                        this._setDates(dates);
                    } else if (!this._settings.keepInvalid) {
                        this._setDates(this._dates);
                    }
                } else {
                    try {
                        const date = this._makeDate(value);
                        if (date.isValid && this._isValid(date, 'second')) {
                            this._setDate(date);
                        } else if (!this._settings.keepInvalid) {
                            this._setDate(this._date);
                        }
                    } catch (e) {
                        if (!this._settings.keepInvalid) {
                            this._setDate(this._date);
                        }
                    }
                }
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

                        this._viewDate = tempDate.clone();

                        this._setDates(this._dates);

                        break;
                    case 'nextTime':
                    case 'prevTime':
                        const timeMethod = action === 'prevTime' ?
                            'sub' :
                            'add';
                        const unit = dom.getDataset(element, 'unit');
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

            if (this._settings.multiDate && !this._hasDate) {
                throw new Error('Date components must be used with multiDate option.');
            }
        },

        /**
         * Clamp a date between min and max dates.
         * @param {DateTime} date The input date.
         */
        _clampDate(date) {
            if (this._minDate && this._minDate.isAfter(date)) {
                date.setTimestamp(this._minDate.getTimestamp());
            }

            if (this._maxDate && this._maxDate.isBefore(date)) {
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
         * Determine whether a date is between min/max dates.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity=second] The level of granularity to use for comparison.
         * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
         */
        _isAfterMin(date, granularity = 'second') {
            if (this._minDate && date.isBefore(this._minDate, granularity)) {
                return false;
            }

            return true;
        },

        /**
         * Determine whether a date is between min/max dates.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity=second] The level of granularity to use for comparison.
         * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
         */
        _isBeforeMax(date, granularity = 'second') {
            if (this._maxDate && date.isAfter(this._maxDate, granularity)) {
                return false;
            }

            return true;
        },

        /**
         * Determine whether a date is a "current" date.
         * @param {DateTime} date The date to test.
         * @param {string} [granularity=day] The level of granularity to use for comparison.
         * @return {Boolean} TRUE if the date is a "current" date, otherwise FALSE.
         */
        _isCurrent(date, granularity = 'day') {
            if (this._settings.multiDate) {
                return !!this._dates.find(currentDate => currentDate.isSame(date, granularity));
            }

            return this._date && this._date.isSame(date, granularity);
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
                default:
                    minMaxGranularity = 'second';
                    break;
            }

            if (!this._isAfterMin(date, minMaxGranularity)) {
                return false;
            }

            if (!this._isBeforeMax(date, minMaxGranularity)) {
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
         * @returns {DateTime} The new DateTime.
         */
        _makeDate(date) {
            return DateTime.fromFormat(this._settings.format, date, this._dateOptions);
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
                this._date = this._makeDate(value);
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
                this._viewDate = this._date.clone();
            }

            if (!this._viewDate) {
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

            dom.triggerEvent(this._node, 'change.frost.datetimepicker', {
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

            dom.triggerEvent(this._node, 'change.frost.datetimepicker', {
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
                if (!this._settings.keepInvalid) {
                    for (const date of this._dates) {
                        this._clampDate(date);
                    }
                }
                value = this._dates
                    .map(date => date.format(this._settings.format))
                    .join(this._settings.multiDateSeparator);
            } else if (this._date) {
                if (!this._settings.keepInvalid) {
                    this._clampDate(this._date);
                }
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
                            html: '<span. class="icon-clock"></>',
                            class: 'dtp-action py-2',
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
                            html: '<span class="icon-calendar"></span>',
                            class: 'dtp-action py-2',
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

            if (!this._settings.inline && this._popper) {
                this._popper.update();
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
                    class: 'col d-flex flex-column'
                });
                dom.append(this._container, this._dateContainer);

                this._refreshDate();
            }

            if (this._hasTime) {
                this._timeContainer = dom.create('div', {
                    class: 'col d-flex flex-column'
                });
                dom.append(this._container, this._timeContainer);

                this._refreshTime();
            }

            if (this._hasDate && this._hasTime) {
                if (this._settings.sideBySide) {
                    dom.addClass(this._menuNode, 'dtp-wide')
                    dom.addClass(this._container, 'row-cols-md-2')
                } else {
                    dom.setStyle(this._timeContainer, 'display', 'none', true);
                }
            }

            if (this._settings.inline) {
                dom.addClass(this._menuNode, 'dtp-inline');

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

            let prev, next;

            if (this._isAfterMin(start)) {
                prev = {
                    data: {
                        action: 'prev',
                        unit: 'month'
                    },
                    attr: {
                        title: this._settings.tooltips.prevMonth
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
                        title: this._settings.tooltips.nextMonth
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
                        title: this._settings.tooltips.selectMonth
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
                            dom.addClass(td, 'dtp-active');
                        } else if (!this._viewDate.isSame(current, 'month')) {
                            dom.addClass(td, 'text-secondary');
                        }

                        if (!this._isValid(current, 'day')) {
                            dom.addClass(td, 'dtp-disabled');
                        } else {
                            dom.addClass(td, 'dtp-action');
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
                            dom.addClass(td, 'dtp-today');
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

                        if (!this._isValid(current, 'hour')) {
                            dom.addClass(col, 'dtp-disabled');
                        } else {
                            dom.addClass(col, 'dtp-action');
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

                        if (!this._isValid(current, 'minute')) {
                            dom.addClass(col, 'dtp-disabled');
                        } else {
                            dom.addClass(col, 'dtp-action');
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
                        title: this._settings.tooltips.prevYear
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
                        title: this._settings.tooltips.nextYear
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
                        title: this._settings.tooltips.selectYear
                    },
                    prev,
                    next
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
                            dom.addClass(col, 'dtp-active');
                        }

                        if (!this._isValid(current, 'month')) {
                            dom.addClass(col, 'dtp-disabled');
                        } else {
                            dom.addClass(col, 'dtp-action');
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
                            dom.addClass(col, 'dtp-disabled');
                        } else {
                            dom.addClass(col, 'dtp-action');
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
                                    title: this._settings.tooltips.incrementHour
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
                                    title: this._settings.tooltips.decrementHour
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
                                    title: this._settings.tooltips.selectHour
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
                                    title: this._settings.tooltips.incrementMinute
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
                                    title: this._settings.tooltips.decrementMinute
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
                                    title: this._settings.tooltips.selectMinute
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
                                    title: this._settings.tooltips.incrementSecond
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
                                    title: this._settings.tooltips.decrementSecond
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
                                    title: this._settings.tooltips.selectSecond
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
                            class: 'btn btn-primary d-block'
                        });

                        const currentHours = initialDate.getHours();
                        const otherPeriod = initialDate.clone().setHours(
                            currentHours + (currentHours < 12 ? 12 : -12)
                        );
                        if (!this._isValid(otherPeriod, 'second')) {
                            dom.addClass(periodButton, 'dtp-disabled');
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

            let prev, next;

            if (this._isAfterMin(start)) {
                prev = {
                    data: {
                        action: 'prev',
                        unit: 'years',
                        amount: 10
                    },
                    attr: {
                        title: this._settings.tooltips.prevDecade
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
                        title: this._settings.tooltips.nextDecade
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
                            dom.addClass(col, 'dtp-active');
                        } else if (thisYear < startYear || thisYear > endYear) {
                            dom.addClass(col, 'text-secondary');
                        }

                        if (!this._isValid(current, 'year')) {
                            dom.addClass(col, 'dtp-disabled');
                        } else {
                            dom.addClass(col, 'dtp-action');
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
                class: 'table table-sm text-center mx-0 my-auto'
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
                    html: `<span class="${options.icons.left}"></span>`,
                    class: 'action text-primary fw-bold'
                });

                if (!options.header.prev) {
                    dom.addClass(prevTd, 'dtp-disabled');
                } else {
                    dom.addClass(prevTd, 'dtp-action');
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
                    dom.addClass(titleTd, 'dtp-action');
                }

                if (options.header.wide) {
                    dom.addClass(titleTd, 'w-100');
                }

                const nextTd = dom.create('td', {
                    html: `<span class="${options.icons.right}"></span>`,
                    class: 'action text-primary fw-bold'
                });

                if (!options.header.next) {
                    dom.addClass(nextTd, 'dtp-disabled');
                } else {
                    dom.addClass(nextTd, 'dtp-action');
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
                html: `<span class="${options.icons.up}"></span>`,
                class: 'text-primary bw-bold py-4 px-0',
                style: {
                    width: `${options.cellWidth}%`
                }
            });

            if (!options.increment) {
                dom.addClass(upTd, 'dtp-disabled');
            } else {
                dom.addClass(upTd, 'dtp-action');
                dom.setDataset(upTd, options.increment.data);
                dom.setAttribute(upTd, options.increment.attr);
            }

            dom.append(options.upTr, upTd);

            const selectTd = dom.create('td', {
                text: options.select.text,
                class: 'dtp-action dtp-time py-2 px-0',
                dataset: options.select.data,
                attributes: options.select.attr
            });
            dom.append(options.timeTr, selectTd);

            const downTd = dom.create('td', {
                html: `<span class="${options.icons.down}"></span>`,
                class: 'text-primary bw-bold py-4 px-0'
            });

            if (!options.decrement) {
                dom.addClass(downTd, 'dtp-disabled');
            } else {
                dom.addClass(downTd, 'dtp-action');
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
                class: 'time py-2'
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
        locale: DateFormatter.defaultLocale,
        timeZone: DateTime.defaultTimeZone,
        defaultDate: null,
        minDate: null,
        maxDate: null,
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
        isValidDay: null,
        isValidMonth: null,
        isValidTime: null,
        isValidYear: null,
        renderDay: null,
        renderMonth: null,
        renderYear: null,
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

            if (!date || dtp._isValid(date, 'second')) {
                dtp._setDate(date);
            }
        },
        multiDate: false,
        multiDateSeparator: ',',
        useCurrent: false,
        keepOpen: false,
        focusOnShow: true,
        inline: false,
        sideBySide: false,
        keepInvalid: false,
        minView: null,
        stepping: 1,
        duration: 100,
        placement: 'bottom',
        position: 'start',
        fixed: false,
        spacing: 3,
        minContact: false
    };

    // Format token RegExp
    DateTimePicker._formatTokenRegExp = /([a-z])\1*|'[^']*'/ig;

    // Cache values
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