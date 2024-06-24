import $ from '@fr0st/query';
import { isSameDay } from './../comparisons.js';

/**
 * Attach events for the DateTimePicker.
 */
export function _events() {
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
};

/**
 * Attach time events for the DateTimePicker.
 */
export function _eventsTime() {
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

                let method;
                switch (unit) {
                    case 'hour':
                        method = action === 'prev' ?
                            'subHours' :
                            'addHours';
                        break;
                    case 'minute':
                        method = action === 'prev' ?
                            'subMinutes' :
                            'addMinutes';
                        break;
                }

                tempDate = tempDate[method](amount);

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
                                tempDate = tempDate.addHour();
                                break;
                            case 'minutes':
                                tempDate = tempDate.addMinutes(this._options.minuteStepping);
                                break;
                        }

                        break;
                    case 'ArrowDown':
                        switch (timeView) {
                            case 'hours':
                                tempDate = tempDate.subHour();
                                break;
                            case 'minutes':
                                tempDate = tempDate.subMinutes(this._options.minuteStepping);
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
};

/**
 * Attach date events for the DateTimePicker.
 */
export function _eventsDate() {
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
                        let current = tempDate.startOfDay();
                        const endOfDay = tempDate.endOfDay();

                        while (current.isBefore(endOfDay)) {
                            if (this._isValid(current)) {
                                tempDate = current;
                                break;
                            }

                            current = current.addMinutes(5);
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

                let method;
                switch (unit) {
                    case 'month':
                        method = action === 'prev' ?
                            'subMonths' :
                            'addMonths';
                        break;
                    case 'year':
                        method = action === 'prev' ?
                            'subYears' :
                            'addYears';
                        break;
                }

                this._viewDate = this._viewDate[method](amount);

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
                            tempView = tempView.subYear();
                        } else {
                            tempView = tempView.subWeek();
                        }
                        break;
                    case 'months':
                        tempView = tempView.subMonths(3);
                        break;
                    case 'years':
                        tempView = tempView.subYears(3);
                        break;
                }
                break;
            case 'ArrowRight':
                switch (this._viewMode) {
                    case 'days':
                        if (e.ctrlKey) {
                            tempView = tempView.addMonth();
                        } else {
                            tempView = tempView.addDay();
                        }
                        break;
                    case 'months':
                        tempView = tempView.addMonth();
                        break;
                    case 'years':
                        tempView = tempView.addYear();
                        break;
                }
                break;
            case 'ArrowDown':
                switch (this._viewMode) {
                    case 'days':
                        if (e.ctrlKey) {
                            tempView = tempView.addYear();
                        } else {
                            tempView = tempView.addWeek();
                        }
                        break;
                    case 'months':
                        tempView = tempView.addMonths(3);
                        break;
                    case 'years':
                        tempView = tempView.addYears(3);
                        break;
                }
                break;
            case 'ArrowLeft':
                switch (this._viewMode) {
                    case 'days':
                        if (e.ctrlKey) {
                            tempView = tempView.subMonth();
                        } else {
                            tempView = tempView.subDay();
                        }
                        break;
                    case 'months':
                        tempView = tempView.subMonth();
                        break;
                    case 'years':
                        tempView = tempView.subYear();
                        break;
                }
                break;
            case 'Home':
                switch (this._viewMode) {
                    case 'days':
                        tempView = tempView.startOfWeek();
                        break;
                }
                break;
            case 'End':
                switch (this._viewMode) {
                    case 'days':
                        tempView = tempView.endOfWeek();
                        break;
                }
                break;
            case 'PageUp':
                switch (this._viewMode) {
                    case 'days':
                        tempView = tempView.subMonth();
                        break;
                }
                break;
            case 'PageDown':
                switch (this._viewMode) {
                    case 'days':
                        tempView = tempView.addMonth();
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
};

/**
 * Attach events for the Modal.
 */
export function _eventsModal() {
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
};
