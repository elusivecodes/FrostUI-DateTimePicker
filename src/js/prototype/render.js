import $ from '@fr0st/query';

/**
 * Render the DateTimePicker.
 */
export function _render() {
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
};

/**
 * Render the days picker.
 */
export function _renderDays() {
    const start = this._viewDate.startOfMonth();
    const end = this._viewDate.endOfMonth();

    let current = start.startOfWeek();
    const last = end.endOfWeek();

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
            title: this._viewDate.format('LLLL yyyy'),
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

            while (current.isSameOrBeforeDay(last)) {
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

                if (this._viewDate.isSameDay(current)) {
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
                } else if (!this._viewDate.isSameMonth(current)) {
                    $.addClass(td, this.constructor.classes.tertiary);
                }

                if (now.isSameDay(current)) {
                    $.addClass(td, this.constructor.classes.today);
                }

                if (this._options.renderDay) {
                    this._options.renderDay(current, td);
                }

                current = current.addDay();
            }
        },
    });

    $.append(this._dateContainer, table);
};

/**
 * Render the hours picker.
 */
export function _renderHours() {
    const initialDate = this._date ?
        this._date :
        this._defaultDate;

    let current = initialDate.startOfDay();
    const last = initialDate.endOfDay();

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

            while (current.isSameOrBeforeHour(last)) {
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

                if (initialDate.isSameHour(current)) {
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

                if (this._date && this._date.isSameHour(current)) {
                    $.addClass(col, this.constructor.classes.active);
                    $.setAttribute(col, { 'aria-selected': true });
                }

                current = current.addHour();
            }
        },
    });

    $.append(this._timeContainer, table);
};

/**
 * Render the minutes picker.
 */
export function _renderMinutes() {
    const initialDate = this._date ?
        this._date :
        this._defaultDate;

    let current = initialDate.startOfHour();
    const last = initialDate.endOfHour();

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

            while (current.isSameOrBeforeMinute(last)) {
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

                if (initialDate.isSameMinute(current)) {
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

                if (this._date && this._date.isSameMinute(current)) {
                    $.addClass(col, this.constructor.classes.active);
                    $.setAttribute(col, { 'aria-selected': true });
                }

                current = current.addMinutes(stepping);
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
};

/**
 * Render the Modal.
 */
export function _renderModal() {
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

    const modalFooter = $.create('div', {
        class: this.constructor.classes.modalFooter,
    });

    $.append(modalContent, modalFooter);

    const cancelBtn = $.create('button', {
        class: this.constructor.classes.modalBtnSecondary,
        text: this.constructor.lang.cancel,
        attributes: {
            'type': 'button',
            'data-ui-dismiss': 'modal',
        },
    });

    $.append(modalFooter, cancelBtn);

    this._setBtn = $.create('button', {
        class: this.constructor.classes.modalBtnPrimary,
        text: this.constructor.lang.set,
        attributes: {
            'type': 'button',
            'data-ui-dismiss': 'modal',
            'data-ui-set-color': 'true',
        },
    });

    $.append(modalFooter, this._setBtn);
};

/**
 * Render the months picker.
 */
export function _renderMonths() {
    const start = this._viewDate.startOfYear();
    const end = this._viewDate.endOfYear();

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

            while (current.isSameOrBeforeMonth(end)) {
                const col = $.create('div', {
                    text: current.format('LLL'),
                    class: this.constructor.classes.dateColumn,
                });
                $.append(row, col);

                if (this._viewDate.isSameMonth(current)) {
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

                current = current.addMonth();
            }
        },
    });

    $.append(this._dateContainer, table);
};

/**
 * Render the time picker.
 */
export function _renderTime() {
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

                const nextHour = initialDate.addHour();
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

                const prevHour = initialDate.subHour();
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

                const prevMinute = initialDate.subMinutes(this._options.minuteStepping);
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
};

/**
 * Render the toolbar.
 */
export function _renderToolbar() {
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
};

/**
 * Render the years picker.
 */
export function _renderYears() {
    const viewYear = this._viewDate.getYear();
    const startYear = viewYear - (viewYear % 10);
    const endYear = startYear + 9;

    const start = this._viewDate.setYear(startYear).startOfYear();
    const end = this._viewDate.setYear(endYear).endOfYear();

    let current = start.subYear();
    const last = end.addYear();

    let prev; let next;

    if (this._isAfterMin(start)) {
        prev = {
            dataset: {
                uiAction: 'prev',
                uiUnit: 'year',
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
                uiUnit: 'year',
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

            while (current.isSameOrBeforeYear(last)) {
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

                if (this._viewDate.isSameYear(current)) {
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

                current = current.addYear();
            }
        },
    });

    $.append(this._dateContainer, table);
}
