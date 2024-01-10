import $ from '@fr0st/query';
import { getClickTarget, initComponent } from '@fr0st/ui';
import DateTimePicker from './date-time-picker.js';
import { _events, _eventsDate, _eventsModal, _eventsTime } from './prototype/events.js';
import { _checkFormat, _clampDate, _clampStepping, _formatDate, _formatDates, _isAfterMin, _isBeforeMax, _isCurrent, _isEditable, _isValid, _makeDate, _now, _parseDate, _parseDates, _refresh, _refreshDate, _refreshDisabled, _refreshTime, _resetView, _setDate, _setDates, _updateValue } from './prototype/helpers.js';
import { _render, _renderDays, _renderHours, _renderMinutes, _renderModal, _renderMonths, _renderTime, _renderToolbar, _renderYears } from './prototype/render.js';
import { _createTable, _renderTimeColumn, _renderTimeSeparator } from './static/render.js';

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
initComponent('datetimepicker', DateTimePicker);

// DateTimePicker events
$.addEvent(document, 'mousedown.ui.datetimepicker', (e) => {
    const target = getClickTarget(e);
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

export default DateTimePicker;
