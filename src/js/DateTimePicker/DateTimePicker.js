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
