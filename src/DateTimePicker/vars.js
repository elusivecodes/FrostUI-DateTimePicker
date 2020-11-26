// DateTimePicker default options
DateTimePicker.defaults = {
    date: null,
    format: null,
    locale: DateFormatter.defaultLocale,
    timeZone: DateTime.defaultTimeZone,
    minDate: null,
    maxDate: null,
    enabledDates: null,
    disabledDates: null,
    enabledDays: null,
    disabledDays: null,
    enabledHours: null,
    disabledHours: null,
    // disabledTimeIntervals: null,
    // multiDate: false,
    // multiDateSeparator: ',',
    icons: {},
    buttons: {},
    keepOpen: false,
    focusOnShow: false,

    inline: false,
    display: 'dynamic',
    duration: 100,
    placement: 'bottom',
    position: 'start',
    fixed: false,
    spacing: 3,
    minContact: false
};

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
