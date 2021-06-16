// DateTimePicker events
dom.addEvent(document, 'click.ui.datetimepicker', e => {
    DateTimePicker.autoHide(e.target);
});
