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
     * @param {object} [settings.lang] lang to use for actions.
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
     * @param {object} [settings.lang] lang to use for actions.
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
