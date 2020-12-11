/**
 * DateTimePicker Class
 * @class
 */
class DateTimePicker extends UI.BaseComponent {

    /**
     * New DateTimePicker constructor.
     * @param {HTMLElement} node The input node.
     * @param {object} [settings] The options to create the DateTimePicker with.
     * @param {Boolean} [autoInit=false] Whether the date picker was initialized from a toggle event.
     * @returns {DateTimePicker} A new DateTimePicker object.
     */
    constructor(node, settings, autoInit = false) {
        super(node, settings);

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
        this._updateValue();
        this._render();
        this._events();
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

        dom.removeEvent(this._node, 'focus.ui.datetimepicker');
        dom.removeEvent(this._node, 'blur.ui.datetimepicker');
        dom.removeEvent(this._node, 'input.ui.datetimepicker')
        dom.removeEvent(this._node, 'keydown.ui.datetimepicker')
        dom.remove(this._menuNode);

        super.destroy();
    }

    /**
     * Hide the DateTimePicker.
     */
    hide() {
        if (
            this._settings.inline ||
            this._animating ||
            !dom.isConnected(this._menuNode) ||
            !dom.triggerOne(this._node, 'hide.ui.datetimepicker')
        ) {
            return;
        }

        this._animating = true;

        dom.fadeOut(this._menuNode, {
            duration: this._settings.duration
        }).then(_ => {
            dom.detach(this._menuNode);
            dom.triggerEvent(this._node, 'hidden.ui.datetimepicker');
        }).catch(_ => { }).finally(_ => {
            this._animating = false;
        });
    }

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
            !dom.triggerOne(this._node, 'show.ui.datetimepicker')
        ) {
            return;
        }

        this._animating = true;
        dom.append(document.body, this._menuNode);
        this.update();

        dom.fadeIn(this._menuNode, {
            duration: this._settings.duration
        }).then(_ => {
            dom.triggerEvent(this._node, 'shown.ui.datetimepicker');

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
     * Update the DateTimePicker position.
     */
    update() {
        if (this._settings.inline) {
            return;
        }

        this._popper.update();
    }

    /**
     * Auto-hide all visible datetimepickers (non-inline).
     * @param {HTMLElement} [target] The target node.
     */
    static autoHide(target) {
        const menus = dom.find('.datetimepicker:not(.dtp-inline)');

        for (const menu of menus) {
            const selector = dom.getDataset(menu, 'uiTrigger');
            const trigger = dom.findOne(selector);

            if (trigger === target) {
                continue;
            }

            const datetimepicker = this.init(trigger);
            datetimepicker.hide();
        }
    }

}
