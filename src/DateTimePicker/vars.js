// DateTimePicker default options
DateTimePicker.defaults = {
    format: null,
    locale: DateFormatter.defaultLocale,
    timeZone: DateTime.defaultTimeZone,
    defaultDate: null,
    minDate: null,
    maxDate: null,
    enabledDates: null,
    disabledDates: null,
    enabledDays: null,
    disabledDays: null,
    enabledHours: null,
    disabledHours: null,
    disabledTimeIntervals: null,
    // multiDate: false,
    // multiDateSeparator: ',',
    icons: {
        up: 'icon-arrow-up',
        right: 'icon-arrow-right',
        down: 'icon-arrow-down',
        left: 'icon-arrow-left'
    },
    buttons: {},
    keyBinds: {},
    useCurrent: false,
    keepOpen: false,
    focusOnShow: false,
    minView: null,

    inline: false,
    sideBySide: false,

    display: 'dynamic',
    duration: 100,
    placement: 'bottom',
    position: 'start',
    fixed: false,
    spacing: 3,
    minContact: false
};

DateTimePicker._formatTokenRegExp = /([a-z])\1*|'[^']*'/ig;
DateTimePicker._dateTokenRegExp = /[GyYqQMLwWdDFEec]/;
DateTimePicker._timeTokenRegExp = /[ahHKkmsS]/;

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
