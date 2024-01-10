import $ from '@fr0st/query';
import { BaseComponent, Modal, Popper } from '@fr0st/ui';
import { checkDayPeriod, getDefaultDateFormat, getDefaultFormat } from './formats.js';

/**
 * DateTimePicker Class
 * @class
 */
export default class DateTimePicker extends BaseComponent {
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
            Modal.init(this._modal).dispose();
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
            Modal.init(this._modal).hide();
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

            const modal = Modal.init(this._modal);

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

        this._popper = new Popper(
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
