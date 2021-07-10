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

        dom.removeEvent(this._node, 'focus.ui.datetimepicker');
        dom.removeEvent(this._node, 'blur.ui.datetimepicker');
        dom.removeEvent(this._node, 'input.ui.datetimepicker')
        dom.removeEvent(this._node, 'keydown.ui.datetimepicker')
        dom.remove(this._menuNode);

        this.constructor._triggers.delete(this._menuNode);

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
            dom.append(document.body, this._menuNode);
        } else {
            dom.after(this._node, this._menuNode);
        }

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
        if (!this._native && !this._settings.inline) {
            this._popper.update();
        }

        return this;
    }

}
